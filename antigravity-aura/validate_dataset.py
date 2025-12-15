"""
Dataset Validation & Statistics Tool
Run before training to verify your dataset is ready
"""

import os
import pandas as pd
import numpy as np
from collections import Counter

def validate_dataset(csv_path='data/Suicide_Detection.csv'):
    """Validate and show statistics for training dataset"""
    
    print("=" * 80)
    print("AURA Dataset Validation Tool")
    print("=" * 80)
    print()
    
    # Check if file exists
    if not os.path.exists(csv_path):
        print(f"❌ ERROR: Dataset not found at {csv_path}")
        print("\nExpected location: data/Suicide_Detection.csv")
        print("Required columns: 'text' and 'class'")
        print("\nExample CSV format:")
        print("text,class")
        print('"I feel hopeless",suicide')
        print('"Having a great day!",non-suicide')
        return False
    
    print(f"✓ Dataset found: {csv_path}")
    
    # Load dataset
    try:
        df = pd.read_csv(csv_path)
        print(f"✓ Loaded successfully: {len(df)} rows")
    except Exception as e:
        print(f"❌ ERROR loading CSV: {e}")
        return False
    
    print()
    print("=" * 80)
    print("Column Information")
    print("=" * 80)
    print()
    
    # Check columns
    print(f"Columns found: {df.columns.tolist()}")
    
    required_cols = ['text', 'class']
    missing_cols = [col for col in required_cols if col not in df.columns]
    
    if missing_cols:
        print(f"\n❌ ERROR: Missing required columns: {missing_cols}")
        print(f"   Found: {df.columns.tolist()}")
        print(f"   Required: {required_cols}")
        return False
    
    print(f"✓ All required columns present: {required_cols}")
    
    print()
    print("=" * 80)
    print("Data Quality Check")
    print("=" * 80)
    print()
    
    # Check for missing values
    missing_text = df['text'].isna().sum()
    missing_class = df['class'].isna().sum()
    
    print(f"Missing values:")
    print(f"  text:  {missing_text} ({missing_text/len(df)*100:.2f}%)")
    print(f"  class: {missing_class} ({missing_class/len(df)*100:.2f}%)")
    
    if missing_text > 0 or missing_class > 0:
        print(f"\n⚠️  WARNING: {missing_text + missing_class} missing values will be removed during training")
    else:
        print(f"\n✓ No missing values")
    
    # Check for empty strings
    empty_text = (df['text'].astype(str).str.strip() == '').sum()
    if empty_text > 0:
        print(f"\n⚠️  WARNING: {empty_text} empty text fields found")
    else:
        print(f"✓ No empty text fields")
    
    # Remove NaN and empty for statistics
    df_clean = df.dropna(subset=['text', 'class'])
    df_clean = df_clean[df_clean['text'].astype(str).str.strip() != '']
    
    print()
    print("=" * 80)
    print("Class Distribution")
    print("=" * 80)
    print()
    
    # Class distribution
    class_counts = df_clean['class'].value_counts()
    print(f"Total samples (after cleaning): {len(df_clean)}")
    print()
    
    for class_name, count in class_counts.items():
        percentage = count / len(df_clean) * 100
        bar = "█" * int(percentage / 2)
        print(f"  {class_name:15s}: {count:6d} ({percentage:5.2f}%) {bar}")
    
    # Check balance
    print()
    if len(class_counts) < 2:
        print(f"❌ ERROR: Only one class found: {class_counts.index.tolist()}")
        print(f"   Need at least 2 classes for classification")
        return False
    
    max_count = class_counts.max()
    min_count = class_counts.min()
    imbalance_ratio = max_count / min_count
    
    print(f"Class balance ratio: {imbalance_ratio:.2f}:1")
    
    if imbalance_ratio > 10:
        print(f"⚠️  HIGH IMBALANCE: {imbalance_ratio:.1f}:1 ratio")
        print(f"   Training script will downsample to 1:1 (50/50 split)")
        print(f"   After balancing: {min_count * 2} total samples ({min_count} per class)")
    elif imbalance_ratio > 5:
        print(f"⚠️  MODERATE IMBALANCE: {imbalance_ratio:.1f}:1 ratio")
        print(f"   Training script will balance to 1:1")
    else:
        print(f"✓ GOOD BALANCE: {imbalance_ratio:.1f}:1 ratio")
    
    print()
    print("=" * 80)
    print("Text Statistics")
    print("=" * 80)
    print()
    
    # Text length statistics
    text_lengths = df_clean['text'].astype(str).str.len()
    word_counts = df_clean['text'].astype(str).str.split().str.len()
    
    print(f"Character length:")
    print(f"  Min:    {text_lengths.min()}")
    print(f"  Max:    {text_lengths.max()}")
    print(f"  Mean:   {text_lengths.mean():.1f}")
    print(f"  Median: {text_lengths.median():.1f}")
    
    print(f"\nWord count:")
    print(f"  Min:    {word_counts.min()}")
    print(f"  Max:    {word_counts.max()}")
    print(f"  Mean:   {word_counts.mean():.1f}")
    print(f"  Median: {word_counts.median():.1f}")
    
    # Check for very short texts
    very_short = (word_counts < 3).sum()
    if very_short > 0:
        print(f"\n⚠️  WARNING: {very_short} samples have <3 words")
        print(f"   These may not provide enough context for classification")
    
    # Check for very long texts
    very_long = (word_counts > 100).sum()
    if very_long > 0:
        print(f"\n⚠️  NOTE: {very_long} samples have >100 words")
        print(f"   These will be truncated to 512 tokens during training")
    
    print()
    print("=" * 80)
    print("Sample Data Preview")
    print("=" * 80)
    print()
    
    # Show sample from each class
    for class_name in class_counts.index[:2]:
        print(f"\nClass: {class_name}")
        samples = df_clean[df_clean['class'] == class_name]['text'].head(3)
        for i, text in enumerate(samples, 1):
            text_preview = str(text)[:100]
            if len(str(text)) > 100:
                text_preview += "..."
            print(f"  {i}. {text_preview}")
    
    print()
    print("=" * 80)
    print("Training Readiness")
    print("=" * 80)
    print()
    
    # Minimum samples check
    min_samples_per_class = 50
    if min_count < min_samples_per_class:
        print(f"❌ INSUFFICIENT DATA: Minimum class has only {min_count} samples")
        print(f"   Recommended: At least {min_samples_per_class} samples per class")
        print(f"   For reliable training: 500+ samples per class")
        return False
    
    # Final recommendations
    if min_count < 200:
        print(f"⚠️  LIMITED DATA: {min_count} samples per class (after balancing)")
        print(f"   Recommended: 500+ samples per class for best results")
        print(f"   Current data may result in <90% accuracy")
    elif min_count < 500:
        print(f"✓ ADEQUATE DATA: {min_count} samples per class (after balancing)")
        print(f"   Should achieve 85-90% accuracy")
        print(f"   For >90% accuracy, consider collecting more data")
    else:
        print(f"✅ EXCELLENT DATA: {min_count} samples per class (after balancing)")
        print(f"   Should achieve >90% accuracy target")
    
    print()
    print("=" * 80)
    print("Summary")
    print("=" * 80)
    print()
    
    print(f"✓ Dataset location: {csv_path}")
    print(f"✓ Total samples: {len(df_clean)}")
    print(f"✓ Classes: {len(class_counts)}")
    print(f"✓ After balancing: {min_count * 2} samples ({min_count} per class)")
    print(f"✓ Train set: ~{int(min_count * 2 * 0.8)} samples")
    print(f"✓ Test set: ~{int(min_count * 2 * 0.2)} samples")
    
    print()
    if min_count >= min_samples_per_class:
        print("✅ Dataset is READY for training!")
        print("\nNext step: python train_classifier.py")
    else:
        print("❌ Dataset needs MORE DATA before training")
        print(f"\nCollect at least {min_samples_per_class - min_count} more samples for minority class")
    
    print()
    return True

if __name__ == "__main__":
    # Check for dataset
    if not os.path.exists('data/Suicide_Detection.csv'):
        print("Dataset not found. Checking for sample data...")
        
        if os.path.exists('data/Suicide_Detection_SAMPLE.csv'):
            print("\n⚠️  Found sample data: data/Suicide_Detection_SAMPLE.csv")
            print("This is only for testing the script. Use real data for production.")
            response = input("\nValidate sample data? (y/n): ").strip().lower()
            
            if response == 'y':
                validate_dataset('data/Suicide_Detection_SAMPLE.csv')
            else:
                print("\nPlease add your dataset as: data/Suicide_Detection.csv")
        else:
            print("\n❌ No dataset found.")
            print("\nExpected: data/Suicide_Detection.csv")
            print("Sample available: data/Suicide_Detection_SAMPLE.csv")
    else:
        validate_dataset('data/Suicide_Detection.csv')
