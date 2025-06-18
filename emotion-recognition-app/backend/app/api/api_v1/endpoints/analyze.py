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
    model_path: str = Query(...),
) -> Dict[str, Any]:
    """
    Analyze an image using MediaPipe and TorchScript for emotion recognition.
    """
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Could not decode image")

        # Load detector instance
        detector = get_emotion_detector(model_path)

        # Run prediction
        emotion, confidence, all_faces = detector.predict_emotion(img)

        if not all_faces:
            return JSONResponse(content={
                "status": "success",
                "emotion": "no_face",
                "message": "No faces detected in the image"
            })

        return JSONResponse(content={
            "status": "success",
            "emotion": emotion,
            "confidence": confidence,
            "all_faces": all_faces,
            "timestamp": datetime.utcnow().isoformat()
        })

    except Exception as e:
        logger.error(f"Error processing image: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error processing image: {str(e)}"
        )
