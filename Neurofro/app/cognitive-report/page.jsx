"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import {
  BarChart3,
  Loader2,
  Download,
  TrendingUp,
  Brain,
  FileText,
  Lightbulb,
  AlertCircle,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import {
  buildDomainScores,
  buildTrendData,
  buildAccuracyByTest,
  buildRadarData,
  generateSummary,
  generateInsights,
  generateSuggestions,
} from "@/lib/cognitiveReportUtils";

const API_BASE =
  typeof window !== "undefined" ? "/api/backend" : "http://localhost:5002/api";

const COLORS = {
  composite: "#0d9488",
  memory: "#3b82f6",
  attention: "#8b5cf6",
  speed: "#10b981",
  executive: "#f59e0b",
  fluency: "#ec4899",
};

export default function CognitiveReportPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserId(localStorage.getItem("userId") || "demo-user-123");
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/neurotwin/${userId}`);
        if (res.status === 404) {
          const json = await res.json().catch(() => ({}));
          if (json.error === "NeuroTwin profile not found") {
            setData({ empty: true, history: [] });
            return;
          }
        }
        if (!res.ok) throw new Error("Failed to load report");
        const json = await res.json();
        setData(json);
      } catch {
        setData({ empty: true, history: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-teal-600" />
        </div>
      </AuthGuard>
    );
  }

  const history = data?.history ?? [];
  const aggregateMetrics = data?.aggregate_metrics ?? {};
  const trends = data?.trends ?? {};
  const backendInsights = data?.insights ?? [];
  const hasData = history.length > 0;

  const domainScores = buildDomainScores(history, aggregateMetrics);
  const trendData = buildTrendData(history, aggregateMetrics);
  const accuracyData = buildAccuracyByTest(history);
  const radarData = buildRadarData(domainScores);
  const summary = generateSummary(history, trends, domainScores);
  const insights = generateInsights(domainScores, trends, backendInsights);
  const suggestions = generateSuggestions(domainScores, trends);

  // Empty state
  if (!hasData) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50">
          <div className="max-w-2xl mx-auto px-4 py-16 text-center">
            <div className="w-20 h-20 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="w-10 h-10 text-teal-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Your Cognitive Report
            </h1>
            <p className="text-gray-600 mb-6">
              Complete cognitive tests to build your personalized report with
              trends, insights, and suggestions.
            </p>
            <Link
              href="/tests"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl font-semibold hover:from-teal-600 hover:to-blue-700"
            >
              Take a Test
            </Link>
            <div className="mt-8">
              <Link
                href="/dashboard"
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const handleDownload = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50">
        <div id="report-content" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:bg-transparent pb-16">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Your Cognitive Report
              </h1>
              <p className="text-gray-600 mt-1">
                Performance patterns over {history.length} session
                {history.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-3 print:hidden" data-html2canvas-ignore="true">
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-teal-200 hover:border-teal-300 hover:bg-teal-50 text-teal-700 font-medium transition-all"
              >
                <Download className="w-4 h-4" />
                Download Report
              </button>
              <Link
                href="/dashboard"
                className="text-teal-600 hover:text-teal-700 font-semibold"
              >
                ← Dashboard
              </Link>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-teal-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Summary</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">{summary}</p>
          </div>

          {/* Key Metrics */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Key Metrics</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
              {[
                { key: "memory", label: "Memory", icon: "🧠" },
                { key: "attention", label: "Attention", icon: "👁️" },
                { key: "processing_speed", label: "Processing Speed", icon: "⚡" },
                { key: "executive_function", label: "Executive Function", icon: "🔄" },
                { key: "fluency", label: "Fluency", icon: "💬" },
              ].map(({ key, label, icon }) => {
                const score =
                  domainScores[key] ??
                  domainScores[key === "processing_speed" ? "speed" : key] ??
                  50;
                return (
                  <div
                    key={key}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                  >
                    <div className="text-2xl mb-2">{icon}</div>
                    <div className="text-sm text-gray-600 mb-1">{label}</div>
                    <div className="text-2xl font-bold text-teal-600">
                      {score}
                      <span className="text-sm font-normal text-gray-500">
                        /100
                      </span>
                    </div>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-blue-500 rounded-full transition-all"
                        style={{ width: `${Math.min(score, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Charts row */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Line chart - trends over time */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Trends Over Time
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="label"
                    stroke="#6b7280"
                    style={{ fontSize: 11 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="#6b7280"
                    style={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="composite"
                    stroke={COLORS.composite}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Overall"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Radar chart */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Cognitive Domains
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis
                    dataKey="category"
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                  />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="#0d9488"
                    fill="#0d9488"
                    fillOpacity={0.4}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar chart - accuracy by test */}
          {accuracyData.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Accuracy by Test
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={accuracyData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" domain={[0, 100]} stroke="#6b7280" />
                  <YAxis
                    type="category"
                    dataKey="test"
                    width={100}
                    stroke="#6b7280"
                    style={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="score"
                    fill="#0d9488"
                    radius={[0, 4, 4, 0]}
                    name="Score"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Insights */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Brain className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Insights</h2>
            </div>
            <ul className="space-y-3">
              {insights.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <Lightbulb
                    className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      item.type === "positive" ? "text-green-600" : "text-amber-600"
                    }`}
                  />
                  <span className="text-gray-700 text-sm">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Suggestions */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-teal-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Suggestions</h2>
            </div>
            <ul className="space-y-2">
              {suggestions.map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-700">
                  <span className="text-teal-500 font-bold">•</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-3 p-6 rounded-2xl bg-teal-50 border border-teal-100">
            <AlertCircle className="w-6 h-6 text-teal-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              This report reflects performance patterns over time based on your
              cognitive test sessions. It is not a medical diagnosis. For health
              questions, please consult a qualified healthcare professional.
            </p>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
