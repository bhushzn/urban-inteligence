# Model Card: YOLOv12-small Road Damage Detection

## Model Details
- **Model ID**: `rezzzq/yolo12s-road-damage-rdd2022`
- **Architecture**: YOLOv12-small
- **Dataset**: RDD2022
- **Classes**:
  - `D00` (Longitudinal Crack)
  - `D10` (Transverse Crack)
  - `D20` (Alligator Crack)
  - `D40` (Pothole)
  - `Repair` (Repaired Area)
- **Source**: [Hugging Face Repository](https://huggingface.co/rezzzq/yolo12s-road-damage-rdd2022)
- **Repository**: Official YOLOv12 GitHub Repository (`sunsmarterjie/yolov12`)
- **License**: MIT (as specified in HF repo tags)

## Integration Details
- **Date Integrated**: 2026-09-08
- **Dependency**: `ultralytics` v8.4.143 (standard PyPI package). Fully compatible without needing the yolov12 fork.
- **Local/Remote Method**: Downloaded `yolo12s_RDD2022_best.pt` file locally. Loaded from `models/road_damage/yolo12s_rdd2022.pt`.

## Known Limitations
- The model ONLY detects the five classes listed above.
- **CityEye MUST NOT** claim this model detects: manholes, garbage dumps, garbage/debris, streetlights, waterlogging, or other general municipal anomalies.
- "Repaired Area" is detected but is treated as an informational class, not an active hazard.

## Performance
- Performs well on CPU for simple inference tasks.
- Can be swapped dynamically via the backend AI loading mechanics without restarting the process.
