"""
Dataset Preprocessing Script
Cleans and enhances the combined counseling dataset for better chatbot accuracy
"""

import json
import re
from collections import defaultdict

def clean_text(text):
    """Remove extra whitespace and formatting issues"""
    if not text:
        return ""
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove leading/trailing whitespace
    text = text.strip()
    # Fix common formatting issues
    text = text.replace('\u00a0', ' ')  # Non-breaking space
    text = text.replace('\u2019', "'")  # Smart quote
    text = text.replace('\u201c', '"')  # Smart quote
    text = text.replace('\u201d', '"')  # Smart quote
    return text

def calculate_response_quality(response):
    """
    Calculate quality score for a response
    RECALIBRATED v3: Target avg ~55-65 for more realistic distribution
    """
    if not response or len(response) < 50:
        return 0
    
    score = 0
    response_lower = response.lower()
    
    # Professional language (30%) - ADJUSTED: *8 for higher baseline
    professional_terms = [
        'therapy', 'counseling', 'therapist', 'counselor',
        'mental health', 'cognitive', 'behavioral', 'emotional',
        'coping', 'support', 'professional', 'treatment', 'approach',
        'strategy', 'wellness', 'healing', 'recovery'
    ]
    professional_count = sum(1 for term in professional_terms if term in response_lower)
    score += min(professional_count * 8, 30)
    
    # Empathy markers (30%) - ADJUSTED: *8 for higher baseline
    empathy_terms = [
        'understand', 'sorry to hear', 'sounds like', 'must be',
        'i hear', 'validate', 'acknowledge', 'recognize',
        'difficult', 'challenging', 'courage', 'brave', 'feel',
        'thank you for', 'appreciate', 'important', 'care'
    ]
    empathy_count = sum(1 for term in empathy_terms if term in response_lower)
    score += min(empathy_count * 8, 30)
    
    # Action-oriented (20%) - ADJUSTED: *6 for higher baseline
    action_terms = [
        'suggest', 'recommend', 'try', 'practice', 'consider',
        'work on', 'focus on', 'start', 'begin', 'help you',
        'explore', 'learn', 'develop', 'reach out', 'talk to'
    ]
    action_count = sum(1 for term in action_terms if term in response_lower)
    score += min(action_count * 6, 20)
    
    # Length appropriate (10%) - Give baseline points for most responses
    if 150 <= len(response) <= 2000:
        score += 10
    elif 100 <= len(response) < 150:
        score += 9
    elif 50 <= len(response) < 100:
        score += 7
    
    # Has structure (10%) - More generous baseline
    if '.' in response:
        sentence_count = response.count('.')
        if sentence_count >= 3:
            score += 7  # Good paragraph structure
        elif sentence_count >= 1:
            score += 5  # Basic structure
    
    if any(q in response for q in ['?', 'How', 'What', 'When', 'Where', 'Why']):
        score += 3
    
    return min(score, 100)

def add_empathy_prefix(response, context):
    """Add empathetic opening to responses that lack it"""
    response_lower = response.lower()
    
    # Check if already has empathy
    empathy_starters = [
        'i understand', 'i hear', 'i\'m sorry', 'it sounds like',
        'thank you for', 'i appreciate', 'that must be'
    ]
    
    if any(response_lower.startswith(starter) for starter in empathy_starters):
        return response
    
    # Detect context emotion
    context_lower = context.lower()
    
    if any(word in context_lower for word in ['suicide', 'kill myself', 'want to die', 'end it']):
        prefix = "I'm deeply concerned about what you're sharing. "
    elif any(word in context_lower for word in ['depressed', 'worthless', 'hopeless', 'sad']):
        prefix = "I hear how much pain you're in, and I want you to know you're not alone. "
    elif any(word in context_lower for word in ['anxious', 'anxiety', 'panic', 'worried', 'scared']):
        prefix = "I understand how overwhelming anxiety can feel. "
    elif any(word in context_lower for word in ['trauma', 'abuse', 'abused', 'hurt']):
        prefix = "Thank you for trusting me with something so difficult. "
    elif any(word in context_lower for word in ['angry', 'frustrated', 'mad']):
        prefix = "I hear your frustration, and those feelings are valid. "
    else:
        prefix = "Thank you for reaching out. "
    
    return prefix + response

def categorize_context(context):
    """Categorize the mental health concern"""
    context_lower = context.lower()
    categories = []
    
    if any(word in context_lower for word in ['suicide', 'kill myself', 'end it', 'die', 'death']):
        categories.append('crisis')
    if any(word in context_lower for word in ['depressed', 'depression', 'sad', 'worthless', 'hopeless']):
        categories.append('depression')
    if any(word in context_lower for word in ['anxious', 'anxiety', 'panic', 'worried', 'stress']):
        categories.append('anxiety')
    if any(word in context_lower for word in ['trauma', 'abuse', 'abused', 'ptsd', 'assault']):
        categories.append('trauma')
    if any(word in context_lower for word in ['relationship', 'marriage', 'partner', 'divorce']):
        categories.append('relationships')
    if any(word in context_lower for word in ['family', 'parent', 'child', 'sibling']):
        categories.append('family')
    if any(word in context_lower for word in ['self esteem', 'confidence', 'worth']):
        categories.append('self-esteem')
    if any(word in context_lower for word in ['grief', 'loss', 'death', 'died']):
        categories.append('grief')
    
    return categories if categories else ['general']

def extract_keywords(text):
    """Extract important keywords from text"""
    # Remove common words
    stop_words = {'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'you', 'your', 'yours', 
                  'he', 'him', 'his', 'she', 'her', 'hers', 'it', 'its', 'they', 'them',
                  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
                  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
                  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
                  'should', 'that', 'this', 'these', 'those', 'am', 'can', 'what', 'how'}
    
    # Extract words
    words = re.findall(r'\b\w+\b', text.lower())
    keywords = [w for w in words if w not in stop_words and len(w) > 3]
    
    # Count frequency
    word_freq = defaultdict(int)
    for word in keywords:
        word_freq[word] += 1
    
    # Return top keywords
    sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
    return [word for word, freq in sorted_words[:10]]

def preprocess_dataset(input_file, output_file):
    """Main preprocessing function"""
    print("=" * 80)
    print("DATASET PREPROCESSING")
    print("=" * 80)
    
    # Load dataset
    print(f"\n📂 Loading dataset from {input_file}...")
    dataset = []
    skipped = 0
    
    with open(input_file, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if line:
                try:
                    dataset.append(json.loads(line))
                except json.JSONDecodeError as e:
                    skipped += 1
                    print(f"   ⚠️  Skipped line {line_num}: Invalid JSON")
    
    print(f"   ✅ Loaded {len(dataset)} entries ({skipped} skipped)")
    
    # Process dataset
    print(f"\n🔧 Processing entries...")
    processed = []
    removed_empty = 0
    removed_short = 0
    removed_duplicate = 0
    enhanced_empathy = 0
    
    seen_contexts = set()
    
    for i, entry in enumerate(dataset):
        if (i + 1) % 500 == 0:
            print(f"   Processing: {i + 1}/{len(dataset)}...")
        
        context = entry.get('Context', '')
        response = entry.get('Response', '')
        
        # Skip empty responses
        if not response or len(response.strip()) == 0:
            removed_empty += 1
            continue
        
        # Skip very short responses (< 50 chars)
        if len(response) < 50:
            removed_short += 1
            continue
        
        # Skip duplicate contexts
        context_normalized = clean_text(context).lower()
        if context_normalized in seen_contexts:
            removed_duplicate += 1
            continue
        seen_contexts.add(context_normalized)
        
        # Clean text
        context = clean_text(context)
        response = clean_text(response)
        
        # Add empathy if missing
        original_response = response
        response = add_empathy_prefix(response, context)
        if response != original_response:
            enhanced_empathy += 1
        
        # Calculate quality score
        quality_score = calculate_response_quality(response)
        
        # Categorize
        categories = categorize_context(context)
        
        # Extract keywords
        context_keywords = extract_keywords(context)
        response_keywords = extract_keywords(response)
        
        # Create enhanced entry
        processed_entry = {
            'context': context,
            'response': response,
            'quality_score': quality_score,
            'categories': categories,
            'context_keywords': context_keywords,
            'response_keywords': response_keywords,
            'context_length': len(context),
            'response_length': len(response)
        }
        
        processed.append(processed_entry)
    
    # Sort by quality score (highest first)
    processed.sort(key=lambda x: x['quality_score'], reverse=True)
    
    # Statistics
    print(f"\n📊 Processing Statistics:")
    print(f"   Original entries: {len(dataset)}")
    print(f"   Removed (empty): {removed_empty}")
    print(f"   Removed (too short): {removed_short}")
    print(f"   Removed (duplicates): {removed_duplicate}")
    print(f"   Enhanced (empathy added): {enhanced_empathy}")
    print(f"   Final entries: {len(processed)}")
    print(f"   Reduction: {(1 - len(processed)/len(dataset))*100:.1f}%")
    
    # Quality distribution
    high_quality = sum(1 for e in processed if e['quality_score'] >= 70)
    medium_quality = sum(1 for e in processed if 50 <= e['quality_score'] < 70)
    low_quality = sum(1 for e in processed if e['quality_score'] < 50)
    
    print(f"\n✅ Quality Distribution:")
    print(f"   High (70+): {high_quality} ({high_quality/len(processed)*100:.1f}%)")
    print(f"   Medium (50-69): {medium_quality} ({medium_quality/len(processed)*100:.1f}%)")
    print(f"   Low (<50): {low_quality} ({low_quality/len(processed)*100:.1f}%)")
    
    # Category distribution
    category_counts = defaultdict(int)
    for entry in processed:
        for cat in entry['categories']:
            category_counts[cat] += 1
    
    print(f"\n📑 Category Distribution:")
    for cat, count in sorted(category_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"   {cat}: {count} ({count/len(processed)*100:.1f}%)")
    
    # Save processed dataset
    print(f"\n💾 Saving processed dataset to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(processed, f, indent=2, ensure_ascii=False)
    
    print(f"   ✅ Saved {len(processed)} processed entries")
    
    # Create simple version for faster loading
    simple_output = output_file.replace('.json', '_simple.json')
    print(f"\n💾 Creating simplified version for fast loading...")
    simple_dataset = [
        {
            'context': e['context'],
            'response': e['response'],
            'categories': e['categories'],
            'quality_score': e['quality_score']
        }
        for e in processed
    ]
    
    with open(simple_output, 'w', encoding='utf-8') as f:
        json.dump(simple_dataset, f, indent=2, ensure_ascii=False)
    
    print(f"   ✅ Saved simplified version")
    
    # Sample high-quality entries
    print(f"\n📖 Sample High-Quality Entries:")
    for i, entry in enumerate(processed[:3]):
        print(f"\n   Entry {i+1} (Score: {entry['quality_score']}):")
        print(f"   Categories: {', '.join(entry['categories'])}")
        print(f"   Context: {entry['context'][:100]}...")
        print(f"   Response: {entry['response'][:150]}...")
    
    return processed

if __name__ == '__main__':
    input_file = 'combined_dataset.json'
    output_file = 'combined_dataset_processed.json'
    
    processed = preprocess_dataset(input_file, output_file)
    
    print("\n" + "=" * 80)
    print("PREPROCESSING COMPLETE!")
    print("=" * 80)
    print(f"\n✅ Output files created:")
    print(f"   1. {output_file} (Full with metadata)")
    print(f"   2. combined_dataset_processed_simple.json (Simplified)")
    print(f"\n🎯 Next steps:")
    print(f"   1. Update backend/app.py to use processed dataset")
    print(f"   2. Test chatbot with new dataset")
    print(f"   3. Monitor accuracy improvements")
    print("=" * 80)
