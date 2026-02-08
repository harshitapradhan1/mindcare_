"use client";
import { useState, useEffect } from 'react';
import { Trophy, TrendingDown, TrendingUp, RefreshCw, Award, Users, Brain } from 'lucide-react';

export default function NeuroAgeCard({ userId, baseAge = 30, region = 'global' }) {
  const [neuroAge, setNeuroAge] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = 'http://localhost:5002/api';

  useEffect(() => {
    if (userId) {
      calculateNeuroAge();
    }
  }, [userId]);

  const calculateNeuroAge = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/neuroage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          base_age: baseAge,
          region: region
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setNeuroAge(data);
      } else {
        setError(data.error || 'Failed to calculate NeuroAge');
      }
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('ERR_CONNECTION_REFUSED')) {
        setError('Backend server not available. Please ensure the server is running on port 5002.');
      } else {
      setError(err.message || 'Failed to calculate NeuroAge');
      }
      // Don't show error UI, just return null to hide component
      setNeuroAge(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-teal-600"></div>
        </div>
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

  if (!neuroAge) {
    return null;
  }

  const ageDiff = neuroAge.cognitive_age - baseAge;
  const isBetter = ageDiff < 0;

  return (
    <div className="bg-gradient-to-br from-teal-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold mb-2">Your NeuroAge</h3>
          <p className="text-teal-100">Cognitive performance age</p>
        </div>
        <div className="bg-white/20 rounded-full p-4">
          <Brain className="w-8 h-8" />
        </div>
      </div>

      <div className="bg-white/10 rounded-xl p-6 mb-6 backdrop-blur-sm">
        <div className="flex items-end justify-center gap-2 mb-4">
          <div className="text-6xl font-bold">{neuroAge.cognitive_age.toFixed(1)}</div>
          <div className="text-2xl text-teal-100 mb-2">years</div>
        </div>
        
        <div className="flex items-center justify-center gap-2">
          {isBetter ? (
            <>
              <TrendingDown className="w-5 h-5 text-green-300" />
              <span className="text-green-300 font-semibold">
                {Math.abs(ageDiff).toFixed(1)} years younger than your age!
              </span>
            </>
          ) : (
            <>
              <TrendingUp className="w-5 h-5 text-yellow-300" />
              <span className="text-yellow-300 font-semibold">
                {ageDiff.toFixed(1)} years older than your age
              </span>
            </>
          )}
        </div>
      </div>

      {/* Rank Display */}
      <div className="bg-white/10 rounded-xl p-4 mb-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-300" />
            <div>
              <p className="text-sm text-teal-100">Rank</p>
              <p className="text-2xl font-bold">#{neuroAge.rank || 'N/A'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-teal-100">Out of</p>
            <p className="text-xl font-bold">{neuroAge.total_peers || 0}</p>
            <p className="text-xs text-teal-200">peers</p>
          </div>
        </div>
      </div>

      {/* Performance Score */}
      <div className="bg-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-teal-100">Performance Score</span>
          <span className="text-2xl font-bold">{neuroAge.performance_score.toFixed(0)}/100</span>
        </div>
        <div className="mt-2 bg-white/20 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-white h-full rounded-full transition-all"
            style={{ width: `${neuroAge.performance_score}%` }}
          />
        </div>
      </div>

      {/* Retake Test Button */}
      <button
        onClick={calculateNeuroAge}
        className="w-full bg-white text-teal-600 rounded-xl py-4 font-bold hover:bg-teal-50 transition-all flex items-center justify-center gap-2 shadow-lg"
      >
        <RefreshCw className="w-5 h-5" />
        Retake Test to Improve Score
      </button>
    </div>
  );
}

