import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

  const content = (
    <div className="fixed inset-0 bg-gradient-to-br from-red-500 to-red-700 z-[9999] flex items-center justify-center overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-20 backdrop-blur-sm"
        aria-label="Close emergency screen"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-6">
        {!activeCall ? (
          // Connecting State
          <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
            <div className="mb-8">
              <div className="w-32 h-32 mx-auto bg-red-100 rounded-full flex items-center justify-center relative">
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
                <Phone className="w-16 h-16 text-red-600 animate-pulse" />
              </div>
            </div>

            <div className="mb-6">
              <div className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <AlertTriangle className="w-4 h-4" />
                EMERGENCY MODE ACTIVE
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Connecting to Help
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              {emergencyContacts.length > 0 
                ? `Calling ${emergencyContacts[0].name}...` 
                : 'Calling Tele MANAS Crisis Helpline...'}
            </p>
            
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>

            {detectionData && (
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold">AI Crisis Detection</span>
                </div>
                <p>Confidence: {(detectionData.confidence * 100).toFixed(0)}%</p>
              </div>
            )}
          </div>
        ) : (
          // Active Call State
          <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
            <div className="mb-8">
              <div className="w-32 h-32 mx-auto bg-green-100 rounded-full flex items-center justify-center relative">
                <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
                <Phone className="w-16 h-16 text-green-600" />
              </div>
            </div>

            <div className="mb-6">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <Volume2 className="w-4 h-4" />
                CALL IN PROGRESS
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">{activeCall}</h2>
            <div className="text-5xl font-bold text-gray-900 mb-8 tabular-nums">
              {formatDuration(callDuration)}
            </div>

            <button
              onClick={handleEndCall}
              className="w-20 h-20 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-105 mx-auto mb-8"
            >
              <Phone className="w-8 h-8 text-white transform rotate-135" />
            </button>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>End-to-End Encrypted</span>
                </div>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  <span>Confidential</span>
                </div>
              </div>
            </div>

            {/* Quick Access to Other Helplines */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4">Other helplines available</p>
              <div className="grid grid-cols-2 gap-3">
                {crisisHelplines.filter(h => h.name !== activeCall).slice(0, 2).map((helpline) => (
                  <button
                    key={helpline.number}
                    onClick={() => {
                      handleEndCall();
                      setTimeout(() => handleCallHelpline(helpline), 500);
                    }}
                    className="bg-gray-100 hover:bg-gray-200 rounded-xl p-3 text-left transition-all"
                  >
                    <div className="text-xs font-semibold text-gray-900">{helpline.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{helpline.number}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Message */}
        <div className="mt-6 text-center">
          <p className="text-white text-lg font-semibold drop-shadow-lg">
            You are not alone. Help is available 24/7.
          </p>
        </div>
      </div>
    </div>
  );

  // Render using Portal to ensure it appears above all other content
  return createPortal(content, document.body);
}
