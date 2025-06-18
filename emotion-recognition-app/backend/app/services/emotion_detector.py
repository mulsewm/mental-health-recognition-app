import cv2
import numpy as np
import torch
import mediapipe as mp
from PIL import Image
from typing import Tuple, List
from datetime import datetime
from torchvision import transforms
import logging
import os

logger = logging.getLogger(__name__)

class EmotionDetector:
    EMOTIONS = {
        0: 'Neutral', 1: 'Happiness', 2: 'Sadness', 3: 'Surprise',
        4: 'Fear', 5: 'Disgust', 6: 'Anger'
    }

    def __init__(self, model_path: str):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = self._load_model(model_path)
        self.face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                 std=[0.229, 0.224, 0.225])
        ])
        os.makedirs("debug_faces", exist_ok=True)
        logger.info("EmotionDetector initialized")

    def _load_model(self, model_path: str) -> torch.nn.Module:
        model = torch.jit.load(model_path, map_location=self.device)
        model.eval()
        logger.info(f"Loaded model from {model_path} | dtype: {next(model.parameters()).dtype}")
        return model

    def _get_bbox(self, landmarks, img_w, img_h) -> Tuple[int, int, int, int]:
        x_coords = [lm.x * img_w for lm in landmarks.landmark]
        y_coords = [lm.y * img_h for lm in landmarks.landmark]
        x_min, x_max = int(min(x_coords)), int(max(x_coords))
        y_min, y_max = int(min(y_coords)), int(max(y_coords))

        padding = 20
        x_min = max(0, x_min - padding)
        y_min = max(0, y_min - padding)
        x_max = min(img_w, x_max + padding)
        y_max = min(img_h, y_max + padding)

        return x_min, y_min, x_max, y_max

    def _enhance_contrast(self, img: np.ndarray) -> np.ndarray:
        img_yuv = cv2.cvtColor(img, cv2.COLOR_BGR2YUV)
        img_yuv[:, :, 0] = cv2.equalizeHist(img_yuv[:, :, 0])
        return cv2.cvtColor(img_yuv, cv2.COLOR_YUV2BGR)

    def _preprocess_face(self, face_img: np.ndarray) -> torch.Tensor:
        face_img = self._enhance_contrast(face_img)
        pil_img = Image.fromarray(cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB))
        tensor = self.transform(pil_img).unsqueeze(0)
        model_dtype = next(self.model.parameters()).dtype
        return tensor.to(dtype=model_dtype, device=self.device)

    def predict_emotion(self, frame: np.ndarray) -> Tuple[str, float, List[dict]]:
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(frame_rgb)

        h, w, _ = frame.shape

        if results.multi_face_landmarks:
            landmarks = results.multi_face_landmarks[0]
            x1, y1, x2, y2 = self._get_bbox(landmarks, w, h)
            face_img = frame[y1:y2, x1:x2]
            bbox = {"top": y1, "right": x2, "bottom": y2, "left": x1}
        else:
            # Fallback: center crop
            cx, cy = w // 2, h // 2
            size = min(w, h) // 2
            x1, y1 = max(cx - size, 0), max(cy - size, 0)
            x2, y2 = min(cx + size, w), min(cy + size, h)
            face_img = frame[y1:y2, x1:x2]
            bbox = {"top": y1, "right": x2, "bottom": y2, "left": x1}
            logger.warning("No landmarks detected. Using center crop.")

        if face_img.size == 0:
            logger.warning("Empty face ROI.")
            return "unknown", 0.0, []

        # Debug: Save face image
        ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")
        cv2.imwrite(f"debug_faces/face_{ts}.jpg", face_img)

        try:
            input_tensor = self._preprocess_face(face_img)

            with torch.no_grad():
                output = self.model(input_tensor)
                print("Raw logits:", output.cpu().numpy())

                probs = torch.nn.functional.softmax(output, dim=1)
                print("Softmax:", probs.cpu().numpy())

                confidence, predicted = torch.max(probs, 1)
                emotion_idx = predicted.item()
                confidence_val = confidence.item()
                emotion = self.EMOTIONS.get(emotion_idx, "unknown")

                logger.info(f"Predicted: {emotion} ({confidence_val:.4f})")

                face_data = [{
                    "face_id": 0,
                    "bounding_box": bbox,
                    "emotion": emotion,
                    "confidence": confidence_val
                }]

                return emotion, confidence_val, face_data

        except Exception as e:
            logger.error(f"Prediction error: {str(e)}", exc_info=True)
            return "unknown", 0.0, []

# Singleton instance
emotion_detector = None

def get_emotion_detector(model_path: str) -> EmotionDetector:
    global emotion_detector
    if emotion_detector is None:
        emotion_detector = EmotionDetector(model_path)
    return emotion_detector
