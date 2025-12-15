from flask import Flask, request, jsonify
from flask_cors import CORS
from train_chatbot import MentalHealthChatbot
import os
from dotenv import load_dotenv
import google.generativeai as genai
import json

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize ENHANCED ML-based distress detector (v2 with feature engineering)
distress_detector = None
try:
    from distress_detector_v2 import EnhancedMentalHealthDetector
    distress_detector = EnhancedMentalHealthDetector(model_type='random_forest')
    
    # Try v2 model first (enhanced with 78.85% accuracy)
    model_path_v2 = os.path.join(os.path.dirname(__file__), 'distress_detector_v2_random_forest.pkl')
    model_path_v1 = os.path.join(os.path.dirname(__file__), 'distress_detector.pkl')
    
    if os.path.exists(model_path_v2):
        distress_detector.load_model(model_path_v2)
        print("✅ ENHANCED ML distress detector v2 loaded (RandomForest + Features)")
        # Display test metrics if available
        test_metrics = distress_detector.get_test_metrics()
        if test_metrics and isinstance(test_metrics, dict):
            print(f"   📊 Gold Standard Test Performance:")
            print(f"      Accuracy:  {test_metrics['accuracy']*100:.2f}%")
            print(f"      Precision: {test_metrics['precision']*100:.2f}%")
            print(f"      Recall:    {test_metrics['recall']*100:.2f}%")
            print(f"      F1-Score:  {test_metrics['f1_score']*100:.2f}%")
            print(f"      Model:     {test_metrics['model_type'].upper()}")
            print(f"      Features:  {test_metrics['feature_count']} (TF-IDF + LIWC + Social + Sentiment)")
    else:
        print("⚠️ Enhanced model not found, training now (this may take 2-3 minutes)...")
        csv_path = os.path.join(os.path.dirname(__file__), 'train_data.csv')
        if os.path.exists(csv_path):
            distress_detector.train(csv_path, test_size=0.1, val_size=0.1)
            distress_detector.save_model(model_path_v2)
            print("✅ Enhanced ML distress detector v2 trained and saved")
        else:
            print("⚠️ train_data.csv not found, ML detection disabled")
            distress_detector = None
except Exception as e:
    print(f"⚠️ Could not load enhanced detector, trying fallback v1: {e}")
    # Fallback to v1 if v2 fails
    try:
        from distress_detector import MentalHealthDetector
        distress_detector = MentalHealthDetector()
        model_path = os.path.join(os.path.dirname(__file__), 'distress_detector.pkl')
        if os.path.exists(model_path):
            distress_detector.load_model(model_path)
            print("✅ ML distress detector v1 loaded (fallback)")
    except Exception as e2:
        print(f"⚠️ Could not load any distress detector: {e2}")
        distress_detector = None

# Load train_data.csv as primary dataset
counseling_dataset = []
import csv
import pandas as pd

try:
    # Load from train_data.csv in parent directory
    csv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'train_data.csv')
    
    if os.path.exists(csv_path):
        # Read CSV using pandas for better handling
        df = pd.read_csv(csv_path)
        
        # Create context-response pairs from the distress dataset
        for _, row in df.iterrows():
            text = str(row['text']) if 'text' in row else ''
            label = int(row['label']) if 'label' in row else 0
            confidence = float(row['confidence']) if 'confidence' in row else 0.5
            sentiment = float(row['sentiment']) if 'sentiment' in row else 0.0
            
            if len(text) < 20:  # Skip very short texts
                continue
            
            # Determine category based on label and content
            category = 'crisis' if label == 1 else 'general'
            
            # Generate appropriate response based on distress level
            if label == 1:  # Distress detected
                response = ("I hear how much pain you're going through, and I want you to know that you're not alone. "
                           "What you're feeling is valid, and there are people who care about you and want to help. "
                           "Please consider reaching out to a crisis helpline or a mental health professional. "
                           "Your life has value, and with support, things can get better. "
                           "Would you like to talk more about what you're experiencing?")
            else:
                response = ("Thank you for sharing what's on your mind. I'm here to listen and support you. "
                           "It sounds like you're dealing with something challenging. "
                           "Remember that seeking help is a sign of strength, not weakness. "
                           "Would you like to explore some coping strategies or talk more about how you're feeling?")
            
            counseling_dataset.append({
                'context': text,
                'response': response,
                'categories': [category],
                'quality_score': int(confidence * 100),
                'label': label,
                'sentiment': sentiment
            })
        
        print(f"✅ Loaded {len(counseling_dataset)} entries from train_data.csv")
        avg_quality = sum(e.get('quality_score', 0) for e in counseling_dataset) / len(counseling_dataset) if counseling_dataset else 0
        print(f"   📊 Average quality score: {avg_quality:.1f}")
        distress_count = sum(1 for e in counseling_dataset if e.get('label') == 1)
        print(f"   📊 Distress samples: {distress_count} / {len(counseling_dataset)} ({distress_count/len(counseling_dataset)*100:.1f}%)")
    else:
        print(f"⚠️ train_data.csv not found at {csv_path}, trying fallback...")
        # Fallback to processed dataset
        dataset_path = os.path.join(os.path.dirname(__file__), 'combined_dataset_processed_simple.json')
        if os.path.exists(dataset_path):
            with open(dataset_path, 'r', encoding='utf-8') as f:
                counseling_dataset = json.load(f)
            print(f"✅ Loaded {len(counseling_dataset)} processed counseling responses (fallback)")
except Exception as e:
    print(f"⚠️ Could not load dataset: {e}")
    import traceback
    traceback.print_exc()

# Function to find best matching response from dataset (enhanced)
def find_best_counseling_response(user_message):
    """Find best matching response using intelligent scoring"""
    if not counseling_dataset:
        return None
    
    user_message_lower = user_message.lower()
    
    # Category keywords for intelligent matching
    category_keywords = {
        'crisis': ['suicide', 'suicidal', 'kill myself', 'end my life', 'die', 'death', 'cant take', "can't take"],
        'depression': ['depression', 'depressed', 'sad', 'hopeless', 'empty', 'worthless', 'useless'],
        'anxiety': ['anxiety', 'anxious', 'worried', 'panic', 'nervous', 'stress', 'overwhelmed'],
        'trauma': ['abuse', 'trauma', 'hurt', 'violated', 'ptsd', 'assault'],
        'relationships': ['relationship', 'marriage', 'partner', 'boyfriend', 'girlfriend', 'spouse', 'divorce'],
        'family': ['family', 'parent', 'mother', 'father', 'child', 'sibling', 'brother', 'sister'],
        'self-esteem': ['self esteem', 'confidence', 'worth', 'value', 'believe in myself'],
        'grief': ['grief', 'loss', 'died', 'death', 'mourning'],
        'sleep': ['sleep', 'insomnia', 'cant sleep', "can't sleep", 'tired', 'exhausted'],
        'general': ['help', 'need', 'advice', 'what should']
    }
    
    # Detect user message category
    user_categories = []
    for category, keywords in category_keywords.items():
        if any(keyword in user_message_lower for keyword in keywords):
            user_categories.append(category)
    
    if not user_categories:
        user_categories = ['general']
    
    scored_responses = []
    for entry in counseling_dataset:
        context = entry.get('context', entry.get('Context', '')).lower()
        response = entry.get('response', entry.get('Response', ''))
        entry_categories = entry.get('categories', ['general'])
        quality_score = entry.get('quality_score', 50)
        
        if not response or len(response) < 50:
            continue
        
        score = 0
        
        # Category match (high weight)
        category_matches = len(set(user_categories) & set(entry_categories))
        score += category_matches * 30
        
        # Keyword matching in context
        for category in user_categories:
            keywords = category_keywords.get(category, [])
            for keyword in keywords:
                if keyword in user_message_lower and keyword in context:
                    score += 15
        
        # Word overlap (lower weight, for general matching)
        user_words = set(user_message_lower.split())
        context_words = set(context.split())
        # Remove common words
        stop_words = {'i', 'me', 'my', 'am', 'is', 'are', 'the', 'a', 'an', 'and', 'or', 'but'}
        user_words -= stop_words
        context_words -= stop_words
        overlap = len(user_words & context_words)
        score += overlap * 2
        
        # Quality boost (prefer higher quality responses)
        score += quality_score * 0.2
        
        # Priority for crisis responses
        if 'crisis' in user_categories and 'crisis' in entry_categories:
            score += 50
        
        if score > 0:
            scored_responses.append((score, response, entry_categories))
    
    if scored_responses:
        # Sort by score (highest first)
        scored_responses.sort(reverse=True, key=lambda x: x[0])
        # Return best matching response
        return scored_responses[0][1]
    
    return None

# Initialize Gemini AI
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
use_gemini = False
gemini_model = None

if GEMINI_API_KEY and GEMINI_API_KEY != 'your_gemini_api_key_here':
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        # Try multiple model versions in order of preference (updated to latest stable models)
        model_names = [
            'models/gemini-1.5-flash-latest',  # Latest stable flash model
            'models/gemini-1.5-pro-latest',    # Latest stable pro model
            'models/gemini-pro',               # Fallback to classic model
            'models/gemini-1.5-flash'          # Specific version fallback
        ]
        for model_name in model_names:
            try:
                gemini_model = genai.GenerativeModel(model_name)
                test_response = gemini_model.generate_content("Hi")
                use_gemini = True
                print(f"✅ Gemini AI initialized successfully with model: {model_name}")
                break
            except Exception as model_error:
                print(f"⚠️ Failed to load {model_name}: {model_error}")
                continue
        
        if not use_gemini:
            print("⚠️ All Gemini models failed to initialize")
            print("   Falling back to trained model only...")
            gemini_model = None
    except Exception as e:
        print(f"⚠️ Gemini configuration failed: {e}")
        print("   Falling back to trained model only...")
        use_gemini = False
        gemini_model = None
else:
    print("ℹ️ No Gemini API key found. Using trained model only.")

# RAG components - disabled for now due to loading issues
print("ℹ️ RAG system temporarily disabled (loading optimization needed)")
use_rag = False
embedding_model = None
rag_collection = None
chroma_client = None

# Note: To enable RAG, run setup_rag.py separately and ensure sentence-transformers loads correctly

# Initialize chatbot
chatbot = MentalHealthChatbot()

# Load the trained model
model_path = 'chatbot_model.pkl'
if os.path.exists(model_path):
    chatbot.load_model(model_path)
    print("✅ Chatbot model loaded successfully!")
else:
    print("⚠️ No trained model found. Please train the model first.")
    print("Run: python train_chatbot.py")

@app.route('/', methods=['GET'])
def root():
    """Root endpoint"""
    return jsonify({
        'message': 'AURA Mental Health Chatbot API',
        'status': 'running',
        'endpoints': {
            'chat': '/api/chat (POST)',
            'health': '/api/health (GET)',
            'modes': '/api/modes (GET)'
        }
    })

@app.route('/api/chat', methods=['POST', 'OPTIONS'])
def chat():
    """Handle chat requests with ML-based distress detection"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        print(f"📨 Received request: {data}")
        
        user_message = data.get('message', '')
        mode = data.get('mode', 'friend')
        use_ai = data.get('useAI', True)  # Option to use Gemini or trained model
        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        # ML-based distress detection
        ml_distress_result = None
        if distress_detector:
            try:
                ml_distress_result = distress_detector.predict_distress(user_message)
                print(f"🧠 ML Distress Detection: {ml_distress_result}")
            except Exception as e:
                print(f"⚠️ ML distress detection error: {e}")
        
        # Try to find a matching response from professional counseling dataset first
        counseling_response = find_best_counseling_response(user_message)
        
        if counseling_response and mode == 'professional':
            # Use professional counseling response from dataset
            response = counseling_response
            source = 'counseling_dataset'
        elif use_gemini and use_ai:
            # Use Gemini AI with mental health context
            response = get_gemini_response(user_message, mode)
            source = 'gemini'
        else:
            # Use trained model
            response = chatbot.get_response(user_message, mode=mode)
            source = 'trained_model'
        
        print(f"✅ Sending response ({source}): {response[:100]}...")
        
        # Build response with ML distress info
        response_data = {
            'response': response,
            'mode': mode,
            'source': source
        }
        
        # Add ML distress detection results if available
        if ml_distress_result:
            response_data['distress_detection'] = {
                'is_distress': ml_distress_result['is_distress'],
                'confidence': ml_distress_result['confidence'],
                'severity': ml_distress_result['severity'],
                'distress_probability': ml_distress_result['distress_probability']
            }
        
        return jsonify(response_data)
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

def retrieve_context(query, top_k=3):
    """Retrieve relevant context from RAG database"""
    if not use_rag:
        return ""
    
    try:
        # Generate query embedding
        query_embedding = embedding_model.encode([query])[0].tolist()
        
        # Query vector database
        results = rag_collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k
        )
        
        # Format retrieved documents
        context_docs = []
        for i, doc in enumerate(results['documents'][0]):
            metadata = results['metadatas'][0][i]
            context_docs.append(f"- {doc}")
        
        return "\n".join(context_docs)
    except Exception as e:
        print(f"⚠️ RAG retrieval error: {e}")
        return ""

def get_gemini_response(user_message, mode):
    """Get response from Gemini AI with RAG-enhanced context"""
    try:
        # Retrieve relevant context from RAG database
        retrieved_context = retrieve_context(user_message, top_k=5)
        
        # Create context based on mode
        if mode == 'friend':
            system_prompt = """You are Aura, a friendly and empathetic mental health support chatbot. 
            Respond in a casual, supportive, and relatable way. Use emojis occasionally. 
            Show understanding and provide emotional support like a caring friend would.
            Keep responses concise (2-4 sentences). Be warm and approachable.
            Do NOT mention that you're an AI in your responses - users already know this."""
        else:  # professional mode
            system_prompt = """You are Aura, a professional mental health assistant. 
            Provide structured, therapeutic responses with clinical insight. 
            Ask thoughtful questions to understand the user's situation better.
            Offer evidence-based suggestions and coping strategies.
            Keep responses concise (2-4 sentences). Be professional yet compassionate.
            Do NOT mention that you're an AI in your responses - users already know this."""
        
        # Build context with RAG information
        rag_context = ""
        if retrieved_context:
            rag_context = f"\n\nRelevant mental health knowledge base context:\n{retrieved_context}\n"
        
        # Add important crisis handling context
        context = f"""{system_prompt}

IMPORTANT: If someone mentions self-harm, suicide, or severe crisis, provide crisis helpline information immediately.{rag_context}

User message: {user_message}

Respond appropriately based on the context above:"""
        
        response = gemini_model.generate_content(context)
        return response.text.strip()
        
    except Exception as e:
        print(f"⚠️ Gemini error: {e}")
        # Fallback to trained model
        return chatbot.get_response(user_message, mode=mode)

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'trained_model_loaded': chatbot.vectorizer is not None,
        'gemini_enabled': use_gemini,
        'rag_enabled': use_rag,
        'ai_provider': 'gemini_with_rag' if (use_gemini and use_rag) else ('gemini' if use_gemini else 'trained_model')
    })

@app.route('/api/modes', methods=['GET'])
def get_modes():
    """Get available chat modes"""
    return jsonify({
        'modes': [
            {
                'id': 'friend',
                'name': 'Friend Mode',
                'description': 'Casual, supportive conversations'
            },
            {
                'id': 'professional',
                'name': 'Professional Mode',
                'description': 'Professional therapeutic guidance'
            }
        ]
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
