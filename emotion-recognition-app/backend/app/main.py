from fastapi import FastAPI, WebSocket, WebSocketDisconnect, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import uvicorn
import os
from typing import List, Dict, Any
import json
import asyncio
import cv2
import numpy as np
from datetime import datetime

from .api.api_v1.api import api_router
from .core.config import settings

app = FastAPI(
    title="Facial Emotion Recognition API",
    description="API for real-time facial emotion recognition",
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

# WebSocket endpoint for real-time processing
@app.websocket("/ws/emotion")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_bytes()
            # Process the frame and get emotion prediction
            # This is a placeholder - implement actual processing
            emotion_data = {"emotion": "neutral", "confidence": 0.95}
            await websocket.send_json(emotion_data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
