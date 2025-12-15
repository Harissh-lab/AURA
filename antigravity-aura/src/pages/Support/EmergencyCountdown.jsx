import React, { useState, useEffect } from 'react';
import { AlertTriangle, Phone, X } from 'lucide-react';

const EmergencyCountdown = ({ onComplete, onCancel, initialCount = 10 }) => {
    const [countdown, setCountdown] = useState(initialCount);
    const [isHolding, setIsHolding] = useState(false);
    const [holdDuration, setHoldDuration] = useState(0);
    const [cancelled, setCancelled] = useState(false);

    // Countdown timer
    useEffect(() => {
        if (countdown <= 0) {
            onComplete();
            return;
        }

        const timer = setInterval(() => {
            setCountdown(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [countdown, onComplete]);

    // Hold timer (3 seconds = 3000ms)
    useEffect(() => {
        let interval;
        if (isHolding) {
            interval = setInterval(() => {
                setHoldDuration(prev => {
                    if (prev >= 3000) {
                        return 3000;
                    }
                    return prev + 50;
                });
            }, 50);
        } else {
            setHoldDuration(0);
        }
        return () => clearInterval(interval);
    }, [isHolding]);

    // Trigger cancel when hold completes
    useEffect(() => {
        if (holdDuration >= 3000 && !cancelled) {
            setCancelled(true);
            onCancel();
        }
    }, [holdDuration, onCancel, cancelled]);

    const holdProgress = (holdDuration / 3000) * 100;

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex items-center justify-center animate-fade-in">
            <div className="max-w-md w-full mx-4">
                {/* Alert Icon with Pulse */}
                <div className="flex justify-center mb-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                        <div className="relative bg-red-500 p-6 rounded-full">
                            <AlertTriangle size={64} className="text-white" />
                        </div>
                    </div>
                </div>

                {/* Message */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Crisis Support Activated
                    </h2>
                    <p className="text-slate-300 text-lg mb-2">
                        We detected you may need immediate help.
                    </p>
                    <p className="text-slate-400 text-sm">
                        Connecting to crisis support in...
                    </p>
                </div>

                {/* Countdown Display */}
                <div className="flex justify-center mb-8">
                    <div className="bg-slate-800 rounded-full w-32 h-32 flex items-center justify-center border-4 border-red-500 shadow-2xl shadow-red-500/50">
                        <span className="text-6xl font-bold text-red-500">
                            {countdown}
                        </span>
                    </div>
                </div>

                {/* Cancel Button - Hold to Cancel */}
                <div className="bg-slate-800 rounded-2xl p-6 mb-4">
                    <p className="text-white text-center mb-4 text-sm">
                        If you're safe and don't need help:
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="relative h-2 bg-slate-700 rounded-full mb-4 overflow-hidden">
                        <div 
                            className="absolute left-0 top-0 h-full bg-gradient-to-r from-teal-400 to-teal-500 transition-all duration-100 ease-linear rounded-full"
                            style={{ width: `${holdProgress}%` }}
                        ></div>
                    </div>

                    <button
                        onMouseDown={() => setIsHolding(true)}
                        onMouseUp={() => setIsHolding(false)}
                        onMouseLeave={() => setIsHolding(false)}
                        onTouchStart={() => setIsHolding(true)}
                        onTouchEnd={() => setIsHolding(false)}
                        className={`w-full py-4 rounded-xl font-semibold transition-all transform active:scale-95 ${
                            holdProgress >= 100
                                ? 'bg-gradient-to-r from-teal-500 to-green-500 text-white'
                                : isHolding
                                ? 'bg-teal-500 text-white'
                                : 'bg-slate-700 text-white hover:bg-slate-600'
                        }`}
                    >
                        {holdProgress >= 100 ? 'Cancelled' : isHolding ? 'Keep Holding...' : 'Hold for 3 Seconds to Cancel'}
                    </button>
                    
                    <p className="text-slate-400 text-xs text-center mt-3">
                        Press and hold the button above
                    </p>
                </div>

                {/* Direct Call Option */}
                <button
                    onClick={onComplete}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all shadow-lg"
                >
                    <Phone size={24} />
                    Connect Now
                </button>
            </div>
        </div>
    );
};

export default EmergencyCountdown;
