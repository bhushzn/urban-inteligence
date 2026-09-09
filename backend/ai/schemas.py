from pydantic import BaseModel
from typing import Dict, Optional, Any

class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    x_center: Optional[float] = None
    y_center: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None

class NormalizedDetection(BaseModel):
    class_id: int
    class_name: str
    display_name: str
    confidence: float
    severity: str
    bbox: BoundingBox
    is_active_hazard: bool
    
    # Optional raw outputs if needed
    raw_data: Optional[Dict[str, Any]] = None
