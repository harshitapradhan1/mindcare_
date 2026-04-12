"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import JournalTimeline from '@/components/JournalTimeline';
import { PencilLine, Sparkles, Loader2 } from 'lucide-react';

export default function JournalPage() {
  const router = useRouter();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const userId = localStorage.getItem('userId') || 'demo-user-123';
      const res = await fetch(`http://localhost:5002/api/journal/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (error) {
      console.error("Error fetching entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadInsights = async () => {
    setLoadingInsights(true);
    try {
      const userId = localStorage.getItem('userId') || 'demo-user-123';
      const res = await fetch('http://localhost:5002/api/journal/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      });
      if (res.ok) {
        const data = await res.json();
        setInsights(data.insights || []);
      }
    } catch (error) {
      console.error("Error fetching insights:", error);
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    try {
      const res = await fetch(`http://localhost:5002/api/journal/${entryId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setEntries(entries.filter(e => e.entry_id !== entryId));
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Mind Journal</h1>
              <p className="text-slate-500">A simple space to write or speak your thoughts.</p>
            </div>
            <button
              onClick={() => router.push('/journal/new')}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl font-medium shadow-md shadow-blue-500/20 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <PencilLine size={20} />
              Write Today's Reflection
            </button>
          </div>

          {/* AI Insights Section */}
          <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-indigo-800 font-semibold">
                <Sparkles size={20} className="text-indigo-500" />
                <span>Journal Insights</span>
              </div>
              <button 
                onClick={loadInsights}
                disabled={loadingInsights || entries.length === 0}
                className="text-sm bg-white border border-indigo-200 text-indigo-600 px-4 py-1.5 rounded-full hover:bg-indigo-50 transition-colors disabled:opacity-50"
              >
                {loadingInsights ? <Loader2 size={16} className="animate-spin inline mr-1" /> : null}
                {insights.length > 0 ? "Refresh" : "Analyze Patterns"}
              </button>
            </div>

            {insights.length > 0 ? (
              <div className="space-y-2">
                {insights.map((insight, idx) => (
                  <p key={idx} className="text-slate-700 italic border-l-2 border-indigo-300 pl-3">"{insight}"</p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                {entries.length === 0 
                  ? "Write a few entries to see gentle patterns and insights about your reflections." 
                  : "Click 'Analyze Patterns' to safely reflect on your recent entries."}
              </p>
            )}
            <p className="text-xs text-slate-400 mt-4">
              * Insights are for reflection only. They are not medical advice or diagnoses.
            </p>
          </div>

          {/* Timeline */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
          ) : (
            <JournalTimeline entries={entries} onDelete={handleDeleteEntry} />
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
