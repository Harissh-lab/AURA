import React, { useState, useEffect, useRef } from 'react';
import { Menu, Sparkles, ImageIcon, Mic, Send, LogOut, User } from 'lucide-react';
import Sidebar from '../../components/navigation/Sidebar';
// IMPORTANT: Ensure this path matches your folder structure (Capital 'C' for Chat if that's how you named it)
import ChatMessage from '../../components/Chat/ChatMessage'; 
import SOSPage from '../Support/SOSPage';
import CallScreen from '../Support/CallScreen';
import EmergencyCountdown from '../Support/EmergencyCountdown';
import { SUGGESTIONS } from '../../constants/data'; 
import chatbotService from '../../services/chatbotService';
import { detectCrisis, formatCrisisDetection } from '../../utils/crisisDetection';
import { logOut } from '../../services/authService';
import { logCrisisAlert, getUserProfile } from '../../services/firestoreService';
import { db, auth } from '../../config/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

const Dashboard = () => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [chatMode, setChatMode] = useState('friend'); 
    const [view, setView] = useState('chat'); 
    const [showEmergencyCountdown, setShowEmergencyCountdown] = useState(false);
    const [isEmergencyCall, setIsEmergencyCall] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const scrollRef = useRef(null);

    // --- EFFECT 1: LOAD USER & MESSAGES ---
    useEffect(() => {
        const user = auth.currentUser;
        
        if (!user) {
            return;
        }

        setCurrentUser(user);

        // Load user profile
        const loadProfile = async () => {
            const profile = await getUserProfile(user.uid);
            if (profile) {
                setUserProfile(profile);
                if (profile.chatMode) setChatMode(profile.chatMode);
            }
        };
        loadProfile();

        // Real-time listener
        const messagesRef = collection(db, `users/${user.uid}/messages`);
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const messagesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(messagesData);
        }, (error) => {
            console.error('Error listening to messages:', error);
        });

        // Cleanup
        return () => unsubscribe();
    }, []);

    // --- EFFECT 2: AUTO SCROLL ---
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // --- HANDLER: SEND MESSAGE ---
    const handleSend = async (text = input) => {
        if (!text.trim()) return;

        const user = auth.currentUser;
        if (!user) return;

        // 1. CRISIS DETECTION
        const crisisDetection = detectCrisis(text);
        
        if (crisisDetection.isCrisis && crisisDetection.severity === 'high') {
            const messagesRef = collection(db, `users/${user.uid}/messages`);
            
            // User Message
            await addDoc(messagesRef, {
                text: text,
                role: 'user',
                createdAt: serverTimestamp()
            });

            // Crisis Alert
            await addDoc(messagesRef, {
                text: "🚨 Connecting you to SOS Crisis Support immediately. Help is on the way.",
                role: 'ai',
                createdAt: serverTimestamp()
            });

            setInput('');
            await logCrisisAlert(user.uid, {
                severity: crisisDetection.severity,
                keywords: crisisDetection.matchedKeywords,
                message: text
            });
            
            setTimeout(() => {
                setShowEmergencyCountdown(true);
                setIsEmergencyCall(true);
            }, 800);
            return;
        }

        // 2. NORMAL CHAT FLOW
        setInput('');
        setIsTyping(true);

        const messagesRef = collection(db, `users/${user.uid}/messages`);
        
        // Save User Message
        await addDoc(messagesRef, {
            text: text,
            role: 'user',
            createdAt: serverTimestamp()
        });

        try {
            // Get AI Response
            const response = await chatbotService.sendMessage(text, chatMode);
            
            // ML Distress Check
            if (response.distressDetection) {
                const { is_distress, severity, distress_probability } = response.distressDetection;
                
                if (is_distress && distress_probability > 0.75) {
                    await addDoc(messagesRef, {
                        text: "🚨 I'm concerned about what you've shared. Connecting you to SOS Crisis Support immediately.",
                        role: 'ai',
                        createdAt: serverTimestamp()
                    });
                    
                    setTimeout(() => {
                        setShowEmergencyCountdown(true);
                        setIsEmergencyCall(true);
                    }, 800);
                    setIsTyping(false);
                    return;
                }
            }
            
            // Save AI Response
            await addDoc(messagesRef, {
                text: response.text || response,
                role: 'ai',
                createdAt: serverTimestamp()
            });

        } catch (error) {
            console.error('Error getting response:', error);
            await addDoc(messagesRef, {
                text: 'Sorry, I encountered an error. Please try again.',
                role: 'ai',
                createdAt: serverTimestamp()
            });
        } finally {
            setIsTyping(false);
        }
    };

    const handleSuggestionClick = (text) => {
        handleSend(text);
    };

    // --- RENDER HELPERS ---
    if (showEmergencyCountdown) {
        return (
            <EmergencyCountdown 
                onComplete={() => {
                    setShowEmergencyCountdown(false);
                    setView('call');
                }}
                onCancel={() => {
                    setShowEmergencyCountdown(false);
                    setIsEmergencyCall(false);
                }}
                initialCount={10}
            />
        );
    }

    if (view === 'sos') {
        return (
            <SOSPage 
                onBack={() => setView('chat')}
                onStartCall={() => {
                    setIsEmergencyCall(true);
                    setView('call');
                }}
            />
        );
    }

    if (view === 'call') {
        return (
            <CallScreen 
                onEndCall={() => setView('sos')}
                isEmergency={isEmergencyCall}
            />
        );
    }

    // --- MAIN RENDER ---
    return (
        <div className="h-screen bg-white flex flex-col relative overflow-hidden font-sans text-slate-900">
            <Sidebar 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)}
                onNavigate={(destination) => {
                    setView(destination);
                    setIsSidebarOpen(false);
                }}
            />

            {/* HEADER */}
            <header className="flex flex-col z-20 bg-white/80 backdrop-blur-md sticky top-0">
                <div className="flex items-center justify-between px-4 py-3">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-full hover:bg-slate-100 text-slate-600">
                        <Menu size={24} />
                    </button>

                    <div className="flex items-center gap-3">
                        <span className="font-semibold bg-gradient-to-r from-teal-500 to-indigo-500 bg-clip-text text-transparent">Aura</span>
                        <div className="flex gap-1 bg-slate-100 rounded-full p-1">
                            <button onClick={() => setChatMode('friend')} className={`px-3 py-1 rounded-full text-xs font-medium ${chatMode === 'friend' ? 'bg-teal-500 text-white' : 'text-slate-600'}`}>Friend</button>
                            <button onClick={() => setChatMode('professional')} className={`px-3 py-1 rounded-full text-xs font-medium ${chatMode === 'professional' ? 'bg-indigo-500 text-white' : 'text-slate-600'}`}>Pro</button>
                        </div>
                    </div>

                    <button onClick={async () => { await logOut(); window.location.href = '/'; }} className="p-2 text-slate-600 hover:text-red-600">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* MESSAGES AREA */}
            <main className="flex-1 overflow-y-auto pb-32 px-4 pt-4">
                {messages.length === 0 && (
                    <div className="flex flex-col h-full justify-center max-w-2xl mx-auto">
                        <div className="mb-8 space-y-2">
                            <h1 className="text-4xl font-semibold bg-gradient-to-br from-teal-400 to-indigo-600 bg-clip-text text-transparent">Hello, {userProfile?.displayName || 'Friend'}</h1>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                            {SUGGESTIONS.map((s, idx) => (
                                <button key={idx} onClick={() => handleSuggestionClick(s.text)} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left hover:bg-slate-100 flex gap-3">
                                    <div className={`p-2 rounded-full ${s.color} bg-opacity-20`}>{s.icon}</div>
                                    <span className="text-slate-700 text-sm font-medium mt-1">{s.text}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="max-w-2xl mx-auto pt-4 space-y-4">
                    {messages.map((msg, idx) => (
                        <ChatMessage key={idx} role={msg.role} text={msg.text} />
                    ))}
                    {isTyping && <ChatMessage role="ai" isTyping={true} />}
                    <div ref={scrollRef} />
                </div>
            </main>

            {/* INPUT AREA */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-10 pb-6 px-4 z-30">
                <div className="max-w-2xl mx-auto bg-slate-100 rounded-[28px] p-2 flex items-end shadow-sm border border-slate-200">
                    <button className="p-3 rounded-full hover:bg-slate-200 text-slate-500"><ImageIcon size={22} /></button>
                    <textarea 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                        placeholder="Type, talk, or share..." 
                        className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 px-2 max-h-32 min-h-[48px] outline-none" 
                        rows={1} 
                    />
                    <div className="flex items-center gap-1">
                        {input.trim().length > 0 ? (
                            <button onClick={() => handleSend()} className="p-3 rounded-full bg-teal-600 text-white hover:bg-teal-700 shadow-md"><Send size={20} /></button>
                        ) : (
                            <button className="p-3 rounded-full hover:bg-slate-200 text-slate-500"><Mic size={22} /></button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;