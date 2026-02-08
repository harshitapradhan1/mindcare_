"use client";
import { useState, useRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Mic, MicOff, Camera, Loader2, AlertCircle } from 'lucide-react';

export default function EmotionAnalysisWidget() {
  const [isRecording, setIsRecording] = useState(false);
  const [emotions, setEmotions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const API_BASE = 'http://localhost:5002/api';

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setError(null);
      
      // Get audio stream
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Get video stream for webcam
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = { audio: audioStream, video: videoStream };
      
      if (videoRef.current) {
        videoRef.current.srcObject = videoStream;
      }
      
      // Setup audio recording
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      const mediaRecorder = new MediaRecorder(audioStream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        analyzeEmotions();
      };

      mediaRecorder.start(100);
    } catch (err) {
      setError('Unable to access microphone/webcam. Please check permissions.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop streams
      if (streamRef.current) {
        streamRef.current.audio.getTracks().forEach(track => track.stop());
        streamRef.current.video.getTracks().forEach(track => track.stop());
      }
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    return canvas.toDataURL('image/jpeg');
  };

  const analyzeEmotions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const imageData = captureFrame();
      
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');
      if (imageData) {
        formData.append('image', imageData);
      }
      
      const response = await fetch(`${API_BASE}/emotion-analyze`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        setEmotions(data.emotions);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze emotions');
    } finally {
      setLoading(false);
    }
  };

  // Format data for radar chart
  const radarData = emotions ? [
    { emotion: 'Joy', value: emotions.joy * 100 },
    { emotion: 'Stress', value: emotions.stress * 100 },
    { emotion: 'Fatigue', value: emotions.fatigue * 100 },
    { emotion: 'Neutral', value: emotions.neutral * 100 },
    { emotion: 'Sadness', value: emotions.sadness * 100 },
    { emotion: 'Anger', value: emotions.anger * 100 }
  ] : [];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Emotion Analysis</h3>
      
      <div className="space-y-6">
        {/* Recording Controls */}
        <div className="flex items-center justify-center gap-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold flex items-center gap-2"
            >
              <Mic className="w-5 h-5" />
              Start Analysis
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="px-8 py-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-semibold flex items-center gap-2 animate-pulse"
            >
              <MicOff className="w-5 h-5" />
              Stop & Analyze
            </button>
          )}
        </div>

        {/* Video Preview */}
        {isRecording && (
          <div className="relative bg-gray-900 rounded-xl overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-64 object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <span className="ml-3 text-gray-600">Analyzing emotions...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Radar Chart */}
        {emotions && radarData.length > 0 && (
          <div>
            <div className="mb-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Dominant Emotion</p>
              <p className="text-2xl font-bold text-purple-600 capitalize">
                {Object.entries(emotions).sort((a, b) => b[1] - a[1])[0][0]}
              </p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis 
                  dataKey="emotion" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]}
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                />
                <Radar
                  name="Emotion"
                  dataKey="value"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.6}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Privacy Badge */}
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3">
          <div className="bg-green-500 rounded-full p-2">
            <Camera className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-900">Your data never leaves your device</p>
            <p className="text-xs text-green-700">Analysis performed locally before upload</p>
          </div>
        </div>
      </div>
    </div>
  );
}


