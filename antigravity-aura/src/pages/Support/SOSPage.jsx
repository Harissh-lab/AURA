import React, { useState, useEffect } from 'react';
import { Phone, ArrowLeft, Heart } from 'lucide-react';

const SOSPage = ({ onBack, onStartCall }) => {
    const [isGrounding, setIsGrounding] = useState(false);
    const [groundingProgress, setGroundingProgress] = useState(0);
    const [groundingComplete, setGroundingComplete] = useState(false);

    useEffect(() => {
        let interval;
        if (isGrounding) {
            interval = setInterval(() => {
                setGroundingProgress(prev => {
                    if (prev >= 100) {
                        setGroundingComplete(true);
                        setIsGrounding(false);
                        setTimeout(() => {
                            setGroundingComplete(false);
                            setGroundingProgress(0);
                        }, 2000);
                        return 100;
                    }
                    return prev + 2;
                });
            }, 50);
        } else if (!groundingComplete) {
            setGroundingProgress(0);
        }
        return () => clearInterval(interval);
    }, [isGrounding, groundingComplete]);

    const handleGroundingStart = () => {
        setIsGrounding(true);
        setGroundingComplete(false);
    };

    const handleGroundingEnd = () => {
        setIsGrounding(false);
    };

    return (
        <div className="h-screen bg-gradient-to-br from-rose-50 via-slate-50 to-rose-100 flex flex-col relative overflow-hidden animate-fade-in">
            {/* Animated Background Pulse */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-200/30 rounded-full animate-pulse blur-3xl"></div>
                <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-slate-200/20 rounded-full animate-pulse blur-2xl animation-delay-1000"></div>
            </div>

            {/* Header */}
            <header className="relative z-10 px-4 py-4">
                <button
                    onClick={onBack}
                    className="p-2 rounded-full hover:bg-white/50 text-slate-700 transition-all"
                >
                    <ArrowLeft size={24} />
                </button>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-20">
                <div className="text-center mb-12 space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-rose-100 rounded-full mb-4">
                        <Heart size={40} className="text-rose-500" />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-800 mb-2">
                        We're Here for You
                    </h1>
                    <p className="text-slate-600 text-lg max-w-md mx-auto">
                        You're not alone. Help is available 24/7.
                    </p>
                </div>

                {/* Crisis Hotline Button */}
                <div className="mb-12 relative">
                    {/* Ping Animation Ring */}
                    <div className="absolute -inset-4 bg-rose-400 rounded-full animate-ping opacity-20"></div>
                    <div className="absolute -inset-2 bg-rose-300 rounded-full animate-ping opacity-30 animation-delay-500"></div>
                    
                    <button
                        onClick={onStartCall}
                        className="relative bg-gradient-to-br from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white px-12 py-6 rounded-full shadow-2xl shadow-rose-500/50 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-4 animate-pulse"
                    >
                        <Phone size={32} className="animate-bounce" />
                        <div className="text-left">
                            <div className="text-2xl font-bold">Call 988</div>
                            <div className="text-sm opacity-90">Crisis Lifeline</div>
                        </div>
                    </button>
                </div>

                {/* Grounding Exercise */}
                <div className="w-full max-w-sm">
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center">
                            Need a moment to ground?
                        </h3>
                        
                        {/* Progress Bar */}
                        <div className="relative h-3 bg-slate-200 rounded-full mb-4 overflow-hidden">
                            <div 
                                className="absolute left-0 top-0 h-full bg-gradient-to-r from-teal-400 to-teal-500 transition-all duration-100 ease-linear rounded-full"
                                style={{ width: `${groundingProgress}%` }}
                            >
                                {groundingProgress > 10 && (
                                    <div className="absolute right-0 top-0 h-full w-8 bg-white/30 animate-pulse"></div>
                                )}
                            </div>
                        </div>

                        {/* Hold Button */}
                        <button
                            onMouseDown={handleGroundingStart}
                            onMouseUp={handleGroundingEnd}
                            onMouseLeave={handleGroundingEnd}
                            onTouchStart={handleGroundingStart}
                            onTouchEnd={handleGroundingEnd}
                            className={`w-full py-4 rounded-2xl font-semibold transition-all transform active:scale-95 ${
                                groundingComplete
                                    ? 'bg-gradient-to-r from-teal-500 to-green-500 text-white shadow-lg'
                                    : isGrounding
                                    ? 'bg-gradient-to-r from-teal-400 to-teal-500 text-white shadow-lg'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            {groundingComplete ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Heart size={20} className="fill-current" />
                                    Well Done
                                </span>
                            ) : isGrounding ? (
                                'Keep Holding...'
                            ) : (
                                'Hold to Ground'
                            )}
                        </button>

                        <p className="text-xs text-slate-500 text-center mt-3">
                            Press and hold to complete a calming breathing exercise
                        </p>
                    </div>
                </div>

                {/* Additional Resources */}
                <div className="mt-8 text-center space-y-2">
                    <p className="text-sm text-slate-600 font-medium">Other Resources:</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <a 
                            href="https://988lifeline.org" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full text-sm text-slate-700 hover:bg-white transition-all border border-slate-200"
                        >
                            988lifeline.org
                        </a>
                        <a 
                            href="https://www.crisistextline.org" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full text-sm text-slate-700 hover:bg-white transition-all border border-slate-200"
                        >
                            Text HOME to 741741
                        </a>
                    </div>
                </div>
            </main>

            {/* Footer Note */}
            <footer className="relative z-10 px-6 pb-6 text-center">
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                    If you're experiencing a mental health crisis, please reach out. You deserve support and care.
                </p>
            </footer>
        </div>
    );
};

export default SOSPage;
