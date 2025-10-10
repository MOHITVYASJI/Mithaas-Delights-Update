"""
Common Utility Functions for Mithaas Delights Backend
Centralized utilities for file handling, MongoDB operations, and data conversion
"""

import os
import uuid
import base64
import logging
from datetime import datetime
from typing import Optional, Any, Dict

logger = logging.getLogger(__name__)


# ==================== FILE HANDLING UTILITIES ====================

def save_base64_image(base64_data: str, folder: str = "uploads") -> Optional[str]:
    """
    Save base64 encoded image to file system
    
    Args:
        base64_data: Base64 encoded image string
        folder: Subfolder name within uploads directory
        
    Returns:
        URL path to saved image or None if failed
    """
    try:
        # Create uploads directory if it doesn't exist
        upload_dir = f"/app/uploads/{folder}"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Decode base64 data
        if "," in base64_data:
            header, data = base64_data.split(",", 1)
            # Extract file extension from header
            if "jpeg" in header or "jpg" in header:
                ext = "jpg"
            elif "png" in header:
                ext = "png"
            elif "gif" in header:
                ext = "gif"
            elif "webp" in header:
                ext = "webp"
            else:
                ext = "jpg"  # default
        else:
            data = base64_data
            ext = "jpg"  # default
        
        # Generate unique filename
        filename = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(upload_dir, filename)
        
        # Save file
        with open(filepath, "wb") as f:
            f.write(base64.b64decode(data))
        
        # Return URL path
        return f"/uploads/{folder}/{filename}"
        
    except Exception as e:
        logger.error(f"Failed to save base64 image: {str(e)}")
        return None


def get_file_size(filepath: str) -> Optional[int]:
    """
    Get file size in bytes
    
    Args:
        filepath: Path to the file
        
    Returns:
        File size in bytes or None if error
    """
    try:
        return os.path.getsize(filepath)
    except Exception as e:
        logger.error(f"Failed to get file size for {filepath}: {str(e)}")
        return None


# ==================== MONGODB UTILITIES ====================

def prepare_for_mongo(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert datetime objects to ISO strings for MongoDB storage
    
    Args:
        data: Dictionary with potential datetime objects
        
    Returns:
        Dictionary with datetime objects converted to ISO strings
    """
    if isinstance(data.get('created_at'), datetime):
        data['created_at'] = data['created_at'].isoformat()
    if isinstance(data.get('updated_at'), datetime):
        data['updated_at'] = data['updated_at'].isoformat()
    if isinstance(data.get('start_date'), datetime):
        data['start_date'] = data['start_date'].isoformat()
    if isinstance(data.get('end_date'), datetime):
        data['end_date'] = data['end_date'].isoformat()
    if isinstance(data.get('expiry_date'), datetime):
        data['expiry_date'] = data['expiry_date'].isoformat()
    return data


def parse_from_mongo(item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parse MongoDB document back to Python objects
    Converts ISO string dates back to datetime objects
    
    Args:
        item: Dictionary from MongoDB
        
    Returns:
        Dictionary with ISO strings converted back to datetime objects
    """
    if isinstance(item.get('created_at'), str):
        try:
            item['created_at'] = datetime.fromisoformat(item['created_at'])
        except ValueError:
            pass
    if isinstance(item.get('updated_at'), str):
        try:
            item['updated_at'] = datetime.fromisoformat(item['updated_at'])
        except ValueError:
            pass
    if isinstance(item.get('start_date'), str):
        try:
            item['start_date'] = datetime.fromisoformat(item['start_date'])
        except ValueError:
            pass
    if isinstance(item.get('end_date'), str):
        try:
            item['end_date'] = datetime.fromisoformat(item['end_date'])
        except ValueError:
            pass
    if isinstance(item.get('expiry_date'), str):
        try:
            item['expiry_date'] = datetime.fromisoformat(item['expiry_date'])
        except ValueError:
            pass
    return item


# ==================== DATA VALIDATION UTILITIES ====================

def validate_image_extension(filename: str) -> bool:
    """
    Validate if filename has acceptable image extension
    
    Args:
        filename: Name of the file
        
    Returns:
        True if valid image extension, False otherwise
    """
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
    ext = os.path.splitext(filename.lower())[1]
    return ext in allowed_extensions


def validate_video_extension(filename: str) -> bool:
    """
    Validate if filename has acceptable video extension
    
    Args:
        filename: Name of the file
        
    Returns:
        True if valid video extension, False otherwise
    """
    allowed_extensions = {'.mp4', '.webm', '.mov', '.avi'}
    ext = os.path.splitext(filename.lower())[1]
    return ext in allowed_extensions
