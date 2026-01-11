import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  Timestamp,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getCurrentUser } from './authService';

export interface MoodEntry {
  id: string;
  date: string;
  mood: 'happy' | 'neutral' | 'sad';
  note: string;
  sentiment: number; // -1 to 1
  userId: string;
  timestamp: Date;
  messageCount?: number; // Number of messages in this session
}

export interface SessionEntry {
  id: string;
  date: string;
  duration: string;
  type: string;
  messageCount: number;
  sentiment: number;
  timestamp: Date;
}

export interface ProgressStats {
  happyDays: number;
  neutralDays: number;
  sadDays: number;
  totalSessions: number;
  averageSentiment: number;
}

/**
 * Analyze emotion from text using keywords and patterns
 */
export function analyzeEmotion(text: string): { mood: 'happy' | 'neutral' | 'sad'; sentiment: number } {
  const lowerText = text.toLowerCase();
  
  // Positive keywords
  const positiveKeywords = [
    'happy', 'great', 'good', 'wonderful', 'excellent', 'amazing', 'fantastic',
    'love', 'joy', 'excited', 'grateful', 'thankful', 'blessed', 'peaceful',
    'calm', 'relaxed', 'hopeful', 'optimistic', 'positive', 'better', 'improved',
    'glad', 'pleased', 'delighted', 'cheerful', 'content'
  ];
  
  // Negative keywords
  const negativeKeywords = [
    'sad', 'depressed', 'anxious', 'worried', 'scared', 'afraid', 'terrible',
    'awful', 'horrible', 'bad', 'worse', 'worst', 'stressed', 'overwhelmed',
    'hopeless', 'helpless', 'lonely', 'alone', 'cry', 'crying', 'hurt',
    'pain', 'suffering', 'struggle', 'struggling', 'difficult', 'hard',
    'angry', 'frustrated', 'upset', 'miserable'
  ];
  
  // Neutral indicators
  const neutralKeywords = [
    'okay', 'fine', 'normal', 'regular', 'usual', 'same', 'alright'
  ];
  
  let positiveScore = 0;
  let negativeScore = 0;
  let neutralScore = 0;
  
  // Count keyword matches
  positiveKeywords.forEach(word => {
    if (lowerText.includes(word)) positiveScore++;
  });
  
  negativeKeywords.forEach(word => {
    if (lowerText.includes(word)) negativeScore++;
  });
  
  neutralKeywords.forEach(word => {
    if (lowerText.includes(word)) neutralScore++;
  });
  
  // Calculate sentiment (-1 to 1)
  const totalScore = positiveScore + negativeScore + neutralScore;
  let sentiment = 0;
  
  if (totalScore > 0) {
    sentiment = (positiveScore - negativeScore) / totalScore;
  }
  
  // Determine mood
  let mood: 'happy' | 'neutral' | 'sad';
  if (positiveScore > negativeScore && positiveScore > 0) {
    mood = 'happy';
  } else if (negativeScore > positiveScore) {
    mood = 'sad';
  } else {
    mood = 'neutral';
  }
  
  return { mood, sentiment };
}

/**
 * Save mood entry to Firestore
 */
export async function saveMoodEntry(
  mood: 'happy' | 'neutral' | 'sad',
  note: string,
  sentiment: number,
  messageCount?: number
): Promise<void> {
  const user = getCurrentUser();
  if (!user) {
    console.warn('❌ No user logged in, cannot save mood entry');
    return;
  }

  try {
    await addDoc(collection(db, 'moodEntries'), {
      userId: user.uid,
      userEmail: user.email,
      mood,
      note,
      sentiment,
      messageCount: messageCount || 1,
      timestamp: serverTimestamp(),
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      createdAt: serverTimestamp()
    });
    console.log(`✅ Mood entry saved: ${mood} (sentiment: ${sentiment})`);
  } catch (error) {
    console.error('❌ Error saving mood entry:', error);
    throw error;
  }
}

/**
 * Save session entry to Firestore
 */
export async function saveSessionEntry(
  type: string,
  messageCount: number,
  sentiment: number,
  durationMinutes: number
): Promise<void> {
  const user = getCurrentUser();
  if (!user) {
    console.warn('❌ No user logged in, cannot save session');
    return;
  }

  try {
    await addDoc(collection(db, 'sessions'), {
      userId: user.uid,
      userEmail: user.email,
      type,
      messageCount,
      sentiment,
      duration: `${durationMinutes} min`,
      timestamp: serverTimestamp(),
      date: new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp()
    });
    console.log(`✅ Session saved: ${type} (${messageCount} messages, ${durationMinutes} min)`);
  } catch (error) {
    console.error('❌ Error saving session:', error);
    throw error;
  }
}

/**
 * Load mood entries from Firestore
 */
export async function loadMoodEntries(limitCount: number = 30): Promise<MoodEntry[]> {
  const user = getCurrentUser();
  if (!user) {
    console.warn('❌ No user logged in, cannot load mood entries');
    return [];
  }

  try {
    const q = query(
      collection(db, 'moodEntries'),
      where('userId', '==', user.uid),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const entries: MoodEntry[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      entries.push({
        id: doc.id,
        date: data.date || data.timestamp?.toDate().toISOString().split('T')[0] || '',
        mood: data.mood || 'neutral',
        note: data.note || '',
        sentiment: data.sentiment || 0,
        userId: data.userId,
        timestamp: data.timestamp?.toDate() || new Date(),
        messageCount: data.messageCount || 1
      });
    });

    // Sort by timestamp descending in JavaScript
    entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    console.log(`✅ Loaded ${entries.length} mood entries`);
    return entries;
  } catch (error) {
    console.error('❌ Error loading mood entries:', error);
    return [];
  }
}

/**
 * Load session entries from Firestore
 */
export async function loadSessionEntries(limitCount: number = 30): Promise<SessionEntry[]> {
  const user = getCurrentUser();
  if (!user) {
    console.warn('❌ No user logged in, cannot load sessions');
    return [];
  }

  try {
    const q = query(
      collection(db, 'sessions'),
      where('userId', '==', user.uid),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const sessions: SessionEntry[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      sessions.push({
        id: doc.id,
        date: data.date || data.timestamp?.toDate().toISOString().split('T')[0] || '',
        duration: data.duration || '0 min',
        type: data.type || 'AI Chat Support',
        messageCount: data.messageCount || 0,
        sentiment: data.sentiment || 0,
        timestamp: data.timestamp?.toDate() || new Date()
      });
    });

    // Sort by timestamp descending in JavaScript
    sessions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    console.log(`✅ Loaded ${sessions.length} session entries`);
    return sessions;
  } catch (error) {
    console.error('❌ Error loading sessions:', error);
    return [];
  }
}

/**
 * Calculate progress statistics
 */
export async function getProgressStats(): Promise<ProgressStats> {
  const moodEntries = await loadMoodEntries(100); // Load more for better stats
  
  const happyDays = moodEntries.filter(m => m.mood === 'happy').length;
  const neutralDays = moodEntries.filter(m => m.mood === 'neutral').length;
  const sadDays = moodEntries.filter(m => m.mood === 'sad').length;
  
  const sessions = await loadSessionEntries(100);
  const totalSessions = sessions.length;
  
  const averageSentiment = moodEntries.length > 0
    ? moodEntries.reduce((sum, entry) => sum + entry.sentiment, 0) / moodEntries.length
    : 0;
  
  return {
    happyDays,
    neutralDays,
    sadDays,
    totalSessions,
    averageSentiment
  };
}

/**
 * Analyze conversation sentiment and save mood
 */
export async function analyzeAndSaveMood(messages: string[]): Promise<void> {
  if (messages.length === 0) return;
  
  // Combine all messages
  const combinedText = messages.join(' ');
  
  // Analyze emotion
  const { mood, sentiment } = analyzeEmotion(combinedText);
  
  // Create note from last user message
  const lastMessage = messages[messages.length - 1];
  const note = lastMessage.length > 100 
    ? lastMessage.substring(0, 100) + '...'
    : lastMessage;
  
  // Save mood entry
  await saveMoodEntry(mood, note, sentiment, messages.length);
}
