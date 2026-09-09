"""
CityEye AI — Image & Asset Storage Manager
Supports:
1. Cloudinary upload for production cloud storage (Vercel / Render / Supabase)
2. Local disk fallback for development / offline use
3. Image format and payload size validation
"""
import os
import sys
import time
import asyncio
from typing import Optional, Dict, Tuple, Any
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "").strip()
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "").strip()
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "").strip()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.getenv("UPLOADS_DIR", os.path.join(BASE_DIR, "uploads"))
os.makedirs(UPLOADS_DIR, exist_ok=True)

IS_CLOUDINARY_CONFIGURED = bool(
    CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET
)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

if IS_CLOUDINARY_CONFIGURED:
    import cloudinary
    import cloudinary.uploader
    cloudinary.config(
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET,
        secure=True
    )
    print(f"[Storage] Cloudinary configured successfully (Cloud: {CLOUDINARY_CLOUD_NAME})")
else:
    print(f"[Storage] Using local disk storage in ./{UPLOADS_DIR}")

def validate_image_file(filename: str, file_bytes: bytes, max_bytes: int = MAX_FILE_SIZE_BYTES) -> Tuple[bool, Optional[str]]:
    """Validate image extension, size, and header bytes"""
    if not filename:
        return False, "Missing filename"
    
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"

    if len(file_bytes) > max_bytes:
        mb = max_bytes / (1024 * 1024)
        return False, f"File size exceeds maximum allowed size of {mb:.0f} MB."

    if len(file_bytes) < 16:
        return False, "Uploaded file is too small to be a valid image."

    # Verify known image signatures (magic numbers)
    is_jpeg = file_bytes.startswith(b'\xff\xd8\xff')
    is_png = file_bytes.startswith(b'\x89PNG\r\n\x1a\n')
    is_webp = len(file_bytes) >= 12 and file_bytes[:4] == b'RIFF' and file_bytes[8:12] == b'WEBP'

    if not (is_jpeg or is_png or is_webp):
        return False, "Corrupted image file or unrecognized image format signature."

    return True, None

def _upload_to_cloudinary(file_bytes: bytes, filename: str) -> dict:
    import cloudinary.uploader
    public_id = f"incident_{int(time.time() * 1000)}"
    result = cloudinary.uploader.upload(
        file_bytes,
        folder="cityeye/incidents",
        public_id=public_id,
        resource_type="image"
    )
    return result

async def save_image(file_bytes: bytes, original_filename: str) -> Dict[str, str]:
    """
    Saves an image to Cloudinary (if configured) or local disk.
    Returns:
        {
            "storage": "cloudinary" | "local",
            "image_path": "<url or filename>",
            "image_url": "<accessible url>"
        }
    """
    ext = os.path.splitext(original_filename)[1].lower() or ".jpg"
    timestamp_name = f"incident_{int(time.time() * 1000)}{ext}"

    if IS_CLOUDINARY_CONFIGURED:
        try:
            res = await asyncio.to_thread(_upload_to_cloudinary, file_bytes, timestamp_name)
            secure_url = res.get("secure_url")
            if secure_url:
                return {
                    "storage": "cloudinary",
                    "image_path": secure_url,
                    "image_url": secure_url
                }
        except Exception as e:
            print(f"[Storage Warning] Cloudinary upload error: {e}. Falling back to local disk.")

    # Local disk fallback
    local_path = os.path.join(UPLOADS_DIR, timestamp_name)
    with open(local_path, "wb") as f:
        f.write(file_bytes)

    return {
        "storage": "local",
        "image_path": timestamp_name,
        "image_url": f"/uploads/{timestamp_name}"
    }

def format_image_url(image_path: Optional[str]) -> Optional[str]:
    """Normalize image URL whether stored locally or on Cloudinary"""
    if not image_path:
        return None
    if image_path.startswith("http://") or image_path.startswith("https://"):
        return image_path
    if image_path.startswith("/uploads/"):
        return image_path
    return f"/uploads/{image_path}"

def get_storage_health() -> Dict[str, Any]:
    """Returns storage subsystem health for telemetry"""
    try:
        files = os.listdir(UPLOADS_DIR) if os.path.exists(UPLOADS_DIR) else []
        total_size = sum(
            os.path.getsize(os.path.join(UPLOADS_DIR, f))
            for f in files if os.path.isfile(os.path.join(UPLOADS_DIR, f))
        )
        return {
            "status": "ready",
            "engine": "Cloudinary" if IS_CLOUDINARY_CONFIGURED else "Local Disk",
            "cloudinary_configured": IS_CLOUDINARY_CONFIGURED,
            "local_uploads_count": len(files),
            "local_uploads_bytes": total_size
        }
    except Exception as e:
        return {
            "status": "error",
            "engine": "unknown",
            "error": str(e)
        }
