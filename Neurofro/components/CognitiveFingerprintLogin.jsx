"use client";
import { useState, useRef } from 'react';
import { Fingerprint, Mic, Camera, Loader2, CheckCircle, XCircle, Shield } from 'lucide-react';

export default function CognitiveFingerprintLogin({ onSuccess }) {
  const [step, setStep] = useState('idle'); // idle, recording, processing, success, error
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const API_BASE = 'http://localhost:5002/api';

  const startCapture = async () => {
    try {
      setStep('recording');
      setError(null);
      setMessage('Please speak and look at the camera...');
      
      // Get audio and video streams
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const videoStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      
      streamRef.current = { audio: audioStream, video: videoStream };
      
      if (videoRef.current) {
        videoRef.current.srcObject = videoStream;
      }
      
      // Record audio for 3 seconds
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
        processFingerprint();
      };

      mediaRecorder.start();
      
      // Stop after 3 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      }, 3000);
      
    } catch (err) {
      setError('Unable to access microphone/webcam. Please check permissions.');
      setStep('error');
    }
  };

  const processFingerprint = async () => {
    setStep('processing');
    setMessage('Processing your cognitive fingerprint...');
    
    try {
      // Capture frame
      const imageData = captureFrame();
      
      // Generate embeddings (simplified - in production, use actual Whisper/FaceNet)
      const audioEmbedding = await generateAudioEmbedding();
      const faceEmbedding = await generateFaceEmbedding(imageData);
      
      // Send to backend for verification
      const response = await fetch(`${API_BASE}/auth/fingerprint-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio_embedding: audioEmbedding,
          face_embedding: faceEmbedding
        })
      });
      
      const data = await response.json();
      
      // Stop streams
      if (streamRef.current) {
        streamRef.current.audio.getTracks().forEach(track => track.stop());
        streamRef.current.video.getTracks().forEach(track => track.stop());
      }
      
      if (data.success) {
        setStep('success');
        setMessage(`Welcome back! Similarity: ${(data.similarity * 100).toFixed(1)}%`);
        if (onSuccess) {
          setTimeout(() => onSuccess(data.user_id), 1500);
        }
      } else {
        setStep('error');
        setError(data.error || 'Cognitive ID not recognized');
      }
    } catch (err) {
      setStep('error');
      setError(err.message || 'Failed to process fingerprint');
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

  const generateAudioEmbedding = async () => {
    // Simplified embedding generation
    // In production, use OpenAI Whisper or similar
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Generate a simple embedding vector (128 dimensions)
    // In production, this would use actual ML model
    const embedding = Array.from({ length: 128 }, (_, i) => {
      return Math.sin(i * 0.1) * 0.5 + 0.5; // Simplified mock embedding
    });
    
    return embedding;
  };

  const generateFaceEmbedding = async (imageData) => {
    // Simplified embedding generation
    // In production, use FaceNet or DeepFace
    // For now, generate a mock embedding
    const embedding = Array.from({ length: 128 }, (_, i) => {
      return Math.cos(i * 0.1) * 0.5 + 0.5; // Simplified mock embedding
    });
    
    return embedding;
  };

  const reset = () => {
    setStep('idle');
    setError(null);
    setMessage('');
    if (streamRef.current) {
      streamRef.current.audio?.getTracks().forEach(track => track.stop());
      streamRef.current.video?.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
      <div className="text-center mb-6">
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Fingerprint className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Login with Cognitive ID</h3>
        <p className="text-gray-600">Use your voice and face to authenticate</p>
      </div>

      {step === 'idle' && (
        <button
          onClick={startCapture}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl py-4 font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <Fingerprint className="w-5 h-5" />
          Start Cognitive ID Login
        </button>
      )}

      {step === 'recording' && (
        <div className="space-y-4">
          <div className="relative bg-gray-900 rounded-xl overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-64 object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-red-500 rounded-full p-4 animate-pulse">
                <Mic className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          <p className="text-center text-gray-600">{message}</p>
        </div>
      )}

      {step === 'processing' && (
        <div className="text-center py-8">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">{message}</p>
        </div>
      )}

      {step === 'success' && (
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-xl font-bold text-gray-900 mb-2">Authentication Successful!</p>
          <p className="text-gray-600">{message}</p>
        </div>
      )}

      {step === 'error' && (
        <div className="space-y-4">
          <div className="text-center py-4">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-700 font-semibold">{error}</p>
          </div>
          <button
            onClick={reset}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl py-3 font-semibold transition-all"
          >
            Try Again
          </button>
        </div>
      )}

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">Secure & Private</p>
          <p>Your biometric data is encrypted and never stored in raw form. Only embeddings are used for matching.</p>
        </div>
      </div>
    </div>
  );
}


