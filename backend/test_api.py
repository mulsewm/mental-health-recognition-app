import requests
import os

# Test image URL (using a placeholder image)
test_image_url = "https://raw.githubusercontent.com/opencv/opencv/master/samples/data/lena.jpg"

# Download test image
response = requests.get(test_image_url)
with open("test_image.jpg", "wb") as f:
    f.write(response.content)

# API endpoint
url = "http://localhost:8000/api/v1/analyze/"

# Query parameters
params = {
    "model_path": "models/torchscript_model_0_66_37_wo_gl.pth",
    "landmark_path": "models/shape_predictor_68_face_landmarks.dat"
}

# Prepare the file
files = {
    'file': ('test_image.jpg', open('test_image.jpg', 'rb'), 'image/jpeg')
}

# Make the request
print("Sending request to:", url)
response = requests.post(url, params=params, files=files)

# Print the response
print("\nResponse Status Code:", response.status_code)
print("\nResponse Headers:", response.headers)
print("\nResponse Body:", response.text)

# Clean up
os.remove("test_image.jpg")
