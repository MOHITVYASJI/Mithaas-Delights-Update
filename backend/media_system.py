"""
Media Gallery System for Mithaas Delights API
Handles image/video uploads, gallery management, and media organization
"""

from fastapi import APIRouter, HTTPException, Security, UploadFile, File
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import logging
import os
from motor.motor_asyncio import AsyncIOMotorDatabase
from utils import save_base64_image, prepare_for_mongo, parse_from_mongo, get_file_size

# Setup logging
logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()

# Create router
media_router = APIRouter(prefix="/api", tags=["media"])

# ==================== MODELS ====================

class MediaItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    media_url: str
    media_type: str  # "image" or "video"
    thumbnail_url: Optional[str] = None
    description: Optional[str] = None
    display_order: int = 0
    is_active: bool = True
    file_size: Optional[int] = None  # in bytes
    dimensions: Optional[str] = None  # "1920x1080"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MediaItemCreate(BaseModel):
    title: str
    media_url: str
    media_type: str
    thumbnail_url: Optional[str] = None
    description: Optional[str] = None
    display_order: int = 0

class MediaItemCreateEnhanced(BaseModel):
    title: str
    media_url: Optional[str] = None  # URL input
    media_type: str  # "image" or "video"
    thumbnail_url: Optional[str] = None
    description: Optional[str] = None
    display_order: int = 0
    base64_data: Optional[str] = None  # For file upload

class MediaItemUpdate(BaseModel):
    title: Optional[str] = None
    media_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    description: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None

# ==================== HELPER FUNCTIONS ====================
# All helper functions have been moved to utils.py for centralization

# ==================== MEDIA ENDPOINTS ====================

def setup_media_routes(db: AsyncIOMotorDatabase, get_current_admin_user):
    """Setup media routes with database and auth dependencies"""
    
    @media_router.post("/media-gallery", response_model=MediaItem)
    async def create_media_item(
        media: MediaItemCreateEnhanced,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Create media gallery item (Admin only) - supports both URL and file upload"""
        await get_current_admin_user(credentials, db)
        
        media_url = media.media_url
        file_size = None
        
        # If base64 data provided, save it
        if media.base64_data:
            saved_url = save_base64_image(media.base64_data, "media")
            if saved_url:
                media_url = saved_url
                # Get file size
                full_path = f"/app{saved_url}"
                file_size = get_file_size(full_path)
        
        if not media_url:
            raise HTTPException(status_code=400, detail="Either media_url or base64_data required")
        
        media_obj = MediaItem(
            title=media.title,
            media_url=media_url,
            media_type=media.media_type,
            thumbnail_url=media.thumbnail_url,
            description=media.description,
            display_order=media.display_order,
            file_size=file_size
        )
        
        await db.media_gallery.insert_one(prepare_for_mongo(media_obj.dict()))
        logger.info(f"Media item created: {media_obj.title}")
        return media_obj

    @media_router.get("/media-gallery", response_model=List[MediaItem])
    async def get_media_gallery(
        active_only: bool = True,
        media_type: Optional[str] = None,
        limit: int = 50
    ):
        """Get media gallery items"""
        filter_query = {}
        if active_only:
            filter_query["is_active"] = True
        
        if media_type:
            filter_query["media_type"] = media_type
        
        media_items = await db.media_gallery.find(filter_query).sort("display_order", 1).limit(limit).to_list(length=limit)
        return [MediaItem(**parse_from_mongo(item)) for item in media_items]

    @media_router.get("/media-gallery/{media_id}", response_model=MediaItem)
    async def get_media_item(media_id: str):
        """Get single media item by ID"""
        media_item = await db.media_gallery.find_one({"id": media_id})
        if not media_item:
            raise HTTPException(status_code=404, detail="Media item not found")
        return MediaItem(**parse_from_mongo(media_item))

    @media_router.put("/media-gallery/{media_id}", response_model=MediaItem)
    async def update_media_item(
        media_id: str,
        media_update: MediaItemUpdate,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Update media gallery item (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        update_dict = {k: v for k, v in media_update.dict().items() if v is not None}
        update_dict["updated_at"] = datetime.now(timezone.utc)
        
        result = await db.media_gallery.update_one(
            {"id": media_id},
            {"$set": prepare_for_mongo(update_dict)}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Media item not found")
        
        updated_media = await db.media_gallery.find_one({"id": media_id})
        logger.info(f"Media item updated: {media_id}")
        return MediaItem(**parse_from_mongo(updated_media))

    @media_router.delete("/media-gallery/{media_id}")
    async def delete_media_item(
        media_id: str,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Delete media gallery item (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        # Get media item to delete file if it's local
        media_item = await db.media_gallery.find_one({"id": media_id})
        if media_item and media_item.get("media_url", "").startswith("/uploads/"):
            try:
                file_path = f"/app{media_item['media_url']}"
                if os.path.exists(file_path):
                    os.remove(file_path)
                    logger.info(f"Deleted file: {file_path}")
            except Exception as e:
                logger.warning(f"Could not delete file: {str(e)}")
        
        result = await db.media_gallery.delete_one({"id": media_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Media item not found")
        
        logger.info(f"Media item deleted: {media_id}")
        return {"message": "Media item deleted successfully"}

    @media_router.post("/media-gallery/upload")
    async def upload_media_file(
        file: UploadFile = File(...),
        title: str = "Uploaded Media",
        description: Optional[str] = None,
        display_order: int = 0,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Upload media file directly (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        # Validate file type
        allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        
        # Determine media type
        media_type = "image" if file.content_type.startswith("image/") else "video"
        
        # Create upload directory
        upload_dir = "/app/uploads/media"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        filename = f"{uuid.uuid4().hex}.{file_ext}"
        filepath = os.path.join(upload_dir, filename)
        
        # Save file
        try:
            with open(filepath, "wb") as f:
                content = await file.read()
                f.write(content)
            
            file_size = len(content)
            media_url = f"/uploads/media/{filename}"
            
            # Create media item
            media_obj = MediaItem(
                title=title,
                media_url=media_url,
                media_type=media_type,
                description=description,
                display_order=display_order,
                file_size=file_size
            )
            
            await db.media_gallery.insert_one(prepare_for_mongo(media_obj.dict()))
            logger.info(f"Media file uploaded: {filename}")
            return media_obj
            
        except Exception as e:
            logger.error(f"Failed to upload file: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to upload file")

    @media_router.get("/media-gallery/type/{media_type}", response_model=List[MediaItem])
    async def get_media_by_type(media_type: str, active_only: bool = True):
        """Get media items by type (image/video)"""
        return await get_media_gallery(active_only=active_only, media_type=media_type)

    @media_router.put("/media-gallery/{media_id}/toggle")
    async def toggle_media_item(
        media_id: str,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Toggle media item active status (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        # Get current status
        media_item = await db.media_gallery.find_one({"id": media_id})
        if not media_item:
            raise HTTPException(status_code=404, detail="Media item not found")
        
        new_status = not media_item.get("is_active", True)
        
        await db.media_gallery.update_one(
            {"id": media_id},
            {"$set": {
                "is_active": new_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        logger.info(f"Media item {media_id} status changed to: {new_status}")
        return {"message": f"Media item {'activated' if new_status else 'deactivated'} successfully"}

    return media_router