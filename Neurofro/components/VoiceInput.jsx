"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, Square } from "lucide-react";

/**
 * Web Speech API (Chrome/Edge): recognition runs in the cloud and needs network + HTTPS (except localhost).
 * Error "network" = cannot reach the speech service — not a bug in this file.
 */
export default function VoiceInput({ onTranscript }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [hint, setHint] = useState(null);

  const recognitionRef = useRef(null);
  /** User wants session to stay open (continuous mode restarts on onend). */
  const recordingIntentRef = useRef(false);
  /** After fatal errors, do not auto-restart until user taps Speak again. */
  const blockRestartRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let finalTranscripts = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscripts += transcript;
        }
      }
      if (finalTranscripts) {
        onTranscriptRef.current(finalTranscripts.trim());
      }
    };

    recognition.onerror = (event) => {
      const code = event.error;

      // Benign: silence timeout or intentional stop
      if (code === "no-speech" || code === "aborted") {
        return;
      }

      if (code === "network") {
        blockRestartRef.current = true;
        recordingIntentRef.current = false;
        setIsRecording(false);
        setHint(
          "Voice needs an internet connection (your browser sends audio to its speech service). Check Wi‑Fi/VPN, use HTTPS in production, or type instead."
        );
        return;
      }

      if (code === "not-allowed" || code === "service-not-allowed") {
        blockRestartRef.current = true;
        recordingIntentRef.current = false;
        setIsRecording(false);
        setHint(
          "Microphone access was blocked. Allow the mic for this site in your browser settings."
        );
        return;
      }

      if (process.env.NODE_ENV === "development") {
        console.warn("Speech recognition:", code);
      }
      blockRestartRef.current = true;
      recordingIntentRef.current = false;
      setIsRecording(false);
      setHint("Voice input stopped. Tap Speak to try again.");
    };

    recognition.onend = () => {
      if (
        recordingIntentRef.current &&
        !blockRestartRef.current &&
        recognitionRef.current
      ) {
        try {
          recognitionRef.current.start();
        } catch {
          recordingIntentRef.current = false;
          setIsRecording(false);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recordingIntentRef.current = false;
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!isSupported) {
      window.alert(
        "Voice input is not supported in this browser. Try Chrome or Edge, or type your entry."
      );
      return;
    }

    const rec = recognitionRef.current;
    if (!rec) return;

    if (isRecording) {
      recordingIntentRef.current = false;
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
      setIsRecording(false);
      return;
    }

    setHint(null);
    blockRestartRef.current = false;
    try {
      rec.start();
      recordingIntentRef.current = true;
      setIsRecording(true);
    } catch (e) {
      console.warn("Could not start speech recognition:", e);
      setHint(
        "Could not start the microphone. Wait a moment and try again, or type instead."
      );
    }
  };

  if (!isSupported) {
    return (
      <button
        type="button"
        className="flex items-center gap-2 p-2 px-4 rounded-full text-sm font-medium border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
        title="Voice input not supported in this browser"
      >
        <Mic size={18} />
        Voice disabled
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 items-start max-w-md">
      <button
        type="button"
        onClick={toggleRecording}
        className={`flex items-center gap-2 p-2 px-5 rounded-full text-sm font-medium transition-all ${
          isRecording
            ? "bg-red-50 border border-red-200 text-red-600 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse"
            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
        }`}
      >
        {isRecording ? (
          <>
            <Square size={16} fill="currentColor" />
            <span>Stop recording</span>
          </>
        ) : (
          <>
            <Mic size={18} />
            <span>Speak</span>
          </>
        )}
      </button>
      {hint && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 leading-snug">
          {hint}
        </p>
      )}
    </div>
  );
}
