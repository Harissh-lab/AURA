"""
Simple Chatbot Training Script
Uses train_data.csv and intents.json
"""
from train_chatbot import MentalHealthChatbot
import pandas as pd
import pickle

print("\n=== Training Chatbot Model ===\n")

chatbot = MentalHealthChatbot()

# Load intents
intents_path = '../intents.json'
print(f"Loading intents from: {intents_path}")
chatbot.load_intents(intents_path)

# Process intent patterns
intent_patterns = [chatbot.preprocess_text(item['pattern']) for item in chatbot.intents_data]
chatbot.intent_vectors = chatbot.vectorizer.fit_transform(intent_patterns)

print(f"Loaded {len(chatbot.intents_data)} intent patterns")

# Save the model
model_path = 'chatbot_model.pkl'
chatbot.save_model(model_path)

print(f"\n✅ Chatbot model trained and saved to: {model_path}\n")
