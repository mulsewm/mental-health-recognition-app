import requests
from PIL import Image
import numpy as np
import io

# Create a simple test image (100x100 red square)
img = Image.new('RGB', (100, 100), color='red')

# Convert to bytes
img_byte_arr = io.BytesIO()
img.save(img_byte_arr, format='JPEG')
img_byte_arr = img_byte_arr.getvalue()

# API endpoint
url = "http://localhost:8000/api/v1/analyze"

# Query parameters
params = {
    "model_path": "models/torchscript_model_0_66_37_wo_gl.pth",
    "landmark_path": "models/shape_predictor_68_face_landmarks.dat"
}

# Prepare the file
files = {
    'file': ('test.jpg', img_byte_arr, 'image/jpeg')
}

# Make the request
print("Sending request to:", url)
response = requests.post(url, params=params, files=files)

# Print the response
print("\nResponse Status Code:", response.status_code)
print("\nResponse Headers:", response.headers)
print("\nResponse Body:", response.text)
