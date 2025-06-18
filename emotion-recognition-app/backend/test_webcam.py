import cv2
import requests
import numpy as np
from datetime import datetime
import time

# Initialize webcam
cap = cv2.VideoCapture(0)

def capture_and_analyze():
    print("Capturing image from webcam...")
    
    # Capture frame
    ret, frame = cap.read()
    if not ret:
        print("Error: Could not capture image from webcam")
        return
    
    # Save the captured image
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    image_path = f"capture_{timestamp}.jpg"
    cv2.imwrite(image_path, frame)
    print(f"Image saved as {image_path}")
    
    # Prepare the API request
    url = "http://localhost:8000/api/v1/analyze"
    params = {
        "model_path": "models/torchscript_model_0_66_37_wo_gl.pth",
        "landmark_path": "models/shape_predictor_68_face_landmarks.dat"
    }
    
    # Send the request
    try:
        with open(image_path, 'rb') as img:
            files = {'file': (image_path, img, 'image/jpeg')}
            
            print("\nSending request to API...")
            start_time = time.time()
            response = requests.post(url, params=params, files=files)
            end_time = time.time()
            
            print(f"Response time: {end_time - start_time:.2f} seconds")
            print(f"Status Code: {response.status_code}")
            print("Response:", response.json())
            
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    try:
        # Wait a moment for the webcam to initialize
        print("Initializing webcam... (Press 'c' to capture, 'q' to quit)")
        
        while True:
            # Show webcam preview
            ret, frame = cap.read()
            if not ret:
                print("Error: Could not read from webcam")
                break
                
            # Display the frame
            cv2.imshow('Webcam - Press c to capture, q to quit', frame)
            
            # Check for key presses
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('c'):
                capture_and_analyze()
                print("\nPress 'c' to capture another image, 'q' to quit")
                
    finally:
        # Clean up
        cap.release()
        cv2.destroyAllWindows()
