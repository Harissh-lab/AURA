import React, { useState, useEffect } from 'react';
import { ArrowLeft, Phone, AlertCircle, Heart, Wind, User, CheckCircle, Loader2 } from 'lucide-react';
import { getCurrentUser } from '../services/authService';
import { getUserEmergencyData, callCrisisHelpline, callEmergencyContact, triggerCrisisAlert, type EmergencyContact, type UserEmergencyData } from '../services/emergencyAlertService';

interface EmergencySOSProps {
  onBack: () => void;
}

export function EmergencySOS({ onBack }: EmergencySOSProps) {
  const [emergencyContacted, setEmergencyContacted] = useState(false);
  const [showBreathingExercise, setShowBreathingExercise] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [slideValue, setSlideValue] = useState(0);
  const [userData, setUserData] = useState<UserEmergencyData | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');

  // Load user emergency data from Firebase
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const currentUser = getCurrentUser();
        if (currentUser) {
          setUserName(currentUser.displayName || 'User');
          const data = await getUserEmergencyData(currentUser.uid);
          if (data) {
            setUserData(data);
            
            // Build emergency contacts array
            const contacts: EmergencyContact[] = [];
            if (data.emergencyContact1) {
              contacts.push(data.emergencyContact1);
            }
            if (data.emergencyContact2) {
              contacts.push(data.emergencyContact2);
            }
            setEmergencyContacts(contacts);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleCallContact = (contact: EmergencyContact) => {
    callEmergencyContact(contact);
  };

  const handleCallHelpline = () => {
    callCrisisHelpline();
  };

  const handleAlertAllContacts = async () => {
    if (confirm('This will send an emergency alert to all your emergency contacts. Continue?')) {
      try {
        const currentUser = getCurrentUser();
        if (currentUser) {
          const result = await triggerCrisisAlert(
            currentUser.uid,
            'Emergency SOS alert triggered by user',
            { confidence: 1.0, probability: 1.0 }
          );
          
          if (result.success) {
            setEmergencyContacted(true);
            console.log('✅ Emergency contacts notified');
          }
        }
      } catch (error) {
        console.error('❌ Error alerting contacts:', error);
        alert('Failed to alert emergency contacts. Please try calling them directly.');
      }
    }
  };

  const startBreathingExercise = () => {
    setShowBreathingExercise(true);
    runBreathingCycle();
  };

  const runBreathingCycle = () => {
    setBreathingPhase('inhale');
    setTimeout(() => {
      setBreathingPhase('hold');
      setTimeout(() => {
        setBreathingPhase('exhale');
        setTimeout(() => {
          if (showBreathingExercise) {
            runBreathingCycle();
          }
        }, 4000);
      }, 4000);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 bg-red-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-700 hover:text-teal-400 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <AlertCircle className="w-10 h-10 text-red-500" />
              <h1 className="text-red-500">Emergency SOS</h1>
            </div>
            {userName && (
              <p className="text-gray-800 font-semibold mb-1">Hello, {userName}</p>
            )}
            <p className="text-gray-600">Immediate help and support resources</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Crisis Alert Banner */}
        <div className="bg-red-100 border-2 border-red-500 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <h2 className="text-red-900 mb-2">Are you in immediate danger?</h2>
              <p className="text-red-800 mb-4">
                If you're experiencing thoughts of self-harm or suicide, please reach out for immediate help. You are not alone.
              </p>
              {/* Slide to Call Helpline */}
              <div className="relative bg-red-200 rounded-full h-16 overflow-hidden shadow-inner">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={slideValue}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setSlideValue(value);
                    if (value >= 95) {
                      handleCallHelpline();
                      setSlideValue(0);
                    }
                  }}
                  onMouseUp={() => setSlideValue(0)}
                  onTouchEnd={() => setSlideValue(0)}
                />
                <div 
                  className="absolute left-0 top-0 h-full bg-red-600 transition-all duration-200"
                  style={{ width: `${slideValue}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="flex items-center gap-3 text-white font-bold">
                    <Phone className="w-6 h-6" />
                    <div className="text-center">
                      <div>Slide to Call Crisis Helpline</div>
                      <div className="text-sm text-red-100">1800-599-0019 - Available 24/7</div>
                    </div>
                    <span className="text-2xl">→</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <h2 className="text-teal-400 mb-4">Your Emergency Contacts</h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
            </div>
          ) : emergencyContacts.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <p className="text-amber-800 font-semibold mb-1">No Emergency Contacts Set</p>
              <p className="text-amber-700 text-sm">Add emergency contacts in your profile settings for quick access during crisis.</p>
            </div>
          ) : (
            <>
              {emergencyContacted && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-green-800">Emergency contacts have been notified</p>
                </div>
              )}

              <div className="space-y-3 mb-4">
                {emergencyContacts.map((contact, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-teal-100 p-2 rounded-full">
                        <User className="w-5 h-5 text-teal-400" />
                      </div>
                      <div>
                        <div className="text-gray-900 font-semibold">{contact.name}</div>
                        <div className="text-gray-600 text-sm">{contact.relationship || 'Emergency Contact'}</div>
                        <div className="text-gray-500 text-xs">{contact.phone}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCallContact(contact)}
                      className="bg-teal-400 text-white px-4 py-2 rounded-lg hover:bg-teal-500 transition-colors flex items-center gap-2 shadow-md"
                    >
                      <Phone className="w-4 h-4" />
                      Call
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAlertAllContacts}
                disabled={emergencyContacted}
                className="w-full bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
              >
                {emergencyContacted ? '✓ Emergency Contacts Notified' : '🚨 Alert All Emergency Contacts'}
              </button>
            </>
          )}
        </div>

        {/* Grounding Techniques */}
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <h2 className="text-teal-400 mb-4">Immediate Relief Techniques</h2>
          
          {!showBreathingExercise ? (
            <div className="space-y-3">
              <button
                onClick={startBreathingExercise}
                className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl p-4 text-left transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Wind className="w-6 h-6 text-blue-500" />
                  <h3 className="text-blue-900">Breathing Exercise</h3>
                </div>
                <p className="text-gray-600">Guided 4-4-4 breathing to help calm anxiety</p>
              </button>

              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Heart className="w-6 h-6 text-purple-500" />
                  <h3 className="text-purple-900">5-4-3-2-1 Grounding Technique</h3>
                </div>
                <div className="text-gray-700 space-y-1 text-sm">
                  <p>• Name <strong>5</strong> things you can see</p>
                  <p>• Name <strong>4</strong> things you can touch</p>
                  <p>• Name <strong>3</strong> things you can hear</p>
                  <p>• Name <strong>2</strong> things you can smell</p>
                  <p>• Name <strong>1</strong> thing you can taste</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mb-6">
                <div className={`w-32 h-32 mx-auto rounded-full border-4 transition-all duration-1000 ${
                  breathingPhase === 'inhale' ? 'scale-100 border-blue-400 bg-blue-100' :
                  breathingPhase === 'hold' ? 'scale-110 border-purple-400 bg-purple-100' :
                  'scale-90 border-green-400 bg-green-100'
                }`}>
                  <div className="flex items-center justify-center h-full">
                    <Wind className="w-12 h-12 text-gray-600" />
                  </div>
                </div>
              </div>
              <h3 className="text-2xl mb-2 text-gray-800">
                {breathingPhase === 'inhale' && 'Breathe In...'}
                {breathingPhase === 'hold' && 'Hold...'}
                {breathingPhase === 'exhale' && 'Breathe Out...'}
              </h3>
              <p className="text-gray-600 mb-6">Follow the circle</p>
              <button
                onClick={() => setShowBreathingExercise(false)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Stop Exercise
              </button>
            </div>
          )}
        </div>

        {/* Crisis Resources */}
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <h2 className="text-teal-400 mb-4">Crisis Resources</h2>
          <div className="space-y-3">
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
              <h3 className="text-teal-900 mb-2 font-semibold">Tele MANAS (National Mental Health Helpline)</h3>
              <div className="space-y-1">
                <a href="tel:14416" className="text-teal-600 hover:text-teal-700 font-semibold text-lg block">
                  📞 14416 or 1800-89-14416
                </a>
                <p className="text-teal-800 text-sm">Call or text - Available in 20 languages</p>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <h3 className="text-purple-900 mb-2 font-semibold">KIRAN Mental Health</h3>
              <a href="tel:18005990019" className="text-purple-700 hover:text-purple-800 font-semibold">
                📞 1800-599-0019
              </a>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="text-amber-900 mb-2 font-semibold">Vandrevala Foundation</h3>
              <a href="tel:18602662345" className="text-amber-700 hover:text-amber-800 font-semibold">
                📞 1860-2662-345
              </a>
            </div>

            <div className="bg-pink-50 border border-pink-200 rounded-xl p-4">
              <h3 className="text-pink-900 mb-2 font-semibold">iCall Psychosocial Helpline</h3>
              <a href="tel:+919152987821" className="text-pink-700 hover:text-pink-800 font-semibold">
                📞 +91 9152 987 821
              </a>
              <p className="text-pink-600 text-sm mt-1">Mon-Sat: 8 AM - 10 PM</p>
            </div>
          </div>
        </div>

        {/* Safety Plan */}
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <h2 className="text-teal-400 mb-4">You Are Not Alone</h2>
          <div className="space-y-3 text-gray-700">
            <p>• Your feelings are temporary, even when they feel overwhelming</p>
            <p>• There are people who care about you and want to help</p>
            <p>• Reaching out for help is a sign of strength, not weakness</p>
            <p>• Crisis situations pass, and there is hope for feeling better</p>
          </div>
        </div>

        {/* Disclaimer at Bottom */}
        <div className="text-center pb-4">
          <p className="text-gray-500 text-lg italic">AURA is an AI assistant, not a human counselor</p>
        </div>
      </div>
    </div>
  );
}