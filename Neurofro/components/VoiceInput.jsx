import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';

export default function VoiceInput({ onTranscript }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscripts = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscripts += transcript;
          }
        }
        
        if (finalTranscripts) {
          onTranscript(finalTranscripts.trim());
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        if (event.error !== 'no-speech') {
          setIsRecording(false);
        }
      };

      recognition.onend = () => {
        // Automatically restart if we're still supposed to be recording
        if (isRecording) {
          try {
            recognition.start();
          } catch (e) {
            console.error("Failed to restart recognition:", e);
            setIsRecording(false);
          }
        }
      };

      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript, isRecording]);

  const toggleRecording = () => {
    if (!isSupported) {
      alert("Voice input is not supported in your browser. Try using Chrome.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error starting recording:', error);
      }
    }
  };

  if (!isSupported) {
    return (
      <button 
        className="flex items-center gap-2 p-2 px-4 rounded-full text-sm font-medium border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
        title="Voice input not supported in this browser"
      >
        <Mic size={18} />
        Voice Disabled
      </button>
    );
  }

  return (
    <button
      onClick={toggleRecording}
      className={`flex items-center gap-2 p-2 px-5 rounded-full text-sm font-medium transition-all ${
        isRecording 
          ? 'bg-red-50 border border-red-200 text-red-600 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse'
          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
      }`}
    >
      {isRecording ? (
        <>
          <Square size={16} fill="currentColor" />
          <span>Stop Recording</span>
        </>
      ) : (
        <>
          <Mic size={18} />
          <span>Speak</span>
        </>
      )}
    </button>
  );
}
