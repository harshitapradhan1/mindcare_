"use client";
import { useState } from 'react';
import { Globe, Mic, Loader2 } from 'lucide-react';

const languages = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  zh: 'Chinese',
  ja: 'Japanese',
  hi: 'Hindi',
  ar: 'Arabic'
};

export default function LanguageSelector({ onLanguageChange }) {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = 'http://localhost:5002/api';

  const handleLanguageSelect = (langCode) => {
    setSelectedLanguage(langCode);
    if (onLanguageChange) {
      onLanguageChange(langCode);
    }
  };

  const detectLanguageFromAudio = async () => {
    setDetecting(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');

        try {
          const response = await fetch(`${API_BASE}/language/detect`, {
            method: 'POST',
            body: formData
          });

          const data = await response.json();

          if (data.success) {
            setSelectedLanguage(data.language_code);
            if (onLanguageChange) {
              onLanguageChange(data.language_code);
            }
          }
        } catch (err) {
          setError('Language detection failed');
        } finally {
          setDetecting(false);
        }
      };

      mediaRecorder.start();
      setTimeout(() => mediaRecorder.stop(), 3000);
    } catch (err) {
      setError('Unable to access microphone');
      setDetecting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-teal-600" />
          <span className="font-semibold text-gray-900">Language</span>
        </div>
        <button
          onClick={detectLanguageFromAudio}
          disabled={detecting}
          className="px-3 py-1.5 bg-teal-100 hover:bg-teal-200 text-teal-700 rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {detecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
          Auto-detect
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {Object.entries(languages).map(([code, name]) => (
          <button
            key={code}
            onClick={() => handleLanguageSelect(code)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedLanguage === code
                ? 'bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-md'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-red-600 text-xs mt-2">{error}</p>
      )}
    </div>
  );
}


