import requests

# API endpoint
url = "http://localhost:8000/api/v1/analyze"

# Query parameters
params = {
    "model_path": "models/torchscript_model_0_66_37_wo_gl.pth",
    "landmark_path": "models/shape_predictor_68_face_landmarks.dat"
}

# Path to the uploaded image
image_path = "uploads/Screenshot 2025-06-16 at 9.55.42 PM.png"

# Prepare the file
with open(image_path, 'rb') as img:
    files = {
        'file': (image_path.split('/')[-1], img, 'image/png')
    }
    
    # Make the request
    print(f"Sending request with image: {image_path}")
    response = requests.post(url, params=params, files=files)

    # Print the response
    print("\nResponse Status Code:", response.status_code)
    print("\nResponse Headers:", response.headers)
    print("\nResponse Body:", response.text)
