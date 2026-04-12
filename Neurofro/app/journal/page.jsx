"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import JournalTimeline from '@/components/JournalTimeline';
import { PencilLine, Sparkles, Loader2 } from 'lucide-react';
import {
  mergeJournalEntries,
  removeLocalJournalEntry,
} from '@/lib/journalStorage';

const API_BASE = typeof window !== 'undefined' ? '/api/backend' : 'http://localhost:5002/api';

function JournalPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [deviceSaveNotice, setDeviceSaveNotice] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, []);

  useEffect(() => {
    if (searchParams.get('saved') === 'device') {
      setDeviceSaveNotice(true);
      router.replace('/journal', { scroll: false });
    }
  }, [searchParams, router]);

  const fetchEntries = async () => {
    try {
      const userId = localStorage.getItem('userId') || 'demo-user-123';
      const res = await fetch(`${API_BASE}/journal/${userId}`);
      let serverList = [];
      if (res.ok) {
        const data = await res.json();
        serverList = data.entries || [];
      }
      setEntries(mergeJournalEntries(serverList, userId));
    } catch (error) {
      console.error('Error fetching entries:', error);
      const userId = localStorage.getItem('userId') || 'demo-user-123';
      setEntries(mergeJournalEntries([], userId));
    } finally {
      setLoading(false);
    }
  };

  const loadInsights = async () => {
    setLoadingInsights(true);
    try {
      const userId = localStorage.getItem('userId') || 'demo-user-123';
      const res = await fetch(`${API_BASE}/journal/insights`, {
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
    const userId = localStorage.getItem('userId') || 'demo-user-123';
    const target = entries.find((e) => e.entry_id === entryId);
    if (target?._savedOnDevice) {
      removeLocalJournalEntry(userId, entryId);
      setEntries((prev) => prev.filter((e) => e.entry_id !== entryId));
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/journal/${entryId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.entry_id !== entryId));
        return;
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
    removeLocalJournalEntry(userId, entryId);
    setEntries((prev) => prev.filter((e) => e.entry_id !== entryId));
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {deviceSaveNotice && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
              <strong>Saved on this device.</strong> The server could not be reached (common on
              Vercel until you set <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_API_URL</code>{' '}
              to your live API). Your entry is stored in this browser only.
            </div>
          )}

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
    </>
  );
}

export default function JournalPage() {
  return (
    <AuthGuard>
      <Suspense
        fallback={
          <div className="min-h-screen bg-slate-50 pt-24 flex justify-center px-4">
            <Loader2 className="animate-spin text-blue-500 mt-20" size={32} />
          </div>
        }
      >
        <JournalPageInner />
      </Suspense>
    </AuthGuard>
  );
}
