"""
Data Augmentation Script for Mental Health Chatbot Dataset
Generates synthetic variations using synonym replacement to combat overfitting.
"""

import json
import nlpaug.augmenter.word as naw
from tqdm import tqdm

def load_data(filepath):
    """Load the original dataset."""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data

def augment_dataset(data, num_variations=10):
    """
    Augment dataset by generating synonym-based variations.
    
    Args:
        data: List of dicts with 'context', 'categories', 'response', etc.
        num_variations: Number of synthetic variations per entry
    
    Returns:
        Augmented dataset (original + variations)
    """
    # Initialize synonym-based augmenter
    augmenter = naw.SynonymAug(aug_src='wordnet')
    
    augmented_data = []
    
    print(f"Augmenting {len(data)} entries with {num_variations} variations each...")
    
    for entry in tqdm(data, desc="Generating variations"):
        # Keep original entry
        augmented_data.append(entry)
        
        original_context = entry['context']
        
        # Generate variations
        for i in range(num_variations):
            try:
                # Create augmented text
                augmented_text = augmenter.augment(original_context)
                
                # If augment returns a list, take the first element
                if isinstance(augmented_text, list):
                    augmented_text = augmented_text[0]
                
                # Create new entry with same labels
                new_entry = {
                    'context': augmented_text,
                    'categories': entry['categories'].copy(),
                    'response': entry['response'],
                    'quality_score': entry.get('quality_score', 0)
                }
                
                # Add optional fields if they exist
                if 'intent' in entry:
                    new_entry['intent'] = entry['intent']
                if 'emotion' in entry:
                    new_entry['emotion'] = entry['emotion']
                
                augmented_data.append(new_entry)
                
            except Exception as e:
                # If augmentation fails, skip this variation
                print(f"\nWarning: Failed to augment '{original_context[:50]}...': {e}")
                continue
    
    return augmented_data

def save_data(data, filepath):
    """Save augmented dataset to file."""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"\nSaved augmented dataset to: {filepath}")

def main():
    # File paths
    input_file = 'combined_dataset_processed.json'
    output_file = 'combined_dataset_augmented.json'
    
    print("=" * 60)
    print("DATA AUGMENTATION FOR MENTAL HEALTH CHATBOT")
    print("=" * 60)
    
    # Load original data
    print(f"\nLoading data from: {input_file}")
    original_data = load_data(input_file)
    print(f"Original dataset size: {len(original_data)} entries")
    
    # Augment data
    augmented_data = augment_dataset(original_data, num_variations=10)
    
    # Save augmented data
    save_data(augmented_data, output_file)
    
    # Print statistics
    print("\n" + "=" * 60)
    print("AUGMENTATION COMPLETE")
    print("=" * 60)
    print(f"Original entries:   {len(original_data)}")
    print(f"Augmented entries:  {len(augmented_data)}")
    print(f"New entries added:  {len(augmented_data) - len(original_data)}")
    print(f"Multiplication:     {len(augmented_data) / len(original_data):.1f}x")
    print("=" * 60)

if __name__ == "__main__":
    main()
