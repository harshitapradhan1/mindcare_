"use client";
import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, CheckCircle, AlertCircle, Loader, Info, TrendingUp, Activity, Brain, Shield } from 'lucide-react';
import TestResultNavigation from '@/components/TestResultNavigation';

export default function FaceAnalysis() {
  const [analysisMode, setAnalysisMode] = useState('upload');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  const API_BASE = 'http://localhost:5002/api';

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      setError('Unable to access webcam. Please check permissions.');
      console.error('Webcam error:', err);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleModeChange = (mode) => {
    setAnalysisMode(mode);
    setResult(null);
    setError(null);
    setImagePreview(null);
    
    if (mode === 'webcam') {
      startWebcam();
    } else {
      stopWebcam();
    }
  };

  const simulateProgress = async () => {
    const steps = [
      { progress: 20, message: 'Initializing neural networks...' },
      { progress: 40, message: 'Processing image data...' },
      { progress: 70, message: 'Analyzing facial geometry...' },
      { progress: 90, message: 'Computing advanced metrics...' },
      { progress: 100, message: 'Finalizing analysis...' }
    ];

    for (const step of steps) {
      setProgress(step.progress);
      setProgressMessage(step.message);
      await new Promise(resolve => setTimeout(resolve, 600));
    }
  };

  const captureFromWebcam = () => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    return canvas.toDataURL('image/jpeg');
  };

  const analyzeImage = async (imageData) => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setProgress(0);

    try {
      await simulateProgress();

      const response = await fetch(`${API_BASE}/predict-facial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setResult(data);
      
      // Update NeuroTwin with facial analysis results
      if (data.success && data.risk) {
        const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : 'demo-user-123';
        const API_BASE = typeof window !== 'undefined' ? '/api/backend' : 'http://localhost:5002/api';
        try {
          await fetch(`${API_BASE}/neurotwin/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              test_results: {
                test_type: 'facial',
                risk: data.risk,
                confidence: data.confidence || 0.5,
                features: data.features || {}
              }
            })
          });
        } catch (neurotwinError) {
          console.error('Error updating NeuroTwin:', neurotwinError);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze image');
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
      setProgressMessage('');
    }
  };

  const handleWebcamCapture = async () => {
    const imageData = captureFromWebcam();
    if (imageData) {
      setImagePreview(imageData);
      await analyzeImage(imageData);
    } else {
      setError('Failed to capture image from webcam');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result;
      setImagePreview(imageData);
      await analyzeImage(imageData);
    };
    reader.readAsDataURL(file);
  };

  const getRiskColor = (risk) => {
    const riskLower = risk?.toLowerCase() || '';
    if (riskLower === 'low') return 'text-green-700 bg-green-50 border-green-200';
    if (riskLower === 'medium') return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    if (riskLower === 'high') return 'text-red-700 bg-red-50 border-red-200';
    return 'text-gray-700 bg-gray-50 border-gray-200';
  };

  const getRiskIcon = (risk) => {
    const riskLower = risk?.toLowerCase() || '';
    if (riskLower === 'low') return <CheckCircle className="w-8 h-8 text-green-600" />;
    if (riskLower === 'medium') return <AlertCircle className="w-8 h-8 text-yellow-600" />;
    if (riskLower === 'high') return <AlertCircle className="w-8 h-8 text-red-600" />;
    return <Activity className="w-8 h-8 text-gray-600" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
              AI-Powered Facial Analysis
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Advanced{' '}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Cognitive Analysis
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Using computer vision and AI to analyze facial features for cognitive health assessment
          </p>
        </div>

        {/* Mode Selection */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Activity className="w-6 h-6 text-purple-600" />
            Choose Analysis Method
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => handleModeChange('webcam')}
              className={`group p-6 rounded-xl border-2 transition-all ${
                analysisMode === 'webcam'
                  ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-md'
                  : 'border-gray-200 hover:border-purple-300 hover:shadow-md bg-white'
              }`}
            >
              <div className={`w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center ${
                analysisMode === 'webcam'
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                  : 'bg-gray-100 group-hover:bg-gradient-to-br group-hover:from-purple-500 group-hover:to-pink-500'
              } transition-all`}>
                <Camera className={`w-7 h-7 ${analysisMode === 'webcam' ? 'text-white' : 'text-gray-600 group-hover:text-white'}`} />
              </div>
              <div className="font-semibold text-lg text-gray-900 mb-1">Live Webcam</div>
              <div className="text-sm text-gray-600">Real-time facial capture and analysis</div>
            </button>
            
            <button
              onClick={() => handleModeChange('upload')}
              className={`group p-6 rounded-xl border-2 transition-all ${
                analysisMode === 'upload'
                  ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-md'
                  : 'border-gray-200 hover:border-purple-300 hover:shadow-md bg-white'
              }`}
            >
              <div className={`w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center ${
                analysisMode === 'upload'
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                  : 'bg-gray-100 group-hover:bg-gradient-to-br group-hover:from-purple-500 group-hover:to-pink-500'
              } transition-all`}>
                <Upload className={`w-7 h-7 ${analysisMode === 'upload' ? 'text-white' : 'text-gray-600 group-hover:text-white'}`} />
              </div>
              <div className="font-semibold text-lg text-gray-900 mb-1">Upload Photo</div>
              <div className="text-sm text-gray-600">Analyze from existing image file</div>
            </button>
          </div>
        </div>

        {/* Analysis Interface */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          {analysisMode === 'webcam' ? (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  <strong>Best practices:</strong> Ensure good lighting and position your face clearly in front of the camera. Remove glasses if possible for optimal results.
                </p>
              </div>

              <div className="relative bg-gray-900 rounded-xl overflow-hidden shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-auto"
                  style={{ maxHeight: '500px' }}
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>

              <button
                onClick={handleWebcamCapture}
                disabled={isAnalyzing}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    Capture & Analyze
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  <strong>Image requirements:</strong> Clear frontal face photo with good lighting. Supported formats: JPG, JPEG, PNG (max 10MB)
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-auto rounded-xl border-2 border-gray-200 shadow-md"
                    style={{ maxHeight: '500px', objectFit: 'contain' }}
                  />
                  <button
                    onClick={() => {
                      setImagePreview(null);
                      setResult(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-xl p-16 hover:border-purple-400 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 transition-all group"
                >
                  <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
                  <p className="text-gray-700 font-semibold text-lg mb-2">Click to upload image</p>
                  <p className="text-sm text-gray-500">or drag and drop your file here</p>
                </button>
              )}
            </div>
          )}

          {/* Progress Indicator */}
          {isAnalyzing && (
            <div className="mt-8 space-y-4">
              <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-700 text-center font-medium">
                {progressMessage}
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-xl p-5 flex items-start gap-3 shadow-sm">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 text-lg">Analysis Failed</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Results Display */}
        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* Risk Assessment Card */}
            <div className={`border-2 rounded-2xl p-8 shadow-lg ${getRiskColor(result.risk)}`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    {getRiskIcon(result.risk)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide opacity-75 mb-1">
                      Cognitive Risk Assessment
                    </p>
                    <p className="text-3xl font-bold">{result.risk?.toUpperCase()} RISK</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold uppercase tracking-wide opacity-75 mb-1">
                    Confidence Score
                  </p>
                  <p className="text-3xl font-bold">{(result.confidence * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Biometric Features */}
            {result.features && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  Biometric Analysis
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { label: 'Face Width', value: `${Math.round(result.features.face_width)}px`, icon: '↔️' },
                    { label: 'Face Height', value: `${Math.round(result.features.face_height)}px`, icon: '↕️' },
                    { label: 'X Position', value: result.features.x_position.toFixed(3), icon: '📍' },
                    { label: 'Y Position', value: result.features.y_position.toFixed(3), icon: '📍' }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{item.label}</p>
                        <span className="text-lg">{item.icon}</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analysis Details */}
            {result.reasons && result.reasons.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  Detailed Analysis Report
                </h3>
                <div className="space-y-3">
                  {result.reasons.map((reason, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-800 hover:shadow-md transition-shadow"
                    >
                      <span className="font-bold text-purple-600 mr-2">{index + 1}.</span>
                      {reason}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insights */}
            {result.insights && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  Insights & Recommendations
                </h3>
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
                  <p className="text-blue-900 font-medium text-lg">{result.insights.message}</p>
                </div>
                {result.insights.recommendations && (
                  <div className="space-y-3">
                    {result.insights.recommendations.map((rec, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-4 bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-md transition-all"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{rec}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Analysis Metadata */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-lg p-8">
              <div className="grid md:grid-cols-2 gap-6 text-white">
                <div className="text-center">
                  <p className="text-sm uppercase font-semibold tracking-wide mb-2 opacity-90">Analysis ID</p>
                  <p className="text-xl font-mono font-bold">#{result.analysis_id}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm uppercase font-semibold tracking-wide mb-2 opacity-90">Timestamp</p>
                  <p className="text-xl font-bold">
                    {new Date(result.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center space-y-4">
          <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
            <span className="font-semibold">Advanced Computer Vision</span>
            <span className="opacity-50">•</span>
            <span>Secure & Private</span>
            <span className="opacity-50">•</span>
            <span>AI-Powered Analysis</span>
          </div>
          <p className="text-xs text-gray-500">
            For Research & Educational Purposes • Not a substitute for professional medical diagnosis
          </p>
        </div>
      </div>

      {/* Navigation to NeuroTwin and Dashboard */}
      {result && result.risk && (
        <div className="mt-8">
          <TestResultNavigation 
            testName="Facial Analysis"
            score={result.confidence ? Math.round(result.confidence * 100) : null}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}