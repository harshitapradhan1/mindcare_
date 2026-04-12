"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import VoiceInput from '@/components/VoiceInput';
import { ArrowLeft, Save, Loader2, Info } from 'lucide-react';

export default function NewEntryPage() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!text.trim()) return;
    
    setSaving(true);
    try {
      const userId = localStorage.getItem('userId') || 'demo-user-123';
      const res = await fetch('http://localhost:5002/api/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          text: text,
          tags: []
        }),
      });
      
      if (res.ok) {
        router.push('/journal');
      }
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Failed to save entry. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft size={18} />
              Back
            </button>
            <div className="text-sm font-medium text-slate-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>

          {/* Main Input Area */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[60vh]">
            <textarea
              className="flex-1 w-full p-8 text-lg text-slate-700 placeholder-slate-300 resize-none focus:outline-none"
              placeholder="How are you feeling today? You can write anything..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            
            {/* Toolbar */}
            <div className="bg-slate-50 border-t border-slate-100 p-4 flex items-center justify-between">
              <VoiceInput onTranscript={(newText) => setText(prev => prev ? prev + ' ' + newText : newText)} />
              
              <button
                onClick={handleSave}
                disabled={!text.trim() || saving}
                className="flex items-center gap-2 bg-slate-800 text-white px-6 py-2.5 rounded-full font-medium hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {saving ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="mt-6 flex items-start gap-2 text-slate-400 text-sm bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
            <Info size={16} className="mt-0.5 flex-shrink-0 text-blue-400" />
            <p>
              This journal is for personal reflection and does not provide medical advice. 
              Your entries are private and securely stored.
            </p>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
