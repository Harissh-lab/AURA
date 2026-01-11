import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getCurrentUser } from './authService';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isDistress?: boolean;
  source?: string; // 'gemini', 't5_model', 'trained_model'
}

/**
 * Save a chat message to Firestore
 */
export async function saveChatMessage(message: ChatMessage): Promise<void> {
  const user = getCurrentUser();
  if (!user) {
    console.warn('❌ No user logged in, cannot save message to Firestore');
    return;
  }

  console.log(`💾 Saving message for user: ${user.email} (${user.uid})`);
  console.log(`📝 Message: "${message.text.substring(0, 50)}..." (${message.sender})`);

  try {
    const docRef = await addDoc(collection(db, 'chatHistory'), {
      userId: user.uid,
      userEmail: user.email,
      text: message.text,
      sender: message.sender,
      timestamp: serverTimestamp(),
      isDistress: message.isDistress || false,
      source: message.source || null,
      createdAt: serverTimestamp()
    });
    console.log(`✅ Message saved to Firestore with ID: ${docRef.id}`);
  } catch (error: any) {
    console.error('❌ Error saving message to Firestore:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    throw new Error('Failed to save message');
  }
}

/**
 * Load chat history for the current user from Firestore
 */
export async function loadChatHistory(): Promise<ChatMessage[]> {
  const user = getCurrentUser();
  if (!user) {
    console.warn('❌ No user logged in, cannot load chat history');
    return [];
  }

  console.log(`📥 Loading chat history for user: ${user.email} (${user.uid})`);

  try {
    const q = query(
      collection(db, 'chatHistory'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'asc')
    );

    console.log('🔍 Querying Firestore for messages...');
    const querySnapshot = await getDocs(q);
    console.log(`📦 Found ${querySnapshot.size} documents in Firestore`);
    
    const messages: ChatMessage[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const message = {
        id: doc.id,
        text: data.text,
        sender: data.sender,
        timestamp: data.timestamp instanceof Timestamp 
          ? data.timestamp.toDate() 
          : new Date(data.timestamp),
        isDistress: data.isDistress,
        source: data.source
      };
      messages.push(message);
      console.log(`📄 Loaded: [${message.sender}] "${message.text.substring(0, 30)}..."`);
    });

    console.log(`✅ Successfully loaded ${messages.length} messages for ${user.email}`);
    return messages;
  } catch (error: any) {
    console.error('❌ Error loading chat history:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // If index error, provide helpful message
    if (error.code === 'failed-precondition') {
      console.error('🔧 Firestore index required!');
      console.error('👉 Click the URL in the error above to auto-create the index');
      console.error('Or create manually: Collection: chatHistory, Fields: userId (asc), timestamp (asc)');
    }
    return [];
  }
}

/**
 * Get recent chat history (last N messages)
 */
export async function getRecentChatHistory(limit: number = 50): Promise<ChatMessage[]> {
  const allMessages = await loadChatHistory();
  return allMessages.slice(-limit);
}

/**
 * Clear all chat history for the current user
 */
export async function clearChatHistory(): Promise<void> {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('No user logged in');
  }

  try {
    const q = query(
      collection(db, 'chatHistory'),
      where('userId', '==', user.uid)
    );

    const querySnapshot = await getDocs(q);
    const { deleteDoc } = await import('firebase/firestore');
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  } catch (error: any) {
    console.error('Error clearing chat history:', error);
    throw new Error('Failed to clear chat history');
  }
}
