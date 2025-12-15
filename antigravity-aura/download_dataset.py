"""
Download and prepare Suicide Detection dataset from public sources
"""

import pandas as pd
import numpy as np
import os
from pathlib import Path

print("=" * 80)
print("Downloading Real Suicide Detection Dataset")
print("=" * 80)
print()

# Create data directory
data_dir = Path('data')
data_dir.mkdir(exist_ok=True)

print("Downloading dataset from Kaggle...")
print("Source: Suicide and Depression Detection Dataset")
print()

try:
    # Try to download from Kaggle (requires API key)
    os.system('kaggle datasets download -d nikhileswarkomati/suicide-watch -p data --unzip')
    
    # Check if downloaded
    if os.path.exists('data/Suicide_Detection.csv'):
        print("✓ Dataset downloaded successfully from Kaggle!")
    else:
        raise FileNotFoundError("Kaggle download failed")
        
except Exception as e:
    print("⚠️  Kaggle download not available. Creating synthetic dataset...")
    print()
    
    # Generate a realistic synthetic dataset for demonstration
    np.random.seed(42)
    
    # Suicide-related texts (expanded patterns)
    suicide_texts = [
        "I can't take this anymore, I want to end it all",
        "Feeling hopeless and trapped, no way out",
        "I don't see a point in living anymore",
        "Thinking about ending my life",
        "Everything hurts and I just want it to stop",
        "I want to kill myself, nothing matters",
        "Planning to end my life soon",
        "Life is meaningless, ready to die",
        "I'm going to commit suicide",
        "Death seems like the only option",
        "I wish I could just disappear forever",
        "Cutting myself, might end it all",
        "Wrote my suicide note already",
        "Nobody would miss me if I died",
        "Ready to jump off the bridge",
        "Taking pills to end this pain",
        "I'm worthless and should just die",
        "Saying goodbye, ending it tonight",
        "Can't go on anymore, suicide is the answer",
        "Lost all hope, time to end this",
        "My family would be better off without me",
        "Planning my death, researching methods",
        "I hate myself and want to die",
        "Nothing left to live for anymore",
        "Tired of living, ready to go",
        "Feel like killing myself every day",
        "Suicide is my only escape",
        "Want to overdose and never wake up",
        "Thinking about hanging myself",
        "No reason to keep living",
        "Ready to end this suffering permanently",
        "Writing goodbye letters to everyone",
        "Buying rope to hang myself with",
        "Looking up painless ways to die",
        "My funeral would be soon",
        "Feeling suicidal all the time now",
        "Want to shoot myself and end it",
        "Drowning seems peaceful to me",
        "Giving away my possessions before I go",
        "Death is calling me home",
        "Can't fight these suicidal thoughts anymore",
        "Just want the pain to stop forever",
        "Ready to take my own life",
        "Suicide plan is all set",
        "Nobody can stop me from ending it",
        "My last day alive is coming soon",
        "Contemplating suicide seriously now",
        "Feel like a burden, better off dead",
        "Researching suicide methods online",
        "Ready to say final goodbyes",
    ]
    
    # Add variations
    suicide_variations = []
    for text in suicide_texts[:30]:
        # Create variations
        suicide_variations.append(text.replace("I", "i"))
        suicide_variations.append(text + " please help")
        suicide_variations.append("feeling like " + text.lower())
    
    suicide_texts.extend(suicide_variations)
    
    # Non-suicide texts (mental health but not suicidal)
    non_suicide_texts = [
        "Having a wonderful day at the park!",
        "Just finished a great workout, feeling energized",
        "Looking forward to dinner with friends tonight",
        "My exam went really well today",
        "Enjoying this beautiful weather",
        "Feeling anxious about my presentation tomorrow",
        "Having some trouble sleeping lately",
        "Feeling a bit down today but I'll be okay",
        "Stressed about work but managing it",
        "Missing my family but excited to see them soon",
        "Feeling lonely but reaching out to friends",
        "Had a rough day but tomorrow will be better",
        "Dealing with some sadness but it will pass",
        "Overwhelmed with responsibilities right now",
        "Feeling blue but working through it",
        "Worried about my health but seeing a doctor",
        "Having relationship issues but we're working on it",
        "Feeling tired all the time lately",
        "Struggling with motivation but pushing through",
        "Feeling insecure about myself today",
        "Got into an argument with my partner",
        "Feeling nervous about my job interview",
        "Having financial stress but making a plan",
        "Feeling disconnected from people lately",
        "Grieving the loss of my pet",
        "Dealing with chronic pain daily",
        "Feeling frustrated with my progress",
        "Having trouble concentrating on tasks",
        "Feeling unappreciated at work",
        "Struggling with self-esteem issues",
        "Feeling guilty about past mistakes",
        "Having panic attacks occasionally",
        "Feeling inadequate compared to others",
        "Dealing with family conflict right now",
        "Feeling uncertain about my future",
        "Having trust issues in relationships",
        "Feeling bored and unmotivated lately",
        "Dealing with a breakup, it hurts",
        "Feeling jealous of others' success",
        "Having mood swings throughout the day",
        "Feeling angry about unfair treatment",
        "Dealing with social anxiety in groups",
        "Feeling homesick and missing home",
        "Having nightmares that disturb my sleep",
        "Feeling pressured to meet expectations",
        "Dealing with imposter syndrome at work",
        "Feeling scattered and unfocused today",
        "Having difficulty making decisions lately",
        "Feeling misunderstood by others",
        "Dealing with perfectionism issues",
    ]
    
    # Add positive texts
    positive_texts = [
        "Celebrating my birthday with loved ones!",
        "Got promoted at work today, so happy!",
        "Just adopted a puppy, so excited!",
        "Enjoying a peaceful vacation by the beach",
        "Grateful for my supportive friends and family",
        "Accomplished my fitness goal this month!",
        "Had an amazing date night with my partner",
        "Feeling blessed and thankful today",
        "Just graduated from university!",
        "Received great news about my health",
        "Enjoying quality time with my children",
        "Proud of my personal growth this year",
        "Had a productive day at work",
        "Feeling optimistic about the future",
        "Enjoying my new hobby of painting",
        "Made new friends at the gym",
        "Feeling confident about my abilities",
        "Had a meaningful conversation today",
        "Enjoying the simple pleasures of life",
        "Feeling peaceful and content right now",
        "Laughed so hard with friends today",
        "Feeling inspired by a great book",
        "Enjoying delicious food with family",
        "Feeling proud of overcoming challenges",
        "Having a fun game night tonight",
        "Feeling energized after meditation",
        "Enjoying nature on my morning walk",
        "Feeling creative and motivated today",
        "Had a wonderful therapy session",
        "Feeling supported by my community",
        "Enjoying my favorite music right now",
        "Feeling accomplished after finishing a project",
        "Had a great conversation with a mentor",
        "Feeling excited about new opportunities",
        "Enjoying a cozy evening at home",
        "Feeling refreshed after a good sleep",
        "Had a fun adventure exploring the city",
        "Feeling grateful for second chances",
        "Enjoying learning something new",
        "Feeling connected to others today",
        "Had a relaxing spa day",
        "Feeling hopeful about my recovery",
        "Enjoying spending time with pets",
        "Feeling motivated to help others",
        "Had a breakthrough in therapy",
        "Feeling strong and resilient",
        "Enjoying the journey of self-discovery",
        "Feeling at peace with myself",
        "Had a wonderful experience volunteering",
        "Feeling empowered to make changes",
    ]
    
    non_suicide_texts.extend(positive_texts)
    
    # Create balanced dataset
    n_suicide = len(suicide_texts)
    n_non_suicide = len(non_suicide_texts)
    
    # Balance to have equal samples
    min_samples = min(n_suicide, n_non_suicide)
    
    # Create DataFrame
    suicide_df = pd.DataFrame({
        'text': suicide_texts[:min_samples],
        'class': 'suicide'
    })
    
    non_suicide_df = pd.DataFrame({
        'text': non_suicide_texts[:min_samples],
        'class': 'non-suicide'
    })
    
    # Combine and shuffle
    df = pd.concat([suicide_df, non_suicide_df], ignore_index=True)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    # Save
    output_path = 'data/Suicide_Detection.csv'
    df.to_csv(output_path, index=False)
    
    print(f"✓ Created synthetic dataset: {output_path}")
    print(f"✓ Total samples: {len(df)}")
    print(f"✓ Suicide samples: {len(suicide_df)}")
    print(f"✓ Non-suicide samples: {len(non_suicide_df)}")
    print()
    print("Note: This is a synthetic dataset for demonstration.")
    print("For production use, consider using:")
    print("- Kaggle: 'nikhileswarkomati/suicide-watch' dataset")
    print("- Reddit r/SuicideWatch posts (with proper preprocessing)")
    print("- Clinical mental health databases (with permissions)")

# Final validation
print()
print("=" * 80)
print("Dataset Ready")
print("=" * 80)
print()

if os.path.exists('data/Suicide_Detection.csv'):
    df = pd.read_csv('data/Suicide_Detection.csv')
    print(f"✓ Dataset location: data/Suicide_Detection.csv")
    print(f"✓ Total samples: {len(df)}")
    print(f"✓ Columns: {df.columns.tolist()}")
    print()
    print("Class distribution:")
    for class_name, count in df['class'].value_counts().items():
        print(f"  {class_name}: {count} ({count/len(df)*100:.1f}%)")
    print()
    print("✅ Ready to train! Run: python train_classifier.py")
else:
    print("❌ Dataset not found. Please download manually.")
