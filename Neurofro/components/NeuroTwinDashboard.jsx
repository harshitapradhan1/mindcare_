"use client";
import { useState, useEffect } from 'react';
import { Brain, TrendingUp, TrendingDown, Activity, Clock, Zap, MessageSquare, Loader2, AlertCircle } from 'lucide-react';

export default function NeuroTwinDashboard({ userId }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use Next.js rewrite proxy to avoid CORS issues
  const API_BASE = typeof window !== 'undefined' ? '/api/backend' : 'http://localhost:5002/api';

  useEffect(() => {
    if (userId && userId.trim() !== '') {
      fetchNeuroTwin();
    } else {
      setLoading(false);
      setProfile(null);
      setError(null);
    }
  }, [userId]);

  const fetchNeuroTwin = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!userId || userId.trim() === '') {
        setProfile(null);
        setError(null);
        setLoading(false);
        return;
      }
      
      // Skip health check - go straight to fetching data
      // The fetch itself will handle connection errors
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const url = `${API_BASE}/neurotwin/${encodeURIComponent(userId)}`;
      console.log('Fetching NeuroTwin from:', url);
      console.log('User ID:', userId);
      console.log('API Base:', API_BASE);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
        signal: controller.signal,
        cache: 'no-cache'
      });
      
      clearTimeout(timeoutId);
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      console.log('Content-Type:', response.headers.get('content-type'));
      
      // Check if response is ok first
      if (!response.ok) {
        // Try to get error message
        let errorText = '';
        let errorData = null;
        try {
          errorText = await response.text();
          console.log('Error response text:', errorText.substring(0, 500));
          
          // Check if it's HTML (error page from Next.js or backend)
          if (errorText.trim().toLowerCase().startsWith('<!doctype') || 
              errorText.trim().toLowerCase().startsWith('<html')) {
            console.error('Received HTML error page:', errorText.substring(0, 500));
            throw new Error(`Server returned HTML error page. Status: ${response.status}. This usually means the backend server is not running or the request format is incorrect.`);
          }
          
          // Try to parse as JSON
          try {
            errorData = JSON.parse(errorText);
          } catch (parseError) {
            // Not JSON, use text as error
            errorData = { error: errorText.substring(0, 200) || `HTTP ${response.status}: ${response.statusText}` };
          }
        } catch (textError) {
          console.error('Failed to read error response:', textError);
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        if (response.status === 404) {
          // Profile doesn't exist yet - this is normal for new users
          setProfile(null);
          setError(null); // Don't treat this as an error
          setLoading(false);
          return;
        }
        
        if (response.status === 400) {
          throw new Error(errorData.error || errorData.message || `Bad Request: ${errorText.substring(0, 200)}`);
        }
        
        // Handle 500 errors specifically
        if (response.status === 500) {
          const errorMsg = errorData?.error || errorData?.message || 'Internal server error occurred';
          console.error('Backend 500 error:', errorMsg);
          throw new Error(`Server error: ${errorMsg}. Please try again later or contact support if the issue persists.`);
        }
        
        throw new Error(errorData?.error || errorData?.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Check content type before parsing
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json') && !contentType.includes('text/json')) {
        const text = await response.text();
        console.error('Non-JSON response received:', text.substring(0, 500));
        throw new Error(`Expected JSON but received ${contentType}. Status: ${response.status}`);
      }
      
      let data;
      try {
        const text = await response.text();
        console.log('Response text:', text.substring(0, 200));
        
        // Check if response is HTML (error page)
        if (text.trim().toLowerCase().startsWith('<!doctype') || text.trim().toLowerCase().startsWith('<html')) {
          console.error('Received HTML instead of JSON:', text.substring(0, 500));
          throw new Error(`Server returned HTML error page. Status: ${response.status}`);
        }
        
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        console.error('Response status:', response.status);
        console.error('Response headers:', Object.fromEntries(response.headers.entries()));
        throw new Error(`Invalid response from server: ${parseError.message}`);
      }
      
      if (data.success) {
        setProfile(data);
      } else {
        setError(data.error || 'Failed to load NeuroTwin profile');
      }
    } catch (err) {
      // Network errors or other issues
      console.error('Error fetching NeuroTwin:', err);
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        userId: userId,
        apiBase: API_BASE,
        url: `${API_BASE}/neurotwin/${encodeURIComponent(userId)}`
      });
      
      if (err.name === 'AbortError' || err.name === 'TimeoutError') {
        setError('Request timed out. Please check if the backend server is running on port 5002.');
      } else if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('ERR_CONNECTION_REFUSED'))) {
        // Retry once if it's a network error
        if (retryCount < 1) {
          console.log('Retrying fetch after network error...');
          setTimeout(() => fetchNeuroTwin(retryCount + 1), 2000);
          return;
        }
        setError('Cannot connect to backend server. The backend should be running on http://localhost:5002. Please check the terminal where you started the backend server.');
      } else if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        // Retry once for TypeError: Failed to fetch
        if (retryCount < 1) {
          console.log('Retrying fetch after TypeError...');
          setTimeout(() => fetchNeuroTwin(retryCount + 1), 2000);
          return;
        }
        setError('Cannot connect to backend server. Please ensure the Flask backend is running. Open a terminal and run: cd neuroback && python3 app.py');
      } else {
        setError(err.message || 'Failed to fetch NeuroTwin profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatMetricValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${(value * 100).toFixed(0)}%`;
  };

  const getMetricColor = (metric) => {
    const colors = {
      attention: 'from-blue-500 to-blue-600',
      memory: 'from-purple-500 to-purple-600',
      speed: 'from-green-500 to-green-600',
      verbal_fluency: 'from-orange-500 to-orange-600'
    };
    return colors[metric] || 'from-gray-500 to-gray-600';
  };

  const getMetricIcon = (metric) => {
    const icons = {
      attention: <Activity className="w-5 h-5" />,
      memory: <Brain className="w-5 h-5" />,
      speed: <Zap className="w-5 h-5" />,
      verbal_fluency: <MessageSquare className="w-5 h-5" />
    };
    return icons[metric] || <Activity className="w-5 h-5" />;
  };

  const getMetricLabel = (metric) => {
    const labels = {
      attention: 'Attention',
      memory: 'Memory',
      speed: 'Processing Speed',
      verbal_fluency: 'Verbal Fluency'
    };
    return labels[metric] || metric;
  };

  const renderChart = (metric) => {
    if (!profile || !profile.predictions) return null;

    const history = profile.history || [];
    const predictions = profile.predictions || {};
    
    // Get historical values
    const historicalData = history.map((entry, idx) => ({
      day: idx + 1,
      value: entry.metrics[metric] || 0
    }));

    // Get predicted values
    const predictedData = Object.keys(predictions).map(day => ({
      day: historicalData.length + parseInt(day),
      value: predictions[day][metric] || 0,
      isPrediction: true
    }));

    const allData = [...historicalData, ...predictedData];
    if (allData.length === 0) return null;

    const maxValue = Math.max(...allData.map(d => d.value), 0.1);
    const minValue = Math.min(...allData.map(d => d.value), 0);
    const range = maxValue - minValue || 1;

    const width = 600;
    const height = 200;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = allData.map((point, idx) => {
      const x = padding + (point.day - 1) * (chartWidth / Math.max(allData.length - 1, 1));
      const y = padding + chartHeight - ((point.value - minValue) / range) * chartHeight;
      return { x, y, ...point };
    });

    // Build path for historical data
    let historicalPath = '';
    if (historicalData.length > 0) {
      historicalPath = points
        .slice(0, historicalData.length)
        .map((point, idx) => `${idx === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ');
    }

    // Build path for predicted data (starting from last historical point)
    let predictedPath = '';
    if (predictedData.length > 0) {
      const predictedPoints = points.slice(historicalData.length);
      if (historicalData.length > 0) {
        const lastHistorical = points[historicalData.length - 1];
        predictedPath = `M ${lastHistorical.x} ${lastHistorical.y} ` + 
          predictedPoints.map((point) => `L ${point.x} ${point.y}`).join(' ');
      } else {
        // If no historical data, just draw predicted path
        predictedPath = predictedPoints
          .map((point, idx) => `${idx === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
          .join(' ');
      }
    }

    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 bg-gradient-to-br ${getMetricColor(metric)} rounded-lg flex items-center justify-center text-white`}>
              {getMetricIcon(metric)}
            </div>
            <h3 className="text-lg font-bold text-gray-900">{getMetricLabel(metric)}</h3>
          </div>
          {profile.current_metrics && (
            <div className="text-right">
              <div className="text-sm text-gray-600">Current</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatMetricValue(profile.current_metrics[metric])}
              </div>
            </div>
          )}
        </div>
        
        <div className="relative">
          <svg width={width} height={height} className="w-full h-auto">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1.0].map((val, idx) => {
              const y = padding + chartHeight - (val * chartHeight);
              return (
                <g key={idx}>
                  <line
                    x1={padding}
                    y1={y}
                    x2={width - padding}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                  <text
                    x={padding - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="text-xs fill-gray-500"
                  >
                    {Math.round(val * 100)}%
                  </text>
                </g>
              );
            })}

            {/* Historical line */}
            {historicalPath && (
              <path
                d={historicalPath}
                fill="none"
                stroke="url(#gradient-historical)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Predicted line (dashed) */}
            {predictedPath && (
              <path
                d={predictedPath}
                fill="none"
                stroke="url(#gradient-predicted)"
                strokeWidth="3"
                strokeDasharray="8,4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data points */}
            {points.map((point, idx) => (
              <circle
                key={idx}
                cx={point.x}
                cy={point.y}
                r={point.isPrediction ? 4 : 5}
                fill={point.isPrediction ? "#f59e0b" : "#3b82f6"}
                stroke="white"
                strokeWidth="2"
              />
            ))}

            {/* Gradient definitions */}
            <defs>
              <linearGradient id="gradient-historical" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
              <linearGradient id="gradient-predicted" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>

            {/* Day labels */}
            {allData.map((point, idx) => {
              if (idx % Math.ceil(allData.length / 7) !== 0 && idx !== allData.length - 1) return null;
              return (
                <text
                  key={idx}
                  x={points[idx].x}
                  y={height - 10}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  Day {point.day}
                </text>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-500"></div>
              <span className="text-xs text-gray-600">Historical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-amber-500 border-dashed border-t-2"></div>
              <span className="text-xs text-gray-600">Predicted (7 days)</span>
            </div>
          </div>
        </div>

        {/* Prediction summary */}
        {predictions && Object.keys(predictions).length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Day 7 Prediction:</span>
              <span className="font-bold text-gray-900">
                {formatMetricValue(predictions[7]?.[metric])}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <span className="ml-3 text-gray-600">Loading your Cognitive Twin...</span>
      </div>
    );
  }

  if (error && error !== 'NeuroTwin profile not found') {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <div>
            <p className="font-semibold text-red-900">Error Loading NeuroTwin</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchNeuroTwin}
          className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!profile || !profile.current_metrics) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-blue-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-10 h-10" />
            <h2 className="text-3xl font-bold">Your Cognitive Twin</h2>
          </div>
          <p className="text-teal-100 text-lg">
            AI-powered predictions of your cognitive health over the next 7 days
          </p>
        </div>

        {/* Empty State */}
        <div className="bg-white border-2 border-teal-200 rounded-xl p-12 text-center shadow-lg">
          <div className="bg-gradient-to-br from-teal-100 to-blue-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <Brain className="w-12 h-12 text-teal-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Create Your Cognitive Twin</h3>
          <p className="text-gray-600 mb-2 max-w-md mx-auto">
            Your NeuroTwin profile will be created automatically when you complete your first cognitive test.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Complete at least one test to start tracking your cognitive metrics and get 7-day predictions.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.href = '/game'}
              className="px-8 py-4 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl hover:shadow-xl transition-all font-semibold text-lg flex items-center justify-center gap-2"
            >
              <Activity className="w-5 h-5" />
              Start Cognitive Test
            </button>
            <button
              onClick={() => window.location.href = '/speech'}
              className="px-8 py-4 bg-white border-2 border-teal-500 text-teal-600 rounded-xl hover:bg-teal-50 transition-all font-semibold text-lg flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-5 h-5" />
              Start Speech Test
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">What you'll get:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left max-w-2xl mx-auto">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Attention</div>
                  <div className="text-xs text-gray-600">Track focus levels</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Memory</div>
                  <div className="text-xs text-gray-600">Monitor recall ability</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Speed</div>
                  <div className="text-xs text-gray-600">Processing velocity</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Verbal Fluency</div>
                  <div className="text-xs text-gray-600">Speech patterns</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const metrics = ['attention', 'memory', 'speed', 'verbal_fluency'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-blue-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Brain className="w-10 h-10" />
              <h2 className="text-3xl font-bold">Your Cognitive Twin</h2>
            </div>
            <p className="text-teal-100 text-lg">
              AI-powered predictions of your cognitive health over the next 7 days
            </p>
          </div>
          {profile.history_count > 0 && (
            <div className="text-right">
              <div className="text-sm text-teal-100 mb-1">Data Points</div>
              <div className="text-4xl font-bold">{profile.history_count}</div>
            </div>
          )}
        </div>
      </div>

      {/* Current Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric}
            className={`bg-gradient-to-br ${getMetricColor(metric)} rounded-xl p-6 text-white shadow-lg`}
          >
            <div className="flex items-center justify-between mb-2">
              {getMetricIcon(metric)}
              <span className="text-sm opacity-90">{getMetricLabel(metric)}</span>
            </div>
            <div className="text-3xl font-bold">
              {formatMetricValue(profile.current_metrics[metric])}
            </div>
          </div>
        ))}
      </div>

      {/* Prediction Charts */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-teal-600" />
          <h3 className="text-2xl font-bold text-gray-900">7-Day Predictions</h3>
        </div>
        {metrics.map((metric) => (
          <div key={metric}>{renderChart(metric)}</div>
        ))}
      </div>

      {/* Test History Section */}
      {profile.history && profile.history.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-teal-600" />
              <h3 className="text-2xl font-bold text-gray-900">Test History</h3>
            </div>
            <div className="text-sm text-gray-600">
              {profile.history.length} test{profile.history.length !== 1 ? 's' : ''} recorded
            </div>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {profile.history.slice().reverse().map((entry, idx) => {
              const testType = entry.test_results?.test_type || 'unknown';
              const timestamp = new Date(entry.timestamp);
              return (
                <div key={idx} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-teal-100 text-teal-700 px-3 py-1 rounded-lg text-sm font-semibold capitalize">
                        {testType.replace('-', ' ')}
                      </div>
                      <span className="text-sm text-gray-600">
                        {timestamp.toLocaleDateString()} {timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    {Object.entries(entry.metrics || {}).map(([key, value]) => (
                      <div key={key} className="bg-white rounded-lg p-2">
                        <div className="text-xs text-gray-600 mb-1 capitalize">{key.replace('_', ' ')}</div>
                        <div className="text-lg font-bold text-gray-900">{formatMetricValue(value)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Insights Section */}
      {profile.insights && profile.insights.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="w-6 h-6 text-teal-600" />
            <h3 className="text-2xl font-bold text-gray-900">Performance Insights</h3>
          </div>
          <div className="space-y-4">
            {profile.insights.map((insight, idx) => (
              <div
                key={idx}
                className={`rounded-xl p-4 border-2 ${
                  insight.type === 'positive'
                    ? 'bg-green-50 border-green-200'
                    : insight.type === 'warning'
                    ? 'bg-yellow-50 border-yellow-200'
                    : insight.type === 'attention'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="font-semibold text-gray-900 mb-1">{insight.message}</div>
                <div className="text-sm text-gray-700">{insight.recommendation}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Types Distribution */}
      {profile.test_types && Object.keys(profile.test_types).length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-6 h-6 text-teal-600" />
            <h3 className="text-2xl font-bold text-gray-900">Test Distribution</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(profile.test_types).map(([testType, count]) => (
              <div key={testType} className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-4 border border-teal-200">
                <div className="text-sm text-gray-600 mb-1 capitalize">{testType.replace('-', ' ')}</div>
                <div className="text-3xl font-bold text-teal-600">{count}</div>
                <div className="text-xs text-gray-500">test{count !== 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={fetchNeuroTwin}
          className="px-6 py-3 bg-white border-2 border-teal-500 text-teal-600 rounded-xl hover:bg-teal-50 transition-all font-semibold flex items-center gap-2"
        >
          <Clock className="w-5 h-5" />
          Refresh Data
        </button>
      </div>
    </div>
  );
}

