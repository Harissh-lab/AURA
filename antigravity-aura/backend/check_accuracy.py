"""
Dataset and Gemini API Accuracy Checker
Tests the combined counseling dataset quality and Gemini fallback API performance
"""

import json
import os
import sys
from dotenv import load_dotenv
import google.generativeai as genai
from collections import Counter
import re

# Load environment variables
load_dotenv()

def load_combined_dataset():
    """Load the combined counseling dataset"""
    try:
        dataset = []
        with open('combined_dataset.json', 'r', encoding='utf-8') as f:
            # Handle JSONL format (one JSON object per line)
            for line in f:
                line = line.strip()
                if line:
                    try:
                        dataset.append(json.loads(line))
                    except json.JSONDecodeError as e:
                        print(f"Skipping invalid JSON line: {e}")
        return dataset
    except Exception as e:
        print(f"Error loading dataset: {e}")
        return []

def analyze_dataset_quality(dataset):
    """Analyze the quality and characteristics of the dataset"""
    print("=" * 80)
    print("COMBINED COUNSELING DATASET ANALYSIS")
    print("=" * 80)
    
    if not dataset:
        print("❌ Dataset is empty or failed to load!")
        return
    
    print(f"\n📊 Dataset Size: {len(dataset)} professional responses")
    
    # Check structure
    print(f"\n📋 Dataset Structure:")
    sample = dataset[0] if dataset else {}
    print(f"   Fields: {list(sample.keys())}")
    
    # Analyze context and response lengths
    context_lengths = []
    response_lengths = []
    
    for entry in dataset:
        if 'Context' in entry:
            context_lengths.append(len(entry['Context']))
        if 'Response' in entry:
            response_lengths.append(len(entry['Response']))
    
    if context_lengths:
        avg_context = sum(context_lengths) / len(context_lengths)
        print(f"\n📝 Context Analysis:")
        print(f"   Average length: {avg_context:.0f} characters")
        print(f"   Shortest: {min(context_lengths)} characters")
        print(f"   Longest: {max(context_lengths)} characters")
    
    if response_lengths:
        avg_response = sum(response_lengths) / len(response_lengths)
        print(f"\n💬 Response Analysis:")
        print(f"   Average length: {avg_response:.0f} characters")
        print(f"   Shortest: {min(response_lengths)} characters")
        print(f"   Longest: {max(response_lengths)} characters")
    
    # Check for quality indicators
    print(f"\n✅ Quality Indicators:")
    
    # Professional language indicators
    professional_terms = [
        'therapy', 'counseling', 'therapist', 'counselor',
        'mental health', 'cognitive', 'behavioral', 'emotional',
        'coping', 'support', 'professional help'
    ]
    
    professional_count = 0
    for entry in dataset:
        response = entry.get('Response', '').lower()
        if any(term in response for term in professional_terms):
            professional_count += 1
    
    print(f"   Professional language: {professional_count}/{len(dataset)} ({professional_count/len(dataset)*100:.1f}%)")
    
    # Empathy indicators
    empathy_terms = [
        'understand', 'sorry to hear', 'sounds like', 'must be',
        'i hear', 'validate', 'acknowledge', 'recognize'
    ]
    
    empathy_count = 0
    for entry in dataset:
        response = entry.get('Response', '').lower()
        if any(term in response for term in empathy_terms):
            empathy_count += 1
    
    print(f"   Empathetic responses: {empathy_count}/{len(dataset)} ({empathy_count/len(dataset)*100:.1f}%)")
    
    # Action-oriented guidance
    action_terms = [
        'suggest', 'recommend', 'try', 'practice', 'consider',
        'work on', 'focus on', 'start', 'begin', 'help you'
    ]
    
    action_count = 0
    for entry in dataset:
        response = entry.get('Response', '').lower()
        if any(term in response for term in action_terms):
            action_count += 1
    
    print(f"   Action-oriented: {action_count}/{len(dataset)} ({action_count/len(dataset)*100:.1f}%)")
    
    # Sample contexts (for understanding dataset scope)
    print(f"\n📖 Sample Contexts (First 3):")
    for i, entry in enumerate(dataset[:3]):
        context = entry.get('Context', 'N/A')
        preview = context[:100] + "..." if len(context) > 100 else context
        print(f"\n   {i+1}. {preview}")
    
    return {
        'total_responses': len(dataset),
        'avg_context_length': avg_context if context_lengths else 0,
        'avg_response_length': avg_response if response_lengths else 0,
        'professional_percentage': professional_count/len(dataset)*100,
        'empathy_percentage': empathy_count/len(dataset)*100,
        'action_percentage': action_count/len(dataset)*100
    }

def test_gemini_api():
    """Test Gemini API connectivity and response quality"""
    print("\n" + "=" * 80)
    print("GEMINI AI FALLBACK API TESTING")
    print("=" * 80)
    
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    
    if not GEMINI_API_KEY or GEMINI_API_KEY == 'your_gemini_api_key_here':
        print("\n❌ Gemini API key not configured!")
        print("   Set GEMINI_API_KEY in your .env file")
        return None
    
    print(f"\n🔑 API Key: {GEMINI_API_KEY[:10]}...{GEMINI_API_KEY[-5:]}")
    
    # Try different model versions
    model_names = [
        'models/gemini-2.0-flash-exp',
        'models/gemini-1.5-flash',
        'models/gemini-1.5-pro',
        'models/gemini-pro'
    ]
    
    gemini_model = None
    working_model = None
    
    print(f"\n🔍 Testing Gemini Models:")
    for model_name in model_names:
        try:
            print(f"\n   Testing {model_name}...")
            genai.configure(api_key=GEMINI_API_KEY)
            test_model = genai.GenerativeModel(model_name)
            test_response = test_model.generate_content("Say 'Hello'")
            
            if test_response and test_response.text:
                print(f"   ✅ {model_name} - WORKING")
                print(f"      Response: {test_response.text[:50]}...")
                if not gemini_model:
                    gemini_model = test_model
                    working_model = model_name
            else:
                print(f"   ❌ {model_name} - No response")
        except Exception as e:
            print(f"   ❌ {model_name} - Error: {str(e)[:50]}...")
    
    if not gemini_model:
        print(f"\n❌ All Gemini models failed to initialize")
        return None
    
    print(f"\n✅ Using Model: {working_model}")
    
    # Test with mental health scenarios
    test_scenarios = [
        {
            "name": "Anxiety",
            "message": "I'm feeling really anxious about my exams and can't sleep",
            "expected_keywords": ["anxiety", "stress", "cope", "calm", "relax", "support"]
        },
        {
            "name": "Depression",
            "message": "I feel so worthless and alone lately",
            "expected_keywords": ["understand", "support", "help", "therapy", "counselor", "feelings"]
        },
        {
            "name": "Crisis",
            "message": "I can't take this anymore and don't want to be here",
            "expected_keywords": ["help", "talk", "crisis", "support", "hotline", "immediate"]
        },
        {
            "name": "Casual Check-in",
            "message": "How are you today?",
            "expected_keywords": ["help", "support", "feel", "share", "talk"]
        }
    ]
    
    print(f"\n📝 Testing Response Quality:")
    results = []
    
    for scenario in test_scenarios:
        print(f"\n   Scenario: {scenario['name']}")
        print(f"   Message: \"{scenario['message']}\"")
        
        try:
            # Create mental health context
            prompt = f"""You are a compassionate mental health support chatbot. Respond to this message with empathy and helpful guidance:

User: {scenario['message']}

Provide a supportive, professional response."""
            
            response = gemini_model.generate_content(prompt)
            response_text = response.text if response else "No response"
            
            # Analyze response quality
            response_lower = response_text.lower()
            matched_keywords = [kw for kw in scenario['expected_keywords'] if kw in response_lower]
            keyword_match_rate = len(matched_keywords) / len(scenario['expected_keywords']) * 100
            
            # Check response length
            response_length = len(response_text)
            
            # Check for empathy markers
            empathy_markers = ['understand', 'hear', 'sounds like', 'sorry', 'must be']
            has_empathy = any(marker in response_lower for marker in empathy_markers)
            
            # Check for actionable advice
            action_markers = ['try', 'consider', 'suggest', 'might help', 'can']
            has_action = any(marker in response_lower for marker in action_markers)
            
            print(f"   ✅ Response length: {response_length} characters")
            print(f"   ✅ Keyword match: {keyword_match_rate:.0f}% ({len(matched_keywords)}/{len(scenario['expected_keywords'])})")
            print(f"   ✅ Empathy: {'Yes' if has_empathy else 'No'}")
            print(f"   ✅ Actionable: {'Yes' if has_action else 'No'}")
            print(f"   📄 Response: {response_text[:150]}...")
            
            results.append({
                'scenario': scenario['name'],
                'success': True,
                'response_length': response_length,
                'keyword_match': keyword_match_rate,
                'has_empathy': has_empathy,
                'has_action': has_action
            })
            
        except Exception as e:
            print(f"   ❌ Error: {str(e)[:100]}...")
            results.append({
                'scenario': scenario['name'],
                'success': False,
                'error': str(e)
            })
    
    # Calculate overall accuracy
    successful = sum(1 for r in results if r.get('success', False))
    avg_keyword_match = sum(r.get('keyword_match', 0) for r in results if r.get('success')) / max(successful, 1)
    empathy_rate = sum(1 for r in results if r.get('has_empathy', False)) / len(results) * 100
    action_rate = sum(1 for r in results if r.get('has_action', False)) / len(results) * 100
    
    print(f"\n" + "=" * 80)
    print("GEMINI API PERFORMANCE SUMMARY")
    print("=" * 80)
    print(f"✅ Response Success Rate: {successful}/{len(test_scenarios)} ({successful/len(test_scenarios)*100:.0f}%)")
    print(f"✅ Average Keyword Match: {avg_keyword_match:.1f}%")
    print(f"✅ Empathy Rate: {empathy_rate:.0f}%")
    print(f"✅ Actionable Advice Rate: {action_rate:.0f}%")
    
    return {
        'model': working_model,
        'success_rate': successful/len(test_scenarios)*100,
        'avg_keyword_match': avg_keyword_match,
        'empathy_rate': empathy_rate,
        'action_rate': action_rate
    }

def generate_final_report(dataset_stats, gemini_stats):
    """Generate comprehensive accuracy report"""
    print("\n" + "=" * 80)
    print("FINAL ACCURACY REPORT")
    print("=" * 80)
    
    print(f"\n📊 Dataset Quality Score:")
    if dataset_stats:
        quality_score = (
            dataset_stats['professional_percentage'] * 0.3 +
            dataset_stats['empathy_percentage'] * 0.3 +
            dataset_stats['action_percentage'] * 0.4
        )
        print(f"   Overall Quality: {quality_score:.1f}%")
        print(f"   - Professional: {dataset_stats['professional_percentage']:.1f}%")
        print(f"   - Empathetic: {dataset_stats['empathy_percentage']:.1f}%")
        print(f"   - Actionable: {dataset_stats['action_percentage']:.1f}%")
        
        if quality_score >= 85:
            print(f"   ✅ EXCELLENT - Dataset is high quality")
        elif quality_score >= 70:
            print(f"   ✅ GOOD - Dataset is suitable for production")
        elif quality_score >= 50:
            print(f"   ⚠️  FAIR - Dataset needs improvement")
        else:
            print(f"   ❌ POOR - Dataset requires significant work")
    
    print(f"\n🤖 Gemini API Accuracy:")
    if gemini_stats:
        gemini_score = (
            gemini_stats['success_rate'] * 0.4 +
            gemini_stats['avg_keyword_match'] * 0.2 +
            gemini_stats['empathy_rate'] * 0.2 +
            gemini_stats['action_rate'] * 0.2
        )
        print(f"   Overall Accuracy: {gemini_score:.1f}%")
        print(f"   - Response Success: {gemini_stats['success_rate']:.1f}%")
        print(f"   - Keyword Relevance: {gemini_stats['avg_keyword_match']:.1f}%")
        print(f"   - Empathy: {gemini_stats['empathy_rate']:.1f}%")
        print(f"   - Actionable: {gemini_stats['action_rate']:.1f}%")
        
        if gemini_score >= 85:
            print(f"   ✅ EXCELLENT - Gemini API performs very well")
        elif gemini_score >= 70:
            print(f"   ✅ GOOD - Gemini API is suitable for fallback")
        elif gemini_score >= 50:
            print(f"   ⚠️  FAIR - Gemini API needs tuning")
        else:
            print(f"   ❌ POOR - Gemini API not recommended")
    
    print(f"\n🎯 Recommendations:")
    if dataset_stats and dataset_stats['professional_percentage'] < 70:
        print(f"   • Add more professional counseling responses to dataset")
    if dataset_stats and dataset_stats['empathy_percentage'] < 70:
        print(f"   • Enhance empathetic language in responses")
    if gemini_stats and gemini_stats['success_rate'] < 90:
        print(f"   • Check Gemini API configuration and prompts")
    if gemini_stats and gemini_stats['empathy_rate'] < 80:
        print(f"   • Improve Gemini prompt to include more empathy")
    
    print(f"\n✅ System Status:")
    if dataset_stats and gemini_stats:
        overall_system = (quality_score * 0.6 + gemini_score * 0.4)
        print(f"   Combined System Accuracy: {overall_system:.1f}%")
        if overall_system >= 75:
            print(f"   🟢 PRODUCTION READY")
        elif overall_system >= 60:
            print(f"   🟡 NEEDS IMPROVEMENT")
        else:
            print(f"   🔴 NOT READY FOR PRODUCTION")

if __name__ == '__main__':
    print("=" * 80)
    print("CHATBOT ACCURACY CHECKER")
    print("Analyzing Dataset Quality and Gemini API Performance")
    print("=" * 80)
    
    # Load and analyze dataset
    dataset = load_combined_dataset()
    dataset_stats = analyze_dataset_quality(dataset)
    
    # Test Gemini API
    gemini_stats = test_gemini_api()
    
    # Generate final report
    generate_final_report(dataset_stats, gemini_stats)
    
    print("\n" + "=" * 80)
    print("Analysis Complete!")
    print("=" * 80)
