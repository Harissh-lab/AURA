"""
RAG Setup Script - Initialize Vector Database
Converts training data into embeddings and stores in ChromaDB
"""

import chromadb
from chromadb.config import Settings
import json
import pandas as pd
from sentence_transformers import SentenceTransformer
import os

def setup_vector_database():
    """Initialize ChromaDB with mental health training data"""
    
    print("🔄 Initializing RAG Vector Database...")
    
    # Initialize embedding model
    print("📦 Loading embedding model...")
    embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
    print("✅ Embedding model loaded!")
    
    # Initialize ChromaDB
    chroma_client = chromadb.PersistentClient(path="./chroma_db")
    
    # Delete existing collection if it exists
    try:
        chroma_client.delete_collection(name="mental_health_knowledge")
        print("🗑️ Cleared existing collection")
    except:
        pass
    
    # Create new collection
    collection = chroma_client.create_collection(
        name="mental_health_knowledge",
        metadata={"description": "Mental health chatbot knowledge base"}
    )
    print("✅ Collection created!")
    
    documents = []
    metadatas = []
    ids = []
    doc_id = 0
    
    # Load intents.json (if exists)
    intents_path = '../intents.json'
    if not os.path.exists(intents_path):
        intents_path = 'intents.json'
    
    if os.path.exists(intents_path):
        print(f"\n📖 Loading intents from {intents_path}...")
        try:
            with open(intents_path, 'r', encoding='utf-8') as f:
                intents_data = json.load(f)
        except Exception as e:
            print(f"⚠️ Could not load intents.json: {e}")
            intents_data = None
    else:
        print("ℹ️ intents.json not found, skipping...")
        intents_data = None
    
    if intents_data and 'intents' in intents_data:
        for intent in intents_data['intents']:
            tag = intent['tag']
            patterns = intent.get('patterns', [])
            responses = intent.get('responses', [])
            
            # Add each pattern as a document
            for pattern in patterns:
                documents.append(pattern)
                metadatas.append({
                    'source': 'intents',
                    'tag': tag,
                    'responses': '|||'.join(responses),  # Join responses with delimiter
                    'type': 'pattern'
                })
                ids.append(f"intent_{doc_id}")
                doc_id += 1
            
            # Add responses as documents too (for better context)
            for response in responses:
                documents.append(response)
                metadatas.append({
                    'source': 'intents',
                    'tag': tag,
                    'responses': response,
                    'type': 'response'
                })
                ids.append(f"intent_{doc_id}")
                doc_id += 1
        
        print(f"✅ Loaded {len([m for m in metadatas if m['source'] == 'intents'])} intent documents")
    
    # Load train_data.csv (distress classification data)
    print("\n📊 Loading training dataset...")
    csv_path = '../train_data.csv'
    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
        print(f"Found {len(df)} samples in training data")
        
        # Sample high-quality distress and non-distress examples for the knowledge base
        distress_samples = df[df['label'] == 1].head(200)  # Top 200 distress examples
        non_distress_samples = df[df['label'] == 0].head(200)  # Top 200 non-distress examples
        
        for _, row in pd.concat([distress_samples, non_distress_samples]).iterrows():
            text = str(row.get('text', ''))
            label = int(row.get('label', 0))
            confidence = float(row.get('confidence', 0.5))
            
            if text and text != 'nan' and len(text) > 20:
                # Add text with appropriate mental health context
                documents.append(text)
                
                # Create response based on distress level
                if label == 1:
                    response = ("I hear that you're going through something really difficult right now. "
                              "Your feelings are valid and you don't have to face this alone. "
                              "Please consider reaching out to a crisis helpline or mental health professional. "
                              "Would you like to talk more about what you're experiencing?")
                    category = 'crisis'
                else:
                    response = ("Thank you for sharing. I'm here to listen and support you. "
                              "It sounds like you're dealing with something challenging. "
                              "Remember that seeking help is a sign of strength. "
                              "Would you like to explore some coping strategies?")
                    category = 'support'
                
                metadatas.append({
                    'source': 'training_data',
                    'label': str(label),
                    'confidence': str(confidence),
                    'category': category,
                    'response': response,
                    'type': 'example'
                })
                ids.append(f"train_{doc_id}")
                doc_id += 1
        
        print(f"✅ Loaded {len([m for m in metadatas if m['source'] == 'training_data'])} training data documents")
    else:
        print(f"⚠️ Training data not found at {csv_path}")
    
    # Generate embeddings
    print(f"\n🧠 Generating embeddings for {len(documents)} documents...")
    embeddings = embedding_model.encode(documents, show_progress_bar=True)
    
    # Add to ChromaDB in batches
    batch_size = 100
    print(f"\n💾 Storing in vector database...")
    for i in range(0, len(documents), batch_size):
        batch_end = min(i + batch_size, len(documents))
        collection.add(
            embeddings=embeddings[i:batch_end].tolist(),
            documents=documents[i:batch_end],
            metadatas=metadatas[i:batch_end],
            ids=ids[i:batch_end]
        )
        print(f"  Stored batch {i//batch_size + 1}/{(len(documents)-1)//batch_size + 1}")
    
    print(f"\n✅ RAG Database Setup Complete!")
    print(f"📊 Total documents: {len(documents)}")
    print(f"🗂️ Storage location: ./chroma_db")
    
    # Test query
    print("\n🧪 Testing retrieval...")
    test_query = "I'm feeling anxious"
    test_embedding = embedding_model.encode([test_query])[0].tolist()
    results = collection.query(
        query_embeddings=[test_embedding],
        n_results=3
    )
    print(f"Test query: '{test_query}'")
    print(f"Top 3 relevant documents:")
    for i, doc in enumerate(results['documents'][0], 1):
        print(f"  {i}. {doc[:100]}...")
    
    print("\n🎉 RAG system ready!")

if __name__ == "__main__":
    setup_vector_database()
