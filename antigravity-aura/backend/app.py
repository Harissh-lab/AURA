from flask import Flask, request, jsonify
from flask_cors import CORS
from train_chatbot import MentalHealthChatbot
import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize Gemini AI
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
use_gemini = False
gemini_model = None

if GEMINI_API_KEY and GEMINI_API_KEY != 'your_gemini_api_key_here':
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        # Try multiple model versions in order of preference
        model_names = ['models/gemini-2.5-flash', 'models/gemini-flash-latest', 'models/gemini-2.0-flash']
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
    """Handle chat requests"""
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
        
        # Choose response method
        if use_gemini and use_ai:
            # Use Gemini AI with mental health context
            response = get_gemini_response(user_message, mode)
            source = 'gemini'
        else:
            # Use trained model
            response = chatbot.get_response(user_message, mode=mode)
            source = 'trained_model'
        
        print(f"✅ Sending response ({source}): {response[:100]}...")
        
        return jsonify({
            'response': response,
            'mode': mode,
            'source': source
        })
    
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
