"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, Loader2, TrendingUp } from "lucide-react";

const API_BASE =
  typeof window !== "undefined" ? "/api/backend" : "http://localhost:5002/api";

/**
 * Quick Check Card - Dashboard CTA with optional today's score
 */
export default function QuickCheckCard({ userId }) {
  const [loading, setLoading] = useState(true);
  const [todayScore, setTodayScore] = useState(null);

  useEffect(() => {
    if (!userId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/neurotwin/${userId}`);
        if (res.status === 404 || !res.ok) {
          setTodayScore(null);
          return;
        }
        const data = await res.json();
        const history = data?.history ?? [];
        const today = new Date().toISOString().split("T")[0];
        const todayChecks = history.filter((e) => {
          const tr = e?.test_results || {};
          if (tr.test_type !== "quick-check") return false;
          const ts = e.timestamp || "";
          return ts.startsWith(today);
        });
        if (todayChecks.length > 0) {
          const latest = todayChecks[todayChecks.length - 1];
          const score = latest.test_results?.score ?? latest.test_results?.accuracy * 100;
          setTodayScore(Math.round(score));
        } else {
          setTodayScore(null);
        }
      } catch {
        setTodayScore(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl hover:border-teal-100 transition-all">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center">
            <Zap className="w-7 h-7 text-teal-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Quick Cognitive Check</h2>
            <p className="text-sm text-gray-600">
              A short 2-minute check to understand your cognitive performance today.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
          ) : todayScore != null ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 rounded-xl">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <span className="text-lg font-bold text-teal-700">{todayScore}/100</span>
              <span className="text-xs text-gray-500">Today</span>
            </div>
          ) : null}
          <Link
            href="/quick-check"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl font-semibold hover:from-teal-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
          >
            Start Quick Check
          </Link>
        </div>
      </div>
      {todayScore != null && !loading && (
        <p className="text-xs text-gray-500 mt-3">
          Based on your recent activity and responses
        </p>
      )}
    </div>
  );
}
