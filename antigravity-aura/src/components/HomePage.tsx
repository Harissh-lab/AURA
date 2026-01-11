import React, { useState } from 'react';
import { Brain, Sparkles, MessageCircle, TrendingUp, AlertCircle, FileText, LogOut } from 'lucide-react';
import { ChatBot } from './ChatBot';
import { ProgressTracking } from './ProgressTracking';
import { Reports } from './Reports';
import { EmergencySOS } from './EmergencySOS';

interface HomePageProps {
  onLogout: () => void;
}

type ActiveSection = 'dashboard' | 'chatbot' | 'progress' | 'reports' | 'sos';

export function HomePage({ onLogout }: HomePageProps) {
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [slidePosition, setSlidePosition] = useState(0);
  const [isSliding, setIsSliding] = useState(false);

  const handleEmergencySOS = () => {
    setActiveSection('sos');
  };

  // Swipe gesture handlers
  const handleTouchStartGesture = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const handleTouchMoveGesture = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const handleTouchEndGesture = () => {
    if (!touchStart || !touchEnd) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);
    const minSwipeDistance = 100;
    
    if (isHorizontalSwipe && Math.abs(distanceX) > minSwipeDistance) {
      // Swipe left or right - could be used for navigation between sections
      if (distanceX > 0) {
        // Swiped left
        console.log('Swiped left');
      } else {
        // Swiped right
        console.log('Swiped right');
      }
    } else if (!isHorizontalSwipe && Math.abs(distanceY) > minSwipeDistance) {
      // Swipe down to trigger SOS
      if (distanceY < 0 && activeSection === 'dashboard') {
        // Swiped down
        handleEmergencySOS();
      }
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Handle slider movement
  React.useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isSliding) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const sliderElement = document.querySelector('.sos-slider-track') as HTMLElement;
      
      if (sliderElement) {
        const rect = sliderElement.getBoundingClientRect();
        const maxSlide = rect.width - 60; // 60px for button width + padding
        const x = clientX - rect.left - 28; // 28px is half of button width
        const newPosition = Math.max(0, Math.min(maxSlide, x));
        
        setSlidePosition(newPosition);
        
        // Trigger SOS when slid to the end
        if (newPosition >= maxSlide * 0.9) {
          handleEmergencySOS();
          setSlidePosition(0);
          setIsSliding(false);
        }
      }
    };

    const handleEnd = () => {
      setIsSliding(false);
      setSlidePosition(0);
    };

    if (isSliding) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isSliding]);

  return (
    <div 
      className="min-h-screen bg-teal-50"
      onTouchStart={handleTouchStartGesture}
      onTouchMove={handleTouchMoveGesture}
      onTouchEnd={handleTouchEndGesture}
    >
      {/* Header - Only show on dashboard */}
      {activeSection === 'dashboard' && (
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="relative">
                <Brain className="w-10 h-10 text-teal-400" strokeWidth={1.5} />
                <Sparkles className="w-4 h-4 text-teal-400 absolute -top-1 -right-1" />
              </div>
              <span className="ml-2 text-teal-400 tracking-wide uppercase text-2xl font-black">AURA</span>
            </div>
            
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-teal-400 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </header>
      )}

      {/* Chatbot - Full Screen */}
      {activeSection === 'chatbot' && (
        <ChatBot 
          onBack={() => setActiveSection('dashboard')} 
          onNavigateToSOS={handleEmergencySOS}
        />
      )}

      {/* SOS - Full Screen */}
      {activeSection === 'sos' && (
        <EmergencySOS onBack={() => setActiveSection('dashboard')} />
      )}

      {/* Other sections with container */}
      {(activeSection === 'dashboard' || activeSection === 'progress' || activeSection === 'reports') && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          {activeSection === 'dashboard' && (
            <>
              {/* Welcome Section */}
              <div className="mb-8">
                <h1 className="text-teal-400 mb-2">Welcome Back</h1>
                <p className="text-gray-600">How are you feeling today?</p>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Progress Tracking Card */}
                <button
                  onClick={() => setActiveSection('progress')}
                  className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow text-left group"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-blue-100 p-3 rounded-xl group-hover:bg-blue-200 transition-colors">
                      <TrendingUp className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-teal-400">Progress Tracking</h3>
                      <p className="text-gray-600">Monitor your wellness journey</p>
                    </div>
                  </div>
                  <p className="text-gray-500">View mood trends, session history, and personal growth metrics</p>
                </button>

                {/* Chatbot Card */}
                <button
                  onClick={() => setActiveSection('chatbot')}
                  className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow text-left group"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-teal-100 p-3 rounded-xl group-hover:bg-teal-200 transition-colors">
                      <MessageCircle className="w-8 h-8 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="text-teal-400">AI Support Chat</h3>
                      <p className="text-gray-600">Talk with our AI companion</p>
                    </div>
                  </div>
                  <p className="text-gray-500">Get instant support and guidance with voice or text messaging</p>
                  <div className="mt-4 flex items-center gap-2 text-teal-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">End-to-end encrypted</span>
                  </div>
                </button>

                {/* Reports Card */}
                <button
                  onClick={() => setActiveSection('reports')}
                  className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow text-left group"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-purple-100 p-3 rounded-xl group-hover:bg-purple-200 transition-colors">
                      <FileText className="w-8 h-8 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="text-teal-400">Mental Health Reports</h3>
                      <p className="text-gray-600">Access your health insights</p>
                    </div>
                  </div>
                  <p className="text-gray-500">View detailed reports and analysis of your mental health journey</p>
                </button>
              </div>

              {/* Crisis Support Banner - Combined (Desktop only) */}
              <div className="mt-8 hidden md:block">
                <div className="bg-gradient-to-br from-amber-50 to-red-50 border-2 border-amber-300 rounded-2xl p-3 max-w-2xl mx-auto shadow-md">
                  {/* Crisis Helpline */}
                  <div className="flex items-center justify-center gap-3">
                    <AlertCircle className="w-6 h-6 text-amber-600" />
                    <a href="tel:14416" className="text-amber-900 hover:text-amber-700">
                      <span className="font-bold">National Suicide Prevention Lifeline: 14416</span>
                    </a>
                    <button
                      onClick={handleEmergencySOS}
                      className="bg-red-500 hover:bg-red-600 text-white py-2.5 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 font-semibold"
                    >
                      <AlertCircle className="w-5 h-5" />
                      SOS
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile Crisis Support */}
              <div className="mt-8 md:hidden">
                <div className="bg-gradient-to-br from-amber-50 to-red-50 border-2 border-amber-300 rounded-2xl p-3 max-w-2xl mx-auto shadow-md mb-4">
                  <div className="flex items-center justify-center gap-2">
                    <AlertCircle className="w-6 h-6 text-amber-600" />
                    <a href="tel:14416" className="text-amber-900 hover:text-amber-700">
                      <span className="font-bold">Crisis Helpline: 14416</span>
                    </a>
                  </div>
                </div>

                {/* iPhone-style Slide to Activate SOS */}
                <div 
                  className="sos-slider-track relative bg-gradient-to-r from-red-500 to-red-600 rounded-full h-16 overflow-visible mx-auto max-w-sm shadow-xl"
                  style={{ touchAction: 'none' }}
                >
                  {/* Background fill that grows as you slide */}
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-500 rounded-full transition-all"
                    style={{ 
                      width: `${Math.min(100, slidePosition)}%`,
                      opacity: 0.5
                    }}
                  ></div>
                  
                  {/* Slider button */}
                  <div
                    className="absolute left-1 top-1 bottom-1 bg-white rounded-full w-14 flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing z-10"
                    style={{ 
                      transform: `translateX(${slidePosition}px)`,
                      transition: isSliding ? 'none' : 'transform 0.3s ease-out'
                    }}
                    onMouseDown={(e) => {
                      setIsSliding(true);
                      e.preventDefault();
                    }}
                    onTouchStart={(e) => {
                      setIsSliding(true);
                      e.preventDefault();
                    }}
                  >
                    <AlertCircle className="w-7 h-7 text-red-500" />
                  </div>
                  
                  {/* Text that fades as you slide */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-16">
                    <span 
                      className="text-white font-semibold tracking-wide text-sm"
                      style={{ opacity: Math.max(0, 1 - slidePosition / 100) }}
                    >
                      slide for emergency SOS
                    </span>
                    <span 
                      className="text-white font-bold text-xl ml-2"
                      style={{ opacity: Math.max(0, 1 - slidePosition / 100) }}
                    >
                      →
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === 'progress' && (
            <ProgressTracking onBack={() => setActiveSection('dashboard')} />
          )}

          {activeSection === 'reports' && (
            <Reports onBack={() => setActiveSection('dashboard')} />
          )}
        </div>
      )}
    </div>
  );
}