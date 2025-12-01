# AURA Chatbot - Setup Complete! ✅

## What We've Built

A fully functional mental health AI chatbot with:

### 1. **Machine Learning Backend** (Python/Flask)
- ✅ Trained on 1,071 conversation patterns
  - 661 patterns from intents.json
  - 410 patterns from CSV dataset
- ✅ TF-IDF vectorization with cosine similarity matching
- ✅ NLTK text preprocessing (tokenization, stemming, stopwords)
- ✅ Two response modes: Friend & Professional

### 2. **REST API Server** (Flask)
- ✅ Running on `http://localhost:5000`
- ✅ Endpoints:
  - `POST /api/chat` - Get chatbot responses
  - `GET /api/health` - Health check
  - `GET /api/modes` - Available chat modes

### 3. **React Frontend** (Vite + Tailwind)
- ✅ Running on `http://localhost:5173`
- ✅ Modern, responsive UI
- ✅ Mode toggle (Friend/Professional)
- ✅ Real-time chat interface
- ✅ Integrated with backend API

## Current Status

### ✅ Backend Running
- Flask server: `http://localhost:5000`
- Model loaded: `chatbot_model.pkl`
- Training data processed: 1,071 patterns
- Vocabulary size: 188 words

### ✅ Frontend Running
- Vite dev server: `http://localhost:5173`
- Connected to backend API
- UI with mode selector
- Chat interface active

## How to Use

1. **Open the app**: http://localhost:5173
2. **Login** (if required)
3. **Select mode** using the toggle in the header:
   - **Friend Mode** 🌟: Casual, empathetic responses
   - **Professional Mode** 💼: Structured therapeutic guidance
4. **Start chatting!** Type your message and get AI-powered responses

## Testing Examples

Try these messages to test the chatbot:

- "I feel anxious about my exams"
- "I'm feeling lonely"
- "I can't sleep at night"
- "Hello"
- "I feel depressed"
- "My parents don't understand me"

## Files Created

### Backend Files
```
backend/
├── app.py                    # Flask API server
├── train_chatbot.py         # Training script
├── requirements.txt         # Python dependencies
├── chatbot_model.pkl       # Trained model (190KB)
├── README.md               # Backend documentation
└── .gitignore             # Git ignore patterns
```

### Frontend Files
```
src/
└── services/
    └── chatbotService.js   # API integration service
```

### Updated Files
```
src/pages/Home/Dashboard.jsx  # Added mode selector & API integration
README.md                     # Project documentation
```

## Model Performance

**Training Results:**
- Total patterns processed: 1,071
- Intent patterns: 661
- CSV patterns: 410
- Vocabulary size: 188 unique words
- Model size: ~190KB

**Response Quality:**
- Uses cosine similarity matching (threshold: 0.3)
- Prioritizes mental health-specific responses from CSV
- Falls back to general intents for broader topics
- Default supportive response for unmatched queries

## Next Steps (Optional Enhancements)

1. **Add conversation history** - Store chat sessions
2. **Improve matching** - Train with more data or use embeddings
3. **Add voice input** - Implement speech-to-text
4. **User profiles** - Personalize responses based on user history
5. **Analytics dashboard** - Track conversation patterns
6. **Multi-language support** - Train on multiple languages
7. **Deployment** - Deploy to production (Heroku, AWS, etc.)

## Troubleshooting

### Backend not responding?
```bash
cd backend
python app.py
```

### Frontend not connecting?
- Check if backend is running on port 5000
- Check console for CORS errors
- Verify API_BASE_URL in `chatbotService.js`

### Need to retrain?
```bash
cd backend
python train_chatbot.py
```

## Important Reminders

⚠️ **This chatbot is for educational/support purposes only**
- Not a substitute for professional mental health care
- In emergencies, contact local emergency services
- For serious concerns, consult a licensed therapist

## Technologies Used

**Frontend:**
- React 19
- Vite
- Tailwind CSS
- Lucide React

**Backend:**
- Flask 3.0
- scikit-learn
- NLTK
- pandas
- NumPy

**ML Approach:**
- TF-IDF Vectorization
- Cosine Similarity
- Text Preprocessing

---

🎉 **Your AURA mental health chatbot is ready to use!**

Access it at: http://localhost:5173
