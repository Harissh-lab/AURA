import json
import pandas as pd
import numpy as np
import pickle
import nltk
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import warnings
warnings.filterwarnings('ignore')

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import PorterStemmer

class MentalHealthChatbot:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        self.stemmer = PorterStemmer()
        self.intents_data = None
        self.csv_data = None
        self.intent_vectors = None
        self.csv_vectors = None
        
    def preprocess_text(self, text):
        """Preprocess text: lowercase, tokenize, remove stopwords, stem"""
        if not isinstance(text, str):
            return ""
        
        text = text.lower()
        tokens = word_tokenize(text)
        stop_words = set(stopwords.words('english'))
        tokens = [self.stemmer.stem(word) for word in tokens if word.isalnum() and word not in stop_words]
        return ' '.join(tokens)
    
    def load_intents(self, intents_path):
        """Load and process intents.json"""
        print("Loading intents data...")
        with open(intents_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        self.intents_data = []
        for intent in data['intents']:
            for pattern in intent['patterns']:
                for response in intent['responses']:
                    self.intents_data.append({
                        'tag': intent['tag'],
                        'pattern': pattern,
                        'response': response
                    })
        
        print(f"Loaded {len(self.intents_data)} intent patterns")
        return self.intents_data
    
    def load_csv_data(self, csv_path):
        """Load and process CSV dataset"""
        print("Loading CSV data...")
        df = pd.read_csv(csv_path, encoding='utf-8')
        
        # Combine both friend and professional mode responses
        self.csv_data = []
        for _, row in df.iterrows():
            if pd.notna(row['User Input']) and pd.notna(row['Friend Mode Response']):
                self.csv_data.append({
                    'input': row['User Input'],
                    'response': row['Friend Mode Response'],
                    'mode': 'friend'
                })
            if pd.notna(row['User Input']) and pd.notna(row['Professional Mode Response']):
                self.csv_data.append({
                    'input': row['User Input'],
                    'response': row['Professional Mode Response'],
                    'mode': 'professional'
                })
        
        print(f"Loaded {len(self.csv_data)} CSV patterns")
        return self.csv_data
    
    def train(self, intents_path, csv_path):
        """Train the chatbot model"""
        print("\n=== Starting Training ===\n")
        
        # Load data
        self.load_intents(intents_path)
        self.load_csv_data(csv_path)
        
        # Prepare intent patterns
        print("\nProcessing intent patterns...")
        intent_patterns = [self.preprocess_text(item['pattern']) for item in self.intents_data]
        self.intent_vectors = self.vectorizer.fit_transform(intent_patterns)
        
        # Prepare CSV patterns
        print("Processing CSV patterns...")
        csv_patterns = [self.preprocess_text(item['input']) for item in self.csv_data]
        self.csv_vectors = self.vectorizer.transform(csv_patterns)
        
        print("\n=== Training Complete ===\n")
        print(f"Total intent patterns: {len(intent_patterns)}")
        print(f"Total CSV patterns: {len(csv_patterns)}")
        print(f"Vocabulary size: {len(self.vectorizer.vocabulary_)}")
        
    def get_response(self, user_input, mode='friend', threshold=0.3):
        """Get chatbot response for user input"""
        if not user_input or not user_input.strip():
            return "I'm here to listen. Please tell me what's on your mind."
        
        # Preprocess input
        processed_input = self.preprocess_text(user_input)
        input_vector = self.vectorizer.transform([processed_input])
        
        # Check CSV data first (more specific mental health responses)
        if self.csv_data:
            csv_similarities = cosine_similarity(input_vector, self.csv_vectors)[0]
            max_csv_idx = np.argmax(csv_similarities)
            max_csv_sim = csv_similarities[max_csv_idx]
            
            if max_csv_sim > threshold:
                # Filter by mode
                matching_responses = [item for item in self.csv_data 
                                    if item['mode'] == mode and 
                                    self.csv_data.index(item) == max_csv_idx]
                
                if matching_responses:
                    return matching_responses[0]['response'].strip('"')
                else:
                    # If no match for specified mode, return the best match
                    return self.csv_data[max_csv_idx]['response'].strip('"')
        
        # Check intents data
        if self.intents_data:
            intent_similarities = cosine_similarity(input_vector, self.intent_vectors)[0]
            max_intent_idx = np.argmax(intent_similarities)
            max_intent_sim = intent_similarities[max_intent_idx]
            
            if max_intent_sim > threshold:
                return self.intents_data[max_intent_idx]['response']
        
        # Default response if no good match
        return "I understand you're going through something. Can you tell me more about how you're feeling?"
    
    def save_model(self, model_path='chatbot_model.pkl'):
        """Save trained model"""
        print(f"\nSaving model to {model_path}...")
        model_data = {
            'vectorizer': self.vectorizer,
            'intents_data': self.intents_data,
            'csv_data': self.csv_data,
            'intent_vectors': self.intent_vectors,
            'csv_vectors': self.csv_vectors
        }
        with open(model_path, 'wb') as f:
            pickle.dump(model_data, f)
        print("Model saved successfully!")
    
    def load_model(self, model_path='chatbot_model.pkl'):
        """Load trained model"""
        print(f"Loading model from {model_path}...")
        with open(model_path, 'rb') as f:
            model_data = pickle.load(f)
        
        self.vectorizer = model_data['vectorizer']
        self.intents_data = model_data['intents_data']
        self.csv_data = model_data['csv_data']
        self.intent_vectors = model_data['intent_vectors']
        self.csv_vectors = model_data['csv_vectors']
        print("Model loaded successfully!")

if __name__ == "__main__":
    # Initialize chatbot
    chatbot = MentalHealthChatbot()
    
    # Train the model
    intents_path = '../intents.json'
    csv_path = 'train_data.csv'
    
    chatbot.train(intents_path, csv_path)
    
    # Save the model
    chatbot.save_model('chatbot_model.pkl')
    
    # Test the chatbot
    print("\n=== Testing Chatbot ===\n")
    test_inputs = [
        "I feel really anxious about my exams",
        "I'm feeling lonely these days",
        "Hello",
        "I can't sleep at night"
    ]
    
    for test_input in test_inputs:
        print(f"User: {test_input}")
        print(f"Friend Mode: {chatbot.get_response(test_input, mode='friend')}")
        print(f"Professional Mode: {chatbot.get_response(test_input, mode='professional')}")
        print("-" * 80)
