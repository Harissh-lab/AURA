# Aura Chatbot Backend

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Train the Chatbot Model

```bash
python train_chatbot.py
```

This will:
- Load the intents.json and CSV dataset
- Process and vectorize the training data
- Train the chatbot model
- Save the model to `chatbot_model.pkl`

### 3. Run the Flask API Server

```bash
python app.py
```

The API will be available at `http://localhost:5000`

## API Endpoints

### POST /api/chat
Send a message to the chatbot

**Request:**
```json
{
  "message": "I feel anxious",
  "mode": "friend"
}
```

**Response:**
```json
{
  "response": "Hey, I hear you. Anxiety is tough...",
  "mode": "friend"
}
```

### GET /api/health
Check if the API and model are running

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

### GET /api/modes
Get available chat modes

**Response:**
```json
{
  "modes": [
    {
      "id": "friend",
      "name": "Friend Mode",
      "description": "Casual, supportive conversations"
    },
    {
      "id": "professional",
      "name": "Professional Mode",
      "description": "Professional therapeutic guidance"
    }
  ]
}
```

## Chat Modes

- **Friend Mode**: Casual, empathetic, and supportive responses
- **Professional Mode**: Structured, therapeutic, and professional guidance

## Model Details

The chatbot uses:
- TF-IDF vectorization for text representation
- Cosine similarity for finding best matching responses
- Combined dataset from intents.json and CSV file
- NLTK for text preprocessing (tokenization, stemming, stopword removal)

## Training Data

- `intents.json`: General conversation patterns and responses
- `Mental Health Chatbot Dataset - Friend mode and Professional mode Responses.csv`: Specialized mental health responses in two modes
