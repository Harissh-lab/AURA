import React from 'react';
import { User, Sparkles } from 'lucide-react';

const ChatMessage = ({ role, text, isTyping }) => {
    const isUser = role === 'user';

    return (
        <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3 items-start`}>

                {/* Avatar */}
                <div className={`
          w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1
          ${isUser ? 'bg-slate-200 text-slate-600' : 'bg-gradient-to-tr from-teal-400 to-indigo-500 text-white shadow-md'}
        `}>
                    {isUser ? <User size={16} /> : <Sparkles size={16} />}
                </div>

                {/* Bubble */}
                <div className={`
          p-4 rounded-2xl text-[15px] leading-relaxed
          ${isUser
                        ? 'bg-slate-100 text-slate-800 rounded-tr-none'
                        : 'bg-transparent text-slate-800 px-0 pt-1'} 
        `}>
                    {isTyping ? (
                        <div className="flex gap-1.5 items-center h-6">
                            <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    ) : (
                        text
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatMessage;
