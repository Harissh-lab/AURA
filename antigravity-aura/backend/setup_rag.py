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
    
    # Load intents.json
    print("\n📖 Loading intents.json...")
    with open('../intents.json', 'r', encoding='utf-8') as f:
        intents_data = json.load(f)
    
    for intent in intents_data['intents']:
        tag = intent['tag']
        patterns = intent['patterns']
        responses = intent['responses']
        
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
    
    # Load CSV data
    print("\n📊 Loading CSV dataset...")
    csv_path = '../Mental Health Chatbot Dataset - Friend mode and Professional mode Responses.csv'
    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
        
        for _, row in df.iterrows():
            question = str(row.get('Questions', ''))
            friend_response = str(row.get('Friend mode', ''))
            pro_response = str(row.get('Professional mode', ''))
            
            if question and question != 'nan':
                # Add question
                documents.append(question)
                metadatas.append({
                    'source': 'csv',
                    'friend_response': friend_response,
                    'pro_response': pro_response,
                    'type': 'question'
                })
                ids.append(f"csv_{doc_id}")
                doc_id += 1
                
                # Add friend response
                if friend_response and friend_response != 'nan':
                    documents.append(friend_response)
                    metadatas.append({
                        'source': 'csv',
                        'mode': 'friend',
                        'question': question,
                        'type': 'response'
                    })
                    ids.append(f"csv_{doc_id}")
                    doc_id += 1
                
                # Add professional response
                if pro_response and pro_response != 'nan':
                    documents.append(pro_response)
                    metadatas.append({
                        'source': 'csv',
                        'mode': 'professional',
                        'question': question,
                        'type': 'response'
                    })
                    ids.append(f"csv_{doc_id}")
                    doc_id += 1
        
        print(f"✅ Loaded {len([m for m in metadatas if m['source'] == 'csv'])} CSV documents")
    
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
