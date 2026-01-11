# Emotion Tracking & Progress Tracking Implementation

## 🎯 Overview

The AURA chatbot now includes **real-time emotion tracking** that analyzes user conversations and automatically saves mood entries and session data to Firebase. The Progress Tracking page displays this data dynamically, showing mood trends and session history.

## ✨ Key Features

### 1. **Automatic Emotion Analysis**
- Analyzes user messages using keyword-based sentiment detection
- Classifies mood as: `happy`, `neutral`, or `sad`
- Calculates sentiment score from -1 (negative) to +1 (positive)
- Uses extensive keyword lists for accurate detection:
  - **Positive keywords**: happy, great, good, love, wonderful, amazing, excellent, fantastic, etc.
  - **Negative keywords**: sad, depressed, anxious, worried, stressed, lonely, hopeless, etc.
  - **Neutral keywords**: okay, fine, normal, alright, etc.

### 2. **Real-Time Mood Tracking**
- Saves mood entries to Firebase **every 3 user messages**
- Each entry includes:
  - User's mood classification (happy/neutral/sad)
  - Sentiment score
  - Conversation notes (summary of messages)
  - Message count in session
  - Timestamp

### 3. **Session Tracking**
- Automatically tracks chat sessions
- Records when user starts chatting (session start time)
- Saves session data when user leaves the chat
- Session details include:
  - Duration (in minutes)
  - Total number of messages
  - Average sentiment
  - Session type ("AI Chat Support")

### 4. **Firebase Storage**
- Two Firestore collections:
  - **`moodEntries`**: Stores individual mood recordings
  - **`sessions`**: Stores chat session information
- All data is linked to user ID for privacy
- Server timestamps for accurate tracking

### 5. **Progress Tracking Dashboard**
- Real-time statistics:
  - **Happy Days**: Count of positive mood entries
  - **Neutral Days**: Count of neutral mood entries
  - **Total Sessions**: Number of chat sessions
- Two tabs:
  - **Mood Trends**: Shows recent mood entries with dates and notes
  - **Session History**: Shows chat session records with duration
- Empty state messages when no data exists yet
- Loading spinner while fetching data

## 📁 Files Modified

### 1. **src/services/emotionTrackingService.ts** (NEW)
Main service handling emotion analysis and Firebase operations:

```typescript
// Core Functions:
- analyzeEmotion(text: string) → {mood, sentiment}
- saveMoodEntry(mood, note, sentiment, messageCount)
- saveSessionEntry(type, messageCount, sentiment, durationMinutes)
- loadMoodEntries() → MoodEntry[]
- loadSessionEntries() → SessionEntry[]
- getProgressStats() → {happyDays, neutralDays, totalSessions}
```

### 2. **src/components/ChatBot.tsx**
Enhanced with emotion tracking integration:

**New State Variables:**
```typescript
const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date());
const [userMessagesInSession, setUserMessagesInSession] = useState<string[]>([]);
```

**Key Changes:**
- Initializes session start time when chat loads
- Tracks all user messages in array
- Analyzes emotion every 3 messages
- Saves mood entry to Firebase
- Auto-saves session on component unmount (when user leaves)

**Code Flow:**
1. User sends message
2. Message added to `userMessagesInSession` array
3. Every 3rd message triggers emotion analysis
4. Mood entry saved to Firebase with sentiment score
5. When user exits, session saved with total duration

### 3. **src/components/ProgressTracking.tsx**
Updated to use real Firebase data instead of mock data:

**New State Variables:**
```typescript
const [moodData, setMoodData] = useState<MoodEntry[]>([]);
const [sessions, setSessions] = useState<Session[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [stats, setStats] = useState({ happyDays: 0, neutralDays: 0, totalSessions: 0 });
```

**Key Changes:**
- Loads real data from Firebase on component mount
- Uses `getProgressStats()` for statistics
- Shows loading spinner during data fetch
- Empty state messages when no data exists
- Statistics cards use real counts from Firebase

## 🔄 Data Flow

```
User sends message in ChatBot
         ↓
Message added to userMessagesInSession array
         ↓
Every 3 messages → analyzeEmotion(allMessages)
         ↓
Sentiment analysis using keywords
         ↓
saveMoodEntry() → Firebase 'moodEntries' collection
         ↓
User navigates away from chat
         ↓
Calculate session duration
         ↓
saveSessionEntry() → Firebase 'sessions' collection
         ↓
Progress Tracking page loads data
         ↓
loadMoodEntries() + loadSessionEntries()
         ↓
Display mood trends and session history
```

## 📊 Firebase Data Structure

### moodEntries Collection
```javascript
{
  userId: "user123",
  userEmail: "user@example.com",
  mood: "happy",              // 'happy' | 'neutral' | 'sad'
  note: "Had a great day...", // Summary of messages
  sentiment: 0.75,            // Score from -1 to 1
  messageCount: 5,            // Number of messages analyzed
  timestamp: Timestamp,
  date: "2024-12-15",
  createdAt: Timestamp
}
```

### sessions Collection
```javascript
{
  userId: "user123",
  userEmail: "user@example.com",
  type: "AI Chat Support",
  messageCount: 12,           // Total messages in session
  sentiment: 0.5,             // Average sentiment
  duration: "15 min",         // Session length
  timestamp: Timestamp,
  date: "2024-12-15",
  createdAt: Timestamp
}
```

## 🎨 User Interface

### Progress Tracking Page Features:
1. **Statistics Cards** (Top section)
   - Happy Days count with percentage
   - Neutral Days count with percentage  
   - Total Sessions count

2. **Mood Trends Tab**
   - Chronological list of mood entries
   - Color-coded backgrounds (green/yellow/red)
   - Mood icons (smile/meh/frown)
   - Date and note display
   - Empty state: "No mood entries yet - Start chatting..."

3. **Session History Tab**
   - List of chat sessions
   - Duration and message count
   - Date stamps
   - Empty state: "No sessions recorded yet"

4. **Loading State**
   - Spinning loader while fetching data
   - Prevents empty state flicker

## 🚀 How It Works

### For Users:
1. Start chatting with AURA
2. Have a natural conversation (at least 3 messages)
3. Emotion is automatically detected and saved
4. Navigate to "Progress Tracking" page
5. View your mood trends and session history
6. Track your emotional wellness over time

### For Developers:
1. Emotion detection runs in background
2. No user intervention required
3. Firebase handles all data persistence
4. Real-time updates when data changes
5. Fully integrated with existing authentication

## 🔒 Privacy & Security

- All data tied to authenticated user ID
- Firestore security rules should restrict access to user's own data
- Emotion analysis happens locally (no external API calls)
- Session data includes only aggregate statistics

## 📈 Future Enhancements

Potential improvements:
- [ ] Weekly/monthly mood summaries
- [ ] Trend graphs and visualizations
- [ ] Mood prediction based on patterns
- [ ] Export mood data as CSV
- [ ] Customizable mood categories
- [ ] AI-powered insights on emotional patterns
- [ ] Integration with ML distress detection scores
- [ ] Notifications for concerning mood patterns

## 🧪 Testing

To test the implementation:

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Chat with AURA:**
   - Send at least 3 messages
   - Use emotional keywords (e.g., "I'm feeling happy today")
   - Try different moods (positive, negative, neutral)

3. **Check Firebase Console:**
   - Open Firestore database
   - Look for `moodEntries` collection
   - Verify data is being saved

4. **View Progress Tracking:**
   - Navigate to Progress Tracking page
   - Verify mood entries appear
   - Check statistics cards update correctly

5. **Session Tracking:**
   - Chat for a few minutes
   - Navigate away from chat
   - Return to Progress Tracking
   - Verify session appears in Session History tab

## ✅ Implementation Complete

All features are now functional and integrated:
- ✅ Emotion analysis from chat conversations
- ✅ Automatic mood entry saving (every 3 messages)
- ✅ Session tracking with duration
- ✅ Firebase storage for all data
- ✅ Progress Tracking page shows real data
- ✅ Loading states and empty states
- ✅ Statistics calculations
- ✅ TypeScript type safety
- ✅ Error handling

The emotion tracking system is now fully operational and will automatically track user moods through their conversations with AURA! 🎉
