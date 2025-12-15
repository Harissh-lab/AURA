"""
Upgrade Low-Quality Responses using Gemini API
Rewrites responses with quality_score < 70 to be more empathetic, professional, and actionable
"""

import json
import os
import time
from dotenv import load_dotenv
import google.generativeai as genai
from datetime import datetime

# Load environment variables
load_dotenv()

# Configuration
INPUT_FILE = 'combined_dataset_processed_simple.json'
OUTPUT_FILE = 'combined_dataset_gold.json'
CHECKPOINT_FILE = 'upgrade_checkpoint.json'
QUALITY_THRESHOLD = 70
SAVE_INTERVAL = 20
API_DELAY = 2  # seconds between API calls

def initialize_gemini():
    """Initialize Gemini AI with API key"""
    api_key = os.getenv('GEMINI_API_KEY')
    
    if not api_key or api_key == 'your_gemini_api_key_here':
        raise ValueError("❌ GEMINI_API_KEY not found in environment variables")
    
    try:
        genai.configure(api_key=api_key)
        
        # Try multiple model versions (use correct model names from API)
        model_names = [
            'models/gemini-2.5-flash',          # Fastest, newest
            'models/gemini-flash-latest',       # Latest flash
            'models/gemini-2.0-flash',          # Stable 2.0
            'models/gemini-pro-latest'          # Pro fallback
        ]
        
        for model_name in model_names:
            try:
                model = genai.GenerativeModel(model_name)
                # Test the model
                test_response = model.generate_content("Hi")
                print(f"✅ Gemini AI initialized successfully with model: {model_name}")
                return model
            except Exception as e:
                print(f"⚠️ Failed to load {model_name}: {e}")
                continue
        
        raise Exception("❌ All Gemini models failed to initialize")
        
    except Exception as e:
        raise Exception(f"❌ Gemini configuration failed: {e}")

def load_dataset(filename):
    """Load dataset from JSON file"""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"✅ Loaded {len(data)} entries from {filename}")
        return data
    except FileNotFoundError:
        print(f"❌ File not found: {filename}")
        raise
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in {filename}: {e}")
        raise

def save_dataset(data, filename):
    """Save dataset to JSON file"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"💾 Saved {len(data)} entries to {filename}")
    except Exception as e:
        print(f"❌ Failed to save {filename}: {e}")
        raise

def load_checkpoint():
    """Load checkpoint to resume from where we left off"""
    if os.path.exists(CHECKPOINT_FILE):
        try:
            with open(CHECKPOINT_FILE, 'r', encoding='utf-8') as f:
                checkpoint = json.load(f)
            print(f"📍 Resuming from checkpoint: {checkpoint['last_processed_index']} items processed")
            return checkpoint
        except Exception as e:
            print(f"⚠️ Could not load checkpoint: {e}")
    return {'last_processed_index': -1, 'upgraded_count': 0, 'failed_count': 0}

def save_checkpoint(checkpoint_data):
    """Save checkpoint for recovery"""
    try:
        with open(CHECKPOINT_FILE, 'w', encoding='utf-8') as f:
            json.dump(checkpoint_data, f, indent=2)
    except Exception as e:
        print(f"⚠️ Failed to save checkpoint: {e}")

def upgrade_response_with_gemini(model, context, current_response, retry_count=3):
    """
    Use Gemini API to rewrite a response to be more empathetic, professional, and actionable
    
    Args:
        model: Gemini model instance
        context: User's query/concern
        current_response: Current response to improve
        retry_count: Number of retries on failure
    
    Returns:
        Upgraded response string or None on failure
    """
    prompt = f"""You are a professional mental health counselor. Rewrite the following response to be highly empathetic, professional, and actionable.

User's concern: "{context}"

Current response: "{current_response}"

Requirements:
1. Show deep empathy and understanding
2. Use professional mental health language
3. Provide actionable advice or next steps
4. Keep it under 100 words
5. Maintain a warm, supportive tone
6. Address the specific concern raised

Rewrite the response now:"""

    for attempt in range(retry_count):
        try:
            response = model.generate_content(prompt)
            
            if response and response.text:
                upgraded_text = response.text.strip()
                
                # Basic validation
                if len(upgraded_text) > 20 and len(upgraded_text) < 800:
                    return upgraded_text
                else:
                    print(f"⚠️ Response length invalid: {len(upgraded_text)} chars")
                    
        except Exception as e:
            error_msg = str(e).lower()
            
            # Handle quota exceeded
            if 'quota' in error_msg or '429' in error_msg:
                print(f"⚠️ API quota exceeded. Waiting 60 seconds...")
                time.sleep(60)
                continue
            
            # Handle rate limit
            elif 'rate' in error_msg or 'limit' in error_msg:
                wait_time = (attempt + 1) * 10
                print(f"⚠️ Rate limit hit. Waiting {wait_time} seconds...")
                time.sleep(wait_time)
                continue
            
            # Other errors
            else:
                print(f"❌ API error (attempt {attempt + 1}/{retry_count}): {e}")
                if attempt < retry_count - 1:
                    time.sleep(5)
                    continue
    
    return None

def upgrade_dataset():
    """Main function to upgrade all low-quality responses"""
    
    print("=" * 80)
    print("RESPONSE UPGRADE USING GEMINI API")
    print("=" * 80)
    print()
    
    # Initialize
    print("🔧 Initializing...")
    try:
        model = initialize_gemini()
    except Exception as e:
        print(f"\n{e}")
        print("\n💡 Make sure GEMINI_API_KEY is set in your .env file")
        return
    
    # Load data
    print()
    dataset = load_dataset(INPUT_FILE)
    
    # Load checkpoint
    checkpoint = load_checkpoint()
    start_index = checkpoint['last_processed_index'] + 1
    
    # Analyze dataset
    low_quality = [i for i, entry in enumerate(dataset) if entry.get('quality_score', 0) < QUALITY_THRESHOLD]
    total_to_upgrade = len(low_quality)
    already_processed = sum(1 for i in low_quality if i < start_index)
    remaining = total_to_upgrade - already_processed
    
    print()
    print("📊 Dataset Analysis:")
    print(f"   Total entries: {len(dataset)}")
    print(f"   Low quality (<{QUALITY_THRESHOLD}): {total_to_upgrade} ({total_to_upgrade/len(dataset)*100:.1f}%)")
    print(f"   Already processed: {already_processed}")
    print(f"   Remaining to upgrade: {remaining}")
    print()
    
    if remaining == 0:
        print("✅ All responses already upgraded!")
        return
    
    # Confirm with user
    print(f"⚠️ This will make approximately {remaining} API calls to Gemini.")
    print(f"   Estimated time: {remaining * (API_DELAY + 2) / 60:.1f} minutes")
    print()
    
    # Start upgrading
    print("🚀 Starting upgrade process...")
    print()
    
    upgraded_count = checkpoint['upgraded_count']
    failed_count = checkpoint['failed_count']
    skipped_count = 0
    
    for i, entry in enumerate(dataset):
        # Skip if already processed
        if i < start_index:
            continue
        
        # Skip if quality is already good
        if entry.get('quality_score', 0) >= QUALITY_THRESHOLD:
            skipped_count += 1
            continue
        
        context = entry.get('context', '')
        current_response = entry.get('response', '')
        quality_score = entry.get('quality_score', 0)
        
        print(f"[{i+1}/{len(dataset)}] Quality: {quality_score} | Upgrading...")
        
        # Upgrade response
        new_response = upgrade_response_with_gemini(model, context, current_response)
        
        if new_response:
            entry['response'] = new_response
            entry['original_response'] = current_response  # Keep backup
            entry['upgraded'] = True
            entry['upgrade_date'] = datetime.now().isoformat()
            upgraded_count += 1
            print(f"   ✅ Upgraded ({len(new_response)} chars)")
        else:
            entry['upgrade_failed'] = True
            failed_count += 1
            print(f"   ❌ Failed to upgrade")
        
        # Update checkpoint
        checkpoint['last_processed_index'] = i
        checkpoint['upgraded_count'] = upgraded_count
        checkpoint['failed_count'] = failed_count
        
        # Save progress periodically
        if (upgraded_count + failed_count) % SAVE_INTERVAL == 0:
            print()
            print(f"💾 Saving progress... ({upgraded_count} upgraded, {failed_count} failed)")
            save_dataset(dataset, OUTPUT_FILE)
            save_checkpoint(checkpoint)
            print()
        
        # Delay between API calls
        time.sleep(API_DELAY)
    
    # Final save
    print()
    print("💾 Saving final dataset...")
    save_dataset(dataset, OUTPUT_FILE)
    
    # Clean up checkpoint
    if os.path.exists(CHECKPOINT_FILE):
        os.remove(CHECKPOINT_FILE)
        print("🧹 Checkpoint file removed")
    
    # Summary
    print()
    print("=" * 80)
    print("UPGRADE COMPLETE!")
    print("=" * 80)
    print()
    print(f"✅ Successfully upgraded: {upgraded_count}")
    print(f"❌ Failed to upgrade: {failed_count}")
    print(f"⏭️ Skipped (already good quality): {skipped_count}")
    print()
    print(f"📁 Output saved to: {OUTPUT_FILE}")
    print()
    
    # Quality improvement estimate
    if upgraded_count > 0:
        print("📊 Expected Quality Improvement:")
        print(f"   Before: {total_to_upgrade} low-quality responses ({total_to_upgrade/len(dataset)*100:.1f}%)")
        print(f"   After: ~{failed_count} low-quality responses (~{failed_count/len(dataset)*100:.1f}%)")
        improvement = ((total_to_upgrade - failed_count) / total_to_upgrade) * 100
        print(f"   Improvement: {improvement:.1f}% of low-quality responses fixed")
        print()

if __name__ == '__main__':
    try:
        upgrade_dataset()
    except KeyboardInterrupt:
        print("\n\n⚠️ Process interrupted by user")
        print("💡 Progress has been saved. Run the script again to resume.")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        print("💡 Check the checkpoint file to resume from where you left off.")
