# AI Detector — Image and Video Deepfake Detection System

A full-stack web application for detecting AI-generated images and deepfake videos using state-of-the-art machine learning models.

![AI Detector](Landing%20page%20UI.jpg)

## 🎯 Features

### Core Detection
- **Image Analysis**: Detects AI-generated images using SigLIP v1 + TruthScan API
- **Video Analysis**: Detects deepfake videos using VideoMAE transformer
- **Multi-Model Approach**: Combines local models with cloud APIs for highest accuracy
- **Visual Heatmaps**: Shows which parts of the image triggered the AI detection

### User Features
- 🔐 **Authentication**: Email/password + Google OAuth via Firebase
- 📊 **Detection History**: View all past analyses with filtering
- 📄 **PDF Reports**: Export detailed analysis reports
- 👤 **User Profiles**: Track detection count and manage account

### Admin Dashboard
- 📈 **Operations Dashboard**: Real-time stats (total analyses, AI detection rate, avg confidence)
- 👥 **User Management**: View/edit user roles, disable accounts
- 🔬 **All Analyses**: Monitor all detections across users
- 📊 **Algorithm Comparison**: Benchmark charts comparing ML approaches

## 🏗️ Architecture

```
Frontend (React + Vite)
  ├── Firebase Auth (authentication)
  ├── Firestore (database)
  └── Firebase Hosting (deployment)

Backend (FastAPI + Python)
  ├── TruthScan API (primary detection)
  ├── SigLIP v1 (local fallback)
  ├── VideoMAE (video detection)
  └── Render.com (deployment)
```

## 🚀 Tech Stack

### Frontend
- React 18 + Vite
- TailwindCSS
- Firebase (Auth, Firestore, Hosting)
- Recharts (visualization)
- jsPDF + html2canvas (PDF generation)

### Backend
- FastAPI
- PyTorch + Transformers (HuggingFace)
- OpenCV (video processing)
- Firebase Admin SDK
- Docker

## 📦 Installation

### Prerequisites
- Node.js 18+
- Python 3.11+
- Firebase account
- TruthScan API key (optional)

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your Firebase config
npm run dev
```

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Firebase service account
uvicorn app.main:app --reload
```

## 🌐 Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete deployment instructions to:
- Firebase Hosting (frontend)
- Render.com (backend)

**Live Demo**: https://capstone-project-96d2e.web.app

## 📊 Algorithm Performance

| Algorithm | Accuracy | F1 Score | AUC |
|-----------|----------|----------|-----|
| **TruthScan API (Ours)** | **96.1%** | **96.1%** | **0.99** |
| **SigLIP v1 (Ours)** | **94.4%** | **94.3%** | **0.98** |
| Gradient Boosting | 82.6% | 82.7% | 0.88 |
| Random Forest | 79.1% | 79.3% | 0.85 |
| SVM (RBF) | 77.4% | 77.5% | 0.83 |

See `/admin/algorithms` in the app for full comparison with citations.

## 🎓 Academic Context

This project was developed as a capstone thesis for Computer Science. It demonstrates:
- Full-stack development (React + FastAPI)
- Machine learning model integration (PyTorch, Transformers)
- Cloud deployment (Firebase, Render.com)
- Academic rigor (algorithm benchmarking, citations, evaluation)

## 📄 License

This project is part of an academic capstone and is provided for educational purposes.

## 👥 Contributors

- **Aaron Bolo** - Full-stack development, ML integration, deployment

## 🙏 Acknowledgments

- **Models Used**:
  - [prithivMLmods/deepfake-detector-model-v1](https://huggingface.co/prithivMLmods/deepfake-detector-model-v1) (SigLIP)
  - [Naman712/Deep-fake-detection](https://huggingface.co/Naman712/Deep-fake-detection) (VideoMAE)
  - [TruthScan API](https://truthscan.com) (primary detection)

- **Benchmarks**:
  - CIFAKE dataset (Bird & Lotfi, IEEE Access 2024)
  - FaceForensics++ (Rossler et al., ICCV 2019)

---

**Built with ❤️ for accurate AI detection**
