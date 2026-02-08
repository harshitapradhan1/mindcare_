'use client';
import { useState, useRef } from 'react';
import { Upload, Mic, MicOff, Play, Pause, RotateCcw, Brain, Loader2, Volume2, Activity, TrendingUp, AlertCircle, CheckCircle, Clock, Info, BarChart3, Waves } from 'lucide-react';
import TestResultNavigation from '@/components/TestResultNavigation';

export default function SpeechPage() {
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [audioFeatures, setAudioFeatures] = useState(null);
  const [predictionProbabilities, setPredictionProbabilities] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const chunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const streamRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      
      // Try to use WAV first, fallback to WebM if not supported
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedAudio(blob);
        setAudioUrl(URL.createObjectURL(blob));
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        // Clear recording timer
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setError(null);
      setRecordingTime(0);
      
      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Recording error:', err);
      setError('Unable to access microphone. Please check permissions and ensure your browser supports audio recording.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit. Please choose a smaller file.');
        return;
      }
      
      // Check file type
      const validTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/webm', 'audio/flac', 'audio/m4a'];
      if (!validTypes.some(type => file.type.startsWith('audio/'))) {
        setError('Invalid file type. Please upload an audio file.');
        return;
      }
      
      setRecordedAudio(file);
      setAudioUrl(URL.createObjectURL(file));
      setError(null);
      setPrediction(null);
    }
  };

  // Convert audio blob to WAV format using Web Audio API
  const convertToWav = async (audioBlob) => {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Convert to WAV
      const wav = audioBufferToWav(audioBuffer);
      return new Blob([wav], { type: 'audio/wav' });
    } catch (error) {
      console.warn('Could not convert to WAV, using original format:', error);
      return audioBlob; // Fallback to original
    }
  };

  // Helper function to convert AudioBuffer to WAV
  const audioBufferToWav = (buffer) => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    const channels = [];
    let sample;
    let offset = 0;
    let pos = 0;

    // Write WAV header
    const setUint16 = (data) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };
    const setUint32 = (data) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    // RIFF identifier
    setUint32(0x46464952);
    // File length
    setUint32(length - 8);
    // RIFF type
    setUint32(0x45564157);
    // Format chunk identifier
    setUint32(0x20746d66);
    // Format chunk length
    setUint32(16);
    // Sample format (raw)
    setUint16(1);
    // Channel count
    setUint16(numOfChan);
    // Sample rate
    setUint32(buffer.sampleRate);
    // Byte rate (sample rate * block align)
    setUint32(buffer.sampleRate * 2 * numOfChan);
    // Block align (channel count * bytes per sample)
    setUint16(numOfChan * 2);
    // Bits per sample
    setUint16(16);
    // Data chunk identifier
    setUint32(0x61746164);
    // Data chunk length
    setUint32(length - pos - 4);

    // Get interleaved data
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return arrayBuffer;
  };

  const analyzeAudio = async (audioBlob) => {
    setIsLoading(true);
    setError(null);
    setPrediction(null);
    setAudioFeatures(null);
    setPredictionProbabilities(null);
    
    try {
      // Validate audio blob
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error('Invalid audio data. Please record or upload audio again.');
      }
      
      // Check minimum recording duration (at least 1 second)
      if (audioBlob.size < 10000) {
        throw new Error('Recording too short. Please record at least 2-3 seconds of audio.');
      }
      
      const formData = new FormData();
      
      // Convert to WAV format if not already WAV (to avoid ffmpeg requirement)
      let processedBlob = audioBlob;
      if (!audioBlob.type || !audioBlob.type.includes('wav')) {
        try {
          processedBlob = await convertToWav(audioBlob);
          console.log('Converted audio to WAV format');
        } catch (conversionError) {
          console.warn('Could not convert to WAV, using original format:', conversionError);
          processedBlob = audioBlob;
        }
      }

      // Create a proper File object with WAV extension
      let fileToUpload;
      if (processedBlob instanceof File) {
        fileToUpload = processedBlob;
      } else {
        // Always use WAV format for better backend compatibility
        fileToUpload = new File(
          [processedBlob], 
          `recording_${Date.now()}.wav`, 
          { type: 'audio/wav' }
        );
      }
      
      console.log('Uploading file:', fileToUpload.name, 'Size:', fileToUpload.size, 'Type:', fileToUpload.type);
      formData.append('audio', fileToUpload);

      const API_BASE = typeof window !== 'undefined' ? '/api/backend' : 'http://localhost:5002/api';
      const res = await fetch(`${API_BASE}/predict-speech`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || `Server error: ${res.status}`);
      }

      if (data.success) {
        setPrediction(data.label);
        setAudioFeatures(data.audio_features);
        setPredictionProbabilities(data.prediction_probabilities);
        
        const newAnalysis = {
          id: data.analysis_id || Date.now(),
          timestamp: data.timestamp || new Date().toISOString(),
          prediction: data.label,
          rawPrediction: data.prediction,
          confidence: data.confidence,
          audioUrl: audioUrl || URL.createObjectURL(processedBlob),
          insights: data.insights,
          audioFeatures: data.audio_features
        };
        setAnalysisHistory(prev => [newAnalysis, ...prev.slice(0, 4)]);

        // Update NeuroTwin profile
        try {
          const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : 'demo-user-123';
          if (userId) {
            const API_BASE = typeof window !== 'undefined' ? '/api/backend' : 'http://localhost:5002/api';
            await fetch(`${API_BASE}/neurotwin/update`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: userId,
                test_results: {
                  test_type: 'speech',
                  label: data.label,
                  audio_features: data.audio_features,
                  confidence: data.confidence
                }
              }),
            });
          }
        } catch (neurotwinError) {
          console.error('Error updating NeuroTwin:', neurotwinError);
          // Don't fail the main request if NeuroTwin update fails
        }
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
      
    } catch (err) {
      console.error('Analysis error:', err);
      setError(`Analysis failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayback = () => {
    if (audioPlayerRef.current) {
      if (isPlaying) {
        audioPlayerRef.current.pause();
      } else {
        audioPlayerRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const resetAnalysis = () => {
    setPrediction(null);
    setAudioFeatures(null);
    setPredictionProbabilities(null);
    setError(null);
    setRecordedAudio(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordingTime(0);
    
    // Stop any ongoing recording
    if (isRecording) {
      stopRecording();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getConfidenceColor = (conf) => {
    if (conf >= 0.8) return 'text-green-600';
    if (conf >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBarColor = (conf) => {
    if (conf >= 0.8) return 'from-green-500 to-green-600';
    if (conf >= 0.6) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const getPredictionConfig = (pred) => {
    const predLower = pred?.toLowerCase() || '';
    const configs = {
      'normal': {
        bgClass: 'from-green-50 to-green-100',
        borderClass: 'border-green-200',
        textClass: 'text-green-900',
        icon: <CheckCircle className="w-8 h-8 text-green-600" />,
        badge: 'bg-green-100 text-green-800',
        description: 'Cognitive function within normal range',
        severity: 'low'
      },
      'at risk': {
        bgClass: 'from-yellow-50 to-yellow-100',
        borderClass: 'border-yellow-200',
        textClass: 'text-yellow-900',
        icon: <AlertCircle className="w-8 h-8 text-yellow-600" />,
        badge: 'bg-yellow-100 text-yellow-800',
        description: 'Potential cognitive decline detected',
        severity: 'medium'
      },
      'impaired': {
        bgClass: 'from-red-50 to-red-100',
        borderClass: 'border-red-200',
        textClass: 'text-red-900',
        icon: <AlertCircle className="w-8 h-8 text-red-600" />,
        badge: 'bg-red-100 text-red-800',
        description: 'Significant cognitive impairment indicated',
        severity: 'high'
      }
    };
    return configs[predLower] || configs['normal'];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Speech Pattern Analysis
            </h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Advanced AI-powered cognitive assessment through speech pattern recognition and analysis
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-purple-100">
            <div className="flex items-center gap-3 mb-6">
              <Mic className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-semibold text-gray-900">Record or Upload</h2>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isLoading}
                  className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl font-medium transition-all duration-200 ${
                    isRecording 
                      ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg animate-pulse' 
                      : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                  } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                >
                  {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                  <span className="text-sm font-semibold">
                    {isRecording ? `Recording ${formatTime(recordingTime)}` : 'Start Recording'}
                  </span>
                </button>

                <div className="relative">
                  <input
                    type="file"
                    accept="audio/*,.mp3,.wav,.ogg,.webm,.flac,.m4a"
                    onChange={handleAudioUpload}
                    disabled={isLoading || isRecording}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                  />
                  <div className={`flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed rounded-xl transition-all ${
                    isLoading || isRecording 
                      ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
                      : 'border-purple-300 hover:border-purple-500 hover:bg-purple-50 cursor-pointer'
                  }`}>
                    <Upload className={`w-8 h-8 ${isLoading || isRecording ? 'text-gray-400' : 'text-purple-600'}`} />
                    <span className={`text-sm font-semibold ${isLoading || isRecording ? 'text-gray-400' : 'text-purple-700'}`}>
                      Upload Audio
                    </span>
                  </div>
                </div>
              </div>

              {isRecording && (
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border-2 border-red-200">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-700 font-semibold">Recording in progress...</span>
                    <span className="text-red-600 font-mono">{formatTime(recordingTime)}</span>
                  </div>
                  <p className="text-center text-sm text-red-600 mt-2">Speak clearly for best results</p>
                </div>
              )}

              {audioUrl && !isRecording && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center gap-3 mb-4">
                    <button
                      onClick={togglePlayback}
                      className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full transition-all shadow-lg hover:shadow-xl"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-semibold text-gray-700">Audio Preview</span>
                    </div>
                  </div>
                  <audio
                    ref={audioPlayerRef}
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className="w-full"
                    controls
                  />
                </div>
              )}

              <button
                onClick={() => recordedAudio && analyzeAudio(recordedAudio)}
                disabled={!recordedAudio || isLoading || isRecording}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing Speech Patterns...
                  </>
                ) : (
                  <>
                    <Activity className="w-5 h-5" />
                    Analyze Speech
                  </>
                )}
              </button>
              
              {recordedAudio && !isRecording && (
                <p className="text-center text-sm text-gray-500">
                  Audio ready for analysis • Click "Analyze Speech" to continue
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-purple-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Brain className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-semibold text-gray-900">Analysis Results</h2>
              </div>
              {(prediction || error) && (
                <button
                  onClick={resetAnalysis}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-sm font-medium">Reset</span>
                </button>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                  <span className="font-semibold text-red-900">Analysis Error</span>
                </div>
                <p className="text-red-700">{error}</p>
                <button
                  onClick={resetAnalysis}
                  className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {!prediction && !error && !isLoading && (
              <div className="text-center py-12">
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-10 h-10 text-purple-600" />
                </div>
                <p className="text-gray-600 font-medium">Record or upload audio to begin analysis</p>
                <p className="text-sm text-gray-500 mt-2">Our AI will analyze speech patterns for cognitive assessment</p>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
                <p className="text-gray-700 font-semibold text-lg">Processing Speech Data</p>
                <p className="text-gray-500 text-sm mt-2">Analyzing cognitive patterns...</p>
              </div>
            )}

            {prediction && !isLoading && (
              <div className="space-y-6">
                <div className={`bg-gradient-to-br ${getPredictionConfig(prediction).bgClass} border-2 ${getPredictionConfig(prediction).borderClass} rounded-xl p-6`}>
                  <div className="flex items-center gap-4 mb-4">
                    {getPredictionConfig(prediction).icon}
                    <div>
                      <div className="text-sm text-gray-600 font-medium mb-1">Assessment Result</div>
                      <div className={`text-3xl font-bold ${getPredictionConfig(prediction).textClass} capitalize`}>
                        {prediction}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mt-3">
                    {getPredictionConfig(prediction).description}
                  </p>
                </div>

                {predictionProbabilities && (
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-semibold text-gray-700">Prediction Probabilities</span>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(predictionProbabilities).map(([label, prob]) => (
                        <div key={label}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700 font-medium">{label}</span>
                            <span className="text-gray-900 font-bold">{(prob * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-2 rounded-full transition-all duration-500 bg-gradient-to-r from-purple-500 to-pink-500"
                              style={{ width: `${prob * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {audioFeatures && (
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Waves className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-semibold text-gray-700">Audio Features</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {audioFeatures.duration && (
                        <div className="bg-white rounded-lg p-3">
                          <div className="text-xs text-gray-600 mb-1">Duration</div>
                          <div className="text-lg font-bold text-gray-900">{audioFeatures.duration.toFixed(2)}s</div>
                        </div>
                      )}
                      {audioFeatures.rms_mean !== undefined && (
                        <div className="bg-white rounded-lg p-3">
                          <div className="text-xs text-gray-600 mb-1">Energy (RMS)</div>
                          <div className="text-lg font-bold text-gray-900">{audioFeatures.rms_mean.toFixed(4)}</div>
                        </div>
                      )}
                      {audioFeatures.zcr_mean !== undefined && (
                        <div className="bg-white rounded-lg p-3">
                          <div className="text-xs text-gray-600 mb-1">Zero Crossing Rate</div>
                          <div className="text-lg font-bold text-gray-900">{audioFeatures.zcr_mean.toFixed(4)}</div>
                        </div>
                      )}
                      {audioFeatures.spectral_centroid_mean !== undefined && (
                        <div className="bg-white rounded-lg p-3">
                          <div className="text-xs text-gray-600 mb-1">Spectral Centroid</div>
                          <div className="text-lg font-bold text-gray-900">{audioFeatures.spectral_centroid_mean.toFixed(0)} Hz</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {analysisHistory.length > 0 && analysisHistory[0].insights && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-purple-100">
            <div className="flex items-center gap-3 mb-6">
              <Info className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-semibold text-gray-900">Clinical Insights</h2>
            </div>
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <div className="flex items-start gap-3 mb-4">
                  <Info className="w-6 h-6 text-purple-600 mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-900 mb-2">Assessment Message</div>
                    <p className="text-gray-700">{analysisHistory[0].insights.message}</p>
                  </div>
                </div>
              </div>

              {analysisHistory[0].insights.recommendations && analysisHistory[0].insights.recommendations.length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                    Recommendations
                  </div>
                  <ul className="space-y-3">
                    {analysisHistory[0].insights.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-700 bg-gray-50 rounded-lg p-3">
                        <span className="text-purple-600 font-bold mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className={`bg-gradient-to-br ${getPredictionConfig(analysisHistory[0].prediction).bgClass} border ${getPredictionConfig(analysisHistory[0].prediction).borderClass} rounded-xl p-4`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Risk Severity Level:</span>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${getPredictionConfig(analysisHistory[0].prediction).badge}`}>
                    {analysisHistory[0].insights.severity?.toUpperCase() || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {analysisHistory.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-purple-100">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-semibold text-gray-900">Assessment History</h2>
            </div>
            <div className="space-y-4">
              {analysisHistory.map((analysis) => {
                const config = getPredictionConfig(analysis.prediction);
                return (
                  <div key={analysis.id} className="flex items-center justify-between p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl hover:shadow-md transition-all border border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${config.bgClass} border ${config.borderClass}`}>
                        {config.icon}
                      </div>
                      <div>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${config.badge}`}>
                          {analysis.prediction}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(analysis.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getConfidenceColor(analysis.confidence)}`}>
                          {(analysis.confidence * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500">Confidence</div>
                      </div>
                      {analysis.rawPrediction !== undefined && (
                        <div className="bg-gray-200 px-3 py-1 rounded-lg">
                          <div className="text-xs text-gray-500">Code</div>
                          <div className="text-sm font-bold text-gray-700">{analysis.rawPrediction}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation to NeuroTwin and Dashboard */}
        {prediction && (
          <TestResultNavigation 
            testName="Speech Analysis"
            score={predictionProbabilities ? Math.round(predictionProbabilities[prediction] * 100) : null}
          />
        )}
      </div>
    </div>
  );
}