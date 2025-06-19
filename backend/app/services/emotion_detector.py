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
        self.model.eval()  # Set model to evaluation mode
        
        # Class weights to handle imbalance (adjust these based on your training data distribution)
        self.class_weights = {
            'neutral': 1.0,
            'happiness': 1.0,
            'sadness': 1.0,
            'surprise': 1.0,
            'fear': 1.0,
            'disgust': 1.0,
            'anger': 1.0  
        }
        
        # Temperature scaling for softmax (higher = softer probabilities)
        self.temperature = 1.5
        
        # Initialize MediaPipe Face Mesh with optimized settings
        self.face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=False,  # Better for video streams
            max_num_faces=1,
            refine_landmarks=True,    # Use refined landmarks for better accuracy
            min_detection_confidence=0.4,  # Lower threshold for better detection
            min_tracking_confidence=0.4    # Lower threshold for tracking
        )
        
        # Confidence thresholds
        self.min_confidence = 0.25      # 25% minimum confidence threshold
        self.high_confidence = 0.6      # 60% for high confidence predictions
        
        # Cache for previous predictions (for temporal smoothing)
        self.previous_predictions = []
        self.max_history = 5  # Number of previous predictions to consider
        
        # Image preprocessing pipeline
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                               std=[0.229, 0.224, 0.225])
        ])
        
        # Create debug directory
        os.makedirs("debug_faces", exist_ok=True)
        logger.info("EmotionDetector initialized with MediaPipe face detection")

    def _load_model(self, model_path: str) -> torch.nn.Module:
        model = torch.jit.load(model_path, map_location=self.device)
        model.eval()
        logger.info(f"Loaded model from {model_path} | dtype: {next(model.parameters()).dtype}")
        return model

    def _get_bbox(self, landmarks, img_w: int, img_h: int, padding_ratio: float = 0.2) -> Tuple[int, int, int, int]:
        """
        Calculate bounding box from facial landmarks with adaptive padding.
        
        Args:
            landmarks: MediaPipe face landmarks
            img_w: Image width
            img_h: Image height
            padding_ratio: Ratio of face size to use as padding
            
        Returns:
            Tuple of (x_min, y_min, x_max, y_max) coordinates
        """
        # Get all landmark coordinates
        x_coords = [lm.x * img_w for lm in landmarks.landmark]
        y_coords = [lm.y * img_h for lm in landmarks.landmark]
        
        # Calculate initial bounding box
        x_min, x_max = int(min(x_coords)), int(max(x_coords))
        y_min, y_max = int(min(y_coords)), int(max(y_coords))
        
        # Calculate adaptive padding based on face size
        face_width = x_max - x_min
        face_height = y_max - y_min
        padding = int(max(face_width, face_height) * padding_ratio)
        
        # Apply padding with bounds checking
        x_min = max(0, x_min - padding)
        y_min = max(0, y_min - padding)
        x_max = min(img_w, x_max + padding)
        y_max = min(img_h, y_max + padding)
        
        # Ensure minimum dimensions
        min_face_size = 100  # Minimum face size in pixels
        if (x_max - x_min) < min_face_size or (y_max - y_min) < min_face_size:
            center_x, center_y = (x_min + x_max) // 2, (y_min + y_max) // 2
            half_size = max(min_face_size, max(x_max - x_min, y_max - y_min)) // 2
            x_min = max(0, center_x - half_size)
            y_min = max(0, center_y - half_size)
            x_max = min(img_w, center_x + half_size)
            y_max = min(img_h, center_y + half_size)
        
        return x_min, y_min, x_max, y_max

    def _enhance_contrast(self, img: np.ndarray) -> np.ndarray:
        """Enhance image contrast and quality for better face analysis."""
        if img.size == 0:
            return img
            
        try:
            # Make a copy to avoid modifying the original
            enhanced = img.copy()
            
            # Convert to BGR for OpenCV operations (if not already)
            if enhanced.shape[2] == 3:  # RGB
                enhanced = cv2.cvtColor(enhanced, cv2.COLOR_RGB2BGR)
            
            # Convert to LAB color space
            lab = cv2.cvtColor(enhanced, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            
            # Apply CLAHE to L channel
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            cl = clahe.apply(l)
            
            # Merge the enhanced L channel with original a and b channels
            limg = cv2.merge((cl, a, b))
            
            # Convert back to BGR
            enhanced = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
            
            # Apply slight sharpening
            kernel = np.array([[-1,-1,-1], 
                             [-1, 9,-1],
                             [-1,-1,-1]])
            enhanced = cv2.filter2D(enhanced, -1, kernel)
            
            # Convert back to RGB for the rest of the pipeline
            enhanced = cv2.cvtColor(enhanced, cv2.COLOR_BGR2RGB)
            
            return enhanced
            
        except Exception as e:
            logger.error(f"Error in image enhancement: {str(e)}")
            return img

    def _preprocess_face(self, face_img: np.ndarray) -> torch.Tensor:
        face_img = self._enhance_contrast(face_img)

        # 🔧 Fixed BGR → RGB conversion (safe copy)
        pil_img = Image.fromarray(face_img[:, :, ::-1].copy())

        tensor = self.transform(pil_img).unsqueeze(0)
        model_dtype = next(self.model.parameters()).dtype
        return tensor.to(dtype=model_dtype, device=self.device)

    def _is_valid_face(self, landmarks, frame_shape) -> bool:
        """Check if the detected face is valid based on landmarks."""
        h, w = frame_shape[:2]
        
        # Get all landmark coordinates
        x_coords = [lm.x * w for lm in landmarks.landmark]
        y_coords = [lm.y * h for lm in landmarks.landmark]
        
        # Calculate face dimensions
        face_width = max(x_coords) - min(x_coords)
        face_height = max(y_coords) - min(y_coords)
        
        # Check if face is too small
        min_face_size = min(w, h) * 0.1  # At least 10% of image dimension
        if face_width < min_face_size or face_height < min_face_size:
            logger.warning(f"Face too small: {face_width}x{face_height}px")
            return False
            
        # Check face aspect ratio (should be roughly 1:1 for frontal faces)
        aspect_ratio = face_width / face_height
        if aspect_ratio < 0.5 or aspect_ratio > 2.0:
            logger.warning(f"Invalid face aspect ratio: {aspect_ratio:.2f}")
            return False
            
        return True

    def _smooth_predictions(self, current_emotion: str, confidence: float) -> Tuple[str, float]:
        """Apply temporal smoothing to predictions using a simple moving average."""
        if confidence < self.min_confidence:
            return current_emotion, confidence
            
        # Add current prediction to history
        self.previous_predictions.append((current_emotion, confidence))
        
        # Keep only the most recent predictions
        if len(self.previous_predictions) > self.max_history:
            self.previous_predictions.pop(0)
            
        # If we don't have enough history, return current prediction
        if len(self.previous_predictions) < 3:
            return current_emotion, confidence
            
        # Calculate weighted average of recent predictions
        emotion_weights = {}
        total_weight = 0
        
        for i, (emotion, conf) in enumerate(self.previous_predictions):
            weight = (i + 1) / len(self.previous_predictions)  # More recent = higher weight
            if emotion in emotion_weights:
                emotion_weights[emotion] += conf * weight
            else:
                emotion_weights[emotion] = conf * weight
            total_weight += weight
            
        # Find the emotion with highest weighted confidence
        if not emotion_weights:
            return current_emotion, confidence
            
        # Get the emotion with maximum weighted confidence
        best_emotion = max(emotion_weights.items(), key=lambda x: x[1])[0]
        avg_confidence = emotion_weights[best_emotion] / total_weight
        
        return best_emotion, avg_confidence

    def predict_emotion(self, frame: np.ndarray) -> Tuple[str, float, List[dict]]:
        """
        Predict emotion from a single frame with improved face validation.
        
        Args:
            frame: Input image in RGB format
            
        Returns:
            Tuple of (emotion, confidence, face_data_list)
        """
        if frame is None or frame.size == 0:
            logger.error("Received empty frame")
            return "unknown", 0.0, []
            
        # Ensure frame is in RGB format and properly sized
        if frame.shape[2] == 4:  # RGBA
            frame = cv2.cvtColor(frame, cv2.COLOR_RGBA2RGB)
        elif frame.shape[2] == 1:  # Grayscale
            frame = cv2.cvtColor(frame, cv2.COLOR_GRAY2RGB)
        elif frame.shape[2] == 3 and frame.dtype == np.uint8 and frame[0,0,0] == frame[0,0,2]:  # BGR check
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        h, w, _ = frame.shape
        
        # Resize if image is too large for better performance
        max_dim = 640
        if max(h, w) > max_dim:
            scale = max_dim / max(h, w)
            frame = cv2.resize(frame, (int(w * scale), int(h * scale)))
            h, w = frame.shape[:2]
        
        try:
            # Process with MediaPipe
            results = self.face_mesh.process(frame)
            
            if not results.multi_face_landmarks:
                logger.warning("No faces detected in frame")
                return "no_face", 0.0, []
                
            # Use the first detected face
            landmarks = results.multi_face_landmarks[0]
            
            # Validate the detected face
            if not self._is_valid_face(landmarks, frame.shape):
                logger.warning("Invalid face detected")
                return "invalid_face", 0.0, []
            
            # Get bounding box with adaptive padding
            x1, y1, x2, y2 = self._get_bbox(landmarks, w, h)
            
            # Add extra padding to ensure we get the full face
            padding = int(max(x2-x1, y2-y1) * 0.2)  # 20% padding
            x1 = max(0, x1 - padding)
            y1 = max(0, y1 - padding)
            x2 = min(w, x2 + padding)
            y2 = min(h, y2 + padding)
            
            # Extract face ROI
            face_img = frame[y1:y2, x1:x2]
            
            # Skip if face ROI is too small
            if face_img.size == 0 or min(face_img.shape[:2]) < 40:  # Minimum 40x40 pixels
                logger.warning(f"Face ROI too small: {face_img.shape}")
                return "face_too_small", 0.0, []
            
            # Enhance image quality
            face_img = self._enhance_contrast(face_img)
            
            # Prepare face data for response
            bbox = {
                "top": int(y1),
                "right": int(x2),
                "bottom": int(y2),
                "left": int(x1),
                "width": int(x2 - x1),
                "height": int(y2 - y1)
            }
            
            try:
                # Save debug image (convert back to BGR for correct color display)
                os.makedirs("debug_faces", exist_ok=True)
                ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")
                debug_path = f"debug_faces/face_{ts}.jpg"
                
                # Convert to BGR and save
                debug_img = cv2.cvtColor(face_img, cv2.COLOR_RGB2BGR) if face_img.shape[2] == 3 else face_img
                cv2.imwrite(debug_path, debug_img)
                logger.info(f"Saved debug face image to {debug_path}")
                
                # Preprocess and predict
                input_tensor = self._preprocess_face(face_img)
                
                with torch.no_grad():
                    output = self.model(input_tensor)
                    probs = torch.nn.functional.softmax(output, dim=1)
                    
                    # Apply temperature scaling to soften probabilities
                    probs = torch.nn.functional.softmax(output / self.temperature, dim=1)
                    
                    # Get top predictions
                    confidence, predicted = torch.max(probs, 1)
                    confidence_val = confidence.item()
                    emotion_idx = predicted.item()
                    emotion = self.EMOTIONS.get(emotion_idx, "unknown").lower()
                    
                    # Get distribution of all emotions for debugging
                    emotion_probs = {}
                    for idx, prob in enumerate(probs[0]):
                        emotion_name = self.EMOTIONS.get(idx, f"unknown_{idx}").lower()
                        # Apply class weights
                        weight = self.class_weights.get(emotion_name, 1.0)
                        emotion_probs[emotion_name] = round(prob.item() * weight * 100, 2)
                    
                    # Normalize probabilities to sum to 100%
                    total = sum(emotion_probs.values())
                    if total > 0:
                        emotion_probs = {k: (v / total) * 100 for k, v in emotion_probs.items()}
                    
                    # Get the emotion with highest adjusted probability
                    emotion = max(emotion_probs.items(), key=lambda x: x[1])[0]
                    confidence_val = emotion_probs[emotion] / 100.0  # Convert back to 0-1 range
                    
                    logger.info(f"Emotion probabilities: {emotion_probs}")
                    
                    # Apply temporal smoothing to predictions
                    smoothed_emotion, smoothed_confidence = self._smooth_predictions(emotion, confidence_val)
                    
                    # Apply confidence threshold and handle anger over-prediction
                    if smoothed_confidence < self.min_confidence:
                        logger.warning(f"Low confidence prediction: {smoothed_emotion} ({smoothed_confidence:.2f})")
                        if smoothed_confidence < 0.5:  # Very low confidence
                            # If anger is predicted with low confidence, default to neutral
                            if smoothed_emotion == 'anger':
                                smoothed_emotion = 'neutral'
                                logger.info("Overriding low-confidence anger prediction with neutral")
                            else:
                                smoothed_emotion = "uncertain"
                    # If anger is predicted but not with high confidence, consider second best
                    elif smoothed_emotion == 'anger' and smoothed_confidence < 0.7:
                        # Get second best prediction
                        sorted_probs = sorted(emotion_probs.items(), key=lambda x: x[1], reverse=True)
                        if len(sorted_probs) > 1 and sorted_probs[0][0] == 'anger':
                            next_emotion, next_conf = sorted_probs[1]
                            if next_conf > smoothed_confidence * 0.8:  # If second best is close
                                smoothed_emotion = next_emotion
                                logger.info(f"Overriding anger with {next_emotion} due to close confidence")
                    
                    # Prepare response data
                    face_data = [{
                        "face_id": 0,
                        "bounding_box": bbox,
                        "emotion": smoothed_emotion,
                        "confidence": round(smoothed_confidence, 4),
                        "all_emotions": emotion_probs,
                        "raw_emotion": emotion,
                        "raw_confidence": round(confidence_val, 4)
                    }]
                    
                    logger.info(f"Final prediction: {emotion} ({confidence_val:.2f})")
                    return emotion, confidence_val, face_data
                    
            except Exception as e:
                logger.error(f"Error during emotion prediction: {str(e)}", exc_info=True)
                return "prediction_error", 0.0, []
                
        except Exception as e:
            logger.error(f"Error in face detection: {str(e)}", exc_info=True)
            return "detection_error", 0.0, []

# Singleton instance
emotion_detector = None

def get_emotion_detector(model_path: str) -> EmotionDetector:
    global emotion_detector
    if emotion_detector is None:
        emotion_detector = EmotionDetector(model_path)
    return emotion_detector
