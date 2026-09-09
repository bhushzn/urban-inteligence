import os
import cv2
import time
import numpy as np
from typing import List, Tuple, Dict, Any, Optional
from ultralytics import YOLO

from .schemas import BoundingBox, NormalizedDetection

# CityEye Road Damage Class Mapping (RDD2022)
ROAD_DAMAGE_CLASSES = {
    "D00": "longitudinal_crack",
    "D10": "transverse_crack",
    "D20": "alligator_crack",
    "D40": "pothole",
    "Repair": "repaired_area"
}

DISPLAY_NAMES = {
    "longitudinal_crack": "Longitudinal Crack",
    "transverse_crack": "Transverse Crack",
    "alligator_crack": "Alligator Crack",
    "pothole": "Pothole",
    "repaired_area": "Repaired Area"
}

class RoadDamageAnalyzer:
    def __init__(self):
        self.model = None
        self.model_info = {
            "path": "",
            "name": "None",
            "classes": {},
            "loaded": False,
            "error": None
        }
        self.conf_threshold = float(os.getenv("ROAD_DAMAGE_CONFIDENCE", "0.35"))
        self.model_path = os.getenv("ROAD_DAMAGE_MODEL_PATH", "models/road_damage/yolo12s_rdd2022.pt")
        
        # Determine base directory to resolve relative paths
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        if not os.path.isabs(self.model_path):
            self.model_path = os.path.join(self.base_dir, self.model_path)

    def load_model(self) -> Tuple[bool, Dict[str, Any]]:
        if self.model is not None:
            return True, self.model_info

        try:
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(f"Model file not found at {self.model_path}")

            self.model = YOLO(self.model_path)
            
            # Extract names
            names = getattr(self.model, "names", {})
            if isinstance(names, dict):
                classes_dict = names
            elif isinstance(names, (list, tuple)):
                classes_dict = {i: n for i, n in enumerate(names)}
            else:
                classes_dict = {}

            self.model_info = {
                "path": self.model_path,
                "name": "YOLOv12s RDD2022",
                "classes": classes_dict,
                "loaded": True,
                "error": None
            }
            print(f"[AI Model] Road Damage Model loaded successfully from {self.model_path}.")
            return True, self.model_info
        except Exception as e:
            print(f"[AI Model Error] Could not load Road Damage Model: {e}")
            self.model = None
            self.model_info["error"] = str(e)
            self.model_info["loaded"] = False
            return False, self.model_info

    def determine_severity(self, semantic_class: str, confidence: float, area_ratio: float) -> str:
        """
        CityEye heuristic for determining severity.
        """
        if semantic_class == "pothole":
            return "High" if confidence > 0.8 or area_ratio > 0.05 else "Medium"
        elif semantic_class == "alligator_crack":
            return "High" if confidence > 0.7 else "Medium"
        elif semantic_class in ("longitudinal_crack", "transverse_crack"):
            return "Medium" if confidence > 0.75 or area_ratio > 0.02 else "Low"
        elif semantic_class == "repaired_area":
            return "Informational"
        return "Low"

    def analyze_image(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Runs the YOLO model on the provided image and returns normalized detections.
        """
        start_time = time.time()
        
        # Ensure model is loaded
        if self.model is None:
            success, _ = self.load_model()
            if not success:
                # Return empty detections and error if model cannot be loaded
                return {
                    "success": False,
                    "error": "Model not loaded",
                    "detections": [],
                    "processing_time_ms": int((time.time() - start_time) * 1000)
                }

        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                raise ValueError("Failed to decode image bytes")
                
            height, width, _ = img.shape
            
            # Run YOLO inference
            results = self.model(img, conf=self.conf_threshold)
            
            normalized_detections: List[NormalizedDetection] = []
            
            for result in results:
                boxes = result.boxes
                if boxes is None:
                    continue
                    
                for box in boxes:
                    conf = float(box.conf[0])
                    class_id = int(box.cls[0])
                    raw_class_name = result.names[class_id]
                    
                    # Mapping
                    semantic_class = ROAD_DAMAGE_CLASSES.get(raw_class_name, raw_class_name.lower())
                    display_name = DISPLAY_NAMES.get(semantic_class, raw_class_name)
                    
                    # Coordinates
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    x_c, y_c, w_px, h_px = box.xywh[0].tolist()
                    
                    area_ratio = (w_px * h_px) / (width * height) if width > 0 and height > 0 else 0
                    
                    # Bounding Box struct
                    bbox = BoundingBox(
                        x1=x1, y1=y1, x2=x2, y2=y2,
                        x_center=x_c, y_center=y_c,
                        width=w_px, height=h_px
                    )
                    
                    severity = self.determine_severity(semantic_class, conf, area_ratio)
                    is_active_hazard = semantic_class in (
                        "longitudinal_crack", "transverse_crack", "alligator_crack", "pothole"
                    )
                    
                    detection = NormalizedDetection(
                        class_id=class_id,
                        class_name=semantic_class,
                        display_name=display_name,
                        confidence=round(conf, 3),
                        severity=severity,
                        bbox=bbox,
                        is_active_hazard=is_active_hazard,
                        raw_data={"area_ratio": area_ratio}
                    )
                    normalized_detections.append(detection)
            
            return {
                "success": True,
                "image_width": width,
                "image_height": height,
                "detections": [d.dict() for d in normalized_detections],
                "processing_time_ms": int((time.time() - start_time) * 1000)
            }

        except Exception as e:
            print(f"⚠️ Inference error: {e}")
            return {
                "success": False,
                "error": str(e),
                "detections": [],
                "processing_time_ms": int((time.time() - start_time) * 1000)
            }

# Singleton instance
road_damage_analyzer = RoadDamageAnalyzer()
