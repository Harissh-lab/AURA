import React, { useState, useEffect } from 'react';
import { Phone, AlertTriangle, Heart, Shield, X, Volume2, User } from 'lucide-react';
import { getCurrentUser } from '../services/authService';
import { getUserEmergencyData, callCrisisHelpline, callEmergencyContact, type EmergencyContact } from '../services/emergencyAlertService';

interface EmergencyCallingScreenProps {
  onClose: () => void;
  detectionData?: {
    confidence: number;
    probability: number;
  };
}

export function EmergencyCallingScreen({ onClose, detectionData }: EmergencyCallingScreenProps) {
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [activeCall, setActiveCall] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [autoCallInitiated, setAutoCallInitiated] = useState(false);

  // Load emergency contacts and AUTO-INITIATE CALL
  useEffect(() => {
    const loadContactsAndCall = async () => {
      try {
        const currentUser = getCurrentUser();
        if (currentUser) {
          const data = await getUserEmergencyData(currentUser.uid);
          if (data) {
            const contacts: EmergencyContact[] = [];
            if (data.emergencyContact1) contacts.push(data.emergencyContact1);
            if (data.emergencyContact2) contacts.push(data.emergencyContact2);
            setEmergencyContacts(contacts);

            // AUTO-CALL: Priority order - Emergency Contact 1 > Emergency Contact 2 > Crisis Helpline
            if (!autoCallInitiated) {
              setAutoCallInitiated(true);
              
              // Wait 1 second to show the screen, then auto-dial
              setTimeout(() => {
                if (contacts.length > 0) {
                  // Call first emergency contact
                  console.log('🚨 AUTO-CALLING Emergency Contact:', contacts[0].name);
                  setActiveCall(contacts[0].name);
                  callEmergencyContact(contacts[0]);
                } else {
                  // No emergency contacts, call crisis helpline
                  console.log('🚨 AUTO-CALLING Crisis Helpline: Tele MANAS');
                  setActiveCall('Tele MANAS');
                  callCrisisHelpline('14416');
                }
              }, 1000); // 1 second delay to show screen
            }
          } else {
            // No user data, auto-call helpline
            if (!autoCallInitiated) {
              setAutoCallInitiated(true);
              setTimeout(() => {
                console.log('🚨 AUTO-CALLING Crisis Helpline: Tele MANAS');
                setActiveCall('Tele MANAS');
                callCrisisHelpline('14416');
              }, 1000);
            }
          }
        }
      } catch (error) {
        console.error('Error loading contacts:', error);
        // Fallback to helpline on error
        if (!autoCallInitiated) {
          setAutoCallInitiated(true);
          setTimeout(() => {
            console.log('🚨 AUTO-CALLING Crisis Helpline (fallback)');
            setActiveCall('Tele MANAS');
            callCrisisHelpline('14416');
          }, 1000);
        }
      }
    };

    loadContactsAndCall();
  }, []); // Only run once on mount

  // Call timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeCall) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeCall]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCallHelpline = (helpline: { name: string; number: string }) => {
    setActiveCall(helpline.name);
    callCrisisHelpline(helpline.number);
  };

  const handleCallContact = (contact: EmergencyContact) => {
    setActiveCall(contact.name);
    callEmergencyContact(contact);
  };

  const handleEndCall = () => {
    setActiveCall(null);
    setCallDuration(0);
  };

  const crisisHelplines = [
    { name: 'Tele MANAS', number: '14416', description: 'Free 24/7, 20+ languages' },
    { name: 'KIRAN Mental Health', number: '1800-599-0019', description: '24/7 Free Support' },
    { name: 'Vandrevala Foundation', number: '1860-2662-345', description: '24/7 Helpline' },
    { name: 'iCall Helpline', number: '9152987821', description: 'Mon-Sat 8 AM - 10 PM' },
  ];

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-red-600 via-red-700 to-red-800 z-[200] flex flex-col">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-3 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all z-10"
      >
        <X className="w-6 h-6" />
      </button>

      {/* AI Detection Badge */}
      {detectionData && (
        <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2 text-white z-10">
          <p className="text-xs font-semibold">🤖 AI Crisis Detection</p>
          <p className="text-sm">Confidence: {(detectionData.confidence * 100).toFixed(0)}%</p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {!activeCall ? (
          // Connecting/Loading State (shows while auto-calling is being initiated)
          <div className="text-center animate-fade-in">
            <div className="mb-8">
              <div className="w-48 h-48 mx-auto bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center relative">
                <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-20"></div>
                <Phone className="w-24 h-24 text-white drop-shadow-2xl animate-pulse" />
              </div>
            </div>

            <h2 className="text-4xl font-black text-white mb-4 drop-shadow-lg">
              🚨 CONNECTING TO HELP
            </h2>
            <p className="text-2xl text-white/90 font-semibold mb-8">
              Auto-dialing emergency contact...
            </p>
            
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-4 max-w-md mx-auto">
              <p className="text-white text-lg font-semibold mb-2">
                📞 Priority Call System Active
              </p>
              <p className="text-white/80 text-sm">
                {emergencyContacts.length > 0 
                  ? `Calling: ${emergencyContacts[0].name}` 
                  : 'Calling: Tele MANAS Crisis Helpline'}
              </p>
            </div>
          </div>
        ) : (
          // Active Call UI
          <div className="text-center animate-scale-in w-full max-w-2xl">
            <div className="mb-8">
              <div className="w-48 h-48 mx-auto bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center relative">
                <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
                <Phone className="w-24 h-24 text-white drop-shadow-2xl animate-pulse" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-white mb-2">📞 Connected</h2>
            <p className="text-2xl text-white/90 font-semibold mb-4">{activeCall}</p>
            
            <div className="text-6xl font-black text-white mb-8 drop-shadow-lg">
              {formatDuration(callDuration)}
            </div>

            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 bg-green-500/30 backdrop-blur-sm rounded-full px-6 py-3 text-white border-2 border-green-400">
                <Volume2 className="w-5 h-5" />
                <span className="font-semibold">Line Active</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white">
                <Shield className="w-5 h-5" />
                <span className="font-semibold">Encrypted</span>
              </div>
            </div>

            <button
              onClick={handleEndCall}
              className="w-20 h-20 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-2xl transition-all transform hover:scale-110 mx-auto"
            >
              <X className="w-10 h-10 text-white" />
            </button>
            <p className="text-white mt-4 font-semibold">End Call</p>

            {/* Alternative Call Options During Active Call */}
            <div className="mt-12 pt-8 border-t border-white/20">
              <p className="text-white/80 text-sm mb-4">Need to call someone else?</p>
              <div className="grid grid-cols-2 gap-3">
                {crisisHelplines.slice(0, 2).map((helpline) => (
                  <button
                    key={helpline.number}
                    onClick={() => {
                      handleEndCall();
                      setTimeout(() => handleCallHelpline(helpline), 500);
                    }}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-3 text-white transition-all text-sm"
                  >
                    <Phone className="w-4 h-4 mx-auto mb-1" />
                    <div className="font-semibold">{helpline.name}</div>
                    <div className="text-xs text-white/70">{helpline.number}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Reassurance */}
      <div className="bg-white/10 backdrop-blur-sm py-6 text-center">
        <div className="flex items-center justify-center gap-2 text-white mb-2">
          <Heart className="w-5 h-5" />
          <p className="font-semibold">You are valued. You matter. Help is here.</p>
        </div>
        <p className="text-white/80 text-sm">All calls are confidential and free</p>
      </div>
    </div>
  );
}
