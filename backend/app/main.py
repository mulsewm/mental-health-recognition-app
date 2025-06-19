from fastapi import FastAPI, WebSocket, WebSocketDisconnect, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import uvicorn
from app.services.emotion_detector import get_emotion_detector
import os
from typing import List, Dict, Any, Optional
import json
import asyncio
import cv2
import numpy as np
from datetime import datetime, timedelta
from collections import defaultdict, deque
from pydantic import BaseModel

from .api.api_v1.api import api_router
from .core.config import settings

# In-memory storage for emotion data
class EmotionData(BaseModel):
    timestamp: datetime
    emotion: str
    confidence: float

class EmotionStorage:
    def __init__(self, max_entries: int = 1000):
        self.data: List[EmotionData] = []
        self.max_entries = max_entries
        self.emotion_counts = defaultdict(int)
        self.emotion_confidences = defaultdict(list)
    
    def add_data(self, emotion: str, confidence: float):
        """Add new emotion data point"""
        data_point = EmotionData(
            timestamp=datetime.utcnow(),
            emotion=emotion,
            confidence=confidence
        )
        self.data.append(data_point)
        self.emotion_counts[emotion] += 1
        self.emotion_confidences[emotion].append(confidence)
        
        # Keep only the most recent entries
        if len(self.data) > self.max_entries:
            old_data = self.data.pop(0)
            self.emotion_counts[old_data.emotion] -= 1
            if self.emotion_counts[old_data.emotion] == 0:
                del self.emotion_counts[old_data.emotion]
            self.emotion_confidences[old_data.emotion].pop(0)
            if not self.emotion_confidences[old_data.emotion]:
                del self.emotion_confidences[old_data.emotion]
    
    def get_summary(self, time_window_hours: int = 24) -> Dict[str, Any]:
        """Get summary of emotion data within the specified time window"""
        now = datetime.utcnow()
        time_threshold = now - timedelta(hours=time_window_hours)
        
        # Filter data within time window
        recent_data = [d for d in self.data if d.timestamp >= time_threshold]
        
        # Calculate distribution
        distribution = {}
        for emotion, count in self.emotion_counts.items():
            if count > 0:
                avg_confidence = (
                    sum(self.emotion_confidences[emotion]) / 
                    len(self.emotion_confidences[emotion])
                )
                distribution[emotion] = {
                    'count': count,
                    'avg_confidence': round(avg_confidence, 2)
                }
        
        # Prepare timeline data (group by minute)
        timeline = []
        if recent_data:
            current_minute = recent_data[0].timestamp.replace(second=0, microsecond=0)
            minute_data = {}
            
            for entry in recent_data:
                entry_minute = entry.timestamp.replace(second=0, microsecond=0)
                if entry_minute != current_minute:
                    timeline.append({
                        'timestamp': current_minute.isoformat(),
                        **minute_data
                    })
                    current_minute = entry_minute
                    minute_data = {}
                
                if entry.emotion not in minute_data:
                    minute_data[entry.emotion] = 0
                minute_data[entry.emotion] += 1
            
            # Add the last minute
            if minute_data:
                timeline.append({
                    'timestamp': current_minute.isoformat(),
                    **minute_data
                })
        
        return {
            'summary': {
                'total_frames': len(recent_data),
                'emotion_distribution': distribution,
                'timeline': timeline
            }
        }

# Initialize storage
emotion_storage = EmotionStorage()

app = FastAPI(
    title="Mental Health Recognition App",
    description="Mental Health Recognition App",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")

# Create necessary directories if they don't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

STATIC_DIR = Path("static")
STATIC_DIR.mkdir(exist_ok=True)

# Mount static files directory
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

# Initialize emotion detector
emotion_detector = get_emotion_detector(str(settings.MODEL_PATH))

# WebSocket endpoint for real-time processing
@app.websocket("/ws/emotion")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_bytes()
            # Convert bytes to numpy array
            nparr = np.frombuffer(data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if frame is not None:
                try:
                    # Convert BGR to RGB
                    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    
                    # Detect emotion using the emotion detector
                    result = emotion_detector.detect_emotion(rgb_frame)
                    
                    if result:
                        emotion = result.emotion
                        confidence = result.confidence
                        
                        # Store the emotion data
                        emotion_storage.add_data(emotion, confidence)
                        
                        # Send the result back to the client
                        emotion_data = {
                            "emotion": emotion,
                            "confidence": confidence,
                            "timestamp": datetime.utcnow().isoformat()
                        }
                        await websocket.send_json(emotion_data)
                    else:
                        await websocket.send_json({"error": "No face detected"})
                        
                except Exception as e:
                    print(f"Error processing frame: {str(e)}")
                    await websocket.send_json({"error": f"Error processing frame: {str(e)}"})
            else:
                await websocket.send_json({"error": "Failed to decode frame"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {str(e)}")
        await websocket.send_json({"error": f"WebSocket error: {str(e)}"})
        manager.disconnect(websocket)

# Endpoint to get emotion summary
@app.get("/api/v1/emotion-summary/")
async def get_emotion_summary():
    """
    Get a summary of detected emotions over time.
    """
    return emotion_storage.get_summary()

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
