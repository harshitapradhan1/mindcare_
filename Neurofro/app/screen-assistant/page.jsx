"use client";
import { useState, useRef } from 'react';
import { Eye, Camera, Brain, MessageSquare, Loader2, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ScreenAssistant() {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [screenText, setScreenText] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [error, setError] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const captureScreen = async () => {
    try {
      setError('');
      setIsAnalyzing(true);

      // Request screen capture permission
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' }
      });

      streamRef.current = stream;

      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      await new Promise(resolve => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });

      // Capture frame to canvas
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      // Convert to blob
      canvas.toBlob(async (blob) => {
        // Stop the stream
        stream.getTracks().forEach(track => track.stop());

        // Send to backend for OCR and analysis
        await analyzeScreen(blob);
      }, 'image/png');

    } catch (err) {
      console.error('Screen capture error:', err);
      setError('Failed to capture screen. Please allow screen sharing permission.');
      setIsAnalyzing(false);
    }
  };

  const captureWebcam = async () => {
    try {
      setError('');
      setIsAnalyzing(true);

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Wait a moment for video to start
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Capture frame
      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        // Stop webcam
        stream.getTracks().forEach(track => track.stop());

        // Convert to blob
        canvas.toBlob(async (blob) => {
          await analyzeScreen(blob);
        }, 'image/png');
      }
    } catch (err) {
      console.error('Webcam capture error:', err);
      setError('Failed to access webcam. Please allow camera permission.');
      setIsAnalyzing(false);
    }
  };

  const analyzeScreen = async (imageBlob) => {
    try {
      const formData = new FormData();
      formData.append('image', imageBlob, 'screenshot.png');

      // Send to backend for OCR and AI analysis
      const response = await fetch('http://localhost:5002/api/screen/analyze', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Analysis failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }
      
      setScreenText(data.extracted_text || 'No text found');
      setAiResponse(data.ai_analysis || 'Analysis complete');
      setScreenshot(URL.createObjectURL(imageBlob));
      setIsAnalyzing(false);
      setError(''); // Clear any previous errors

    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze screen. Please try again.');
      setIsAnalyzing(false);
    }
  };

  const askQuestion = async (question) => {
    if (!question.trim() || !screenText) return;

    try {
      setIsAnalyzing(true);
      setError('');

      const response = await fetch('http://localhost:5002/api/screen/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question,
          screen_text: screenText,
          context: aiResponse
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get answer');
      }

      const data = await response.json();
      setAiResponse(data.answer || 'Unable to answer question.');
      setIsAnalyzing(false);

    } catch (err) {
      console.error('Question error:', err);
      setError('Failed to process question. Please try again.');
      setIsAnalyzing(false);
    }
  };

  const stopCapture = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 p-4">
      <div className="max-w-7xl mx-auto py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-xl">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Screen-Aware AI Assistant</h1>
                <p className="text-gray-600">Understand and interact with your screen in real-time</p>
              </div>
            </div>
            <a
              href="/tests"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Back to Tests
            </a>
          </div>

          {/* Capture Buttons */}
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={captureScreen}
              disabled={isAnalyzing}
              className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl py-4 font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Capturing...</span>
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  <span>Capture Screen</span>
                </>
              )}
            </button>
            <button
              onClick={captureWebcam}
              disabled={isAnalyzing}
              className="flex items-center justify-center gap-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl py-4 font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Capturing...</span>
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  <span>Capture Webcam</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Results */}
        {(screenText || aiResponse || screenshot) && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Screenshot */}
            {screenshot && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Captured Image</h3>
                <img
                  src={screenshot}
                  alt="Screenshot"
                  className="w-full rounded-xl border-2 border-gray-200"
                />
              </div>
            )}

            {/* Extracted Text */}
            {screenText && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Extracted Text
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 max-h-64 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{screenText}</p>
                </div>
              </div>
            )}

            {/* AI Analysis */}
            {aiResponse && (
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI Analysis
                </h3>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                  <p className="text-gray-800 whitespace-pre-wrap">{aiResponse}</p>
                </div>

                {/* Ask Question */}
                <div className="mt-6">
                  <h4 className="font-bold text-gray-900 mb-3">Ask a Question About Your Screen</h4>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="e.g., What does this screen show? How can I improve this?"
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          askQuestion(e.target.value);
                          e.target.value = '';
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = e.target.previousElementSibling;
                        askQuestion(input.value);
                        input.value = '';
                      }}
                      disabled={isAnalyzing}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      Ask
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hidden video and canvas for webcam */}
        <video ref={videoRef} className="hidden" autoPlay playsInline />
        <canvas ref={canvasRef} className="hidden" />

        {/* Info Section */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <h3 className="font-bold text-gray-900 mb-3">How It Works</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• <strong>Capture Screen:</strong> Share your screen to analyze what's displayed</li>
            <li>• <strong>Capture Webcam:</strong> Point your camera at a screen or document</li>
            <li>• <strong>OCR Extraction:</strong> Text is automatically extracted from the image</li>
            <li>• <strong>AI Analysis:</strong> AI understands the context and can answer questions</li>
            <li>• <strong>Ask Questions:</strong> Get help understanding or improving what's on screen</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

