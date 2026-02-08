"use client";
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp, AlertCircle, Activity, Brain, Zap } from 'lucide-react';

export default function NeuroDriftDashboard({ userId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = 'http://localhost:5002/api';

  useEffect(() => {
    if (userId) {
      fetchNeuroDrift();
    }
  }, [userId]);

  const fetchNeuroDrift = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/neurodrift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          days: 7
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'Failed to load NeuroDrift data');
      }
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('ERR_CONNECTION_REFUSED')) {
        // Silently fail - don't show error for connection issues
        setData(null);
        setError(null);
      } else {
      setError(err.message || 'Failed to fetch NeuroDrift data');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-teal-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <div>
            <p className="font-semibold text-red-900">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.daily_metrics) {
    return (
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-8 text-center">
        <p className="text-gray-600">Complete more tests to see your Brain Stability Index</p>
      </div>
    );
  }

  // Format data for Recharts
  const chartData = data.daily_metrics.map((day, idx) => ({
    day: `Day ${idx + 1}`,
    focus: Math.round(day.focus),
    mood: Math.round(day.mood),
    alertness: Math.round(day.alertness)
  }));

  const stabilityChange = data.stability_change || 0;
  const showAlert = data.alert && data.alert.show;

  return (
    <div className="space-y-6">
      {/* Header with Stability Index */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Brain Stability Index</h2>
            <p className="text-purple-100">Tracking your cognitive consistency</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">{Math.round(data.stability_index)}</div>
            <div className="text-sm text-purple-100">out of 100</div>
            {stabilityChange !== 0 && (
              <div className={`flex items-center gap-1 mt-2 ${stabilityChange > 0 ? 'text-green-200' : 'text-red-200'}`}>
                {stabilityChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="text-sm font-semibold">
                  {stabilityChange > 0 ? '+' : ''}{stabilityChange.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Alert Tip */}
      {showAlert && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 shadow-lg animate-pulse">
          <div className="flex items-start gap-4">
            <div className="bg-red-500 rounded-full p-2">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-red-900 mb-1">Stability Alert</h3>
              <p className="text-red-700">{data.alert.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-6">7-Day Cognitive Metrics</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="day" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              domain={[0, 100]}
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="focus" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 5 }}
              name="Focus"
            />
            <Line 
              type="monotone" 
              dataKey="mood" 
              stroke="#8b5cf6" 
              strokeWidth={3}
              dot={{ fill: '#8b5cf6', r: 5 }}
              name="Mood"
            />
            <Line 
              type="monotone" 
              dataKey="alertness" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ fill: '#10b981', r: 5 }}
              name="Alertness"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-6 h-6 text-blue-600" />
            <span className="font-semibold text-gray-900">Focus</span>
          </div>
          <div className="text-3xl font-bold text-blue-700">
            {Math.round(data.daily_metrics[data.daily_metrics.length - 1]?.focus || 0)}%
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-6 h-6 text-purple-600" />
            <span className="font-semibold text-gray-900">Mood</span>
          </div>
          <div className="text-3xl font-bold text-purple-700">
            {Math.round(data.daily_metrics[data.daily_metrics.length - 1]?.mood || 0)}%
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-6 h-6 text-green-600" />
            <span className="font-semibold text-gray-900">Alertness</span>
          </div>
          <div className="text-3xl font-bold text-green-700">
            {Math.round(data.daily_metrics[data.daily_metrics.length - 1]?.alertness || 0)}%
          </div>
        </div>
      </div>
    </div>
  );
}


