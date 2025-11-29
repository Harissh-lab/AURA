import React, { useState, useEffect, useRef } from 'react';
import { Menu, Sparkles, ImageIcon, Mic, Send } from 'lucide-react';
import Sidebar from '../../components/navigation/Sidebar';
import ChatMessage from '../../components/chat/ChatMessage';
import { SUGGESTIONS, MOCK_RESPONSE } from '../../constants/data';

const Dashboard = () => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isTyping]);

    const handleSend = async (text = input) => {
        if (!text.trim()) return;

        // Add user message
        const newMsg = { role: 'user', text: text };
        setMessages(prev => [...prev, newMsg]);
        setInput('');
        setIsTyping(true);

        // Simulate AI delay
        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'ai', text: MOCK_RESPONSE }]);
            setIsTyping(false);
        }, 2000);
    };

    const handleSuggestionClick = (text) => {
        handleSend(text);
    };

    return (
        <div className="h-screen bg-white flex flex-col relative overflow-hidden font-sans text-slate-900">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* --- Top Bar --- */}
            <header className="flex items-center justify-between px-4 py-3 z-20 bg-white/80 backdrop-blur-md sticky top-0">
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
                >
                    <Menu size={24} />
                </button>

                <div className="flex items-center gap-2">
                    <span className="font-semibold bg-gradient-to-r from-teal-500 to-indigo-500 bg-clip-text text-transparent">Aura</span>
                    <div className="px-2 py-0.5 rounded-md bg-teal-50 text-[10px] font-bold text-teal-600 border border-teal-100">AI</div>
                </div>

                <button className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 overflow-hidden border border-slate-100">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Profile" className="w-full h-full object-cover" />
                </button>
            </header>

            {/* --- Main Content Area --- */}
            <main className="flex-1 overflow-y-auto pb-32 px-4 pt-4">

                {/* Welcome State (Only if no messages) */}
                {messages.length === 0 && (
                    <div className="flex flex-col h-full justify-center max-w-2xl mx-auto animate-fade-in">
                        <div className="mb-8 space-y-2">
                            <h1 className="text-4xl font-semibold bg-gradient-to-br from-teal-400 to-indigo-600 bg-clip-text text-transparent inline-block">
                                Hello, Alex
                            </h1>
                            <h2 className="text-3xl font-medium text-slate-300">
                                How are you feeling?
                            </h2>
                        </div>

                        {/* Suggestions Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                            {SUGGESTIONS.map((s, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSuggestionClick(s.text)}
                                    className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left hover:bg-slate-100 transition-colors group flex items-start gap-3"
                                >
                                    <div className={`p-2 rounded-full ${s.color} bg-opacity-20`}>
                                        {s.icon}
                                    </div>
                                    <span className="text-slate-700 text-sm font-medium mt-1 group-hover:text-teal-700 transition-colors">
                                        {s.text}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 p-4 bg-teal-50 rounded-xl border border-teal-100 text-sm text-teal-800">
                            <Sparkles size={16} className="text-teal-500 shrink-0" />
                            <p>Your conversations are private and secure.</p>
                        </div>
                    </div>
                )}

                {/* Chat History */}
                <div className="max-w-2xl mx-auto pt-4">
                    {messages.map((msg, idx) => (
                        <ChatMessage key={idx} role={msg.role} text={msg.text} />
                    ))}
                    {isTyping && <ChatMessage role="ai" isTyping={true} />}
                    <div ref={scrollRef} />
                </div>
            </main>

            {/* --- Bottom Input Bar --- */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-10 pb-6 px-4 z-30">
                <div className="max-w-2xl mx-auto bg-slate-100 rounded-[28px] p-2 pr-2 flex items-end shadow-sm border border-slate-200 transition-shadow focus-within:shadow-md focus-within:ring-1 focus-within:ring-slate-300">

                    <button className="p-3 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
                        <ImageIcon size={22} />
                    </button>

                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Type, talk, or share..."
                        className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 px-2 max-h-32 min-h-[48px] text-slate-800 placeholder:text-slate-500 outline-none"
                        rows={1}
                    />

                    <div className="flex items-center gap-1">
                        {input.trim().length > 0 ? (
                            <button
                                onClick={() => handleSend()}
                                className="p-3 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-transform active:scale-95 shadow-md shadow-teal-200"
                            >
                                <Send size={20} className="ml-0.5" />
                            </button>
                        ) : (
                            <button className="p-3 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
                                <Mic size={22} />
                            </button>
                        )}
                    </div>
                </div>
                <p className="text-center text-[10px] text-slate-400 mt-3 font-medium">
                    Aura can make mistakes. Consider checking important information.
                </p>
            </div>
        </div>
    );
};

export default Dashboard;
