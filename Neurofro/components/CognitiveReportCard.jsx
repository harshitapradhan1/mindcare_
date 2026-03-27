"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  ArrowRight,
  Brain,
  Loader2,
  TrendingUp,
} from "lucide-react";
import {
  buildDomainScores,
  generateSummary,
  toScore100,
} from "@/lib/cognitiveReportUtils";

const API_BASE =
  typeof window !== "undefined" ? "/api/backend" : "http://localhost:5002/api";

/**
 * Cognitive Report Card - Dashboard preview
 * Shows summary and "View Full Report" button
 */
export default function CognitiveReportCard({ userId }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/neurotwin/${userId}`);
        if (res.status === 404) {
          const json = await res.json().catch(() => ({}));
          if (json.error === "NeuroTwin profile not found") {
            setData({ empty: true });
            return;
          }
        }
        if (!res.ok) throw new Error("Failed to load report data");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      </div>
    );
  }

  const history = data?.history ?? [];
  const aggregateMetrics = data?.aggregate_metrics ?? {};
  const trends = data?.trends ?? {};
  const domainScores = buildDomainScores(history, aggregateMetrics);
  const summary = generateSummary(history, trends, domainScores);
  const hasData = history.length > 0;
  const avgScore =
    Object.values(domainScores).filter(Boolean).length > 0
      ? Math.round(
          Object.values(domainScores).filter(Boolean).reduce((a, b) => a + b, 0) /
            Object.values(domainScores).filter(Boolean).length
        )
      : null;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl hover:border-teal-100 transition-all">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Your Cognitive Report
            </h2>
            <p className="text-sm text-gray-600">
              Performance patterns over time
            </p>
          </div>
        </div>
        {hasData && avgScore != null && (
          <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 rounded-xl">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            <span className="text-2xl font-bold text-teal-700">{avgScore}</span>
            <span className="text-sm text-gray-600">/ 100</span>
          </div>
        )}
      </div>

      {error ? (
        <p className="text-amber-600 text-sm mb-4">{error}</p>
      ) : hasData ? (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{summary}</p>
      ) : (
        <p className="text-gray-500 text-sm mb-4">
          Complete cognitive tests to build your personalized report.
        </p>
      )}

      <Link
        href="/cognitive-report"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl font-semibold hover:from-teal-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
      >
        View Full Report
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
