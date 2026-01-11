import { loadMoodEntries, loadSessionEntries } from './emotionTrackingService';
import { loadChatHistory } from './chatHistoryService';

export interface WellnessMetrics {
  overallProgress: number; // Percentage change from last month
  wellnessScore: number; // Score out of 10
  activeDays: number; // Days with activity this month
  totalDaysInMonth: number; // Total days in current month
  averageSentiment: number; // Average sentiment score
  moodDistribution: {
    happy: number;
    neutral: number;
    sad: number;
  };
  monthlyComparison: {
    currentMonth: {
      avgSentiment: number;
      sessionCount: number;
      moodCount: number;
    };
    lastMonth: {
      avgSentiment: number;
      sessionCount: number;
      moodCount: number;
    };
  };
}

/**
 * Calculate wellness metrics from user data
 */
export async function calculateWellnessMetrics(): Promise<WellnessMetrics> {
  try {
    console.log('📊 Calculating wellness metrics...');

    // Load all data
    const [moodEntries, sessions, chatHistory] = await Promise.all([
      loadMoodEntries(100),
      loadSessionEntries(100),
      loadChatHistory()
    ]);

    console.log(`📊 Data loaded: ${moodEntries.length} moods, ${sessions.length} sessions, ${chatHistory.length} messages`);

    // Get current date info
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Split data by current month vs last month
    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const lastMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    // Filter current month data
    const currentMonthMoods = moodEntries.filter(m => 
      m.timestamp >= currentMonthStart
    );
    const currentMonthSessions = sessions.filter(s => 
      s.timestamp >= currentMonthStart
    );

    // Filter last month data
    const lastMonthMoods = moodEntries.filter(m => 
      m.timestamp >= lastMonthStart && m.timestamp <= lastMonthEnd
    );
    const lastMonthSessions = sessions.filter(s => 
      s.timestamp >= lastMonthStart && s.timestamp <= lastMonthEnd
    );

    // Calculate mood distribution
    const moodDistribution = {
      happy: currentMonthMoods.filter(m => m.mood === 'happy').length,
      neutral: currentMonthMoods.filter(m => m.mood === 'neutral').length,
      sad: currentMonthMoods.filter(m => m.mood === 'sad').length
    };

    // Calculate average sentiment for current month
    const currentAvgSentiment = currentMonthMoods.length > 0
      ? currentMonthMoods.reduce((sum, m) => sum + m.sentiment, 0) / currentMonthMoods.length
      : 0;

    // Calculate average sentiment for last month
    const lastAvgSentiment = lastMonthMoods.length > 0
      ? lastMonthMoods.reduce((sum, m) => sum + m.sentiment, 0) / lastMonthMoods.length
      : 0;

    // Calculate wellness score (0-10 scale)
    // Based on: sentiment (40%), mood distribution (30%), activity (30%)
    const sentimentScore = ((currentAvgSentiment + 1) / 2) * 4; // 0-4 points
    const moodScore = (moodDistribution.happy / (currentMonthMoods.length || 1)) * 3; // 0-3 points
    const activityScore = Math.min((currentMonthSessions.length / 10) * 3, 3); // 0-3 points (max at 10 sessions)
    const wellnessScore = Math.min(sentimentScore + moodScore + activityScore, 10);

    // Calculate overall progress (percentage change from last month)
    let overallProgress = 0;
    if (lastAvgSentiment !== 0) {
      overallProgress = ((currentAvgSentiment - lastAvgSentiment) / Math.abs(lastAvgSentiment)) * 100;
    } else if (currentAvgSentiment > 0) {
      overallProgress = 100; // If no previous data, show 100% if current is positive
    }

    // Calculate active days (unique days with any activity)
    const activeDaysSet = new Set<string>();
    
    currentMonthMoods.forEach(m => {
      activeDaysSet.add(m.date);
    });
    
    currentMonthSessions.forEach(s => {
      activeDaysSet.add(s.date);
    });

    // Also count days with chat messages
    chatHistory.forEach(msg => {
      const msgDate = msg.timestamp.toISOString().split('T')[0];
      const msgTimestamp = new Date(msgDate);
      if (msgTimestamp >= currentMonthStart) {
        activeDaysSet.add(msgDate);
      }
    });

    const activeDays = activeDaysSet.size;

    const metrics: WellnessMetrics = {
      overallProgress: Math.round(overallProgress),
      wellnessScore: Math.round(wellnessScore * 10) / 10, // Round to 1 decimal
      activeDays,
      totalDaysInMonth,
      averageSentiment: Math.round(currentAvgSentiment * 100) / 100,
      moodDistribution,
      monthlyComparison: {
        currentMonth: {
          avgSentiment: Math.round(currentAvgSentiment * 100) / 100,
          sessionCount: currentMonthSessions.length,
          moodCount: currentMonthMoods.length
        },
        lastMonth: {
          avgSentiment: Math.round(lastAvgSentiment * 100) / 100,
          sessionCount: lastMonthSessions.length,
          moodCount: lastMonthMoods.length
        }
      }
    };

    console.log('✅ Wellness metrics calculated:', metrics);
    return metrics;

  } catch (error) {
    console.error('❌ Error calculating wellness metrics:', error);
    
    // Return default metrics on error
    return {
      overallProgress: 0,
      wellnessScore: 5.0,
      activeDays: 0,
      totalDaysInMonth: 30,
      averageSentiment: 0,
      moodDistribution: { happy: 0, neutral: 0, sad: 0 },
      monthlyComparison: {
        currentMonth: { avgSentiment: 0, sessionCount: 0, moodCount: 0 },
        lastMonth: { avgSentiment: 0, sessionCount: 0, moodCount: 0 }
      }
    };
  }
}

/**
 * Get wellness score description
 */
export function getWellnessDescription(score: number): string {
  if (score >= 8) return 'Excellent';
  if (score >= 7) return 'Above average';
  if (score >= 5) return 'Average';
  if (score >= 3) return 'Below average';
  return 'Needs attention';
}

/**
 * Get progress trend description
 */
export function getProgressTrend(progress: number): string {
  if (progress > 20) return 'Significant improvement';
  if (progress > 5) return 'Improving steadily';
  if (progress >= -5) return 'Stable';
  if (progress >= -20) return 'Slight decline';
  return 'Needs support';
}
