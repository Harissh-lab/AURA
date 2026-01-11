"""
Start AURA Backend Server
Wrapper to ensure server stays running
"""
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import and run app
from app import app

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 AURA Backend Server Starting...")
    print("="*60)
    print(f"📍 Running on: http://127.0.0.1:5000")
    print(f"🎤 Voice input ready!")
    print("="*60 + "\n")
    
    # Run server
    app.run(debug=False, port=5000, host='0.0.0.0', threaded=True, use_reloader=False)
