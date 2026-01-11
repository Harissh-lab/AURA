import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Download, TrendingUp, Activity, Heart, Brain, RefreshCw } from 'lucide-react';
import { calculateWellnessMetrics, getWellnessDescription, getProgressTrend, type WellnessMetrics } from '../services/analyticsService';

interface ReportsProps {
  onBack: () => void;
}

export function Reports({ onBack }: ReportsProps) {
  const [metrics, setMetrics] = useState<WellnessMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      const data = await calculateWellnessMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Error loading wellness metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const reports = [
    {
      id: 1,
      title: 'Monthly Wellness Summary',
      date: 'December 2024',
      type: 'Monthly Report',
      icon: TrendingUp,
      color: 'bg-blue-100 text-blue-500',
    },
    {
      id: 2,
      title: 'Anxiety & Stress Analysis',
      date: 'Last 30 Days',
      type: 'Detailed Analysis',
      icon: Activity,
      color: 'bg-purple-100 text-purple-500',
    },
    {
      id: 3,
      title: 'Mood Patterns Report',
      date: 'Last 3 Months',
      type: 'Trend Analysis',
      icon: Heart,
      color: 'bg-pink-100 text-pink-500',
    },
    {
      id: 4,
      title: 'Therapy Session Insights',
      date: 'November 2024',
      type: 'Session Summary',
      icon: Brain,
      color: 'bg-teal-100 text-teal-500',
    }
  ];

  const handleDownload = (reportTitle: string) => {
    console.log(`Downloading report: ${reportTitle}`);
    alert(`Report "${reportTitle}" downloaded successfully!`);
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
            <FileText className="w-8 h-8 text-teal-400" />
            <h2 className="text-teal-400">Mental Health Reports</h2>
          </div>
          <button
            onClick={loadMetrics}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-teal-400 text-white rounded-lg hover:bg-teal-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        <p className="text-gray-600">Access detailed reports and insights about your mental health journey</p>
      </div>

      {/* Key Metrics */}
      {isLoading ? (
        <div className="bg-white rounded-xl p-8 shadow-md mb-6 text-center">
          <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading metrics...</p>
        </div>
      ) : metrics ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="text-gray-600 mb-1">Overall Progress</div>
            <div className={`text-2xl mb-2 ${
              metrics.overallProgress > 0 ? 'text-green-500' : 
              metrics.overallProgress < 0 ? 'text-red-500' : 
              'text-gray-500'
            }`}>
              {metrics.overallProgress > 0 ? '+' : ''}{metrics.overallProgress}%
            </div>
            <div className="text-sm text-gray-500">{getProgressTrend(metrics.overallProgress)}</div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="text-gray-600 mb-1">Wellness Score</div>
            <div className="text-2xl text-teal-400 mb-2">{metrics.wellnessScore}/10</div>
            <div className="text-sm text-gray-500">{getWellnessDescription(metrics.wellnessScore)}</div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="text-gray-600 mb-1">Active Days</div>
            <div className="text-2xl text-teal-400 mb-2">{metrics.activeDays}/{metrics.totalDaysInMonth}</div>
            <div className="text-sm text-gray-500">This month</div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 shadow-md mb-6 text-center">
          <p className="text-gray-600">No data available. Start chatting to generate metrics!</p>
        </div>
      )}

      {/* Reports List */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-teal-400 mb-6">Available Reports</h3>
        
        <div className="space-y-4">
          {reports.map((report) => {
            const IconComponent = report.icon;
            return (
              <div
                key={report.id}
                className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all flex flex-col"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`${report.color} p-3 rounded-lg flex-shrink-0`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-gray-800 mb-1">{report.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="bg-gray-100 px-2 py-1 rounded">{report.type}</span>
                      <span>•</span>
                      <span>{report.date}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleDownload(report.title)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-400 text-white rounded-lg hover:bg-teal-500 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            );
          })}
        </div>

        {/* Privacy Notice */}
        <div className="mt-8 bg-teal-50 border border-teal-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-teal-900 mb-1">Report Privacy</h4>
              <p className="text-teal-800 text-sm">
                All reports are generated from your encrypted data and are stored securely. 
                You can download or delete them at any time. Your mental health information 
                is never shared with third parties without your explicit consent.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Disclaimer */}
      <div className="mt-6 text-center">
        <p className="text-gray-500 text-lg italic">AURA is an AI assistant, not a human counselor</p>
      </div>
    </div>
  );
}