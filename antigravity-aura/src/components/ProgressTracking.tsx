import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Smile, Meh, Frown, Calendar, Clock, RefreshCw } from 'lucide-react';
import { loadMoodEntries, loadSessionEntries, getProgressStats } from '../services/emotionTrackingService';

interface ProgressTrackingProps {
  onBack: () => void;
}

interface MoodEntry {
  date: string;
  mood: 'happy' | 'neutral' | 'sad';
  note: string;
}

interface Session {
  date: string;
  duration: string;
  type: string;
}

export function ProgressTracking({ onBack }: ProgressTrackingProps) {
  const [selectedTab, setSelectedTab] = useState<'mood' | 'sessions'>('mood');
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [moodData, setMoodData] = useState<MoodEntry[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ happyDays: 0, neutralDays: 0, totalSessions: 0 });

  // Load real data from Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        console.log('🔄 Loading progress data from Firebase...');
        
        const [moods, sessionData, progressStats] = await Promise.all([
          loadMoodEntries(),
          loadSessionEntries(),
          getProgressStats()
        ]);
        
        console.log(`📊 Loaded ${moods.length} mood entries`, moods);
        console.log(`📊 Loaded ${sessionData.length} sessions`, sessionData);
        console.log('📊 Progress stats:', progressStats);
        
        setMoodData(moods);
        setSessions(sessionData);
        setStats(progressStats);
      } catch (error) {
        console.error('❌ Error loading progress data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Manually refreshing progress data...');
      const [moods, sessionData, progressStats] = await Promise.all([
        loadMoodEntries(),
        loadSessionEntries(),
        getProgressStats()
      ]);
      
      console.log(`📊 Refreshed: ${moods.length} moods, ${sessionData.length} sessions`);
      setMoodData(moods);
      setSessions(sessionData);
      setStats(progressStats);
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMoodIcon = (mood: 'happy' | 'neutral' | 'sad') => {
    switch (mood) {
      case 'happy':
        return <Smile className="w-6 h-6 text-green-500" />;
      case 'neutral':
        return <Meh className="w-6 h-6 text-yellow-500" />;
      case 'sad':
        return <Frown className="w-6 h-6 text-red-500" />;
    }
  };

  const getMoodColor = (mood: 'happy' | 'neutral' | 'sad') => {
    switch (mood) {
      case 'happy':
        return 'bg-green-100';
      case 'neutral':
        return 'bg-yellow-100';
      case 'sad':
        return 'bg-red-100';
    }
  };

  // Calculate mood statistics from real data
  const happyDays = stats.happyDays;
  const neutralDays = stats.neutralDays;
  const sadDays = moodData.filter(m => m.mood === 'sad').length;
  const totalDays = moodData.length || 1; // Avoid division by zero

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
    const minSwipeDistance = 50;
    
    if (isHorizontalSwipe && Math.abs(distanceX) > minSwipeDistance) {
      if (distanceX > 0) {
        // Swiped left - go to sessions
        setSelectedTab('sessions');
      } else {
        // Swiped right - go to mood
        setSelectedTab('mood');
      }
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-700 hover:text-teal-400 transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-teal-400" />
            <h2 className="text-teal-400">Progress Tracking</h2>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-teal-400 text-white rounded-lg hover:bg-teal-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        <p className="text-gray-600">Monitor your wellness journey and mental health progress</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-md">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-100 p-2 rounded-lg">
              <Smile className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-gray-600">Happy Days</p>
              <p className="text-2xl text-gray-800">{happyDays}</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {((happyDays / totalDays) * 100).toFixed(0)}% of tracked days
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Meh className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-gray-600">Neutral Days</p>
              <p className="text-2xl text-gray-800">{neutralDays}</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {((neutralDays / totalDays) * 100).toFixed(0)}% of tracked days
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Clock className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-gray-600">Total Sessions</p>
              <p className="text-2xl text-gray-800">{stats.totalSessions}</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            This month
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div 
        className="bg-white rounded-t-2xl shadow-md"
        onTouchStart={handleTouchStartGesture}
        onTouchMove={handleTouchMoveGesture}
        onTouchEnd={handleTouchEndGesture}
      >
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setSelectedTab('mood')}
            className={`flex-1 py-4 px-6 transition-colors ${
              selectedTab === 'mood'
                ? 'text-teal-400 border-b-2 border-teal-400'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Mood Trends
          </button>
          <button
            onClick={() => setSelectedTab('sessions')}
            className={`flex-1 py-4 px-6 transition-colors ${
              selectedTab === 'sessions'
                ? 'text-teal-400 border-b-2 border-teal-400'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Session History
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400"></div>
            </div>
          ) : selectedTab === 'mood' && (
            <div className="space-y-4">
              <h3 className="text-teal-400 mb-4">Recent Mood Entries</h3>
              {moodData.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="mb-2">No mood entries yet</p>
                  <p className="text-sm">Start chatting with AURA to track your emotional progress</p>
                </div>
              ) : (
                moodData.map((entry, index) => (
                  <div
                    key={index}
                    className={`${getMoodColor(entry.mood)} rounded-xl p-4 transition-all hover:shadow-md`}
                  >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {getMoodIcon(entry.mood)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-700">
                          {new Date(entry.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <p className="text-gray-700">{entry.note}</p>
                    </div>
                  </div>
                </div>
              )))}
            </div>
          )}

          {!isLoading && selectedTab === 'sessions' && (
            <div className="space-y-4">
              <h3 className="text-teal-400 mb-4">Session History</h3>
              {sessions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="mb-2">No sessions recorded yet</p>
                  <p className="text-sm">Your chat sessions will appear here</p>
                </div>
              ) : (
                sessions.map((session, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-xl p-4 transition-all hover:shadow-md hover:bg-gray-100"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-teal-100 p-3 rounded-lg">
                          <Clock className="w-6 h-6 text-teal-400" />
                        </div>
                        <div>
                          <p className="text-gray-800">{session.type}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600 text-sm">
                              {new Date(session.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-teal-400">{session.duration}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Disclaimer */}
      <div className="mt-6 text-center">
        <p className="text-gray-500 text-lg italic">AURA is an AI assistant, not a human counselor</p>
      </div>
    </div>
  );
}