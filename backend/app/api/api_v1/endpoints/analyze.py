from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Query
from fastapi.responses import JSONResponse
import cv2
import numpy as np
import logging
from typing import Dict, Any
from datetime import datetime

from ....services.emotion_detector import get_emotion_detector
from ....core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/")
async def analyze_image(
    file: UploadFile = File(...),
    model_path: str = Query(..., description="Path to the emotion detection model"),
) -> Dict[str, Any]:
    """
    Analyze an image for emotion recognition using MediaPipe for face detection
    and a TorchScript model for emotion classification.
    
    Args:
        file: The image file to analyze
        model_path: Path to the TorchScript model file
        
    Returns:
        JSON response containing emotion detection results
    """
    try:
        # Read and decode the image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)  # Read as BGR
        
        if img is None:
            raise HTTPException(status_code=400, detail="Could not decode image")
            
        # Convert to RGB for MediaPipe
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Initialize detector with the specified model
        detector = get_emotion_detector(model_path)
        
        # Run emotion prediction
        emotion, confidence, all_faces = detector.predict_emotion(img_rgb)
        
        if not all_faces:
            logger.warning("No faces detected in the uploaded image")
            return JSONResponse(status_code=200, content={
                "status": "success",
                "emotion": "no_face",
                "confidence": 0.0,
                "message": "No faces detected in the image",
                "timestamp": datetime.utcnow().isoformat()
            })
            
        logger.info(f"Detected emotion: {emotion} with confidence {confidence:.2f}")
        
        return JSONResponse(content={
            "status": "success",
            "emotion": emotion.lower(),  # Ensure consistent lowercase emotion names
            "confidence": float(confidence),  # Convert numpy float to Python float
            "all_faces": all_faces,
            "timestamp": datetime.utcnow().isoformat()
        })

    except Exception as e:
        error_msg = f"Error processing image: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "message": error_msg,
                "error_type": str(type(e).__name__)
            }
        )
