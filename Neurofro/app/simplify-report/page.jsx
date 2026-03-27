"use client";

import { useState, useCallback } from "react";
import {
  FileText,
  Upload,
  Copy,
  RefreshCw,
  Loader2,
  AlertCircle,
  Download,
} from "lucide-react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";

const API_BASE =
  typeof window !== "undefined" ? "/api/backend" : "http://localhost:5002/api";

const ACCEPTED_TYPES = ".pdf,.txt,.docx";
const MAX_FILE_SIZE_MB = 5;

/**
 * Simplify My Report - Convert complex medical/cognitive reports
 * into simple, easy-to-understand language.
 * No diagnosis or medical advice. Educational only.
 */
export default function SimplifyReportPage() {
  const [inputText, setInputText] = useState("");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const reset = useCallback(() => {
    setResult(null);
    setError("");
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_FILE_SIZE_MB}MB`);
      setFile(null);
      setFileName("");
      return;
    }

    const ext = selected.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "txt", "docx"].includes(ext)) {
      setError("Please upload PDF, TXT, or DOCX only");
      setFile(null);
      setFileName("");
      return;
    }

    setFile(selected);
    setFileName(selected.name);
    setError("");
    setInputText(""); // Clear paste when file selected
  };

  const clearFile = () => {
    setFile(null);
    setFileName("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    let textToSend = inputText.trim();
    let useFile = false;

    if (file) {
      useFile = true;
    } else if (!textToSend || textToSend.length < 20) {
      setError(
        "Please paste at least 20 characters of your report, or upload a PDF, TXT, or DOCX file."
      );
      return;
    }

    setLoading(true);

    try {
      const userId =
        typeof window !== "undefined"
          ? localStorage.getItem("userId") || "demo-user-123"
          : "demo-user-123";

      let response;

      if (useFile) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("user_id", userId);

        response = await fetch(`${API_BASE}/simplify-report`, {
          method: "POST",
          body: formData,
        });
      } else {
        response = await fetch(`${API_BASE}/simplify-report`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textToSend, user_id: userId }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setResult(data.simplified);
    } catch (err) {
      setError(err.message || "Could not simplify report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard");
    }
  };

  const handleRegenerate = (e) => {
    e?.preventDefault?.();
    reset();
    // Re-submit with current input (textarea or file)
    handleSubmit({ preventDefault: () => {} });
  };

  const handleDownloadPdf = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 mb-4">
              <FileText className="w-7 h-7 sm:w-8 sm:h-8 text-teal-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Simplify My Report
            </h1>
            <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto">
              Upload or paste your report to get a simple explanation in
              easy-to-understand language.
            </p>
          </div>

          {/* Input form */}
          <form onSubmit={handleSubmit} className="space-y-4 mb-8">
            <div className="bg-white rounded-2xl border-2 border-teal-100 shadow-lg p-4 sm:p-6">
              {/* Paste area */}
              <div className="mb-4">
                <label
                  htmlFor="report-text"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Paste your report
                </label>
                <textarea
                  id="report-text"
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    if (file) clearFile();
                    reset();
                  }}
                  placeholder="Paste your medical or cognitive report here (at least 20 characters)..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all resize-y text-gray-800 placeholder-gray-400"
                  disabled={loading}
                />
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  or upload file
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* File upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload PDF, TXT, or DOCX
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-teal-200 hover:border-teal-400 hover:bg-teal-50/50 cursor-pointer transition-all">
                    <Upload className="w-5 h-5 text-teal-600" />
                    <span className="text-sm font-medium text-teal-700">
                      Choose file
                    </span>
                    <input
                      type="file"
                      accept={ACCEPTED_TYPES}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {fileName && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 rounded-xl">
                      <FileText className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate flex-1 min-w-0">
                        {fileName}
                      </span>
                      <button
                        type="button"
                        onClick={clearFile}
                        className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (!inputText.trim() && !file)}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Simplifying your report…
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Simplify Report
                </>
              )}
            </button>
          </form>

          {/* Output */}
          {result && (
            <div id="simplified-report-content" className="bg-white rounded-2xl border-2 border-teal-100 shadow-xl p-4 sm:p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-gray-900">
                  Simplified Report
                </h2>
                <div className="flex flex-wrap items-center gap-2 print:hidden" data-html2canvas-ignore="true">
                  <button
                    onClick={handleDownloadPdf}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-teal-200 hover:border-teal-300 hover:bg-teal-50 text-teal-700 font-medium transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-teal-200 hover:border-teal-300 hover:bg-teal-50 text-teal-700 font-medium transition-all"
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button
                    onClick={handleRegenerate}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-teal-200 hover:border-teal-300 hover:bg-teal-50 text-teal-700 font-medium transition-all disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Re-generate
                  </button>
                </div>
              </div>

              <div className="prose prose-teal max-w-none">
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed space-y-4 text-sm sm:text-base">
                  {result}
                </div>
              </div>
            </div>
          )}

          {/* Footer note */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 mb-4 max-w-lg mx-auto">
              This tool provides educational explanations only. It does not
              diagnose conditions or replace professional medical advice.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-semibold"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
