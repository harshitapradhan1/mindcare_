"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

const TEST_NAMES = {
  'quick-check': 'Quick Cognitive Check',
  'n-back': 'N-Back',
  'stroop': 'Stroop Test',
  'trail-making': 'Trail Making',
  'digit-span': 'Digit Span',
  'memory-match': 'Memory Match',
  'reaction-time': 'Reaction Time',
  'flanker-task': 'Flanker Task',
  'visual-search': 'Visual Search',
  'dual-task': 'Dual Task',
  'go-no-go': 'Go/No-Go',
  'symbol-digit': 'Symbol-Digit',
  'speech': 'Speech Analysis',
  'facial': 'Facial Analysis'
};

const getTestIcon = (testType) => {
  const icons = {
    'quick-check': '⚡',
    'n-back': '🧠',
    'stroop': '⚡',
    'trail-making': '🔄',
    'digit-span': '🔢',
    'memory-match': '🎯',
    'reaction-time': '⏱️',
    'flanker-task': '↔️',
    'visual-search': '👁️',
    'dual-task': '🎪',
    'go-no-go': '✋',
    'symbol-digit': '🔤',
    'speech': '🎤',
    'facial': '📷'
  };
  return icons[testType] || '📊';
};

const getScoreColor = (score, testType) => {
  if (testType === 'speech' || testType === 'facial') {
    // For risk-based tests
    if (score === 'Normal' || score === 'Low') return 'text-green-600 bg-green-50';
    if (score === 'At Risk' || score === 'Medium') return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  }
  
  // For percentage-based tests
  if (score >= 80) return 'text-green-600 bg-green-50';
  if (score >= 60) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
};

const formatScore = (testResult, testType) => {
  if (testType === 'speech') {
    return testResult.label || 'Unknown';
  }
  if (testType === 'facial') {
    return testResult.risk || 'Unknown';
  }
  if (testResult.accuracy !== undefined) {
    return `${Math.round(testResult.accuracy * 100)}%`;
  }
  if (testResult.score !== undefined) {
    return testResult.score;
  }
  return 'N/A';
};

export default function TestResultsAnalysis({ userId }) {
  const [testHistory, setTestHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!userId) return;
    
    const fetchTestHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const API_BASE = typeof window !== 'undefined' ? '/api/backend' : 'http://localhost:5002/api';
        
        // Fetch NeuroTwin profile which contains test history
        const response = await fetch(`${API_BASE}/neurotwin/${userId}`);
        
        // Handle 404 - user doesn't have a profile yet (normal for new users)
        if (response.status === 404) {
          const data = await response.json().catch(() => ({}));
          if (data.error === 'NeuroTwin profile not found' || !response.ok) {
            // This is normal for new users - show empty state
            setTestHistory([]);
            setSummary({ totalTests: 0, testCounts: {}, latestTests: {}, metrics: {} });
            setLoading(false);
            return;
          }
        }
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Failed to fetch test history');
          throw new Error(errorText || 'Failed to fetch test history');
        }
        
        const data = await response.json();
        
        // Check if response indicates no profile
        if (data.success === false && data.error === 'NeuroTwin profile not found') {
          setTestHistory([]);
          setSummary({ totalTests: 0, testCounts: {}, latestTests: {}, metrics: {} });
          setLoading(false);
          return;
        }
        
        if (data.history && Array.isArray(data.history)) {
          // Extract test results from history
          const tests = data.history
            .filter(entry => entry.test_results)
            .map(entry => ({
              ...entry.test_results,
              timestamp: entry.timestamp,
              metrics: entry.metrics || {}
            }))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          
          setTestHistory(tests);
          
          // Calculate summary
          const testCounts = {};
          const latestTests = {};
          
          tests.forEach(test => {
            const type = test.test_type;
            testCounts[type] = (testCounts[type] || 0) + 1;
            if (!latestTests[type] || new Date(test.timestamp) > new Date(latestTests[type].timestamp)) {
              latestTests[type] = test;
            }
          });
          
          setSummary({
            totalTests: tests.length,
            testCounts,
            latestTests,
            metrics: data.current_metrics || data.aggregate_metrics || {}
          });
        } else {
          setTestHistory([]);
          setSummary({ totalTests: 0, testCounts: {}, latestTests: {}, metrics: {} });
        }
      } catch (err) {
        console.error('Error fetching test history:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTestHistory();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-lg border border-red-200">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading test results: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-6 shadow-lg border border-teal-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Test Results Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-3xl font-bold text-teal-600">{summary?.totalTests || 0}</div>
            <div className="text-sm text-gray-600">Total Tests</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-3xl font-bold text-blue-600">{Object.keys(summary?.testCounts || {}).length}</div>
            <div className="text-sm text-gray-600">Test Types</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-3xl font-bold text-purple-600">
              {summary?.metrics?.memory ? `${Math.round(summary.metrics.memory * 100)}%` : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Memory Score</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-3xl font-bold text-green-600">
              {summary?.metrics?.attention ? `${Math.round(summary.metrics.attention * 100)}%` : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Attention Score</div>
          </div>
        </div>
      </div>

      {/* Cognitive Metrics */}
      {summary?.metrics && Object.keys(summary.metrics).length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Cognitive Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(summary.metrics).map(([key, value]) => (
              <div key={key} className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 capitalize mb-1">{key.replace('_', ' ')}</div>
                <div className="text-2xl font-bold text-teal-600">{Math.round(value * 100)}%</div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-teal-500 to-blue-600 rounded-full"
                    style={{ width: `${Math.min(value * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Latest Test Results */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Latest Test Results</h3>
        {!summary || Object.keys(summary?.latestTests || {}).length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-600 text-lg mb-2">No test results yet</p>
            <p className="text-gray-500 text-sm mb-4">Take a cognitive test to see your results and analysis here!</p>
            <Link 
              href="/tests" 
              className="inline-block px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-lg hover:from-teal-600 hover:to-blue-700 transition-all font-semibold shadow-md hover:shadow-lg"
            >
              Take a Test
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(summary.latestTests).map(([testType, test]) => (
              <div 
                key={testType} 
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getTestIcon(testType)}</span>
                    <h4 className="font-bold text-gray-900">{TEST_NAMES[testType] || testType}</h4>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(
                    testType === 'speech' || testType === 'facial' 
                      ? (test.label || test.risk || 'Unknown')
                      : (test.accuracy ? test.accuracy * 100 : 0),
                    testType
                  )}`}>
                    {formatScore(test, testType)}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  {test.accuracy !== undefined && (
                    <div>Accuracy: <span className="font-semibold">{Math.round(test.accuracy * 100)}%</span></div>
                  )}
                  {test.reaction_time !== undefined && (
                    <div>Reaction Time: <span className="font-semibold">{(test.reaction_time * 1000).toFixed(0)}ms</span></div>
                  )}
                  {test.score !== undefined && (
                    <div>Score: <span className="font-semibold">{test.score}</span></div>
                  )}
                  {test.confidence !== undefined && (
                    <div>Confidence: <span className="font-semibold">{Math.round(test.confidence * 100)}%</span></div>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(test.timestamp).toLocaleDateString()} {new Date(test.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Test History Timeline */}
      {testHistory.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Test History</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {testHistory.slice(0, 20).map((test, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{getTestIcon(test.test_type)}</span>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {TEST_NAMES[test.test_type] || test.test_type}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(test.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold inline-block ${getScoreColor(
                    test.test_type === 'speech' || test.test_type === 'facial' 
                      ? (test.label || test.risk || 'Unknown')
                      : (test.accuracy ? test.accuracy * 100 : 0),
                    test.test_type
                  )}`}>
                    {formatScore(test, test.test_type)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

