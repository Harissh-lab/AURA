"""
Quick script to list available Gemini models
"""
import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

api_key = os.getenv('GEMINI_API_KEY')

if not api_key:
    print("❌ GEMINI_API_KEY not found")
else:
    print(f"✅ API Key found: {api_key[:10]}...")
    
    try:
        genai.configure(api_key=api_key)
        
        print("\n📋 Available Gemini Models:\n")
        
        for model in genai.list_models():
            if 'generateContent' in model.supported_generation_methods:
                print(f"✅ {model.name}")
                print(f"   Display Name: {model.display_name}")
                print(f"   Description: {model.description[:80]}...")
                print()
        
    except Exception as e:
        print(f"❌ Error: {e}")
