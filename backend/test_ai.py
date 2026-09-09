import argparse
import time
import os
import cv2
from ai import road_damage_analyzer

def main():
    parser = argparse.ArgumentParser(description="Test Road Damage AI Model")
    parser.add_argument("image_path", help="Path to test image")
    parser.add_argument("--out", "-o", help="Path to save annotated image", default="annotated_output.jpg")
    args = parser.parse_args()

    if not os.path.exists(args.image_path):
        print(f"File not found: {args.image_path}")
        return

    with open(args.image_path, "rb") as f:
        image_bytes = f.read()

    print(f"Analyzing {args.image_path}...")
    result = road_damage_analyzer.analyze_image(image_bytes)

    if not result.get("success"):
        print(f"Analysis failed: {result.get('error')}")
        return

    print(f"Model: {road_damage_analyzer.model_info.get('name', 'Unknown')}")
    print(f"Processing time: {result['processing_time_ms']} ms")
    
    detections = result.get("detections", [])
    if not detections:
        print("Detections: None")
    else:
        for d in detections:
            bbox = d['bbox']
            bbox_str = f"{bbox['x1']:.1f},{bbox['y1']:.1f},{bbox['x2']:.1f},{bbox['y2']:.1f}"
            print(f"Detections: {d['display_name']} Confidence: {d['confidence']:.2f} Severity: {d['severity'].upper()} BBox: {bbox_str}")

    # Annotate image
    img = cv2.imread(args.image_path)
    if img is not None:
        for d in detections:
            bbox = d['bbox']
            x1, y1, x2, y2 = int(bbox['x1']), int(bbox['y1']), int(bbox['x2']), int(bbox['y2'])
            
            # Draw box
            color = (0, 0, 255) if d['is_active_hazard'] else (0, 255, 255)
            cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
            
            # Draw label
            label = f"{d['display_name']} {d['confidence']:.2f}"
            cv2.putText(img, label, (x1, max(y1 - 10, 0)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
            
        cv2.imwrite(args.out, img)
        print(f"Annotated image saved to {args.out}")

if __name__ == "__main__":
    main()
