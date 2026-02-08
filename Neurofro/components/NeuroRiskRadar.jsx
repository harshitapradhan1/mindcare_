"use client";
import { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { AlertTriangle, CheckCircle, TrendingUp, Activity } from 'lucide-react';

export default function NeuroRiskRadar({ userId }) {
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = 'http://localhost:5002/api';

  useEffect(() => {
    if (userId) {
      analyzeRisk();
    }
  }, [userId]);

  const analyzeRisk = async () => {
    setLoading(true);
    setError(null);

    try {
      // Mock speech and eye movement data (in production, collect from actual tests)
      const mockData = {
        user_id: userId,
        speech_features: {
          latency: Math.random() * 0.8,
          pause_frequency: Math.random() * 0.6,
          tremor: Math.random() * 0.4
        },
        eye_movement: {
          x_variance: Math.random() * 0.5,
          y_variance: Math.random() * 0.5
        }
      };

      const response = await fetch(`${API_BASE}/risk/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setRiskData(data);
      } else {
        setError(data.error || 'Risk analysis failed');
      }
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('ERR_CONNECTION_REFUSED')) {
        // Silently fail - don't show error for connection issues
        setRiskData(null);
        setError(null);
      } else {
        setError(err.message || 'Failed to analyze risk');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!riskData) {
    return null;
  }

  // Format data for radar chart
  const radarData = [
    { 
      category: 'Speech\nLatency', 
      value: riskData.risk_score * 100,
      fullMark: 100 
    },
    { 
      category: 'Pause\nFrequency', 
      value: riskData.risk_score * 100,
      fullMark: 100 
    },
    { 
      category: 'Tremor', 
      value: riskData.risk_score * 100,
      fullMark: 100 
    },
    { 
      category: 'Eye\nMovement', 
      value: riskData.risk_score * 100,
      fullMark: 100 
    },
    { 
      category: 'Overall\nRisk', 
      value: riskData.risk_score * 100,
      fullMark: 100 
    }
  ];

  const riskLevel = riskData.risk_level;
  const riskColor = riskLevel === 'High' ? 'red' : riskLevel === 'Medium' ? 'yellow' : 'green';

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">NeuroRisk Level</h3>
          <p className="text-gray-600">MCI risk assessment</p>
        </div>
        <div className={`px-4 py-2 rounded-xl font-bold text-white ${
          riskLevel === 'High' ? 'bg-red-500' :
          riskLevel === 'Medium' ? 'bg-yellow-500' :
          'bg-green-500'
        }`}>
          {riskLevel} Risk
        </div>
      </div>

      {/* Radar Chart */}
      <div className="mb-6">
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis 
              dataKey="category" 
              tick={{ fill: '#6b7280', fontSize: 11 }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]}
              tick={{ fill: '#6b7280', fontSize: 10 }}
            />
            <Radar
              name="Risk"
              dataKey="value"
              stroke={riskColor === 'red' ? '#ef4444' : riskColor === 'yellow' ? '#eab308' : '#22c55e'}
              fill={riskColor === 'red' ? '#ef4444' : riskColor === 'yellow' ? '#eab308' : '#22c55e'}
              fillOpacity={0.6}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Risk Score */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-semibold">Risk Score</span>
          <span className="text-3xl font-bold text-gray-900">
            {(riskData.risk_score * 100).toFixed(1)}%
          </span>
        </div>
        <div className="mt-2 bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              riskColor === 'red' ? 'bg-red-500' :
              riskColor === 'yellow' ? 'bg-yellow-500' :
              'bg-green-500'
            }`}
            style={{ width: `${riskData.risk_score * 100}%` }}
          />
        </div>
      </div>

      {/* Actionable Insights */}
      {riskData.insights && riskData.insights.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            Actionable Insights
          </h4>
          {riskData.insights.map((insight, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border-2 ${
                riskLevel === 'High' ? 'bg-red-50 border-red-200' :
                riskLevel === 'Medium' ? 'bg-yellow-50 border-yellow-200' :
                'bg-green-50 border-green-200'
              }`}
            >
              <p className="text-sm text-gray-800">{insight}</p>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={analyzeRisk}
        className="mt-4 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all"
      >
        Refresh Analysis
      </button>
    </div>
  );
}


