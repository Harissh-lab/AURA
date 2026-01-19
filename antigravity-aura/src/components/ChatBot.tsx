import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Mic, MicOff, Shield, Lock, AlertTriangle, History, X, Globe, Check, Volume2, VolumeX, Phone, PhoneCall } from 'lucide-react';
import { sendMessage as sendMessageToBackend } from '../services/chatService';
import { saveChatMessage, loadChatHistory, clearChatHistory } from '../services/chatHistoryService';
import { speechRecognitionService, SUPPORTED_LANGUAGES, getLanguageForBackend, getLanguageName, type SpeechRecognitionResult } from '../services/speechService';
import { analyzeEmotion, saveMoodEntry, saveSessionEntry } from '../services/emotionTrackingService';
import { textToSpeechService, getTTSLanguageCode } from '../services/textToSpeechService';
import { triggerCrisisAlert, callCrisisHelpline, callEmergencyContact, type EmergencyContact } from '../services/emergencyAlertService';
import { getCurrentUser } from '../services/authService';

interface ChatBotProps {
  onBack: () => void;
  onNavigateToSOS?: () => void;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isDistress?: boolean;
}

export function ChatBot({ onBack, onNavigateToSOS }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isEncrypted] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date());
  const [userMessagesInSession, setUserMessagesInSession] = useState<string[]>([]);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [autoPlayTTS, setAutoPlayTTS] = useState(false); // Auto-play disabled by default
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [crisisEmergencyContacts, setCrisisEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [showSOSCountdown, setShowSOSCountdown] = useState(false);
  const [sosCountdown, setSOSCountdown] = useState(3);
  const [showLanguageSetup, setShowLanguageSetup] = useState(() => {
    // Check if language was previously selected
    const savedLanguage = localStorage.getItem('aura_preferred_language');
    return !savedLanguage; // Show setup only if no saved language
  });
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    // Load saved language or default to English
    return localStorage.getItem('aura_preferred_language') || 'en-US';
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle language selection on first load
  const handleLanguageSelection = async (langCode: string) => {
    setSelectedLanguage(langCode);
    localStorage.setItem('aura_preferred_language', langCode); // Save preference
    setShowLanguageSetup(false);
    
    // Create welcome message in selected language
    const languageName = getLanguageName(langCode);
    const welcomeMessages: Record<string, string> = {
      'en-US': "Hello! I'm your AURA AI companion. I'm here to listen and support you. How are you feeling today?",
      'hi-IN': "नमस्ते! मैं आपका AURA AI साथी हूं। मैं यहां आपकी बात सुनने और आपका समर्थन करने के लिए हूं। आज आप कैसा महसूस कर रहे हैं?",
      'es-ES': "¡Hola! Soy tu compañero AURA AI. Estoy aquí para escucharte y apoyarte. ¿Cómo te sientes hoy?",
      'fr-FR': "Bonjour! Je suis votre compagnon AURA AI. Je suis là pour vous écouter et vous soutenir. Comment vous sentez-vous aujourd'hui?",
      'de-DE': "Hallo! Ich bin dein AURA AI-Begleiter. Ich bin hier, um zuzuhören und dich zu unterstützen. Wie fühlst du dich heute?",
      'ta-IN': "வணக்கம்! நான் உங்கள் AURA AI துணை. நான் உங்கள் பேச்சைக் கேட்கவும் ஆதரிக்கவும் இங்கே இருக்கிறேன். இன்று நீங்கள் எப்படி உணர்கிறீர்கள்?",
      'te-IN': "నమస్కారం! నేను మీ AURA AI సహచరుడిని. నేను వినడానికి మరియు మిమ్మల్ని సపోర్ట్ చేయడానికి ఇక్కడ ఉన్నాను. ఈరోజు మీరు ఎలా ఫీల్ అవుతున్నారు?",
      'mr-IN': "नमस्कार! मी तुमचा AURA AI साथी आहे. मी तुमचे ऐकण्यासाठी आणि समर्थन करण्यासाठी येथे आहे. आज तुम्हाला कसे वाटते?",
    };

    const welcomeText = welcomeMessages[langCode] || welcomeMessages['en-US'];
    
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      text: welcomeText,
      sender: 'bot',
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
    await saveChatMessage(welcomeMessage);
    
    // Auto-play welcome message
    if (autoPlayTTS && textToSpeechService.isAvailable()) {
      setTimeout(() => {
        speakMessage(welcomeMessage.id, welcomeMessage.text);
      }, 500);
    }
  };

  // Load chat history on mount - runs every time ChatBot opens
  useEffect(() => {
    // Skip loading if language setup is needed
    if (showLanguageSetup) return;
    
    console.log('🔄 ChatBot mounted - Loading chat history from Firebase...');
    
    const loadHistory = async () => {
      setHistoryLoaded(false); // Reset loading state
      console.log('📥 Fetching messages from Firestore...');
      
      try {
        const history = await loadChatHistory();
        console.log(`✅ Successfully loaded ${history.length} messages from Firebase`);
        console.log('📊 Message details:', history.map(m => ({
          sender: m.sender,
          text: m.text.substring(0, 50) + '...',
          timestamp: m.timestamp
        })));
        
        if (history.length > 0) {
          console.log('📝 Setting messages state with chat history');
          setMessages(history);
          console.log('✅ Chat history now visible in main chat window');
        }
        
        // Initialize session start time
        setSessionStartTime(new Date());
      } catch (error: any) {
        console.error('❌ Error loading chat history:', error);
        console.error('Error details:', error.message, error.code);
        
        // Show welcome message on error
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          text: "Hello! I'm your AURA AI companion powered by Gemma-3-27b. I'm here to listen and support you. How are you feeling today?",
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      } finally {
        setHistoryLoaded(true);
        console.log('✅ Chat history loading complete. Total messages:', messages.length);
      }
    };

    loadHistory();
  }, [showLanguageSetup]); // Run when language setup completes

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save session when user leaves
  useEffect(() => {
    return () => {
      // Stop any ongoing speech
      textToSpeechService.stop();
      
      if (userMessagesInSession.length > 0) {
        const saveSession = async () => {
          try {
            const duration = Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 1000 / 60);
            const allMessages = userMessagesInSession.join(' ');
            const emotion = analyzeEmotion(allMessages);
            await saveSessionEntry('AI Chat Support', userMessagesInSession.length, emotion.sentiment, duration);
          } catch (error) {
            console.error('Error saving session on exit:', error);
          }
        };
        saveSession();
      }
    };
  }, [userMessagesInSession, sessionStartTime]);

  const handleSendMessage = async () => {
    if (inputText.trim() === '' || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputText;
    setInputText('');
    setIsLoading(true);

    // Save user message to Firestore
    try {
      await saveChatMessage(userMessage);
    } catch (error) {
      console.error('Error saving user message:', error);
    }

    try {
      // Call the backend API with selected language
      const languageForBackend = getLanguageForBackend(selectedLanguage);
      console.log(`🌐 Sending message in language: ${languageForBackend} (${selectedLanguage})`);
      const response = await sendMessageToBackend(messageText, 'friend', languageForBackend);

      // CRITICAL: Check for crisis intervention BEFORE showing any response
      const requiresCrisisIntervention = response.distress_detection?.requires_crisis_intervention || false;
      
      if (requiresCrisisIntervention) {
        console.log('🚨 CRISIS DETECTED - Showing crisis message and redirecting to SOS page');
        
        // Create comprehensive crisis alert message
        const crisisAlertMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "🚨 **CRISIS ALERT ACTIVATED**\n\nI've detected that you may be in immediate danger. Your safety is my top priority.\n\n**Action Taken:**\n• Emergency support resources are being prepared\n• Redirecting you to the SOS Emergency Support page\n• Crisis intervention protocols activated\n\n**You are not alone. Help is available 24/7.**\n\n🇮🇳 **India Crisis Helplines:**\n• Tele MANAS: 14416 (Free, 24/7, 20+ languages)\n• KIRAN: 1800-599-0019\n• Vandrevala Foundation: 1860-2662-345",
          sender: 'bot',
          timestamp: new Date(),
          isDistress: true
        };
        
        // Add message to chat immediately
        setMessages(prev => [...prev, crisisAlertMessage]);
        
        // Save crisis message to Firestore so it persists
        try {
          await saveChatMessage(crisisAlertMessage);
          console.log('✅ Crisis message saved to chat history');
        } catch (error) {
          console.error('❌ Error saving crisis message:', error);
        }
        
        // Trigger crisis alert system
        const currentUser = getCurrentUser();
        if (currentUser) {
          try {
            await triggerCrisisAlert(
              currentUser.uid,
              messageText,
              {
                confidence: response.distress_detection.confidence,
                probability: response.distress_detection.distress_probability
              }
            );
            console.log('✅ Crisis alert triggered successfully');
          } catch (error) {
            console.error('❌ Error triggering crisis alert:', error);
          }
        }
        
        // Redirect to SOS page after message is saved
        setTimeout(() => {
          console.log('🔄 Redirecting to SOS page...');
          onNavigateToSOS?.();
        }, 2500); // 2.5 seconds to ensure message is visible and saved
        
        setIsLoading(false);
        return; // Stop here, don't show bot response
      }
      
      // Normal response flow (non-crisis)
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response.response,
        sender: 'bot',
        timestamp: new Date(),
        isDistress: response.distress_detection?.is_distress || false
      };

      setMessages(prev => [...prev, botResponse]);

      // Save bot response to Firestore
      try {
        await saveChatMessage(botResponse);
      } catch (error) {
        console.error('Error saving bot message:', error);
      }

      // Auto-play TTS for bot response
      if (autoPlayTTS && textToSpeechService.isAvailable()) {
        setTimeout(() => {
          speakMessage(botResponse.id, botResponse.text);
        }, 500); // Small delay for better UX
      }

      // Track user message for emotion analysis
      const updatedMessages = [...userMessagesInSession, messageText];
      setUserMessagesInSession(updatedMessages);

      console.log(`📊 User messages count: ${updatedMessages.length}`);

      // Save mood entry every 3 messages
      if (updatedMessages.length % 3 === 0) {
        try {
          const allMessages = updatedMessages.join(' ');
          const emotion = analyzeEmotion(allMessages);
          console.log(`🎭 Analyzing emotion: ${emotion.mood} (sentiment: ${emotion.sentiment})`);
          await saveMoodEntry(emotion.mood, allMessages, emotion.sentiment, updatedMessages.length);
          console.log('✅ Mood entry saved successfully!');
        } catch (error) {
          console.error('❌ Error saving mood:', error);
        }
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting right now. Please make sure the backend server is running on http://127.0.0.1:5000. If you're in crisis, please call 1800-599-0019 (India National Helpline) immediately.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };



  const handleVoiceInput = () => {
    if (!speechRecognitionService.isSpeechRecognitionSupported()) {
      setRecordingError('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      setTimeout(() => setRecordingError(null), 5000);
      return;
    }

    if (isRecording) {
      // Stop recording
      speechRecognitionService.stopListening();
      setIsRecording(false);
      setInterimTranscript('');
    } else {
      // Start recording
      setIsRecording(true);
      setRecordingError(null);
      setInterimTranscript('');

      speechRecognitionService.startListening(
        {
          language: selectedLanguage,
          continuous: false,
          interimResults: true,
          maxAlternatives: 1
        },
        (result: SpeechRecognitionResult) => {
          // Handle interim results (as user speaks)
          if (!result.isFinal) {
            setInterimTranscript(result.transcript);
          } else {
            // Handle final result
            setInputText(prev => {
              const newText = prev ? `${prev} ${result.transcript}` : result.transcript;
              return newText;
            });
            setInterimTranscript('');
          }
        },
        (error) => {
          // Handle errors
          console.error('Speech recognition error:', error);
          setIsRecording(false);
          setInterimTranscript('');
          
          let errorMessage = 'Speech recognition error. Please try again.';
          if (error === 'not-allowed' || error === 'permission-denied') {
            errorMessage = 'Microphone permission denied. Please allow microphone access.';
          } else if (error === 'no-speech') {
            errorMessage = 'No speech detected. Please try again.';
          } else if (error === 'network') {
            errorMessage = 'Network error. Please check your connection.';
          }
          
          setRecordingError(errorMessage);
          setTimeout(() => setRecordingError(null), 5000);
        },
        () => {
          // Handle end
          setIsRecording(false);
          setInterimTranscript('');
        }
      );
    }
  };

  // Text-to-Speech Functions
  const speakMessage = async (messageId: string, text: string) => {
    try {
      // Stop any currently playing audio first
      stopSpeaking();
      
      setSpeakingMessageId(messageId);
      
      // Call backend TTS endpoint
      const response = await fetch('http://127.0.0.1:5000/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          language: selectedLanguage
        }),
      });
      
      if (!response.ok) {
        throw new Error('TTS request failed');
      }
      
      // Get audio blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Create and play audio
      const audio = new Audio(audioUrl);
      audio.setAttribute('data-message-id', messageId);
      audio.className = 'tts-audio'; // Add a class for easy selection
      
      audio.onended = () => {
        if (speakingMessageId === messageId) {
          setSpeakingMessageId(null);
        }
        URL.revokeObjectURL(audioUrl);
        audio.remove();
      };
      
      audio.onerror = () => {
        if (speakingMessageId === messageId) {
          setSpeakingMessageId(null);
        }
        URL.revokeObjectURL(audioUrl);
        audio.remove();
      };
      
      // Append to body to make it queryable
      document.body.appendChild(audio);
      await audio.play();
      
    } catch (error) {
      console.log('TTS not available');
      setSpeakingMessageId(null);
    }
  };

  const stopSpeaking = () => {
    // Stop all TTS audio elements
    const audioElements = document.querySelectorAll('audio.tts-audio');
    audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
      const url = audio.src;
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
      audio.remove();
    });
    setSpeakingMessageId(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Language Selection Screen
  if (showLanguageSetup) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-teal-50 via-purple-50 to-pink-50 overflow-y-auto">
        <div className="min-h-screen flex items-center justify-center p-4 py-8">
          <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full p-6 md:p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-block bg-gradient-to-r from-teal-400 to-purple-400 text-white rounded-2xl px-6 py-3 mb-4">
                <h1 className="text-3xl font-bold">AURA AI</h1>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Welcome to Your Mental Health Companion</h2>
              <p className="text-gray-600">Choose your preferred language to begin your journey</p>
            </div>

            {/* Language Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelection(lang.code)}
                className={`p-3 md:p-4 rounded-xl border-2 transition-all hover:shadow-lg hover:scale-105 ${
                  selectedLanguage === lang.code
                    ? 'border-teal-500 bg-teal-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-teal-300'
                }`}
              >
                <div className="text-2xl md:text-3xl mb-1 md:mb-2">{lang.flag}</div>
                <div className="font-medium text-sm md:text-base text-gray-800">{lang.name}</div>
                {selectedLanguage === lang.code && (
                  <div className="mt-1 md:mt-2">
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-teal-600 mx-auto" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Privacy Note */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <Lock className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm text-purple-800">
              Your conversations are end-to-end encrypted and secure
            </p>
          </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-teal-50 flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-700 hover:text-teal-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            
            <div className="flex items-center gap-4">
              {/* Language Selector Button */}
              <button
                onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors bg-gradient-to-r from-purple-100 to-teal-100 text-purple-700 hover:from-purple-200 hover:to-teal-200 border-2 border-purple-300"
                title="Change language"
              >
                <Globe className="w-4 h-4" />
                <span>{getLanguageName(selectedLanguage)}</span>
              </button>
              
              {/* TTS Auto-play Toggle */}
              {textToSpeechService.isAvailable() && (
                <button
                  onClick={() => setAutoPlayTTS(!autoPlayTTS)}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors ${
                    autoPlayTTS
                      ? 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={autoPlayTTS ? 'Auto-play enabled' : 'Auto-play disabled'}
                >
                  {autoPlayTTS ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  <span>{autoPlayTTS ? 'Auto-play ON' : 'Auto-play OFF'}</span>
                </button>
              )}
              
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                <Shield className="w-4 h-4" />
                <span className="text-sm">End-to-End Encrypted</span>
                <Lock className="w-4 h-4" />
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-teal-400 mb-1">AI Support Chat</h2>
            <p className="text-gray-500 text-lg italic">AURA is an AI assistant, not a human counselor</p>
          </div>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* History Header */}
            <div className="bg-gradient-to-r from-teal-400 to-cyan-500 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <History className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">Chat History</h2>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="bg-white/20 px-4 py-2 rounded-full">
                  <span className="font-semibold">{messages.length}</span> Messages
                </div>
              </div>
            </div>

            {/* History Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <History className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">No messages yet</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg border ${
                      message.sender === 'user'
                        ? 'bg-teal-50 border-teal-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold ${
                        message.sender === 'user' ? 'text-teal-600' : 'text-gray-600'
                      }`}>
                        {message.sender === 'user' ? 'You' : 'AURA'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {message.timestamp.toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-gray-800 text-sm">{message.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* History Footer */}
            <div className="border-t p-4 bg-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {historyLoaded ? '✅ Synced' : '⏳ Loading...'}
              </p>
              <button
                onClick={async () => {
                  if (confirm('Clear all chat history?')) {
                    try {
                      await clearChatHistory();
                      setMessages([]);
                      setShowHistory(false);
                    } catch (error) {
                      console.error('Failed to clear history');
                    }
                  }
                }}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-4xl mx-auto h-full p-6">
          {/* Loading Indicator */}
          {!historyLoaded && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mb-4"></div>
              <p className="text-gray-500 text-lg">Loading your chat history...</p>
              <p className="text-gray-400 text-sm mt-2">Syncing with Firebase</p>
            </div>
          )}
          
          {/* Messages */}
          {historyLoaded && (
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">No messages yet</p>
                  <p className="text-sm">Start a conversation!</p>
                </div>
              )}
              {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl p-4 ${
                    message.sender === 'user'
                      ? 'bg-teal-400 text-white'
                      : message.isDistress
                      ? 'bg-amber-50 border-2 border-amber-300 text-gray-800 shadow-md'
                      : 'bg-white text-gray-800 shadow-sm'
                  }`}
                >
                  {message.isDistress && message.sender === 'bot' && (
                    <div className="flex items-center gap-2 mb-2 text-amber-700">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="font-semibold text-sm">Crisis Support</span>
                    </div>
                  )}
                  <p className="break-words">{message.text}</p>
                  
                  {/* TTS Button for Bot Messages */}
                  {message.sender === 'bot' && (
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200">
                      {speakingMessageId === message.id ? (
                        <button
                          onClick={stopSpeaking}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors bg-red-500 hover:bg-red-600 text-white font-medium"
                        >
                          <VolumeX className="w-4 h-4" />
                          <span>Stop</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => speakMessage(message.id, message.text)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors bg-gray-100 text-gray-600 hover:bg-teal-500 hover:text-white"
                        >
                          <Volume2 className="w-4 h-4" />
                          <span>Listen</span>
                        </button>
                      )}
                      {speakingMessageId === message.id && (
                        <span className="text-xs text-teal-600 font-medium animate-pulse">
                          Speaking...
                        </span>
                      )}
                    </div>
                  )}
                  
                  <p
                    className={`text-xs mt-2 ${
                      message.sender === 'user' ? 'text-teal-100' : 'text-gray-400'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="text-gray-500 text-sm">AURA is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          {/* Error Message */}
          {recordingError && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{recordingError}</span>
            </div>
          )}

          {/* Language Selector */}
          {showLanguageSelector && (
            <div className="mb-3 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 pb-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-teal-600" />
                  <h3 className="font-semibold text-gray-800">Select Language</h3>
                </div>
                <button
                  onClick={() => setShowLanguageSelector(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 px-4 pb-3">
                🌐 Responses will be in your selected language
              </p>
              <div 
                className="language-selector-scroll px-4 pb-4" 
                style={{ 
                  height: '320px',
                  overflowY: 'scroll',
                  scrollbarWidth: 'auto',
                  msOverflowStyle: 'auto',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                <div className="grid grid-cols-2 gap-2">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setSelectedLanguage(lang.code);
                        localStorage.setItem('aura_preferred_language', lang.code); // Save preference
                        setShowLanguageSelector(false);
                      }}
                      className={`flex items-center justify-between gap-2 p-2 rounded-lg transition-colors ${
                        selectedLanguage === lang.code
                          ? 'bg-teal-100 border-2 border-teal-400'
                          : 'bg-white border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{lang.flag}</span>
                        <span className="text-sm font-medium text-gray-800">{lang.name}</span>
                      </div>
                      {selectedLanguage === lang.code && (
                        <Check className="w-4 h-4 text-teal-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isRecording ? "Listening..." : "Type your message here..."}
                rows={1}
                className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-none"
                style={{ minHeight: '50px', maxHeight: '120px' }}
                disabled={isRecording}
              />
              {/* Interim Transcript Overlay */}
              {interimTranscript && (
                <div className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-gray-700">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-blue-600 font-semibold">Listening...</span>
                  </div>
                  <span className="italic">{interimTranscript}</span>
                </div>
              )}
            </div>
            
            {/* Language Button */}
            <button
              onClick={() => setShowLanguageSelector(!showLanguageSelector)}
              className="p-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors relative"
              title="Select language"
            >
              <Globe className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 text-xs bg-teal-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.flag}
              </span>
            </button>

            {/* Microphone Button */}
            <button
              onClick={handleVoiceInput}
              className={`p-3 rounded-xl transition-all ${
                isRecording
                  ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                  : 'bg-teal-100 text-teal-600 hover:bg-teal-200'
              }`}
              title={isRecording ? 'Stop recording' : 'Start voice input'}
            >
              {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            
            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={inputText.trim() === '' || isLoading}
              className="p-3 bg-teal-400 text-white rounded-xl hover:bg-teal-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send message"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
          
          {/* Recording Status */}
          {isRecording && (
            <div className="mt-3 flex items-center justify-between bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-600">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold">Recording in {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name}</span>
              </div>
              <span className="text-xs text-red-500">Click mic to stop</span>
            </div>
          )}

          {/* Current Language Display */}
          {!isRecording && !showLanguageSelector && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <Globe className="w-3 h-3" />
              <span>Voice input language: <strong>{SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name}</strong></span>
            </div>
          )}
        </div>
      </div>
      
      {/* SOS Countdown Modal */}
      {showSOSCountdown && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <AlertTriangle className="w-12 h-12 animate-bounce" />
              </div>
              <h2 className="text-2xl font-bold">🚨 Crisis Detected</h2>
              <p className="text-red-100 mt-2">Redirecting to Emergency SOS Page</p>
            </div>
            
            {/* Countdown */}
            <div className="p-12 text-center">
              <div className="relative w-48 h-48 mx-auto">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-8xl font-bold text-red-500 animate-pulse">
                    {sosCountdown}
                  </div>
                </div>
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="#fee2e2"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="#ef4444"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray="552.92"
                    strokeDashoffset={552.92 * (1 - (3 - sosCountdown) / 3)}
                    className="transition-all duration-1000 ease-linear"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <p className="text-gray-600 mt-6 text-lg">
                Emergency help is available now
              </p>
              <button
                onClick={() => {
                  setShowSOSCountdown(false);
                  onNavigateToSOS?.();
                }}
                className="mt-4 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all"
              >
                Go to SOS Page Now
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Crisis Alert Modal */}
      {showCrisisModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-pulse">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 animate-bounce" />
                  <div>
                    <h2 className="text-2xl font-bold">🚨 Crisis Alert</h2>
                    <p className="text-sm text-red-100">Immediate help is available</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCrisisModal(false)}
                  className="hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Crisis Helpline */}
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
                <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                  <PhoneCall className="w-5 h-5" />
                  🇮🇳 Tele MANAS - National Mental Health Helpline
                </h3>
                <button
                  onClick={() => window.location.href = 'tel:14416'}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-105 shadow-lg"
                >
                  <Phone className="w-6 h-6" />
                  <div className="text-left">
                    <div className="text-lg">Call Now: 14416 or 1800-89-14416</div>
                    <div className="text-xs text-red-100">24/7 - Available in 20 Languages</div>
                  </div>
                </button>
              </div>
              
              {/* Emergency Contacts */}
              {crisisEmergencyContacts.length > 0 && (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4">
                  <h3 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Your Emergency Contacts
                  </h3>
                  <p className="text-sm text-orange-700 mb-3">
                    📞 We've notified your emergency contacts
                  </p>
                  <div className="space-y-2">
                    {crisisEmergencyContacts.map((contact, index) => (
                      <button
                        key={index}
                        onClick={() => callEmergencyContact(contact)}
                        className="w-full bg-white border-2 border-orange-300 hover:bg-orange-100 text-orange-800 font-medium py-3 px-4 rounded-xl flex items-center justify-between gap-3 transition-all"
                      >
                        <div className="text-left">
                          <div className="font-bold">{contact.name}</div>
                          <div className="text-xs text-orange-600">
                            {contact.relationship || 'Emergency Contact'} • {contact.phone}
                          </div>
                        </div>
                        <Phone className="w-5 h-5" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Additional Resources */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-800 mb-2 text-sm">🇮🇳 India Crisis Helplines</h3>
                <div className="space-y-1 text-xs text-blue-700">
                  <div>• Tele MANAS: 14416 or 1800-89-14416 (20 languages)</div>
                  <div>• KIRAN Mental Health: 1800-599-0019</div>
                  <div>• Vandrevala Foundation: 1860-2662-345</div>
                  <div>• iCall: 9152987821</div>
                </div>
              </div>
              
              {/* Message */}
              <div className="text-center text-sm text-gray-600 italic">
                💙 You're not alone. Help is here for you, right now.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}