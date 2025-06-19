# Mental Health Recognition App

A full-stack web application for real-time facial emotion recognition using deep learning, designed to support mental health research. This application uses a Next.js frontend and FastAPI backend with PyTorch for emotion detection.

## 🚀 Deployment with Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=YOUR_RAILWAY_TEMPLATE_LINK)

### Prerequisites
- A GitHub account
- A Railway account (free tier available)
- Docker (for local testing, optional)

### Deployment Steps

1. **Fork this repository** to your GitHub account
2. **Sign in to Railway** using your GitHub account
3. **Create a new project** and select "Deploy from GitHub repo"
4. **Select your forked repository** and the branch you want to deploy
5. **Configure environment variables** (if any) in the Railway dashboard
6. **Deploy!** Railway will automatically build and deploy your application

### Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Backend Configuration
PORT=8000
ENVIRONMENT=production

# CORS (update with your frontend URL)
FRONTEND_URL=https://your-frontend-url.railway.app

# Security (generate these for production)
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## 🏗️ Local Development

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the FastAPI server:
   ```bash
   ./start.sh
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🤖 Features

- Real-time facial emotion detection from webcam or uploaded videos
- Emotion prediction using a pre-trained EMO-AffectNet model
- Facial landmark detection with Dlib
- Interactive emotion timeline visualization
- Data export functionality (CSV)
- Responsive and modern UI

## 🛠️ Tech Stack

### Backend
- Python 3.9+
- FastAPI
- PyTorch
- OpenCV
- Dlib
- WebSockets

### Frontend
- Next.js 13
- TypeScript
- TailwindCSS
- Chart.js
- WebRTC

## Features

- Real-time facial emotion detection from webcam or uploaded videos
- Emotion prediction using a pre-trained EMO-AffectNet model
- Facial landmark detection with Dlib
- Interactive emotion timeline visualization
- Data export functionality (CSV)
- Responsive and modern UI

## Tech Stack

### Backend
- Python 3.8+
- FastAPI
- OpenCV
- Dlib
- PyTorch (TorchScript)
- WebSockets for real-time communication

### Frontend
- Next.js 13 with TypeScript
- TailwindCSS for styling
- Chart.js for data visualization
- WebRTC for camera access

## Prerequisites

- Python 3.8 or higher
- Node.js 16.x or higher
- pip (Python package manager)
- npm or yarn

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd emotion-recognition-app
```

### 2. Backend Setup

1. Create and activate a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Download the required models:
   - Place your TorchScript model (e.g., `torchscript_model_0_66_49_wo_gl.pth`) in `backend/models/`
   - Download the Dlib shape predictor file (68 face landmarks) and place it in `backend/models/`

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

## Running the Application

### 1. Start the Backend

From the `backend` directory:

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### 2. Start the Frontend

From the `frontend` directory:

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

## Usage

1. Open the application in your web browser
2. Choose between live camera or video upload mode
3. Allow camera access if prompted
4. View real-time emotion detection and analysis
5. Use the export button to download emotion data as CSV

## Project Structure

```
emotion-recognition-app/
├── backend/                    # Backend server
│   ├── app/
│   │   ├── api/               # API routes
│   │   ├── core/              # Core configuration
│   │   ├── models/            # ML models
│   │   ├── services/          # Business logic
│   │   └── utils/             # Utility functions
│   ├── tests/                 # Backend tests
│   ├── requirements.txt        # Python dependencies
│   └── main.py                # FastAPI application entry point
│
├── frontend/                  # Frontend application
│   ├── public/                # Static files
│   ├── src/
│   │   ├── app/             # Next.js app directory
│   │   ├── components/        # React components
│   │   └── styles/            # Global styles
│   ├── package.json           # Node.js dependencies
│   └── tsconfig.json          # TypeScript configuration
│
└── README.md                 # This file
```

## Troubleshooting

1. **Dlib installation issues**:
   - On macOS: `brew install cmake`
   - On Ubuntu: `sudo apt-get install cmake`
   - Then reinstall dlib: `pip install dlib --force-reinstall --no-cache-dir`

2. **Webcam access issues**:
   - Ensure your browser has camera permissions
   - Try accessing the app via `https://` or `http://localhost`

3. **Model loading errors**:
   - Verify the model files are in the correct location
   - Check the model file paths in `backend/app/core/config.py`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- EMO-AffectNet for the pre-trained emotion recognition model
- Dlib for facial landmark detection
- The open-source community for the amazing libraries used in this project
