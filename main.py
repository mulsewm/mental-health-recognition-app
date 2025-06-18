import cv2
import dlib
import torch
import numpy as np
from torchvision import transforms
from PIL import Image
import csv
import os
from datetime import datetime
from collections import Counter

# --- Load face detector and shape predictor ---
detector = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")

# --- Load TorchScript emotion model ---
model_path = "EMO-AffectNetModel/backbone_models/torchscript_model_0_66_37_wo_gl.pth"
model = torch.jit.load(model_path)
model.eval()

# --- Load emotion labels (same order as model output) ---
with open("labels.txt", "r") as f:
    labels = [line.strip() for line in f.readlines()]

# --- Transform for model input (224x224 RGB) ---
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

# --- Setup webcam ---
cap = cv2.VideoCapture(0, cv2.CAP_AVFOUNDATION)
if not cap.isOpened():
    print("Error: Cannot access webcam")
    exit()

# --- CSV logging setup ---
os.makedirs("logs", exist_ok=True)
csv_path = os.path.join("logs", "emotion_log.csv")

if not os.path.exists(csv_path):
    with open(csv_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["timestamp", "emotion"])

# --- Emotion history buffer ---
emotion_history = []

# --- Main loop ---
while True:
    ret, frame = cap.read()
    if not ret:
        break

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = detector(gray)

    for face in faces:
        # Get landmarks
        shape = predictor(gray, face)

        # Crop & preprocess face
        x1, y1 = face.left(), face.top()
        x2, y2 = face.right(), face.bottom()
        face_crop = frame[y1:y2, x1:x2]

        if face_crop.size == 0:
            continue  # skip if invalid crop

        face_pil = Image.fromarray(cv2.cvtColor(face_crop, cv2.COLOR_BGR2RGB))
        input_tensor = transform(face_pil).unsqueeze(0)

        # Predict emotion
        with torch.no_grad():
            output = model(input_tensor)
            pred = torch.argmax(output, dim=1).item()
            emotion = labels[pred]

        # Draw face landmarks
        for i in range(68):
            x, y = shape.part(i).x, shape.part(i).y
            cv2.circle(frame, (x, y), 1, (0, 255, 0), -1)

        # Draw bounding box and label
        cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
        cv2.putText(frame, emotion, (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

        # --- Log to CSV ---
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with open(csv_path, "a", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([timestamp, emotion])

        # --- Track emotion trends ---
        emotion_history.append(emotion)
        if len(emotion_history) > 100:
            emotion_history.pop(0)

    # Print top 3 recent emotions
    top_emotions = Counter(emotion_history).most_common(3)
    print("Recent dominant emotions:", top_emotions)

    # Display the frame
    cv2.imshow("Facial Landmark + Emotion Recognition", frame)

    # Exit on 'q'
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Cleanup
cap.release()
cv2.destroyAllWindows()
