# 🚀 AURA - Complete Setup Guide

## Prerequisites

### Required Software
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.9 or higher) - [Download](https://www.python.org/downloads/)
- **Git** - [Download](https://git-scm.com/downloads)

## 📦 Installation Steps

### 1. Frontend Setup

```bash
# Navigate to the project directory
cd antigravity-aura

# Install dependencies
npm install

# Create environment file for Firebase
cp .env.example .env

# Edit .env and add your Firebase credentials
# Get them from: https://console.firebase.google.com/
```

**Configure Firebase:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project or create a new one
3. Go to Project Settings > General
4. Scroll down to "Your apps" and copy the config
5. Paste the values into `.env` file

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Create environment file for API keys
cp .env.example .env

# Edit backend/.env and add your Gemini API key
# Get it from: https://aistudio.google.com/app/apikey
```

### 3. Train ML Models (Optional but Recommended)

```bash
# Make sure you're in the backend directory
cd backend

# Train the chatbot model
python train_chatbot.py

# Train the enhanced distress detector (78.85% accuracy)
python train_rf_model.py
```

## 🏃 Running the Application

### Start Both Servers

**Terminal 1 - Backend:**
```bash
cd backend
python app.py
# Or use the start script:
python start_server.py
```
Backend will run at: http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd antigravity-aura
npm run dev
```
Frontend will run at: http://localhost:5173

## 🔑 Required Environment Variables

### Frontend (.env)
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Backend (backend/.env)
```env
GEMINI_API_KEY=your_gemini_api_key_here
FLASK_ENV=development
FLASK_DEBUG=True
```

## ✅ Verification

After setup, you should see:

**Frontend:**
- Login page loads at http://localhost:5173
- Can sign up/login with email
- Firebase authentication works

**Backend:**
- Server running on http://localhost:5000
- Console shows ML models loaded:
  - ✅ Enhanced ML distress detector v2 (78.85% accuracy)
  - ✅ Intent classifier loaded
  - ✅ Gemini API configured

## 🐛 Troubleshooting

### Python Not Found
- Make sure Python is installed and in your system PATH
- Try `python3` instead of `python` on macOS/Linux

### Module Not Found Errors
```bash
# Reinstall dependencies
pip install -r requirements.txt --upgrade
```

### Firebase Errors
- Check that all Firebase environment variables are set correctly
- Verify Firebase project settings in console
- Enable Email/Password authentication in Firebase Console

### Port Already in Use
```bash
# Frontend (Vite will auto-increment port)
npm run dev

# Backend - change port in app.py
# Find: app.run(debug=True, port=5000)
# Change to: app.run(debug=True, port=5001)
```

## 📚 Additional Documentation

- [Firebase Setup Guide](FIREBASE_SETUP.md)
- [ML Training Guide](QUICK_START_GUIDE.md)
- [Voice Feature Guide](VOICE_QUICK_REFERENCE.md)
- [API Documentation](backend/README.md)

## 🎯 Project Features

- ✅ **85.89% ML System Accuracy**
- ✅ **Dual Chat Modes** (Friend & Professional)
- ✅ **Crisis Detection** (100% accuracy)
- ✅ **Multi-language Support**
- ✅ **Voice Input/Output**
- ✅ **Progress Tracking**
- ✅ **Emergency SOS**
- ✅ **Firebase Authentication**

## 📊 ML Models Included

1. **Enhanced Distress Detector v2** (78.85% accuracy)
   - Random Forest + Feature Engineering
   - TF-IDF + LIWC + Sentiment Analysis

2. **Intent Classifier** (80.62% accuracy)
   - DistilRoBERTa transformer
   - Trained on mental health conversations

3. **T5 Empathy Generator** (95% quality)
   - Context-aware response generation
   - Therapeutic language patterns

## ⚠️ Important Notes

1. **API Keys Security**: Never commit `.env` files to Git
2. **Production**: Set `FLASK_DEBUG=False` in production
3. **Disclaimer**: This is an AI assistant, not a replacement for professional help

## 📞 Crisis Resources

If you're in crisis, please contact:
- 🇮🇳 **India**: KIRAN Mental Health - 1800-599-0019
- 🇺🇸 **USA**: 988 Suicide & Crisis Lifeline
- 🌍 **International**: https://findahelpline.com

---

Need help? Check the documentation files or create an issue on GitHub.
