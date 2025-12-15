import React, { useState, useEffect } from 'react';
import { Phone, Mic, Grid3x3, Volume2, Video, MoreHorizontal, User } from 'lucide-react';
import { sendEmergencyAlert, getEmergencyContact, getUserCondition, getUserLocation } from '../../services/emergencyService';

const CallScreen = ({ onEndCall, contactName = "988 - Crisis Lifeline", contactNumber = "988", isEmergency = false }) => {
    const [callDuration, setCallDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(false);
    const [emergencyAlertSent, setEmergencyAlertSent] = useState(false);

    // Call timer
    useEffect(() => {
        const timer = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Send emergency alert if this is an emergency call
    useEffect(() => {
        if (isEmergency && !emergencyAlertSent) {
            handleEmergencyAlert();
        }
    }, [isEmergency, emergencyAlertSent]);

    const handleEmergencyAlert = async () => {
        try {
            // Ask user about their condition
            const condition = await getUserCondition();
            
            // Get user location
            const location = await getUserLocation();
            
            // Get emergency contact
            const contact = getEmergencyContact();
            
            // Send alert
            const result = await sendEmergencyAlert({
                contactNumber: contact.number,
                userName: 'Alex', // This should come from user profile
                userCondition: condition,
                location: location
            });

            if (result.success) {
                setEmergencyAlertSent(true);
                // Show notification to user
                alert(`✓ Emergency contact (${contact.name}) has been notified via SMS.`);
            }
        } catch (error) {
            console.error('Failed to send emergency alert:', error);
        }
    };

    // Format time as MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 h-screen w-screen bg-slate-900 flex flex-col overflow-hidden text-white animate-fade-in">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900"></div>
            
            {/* Content */}
            <div className="relative z-10 flex flex-col h-full w-full">
                {/* Status Bar */}
                <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                    <div className="text-sm text-slate-400">
                        {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                            <div className="w-1 h-3 bg-white rounded-full"></div>
                            <div className="w-1 h-3 bg-white rounded-full"></div>
                            <div className="w-1 h-3 bg-white rounded-full"></div>
                            <div className="w-1 h-3 bg-white/50 rounded-full"></div>
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="flex-1 flex flex-col items-center justify-start pt-12 px-6">
                    {/* Avatar */}
                    <div className="relative mb-6">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-2xl shadow-rose-500/50">
                            <Phone size={56} className="text-white" />
                        </div>
                        {/* Pulse ring animation */}
                        <div className="absolute inset-0 rounded-full border-4 border-rose-400/50 animate-ping"></div>
                    </div>

                    {/* Contact Name */}
                    <h1 className="text-3xl font-semibold mb-2 text-center">
                        {contactName}
                    </h1>
                    
                    {/* Contact Number */}
                    <p className="text-slate-400 text-lg mb-6">
                        {contactNumber}
                    </p>

                    {/* Call Duration */}
                    <div className="px-6 py-2 bg-slate-800/50 backdrop-blur-sm rounded-full border border-slate-700">
                        <p className="text-teal-400 font-mono text-xl font-semibold">
                            {formatTime(callDuration)}
                        </p>
                    </div>

                    {/* Status Text */}
                    <p className="text-slate-500 mt-8 text-sm">
                        Call in progress...
                    </p>

                    {/* Emergency Alert Status */}
                    {isEmergency && emergencyAlertSent && (
                        <div className="mt-6 px-4 py-3 bg-teal-500/20 backdrop-blur-sm rounded-xl border border-teal-400/30">
                            <p className="text-teal-300 text-sm text-center">
                                ✓ Emergency contact has been notified
                            </p>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="px-6 pb-12">
                    {/* Control Grid */}
                    <div className="grid grid-cols-3 gap-6 mb-12">
                        {/* Mute */}
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className={`flex flex-col items-center gap-3 transition-all ${
                                isMuted ? 'opacity-100' : 'opacity-80 hover:opacity-100'
                            }`}
                        >
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                                isMuted 
                                    ? 'bg-white text-slate-900' 
                                    : 'bg-slate-800 text-white hover:bg-slate-700'
                            }`}>
                                <Mic size={24} className={isMuted ? 'line-through' : ''} />
                            </div>
                            <span className="text-xs text-slate-400">mute</span>
                        </button>

                        {/* Keypad */}
                        <button className="flex flex-col items-center gap-3 opacity-80 hover:opacity-100 transition-all">
                            <div className="w-16 h-16 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 transition-colors">
                                <Grid3x3 size={24} />
                            </div>
                            <span className="text-xs text-slate-400">keypad</span>
                        </button>

                        {/* Speaker */}
                        <button
                            onClick={() => setIsSpeaker(!isSpeaker)}
                            className={`flex flex-col items-center gap-3 transition-all ${
                                isSpeaker ? 'opacity-100' : 'opacity-80 hover:opacity-100'
                            }`}
                        >
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                                isSpeaker 
                                    ? 'bg-white text-slate-900' 
                                    : 'bg-slate-800 text-white hover:bg-slate-700'
                            }`}>
                                <Volume2 size={24} />
                            </div>
                            <span className="text-xs text-slate-400">speaker</span>
                        </button>

                        {/* Add Call */}
                        <button className="flex flex-col items-center gap-3 opacity-80 hover:opacity-100 transition-all">
                            <div className="w-16 h-16 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 transition-colors">
                                <User size={24} />
                            </div>
                            <span className="text-xs text-slate-400">add call</span>
                        </button>

                        {/* FaceTime */}
                        <button className="flex flex-col items-center gap-3 opacity-80 hover:opacity-100 transition-all">
                            <div className="w-16 h-16 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 transition-colors">
                                <Video size={24} />
                            </div>
                            <span className="text-xs text-slate-400">FaceTime</span>
                        </button>

                        {/* More */}
                        <button className="flex flex-col items-center gap-3 opacity-80 hover:opacity-100 transition-all">
                            <div className="w-16 h-16 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 transition-colors">
                                <MoreHorizontal size={24} />
                            </div>
                            <span className="text-xs text-slate-400">more</span>
                        </button>
                    </div>

                    {/* End Call Button */}
                    <div className="flex justify-center">
                        <button
                            onClick={onEndCall}
                            className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-2xl shadow-red-500/50 transition-all transform active:scale-95"
                        >
                            <Phone size={32} className="rotate-[135deg]" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CallScreen;
