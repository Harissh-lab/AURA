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

if GEMINI_API_KEY and GEMINI_API_KEY != 'your_gemini_api_key_here':
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel('gemini-pro')
        use_gemini = True
        print("✅ Gemini AI initialized successfully!")
    except Exception as e:
        print(f"⚠️ Gemini initialization failed: {e}")
        use_gemini = False
else:
    print("ℹ️ No Gemini API key found. Using trained model only.")

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

def get_gemini_response(user_message, mode):
    """Get response from Gemini AI with mental health context"""
    try:
        # Create context based on mode
        if mode == 'friend':
            system_prompt = """You are Aura, a friendly and empathetic mental health support chatbot. 
            Respond in a casual, supportive, and relatable way. Use emojis occasionally. 
            Show understanding and provide emotional support like a caring friend would.
            Keep responses concise (2-4 sentences). Be warm and approachable."""
        else:  # professional mode
            system_prompt = """You are Aura, a professional mental health assistant. 
            Provide structured, therapeutic responses with clinical insight. 
            Ask thoughtful questions to understand the user's situation better.
            Offer evidence-based suggestions and coping strategies.
            Keep responses concise (2-4 sentences). Be professional yet compassionate."""
        
        # Add important disclaimer context
        context = f"""{system_prompt}

IMPORTANT: Always remind users that you're an AI assistant, not a replacement for professional help.
If someone mentions self-harm, suicide, or severe crisis, provide crisis helpline information.

User message: {user_message}

Respond appropriately:"""
        
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
        'ai_provider': 'gemini' if use_gemini else 'trained_model'
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
