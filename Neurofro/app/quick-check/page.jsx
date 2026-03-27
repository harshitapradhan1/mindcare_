"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Brain,
  ChevronRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import {
  generateSessionData,
  MEMORY_DISPLAY_SECONDS,
  MAX_POINTS,
} from "@/lib/quickCheckConfig";

const API_BASE =
  typeof window !== "undefined" ? "/api/backend" : "http://localhost:5002/api";

export default function QuickCheckPage() {
  const [sessionData, setSessionData] = useState(null);
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState({});
  const [memoryCountdown, setMemoryCountdown] = useState(MEMORY_DISPLAY_SECONDS);
  const [completed, setCompleted] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserId(localStorage.getItem("userId") || "demo-user-123");
      setSessionData(generateSessionData());
    }
  }, []);

  // Memory countdown timer
  useEffect(() => {
    if (step === 1 && memoryCountdown > 0) {
      const t = setInterval(() => setMemoryCountdown((c) => c - 1), 1000);
      return () => clearInterval(t);
    } else if (step === 1 && memoryCountdown <= 0) {
      // Auto-advance after countdown
      setStep(2);
    }
  }, [step, memoryCountdown]);

  const selectAnswer = useCallback((questionId, value) => {
    setResponses((r) => ({ ...r, [questionId]: value }));
  }, []);

  const N = sessionData?.questions?.length || 0;
  // Steps: 0: Intro, 1: Memory Show, 2 to 2+N-1: Questions, 2+N: Recall
  const totalSteps = 1 + 1 + N + 1; 

  // current progress based on max step (do not count Intro or memory show or results towards the MCQ progress bar tightly)
  const currentProgress = step > 1 && step < totalSteps ? ((step - 1) / (N + 1)) * 100 : step >= totalSteps ? 100 : 0;

  const goNext = () => {
    if (step < totalSteps - 1) setStep((s) => s + 1);
  };

  const goBack = () => {
    if (step > 2) setStep((s) => s - 1); // allow going back to previous questions, but not to the timer
  };

  // Compute score
  const computeScore = useCallback(() => {
    if (!sessionData) return { points: 0, score100: 0, memoryPts: 0, orientationPts: 0, attentionPts: 0 };
    let points = 0;
    let orientationPts = 0;
    let attentionPts = 0;

    sessionData.questions.forEach((q) => {
      if (responses[q.id] === q.correct) {
        points += q.points;
        if (q.category === "orientation") orientationPts += q.points;
        if (q.category === "attention" || q.category === "logic") attentionPts += q.points; // group math/logic together for breakdown
      }
    });

    // Delayed recall - 1 pt per correct word (case-insensitive, partial match)
    const recalled = (responses.recall || "").trim().toLowerCase().split(/\s*[,;]\s*|\s+/).filter(Boolean);
    const target = sessionData.memoryWords.map((w) => w.toLowerCase());
    let memoryPts = 0;
    for (const w of target) {
      if (recalled.some((r) => r.includes(w) || w.includes(r))) memoryPts += 1;
    }
    points += memoryPts;

    const score100 = Math.round((points / MAX_POINTS) * 100);
    return { points, score100, memoryPts, orientationPts, attentionPts };
  }, [responses, sessionData]);

  // Submit on completion
  useEffect(() => {
    if (!completed || result || submitting || !sessionData) return;
    const submit = async () => {
      setSubmitting(true);
      const { points, score100, memoryPts, orientationPts, attentionPts } = computeScore();
      
      const payload = {
        user_id: userId || "demo-user-123",
        test_results: {
          test_type: "quick-check",
          score: score100,
          accuracy: score100 / 100,
          orientation_points: orientationPts,
          memory_points: memoryPts,
          attention_points: attentionPts,
          responses: { ...responses },
          memory_words_shown: sessionData.memoryWords,
        },
      };
      try {
        const res = await fetch(`${API_BASE}/neurotwin/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Save failed");
        }
      } catch (e) {
        console.warn("Could not save quick check:", e);
      }
      setResult({ points, score100, memoryPts });
      setSubmitting(false);
    };
    submit();
  }, [completed, result, submitting, userId, computeScore, responses, sessionData]);

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-teal-600" />
      </div>
    );
  }

  const isIntro = step === 0;
  const isMemoryShow = step === 1;
  const isQuestion = step >= 2 && step < 2 + N;
  const isRecall = step === 2 + N;
  const isResults = completed;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50">
        <div className="max-w-lg mx-auto px-4 py-8">
          {/* Progress bar */}
          {!isIntro && !isMemoryShow && !isResults && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                 <p className="text-sm font-medium text-teal-700">Cognitive Check in Progress</p>
                 <p className="text-xs text-teal-600 font-bold bg-teal-100 px-2 py-1 rounded-lg">
                   {step - 1} / {N + 1}
                 </p>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${currentProgress}%` }}
                />
              </div>
            </div>
          )}

          {isIntro && (
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 text-center transform transition-all">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Brain className="w-8 h-8 text-teal-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Quick Cognitive Check
              </h1>
              <p className="text-gray-600 mb-6">
                A dynamic, 3-minute check designed to be taken frequently. Questions refresh every session.
              </p>
              <ul className="text-left text-sm text-gray-600 space-y-3 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-teal-500" /> Memorization phase</li>
                <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> 6 Randomized tasks</li>
                <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500" /> Delayed recall</li>
              </ul>
              <button
                onClick={() => setStep(1)}
                className="w-full py-4 px-6 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl font-bold hover:from-teal-600 hover:to-blue-700 transition-all shadow-md transform hover:scale-[1.02]"
              >
                Start Quick Check
              </button>
            </div>
          )}

          {isMemoryShow && (
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Memory Task</h2>
              <p className="text-gray-600 mb-8">Memorize these three words for later:</p>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8">
                <p className="text-3xl font-black text-teal-700 tracking-wider">
                  {sessionData.memoryWords.join(" • ")}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-teal-600 bg-teal-50 px-4 py-2 rounded-full inline-flex">
                <Clock className="w-5 h-5 animate-pulse" />
                <span className="font-bold">{memoryCountdown > 0 ? `${memoryCountdown} seconds` : "Continuing…"}</span>
              </div>
            </div>
          )}

          {isQuestion && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200 animate-in slide-in-from-right-4 duration-300">
              <QuestionStep
                question={sessionData.questions[step - 2]}
                value={responses[sessionData.questions[step - 2].id]}
                onSelect={(v) => selectAnswer(sessionData.questions[step - 2].id, v)}
                onNext={goNext}
                canNext={!!responses[sessionData.questions[step - 2].id]}
                onBack={goBack}
                showBack={step > 2}
              />
            </div>
          )}

          {isRecall && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200 animate-in fade-in duration-300">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-amber-600" />
              </div>
              <p className="text-xl font-bold text-gray-900 mb-2">Delayed Recall</p>
              <p className="text-gray-600 mb-6">
                What were the {sessionData.memoryWords.length} words you were asked to remember at the start? Type them separated by commas.
              </p>
              <input
                type="text"
                value={responses.recall || ""}
                onChange={(e) => selectAnswer("recall", e.target.value)}
                placeholder="Type the 3 words here"
                className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-lg shadow-inner"
              />
              <div className="flex gap-3 mt-8">
                <button
                  onClick={goBack}
                  className="px-6 py-3 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-medium"
                >
                  Back
                </button>
                <button
                  onClick={() => setCompleted(true)}
                  className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white rounded-xl font-bold shadow-md transform transition-all hover:scale-[1.02]"
                >
                  Finish Test
                </button>
              </div>
            </div>
          )}

          {isResults && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200 animate-in fade-in duration-500">
              {submitting ? (
                <div className="flex flex-col items-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin text-teal-600 mb-4" />
                  <p className="text-gray-600 font-medium">Analyzing your results…</p>
                </div>
              ) : result ? (
                <ResultsView
                  score={result.score100}
                  points={result.points}
                  memoryPts={result.memoryPts}
                />
              ) : null}
            </div>
          )}

          {!isIntro && !isResults && (
            <p className="text-center text-xs text-gray-400 mt-6 flex items-center justify-center gap-1">
              <AlertCircle className="w-3 h-3" /> Questions adapt dynamically directly on your device.
            </p>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

function QuestionStep({ question, value, onSelect, onNext, canNext, onBack, showBack }) {
  // Map category to readable tag
  const cats = {
    orientation: { l: "Orientation", c: "bg-blue-100 text-blue-800" },
    attention: { l: "Attention & Math", c: "bg-amber-100 text-amber-800" },
    logic: { l: "Pattern Logic", c: "bg-purple-100 text-purple-800" },
    language: { l: "Language", c: "bg-emerald-100 text-emerald-800" },
  };
  const badge = cats[question.category] || { l: "Task", c: "bg-gray-100 text-gray-800" };

  return (
    <>
      <div className="mb-6 flex space-between">
         <span className={`text-xs font-bold px-3 py-1 rounded-full ${badge.c} tracking-wide uppercase`}>
           {badge.l}
         </span>
      </div>
      <p className="text-xl font-bold text-gray-900 mb-8 leading-relaxed">{question.question}</p>
      <div className="space-y-3">
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => onSelect(opt)}
            className={`w-full py-4 px-5 rounded-xl border-2 text-left font-semibold transition-all ${
              value === opt
                ? "border-teal-500 bg-teal-50 text-teal-900 scale-[1.01] shadow-sm transform"
                : "border-gray-200 hover:border-teal-300 hover:bg-teal-50/30 text-gray-700"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      <div className="flex gap-3 mt-8">
        {showBack && (
          <button onClick={onBack} className="px-6 py-3 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-medium">
            Back
          </button>
        )}
        <button
          onClick={onNext}
          disabled={!canNext}
          className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-md transition-all active:scale-[0.98]"
        >
          Next <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </>
  );
}

function ResultsView({ score, points, memoryPts }) {
  const insight =
    memoryPts >= 2
      ? "Your memory recall was strong today."
      : score >= 70
        ? "Your overall performance patterns look consistent."
        : "Patterns indicate room for variation. Regular checks help track trends.";
  const suggestion =
    memoryPts < 2
      ? "Try memory match games to boost active recall."
      : score >= 70
        ? "Keep up regular checks to maintain awareness."
        : "Re-take the test later to track consistency.";

  return (
    <>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-teal-100 mb-4 animate-bounce">
           <CheckCircle className="w-10 h-10 text-teal-600" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">Check Complete</h2>
        <div className="bg-gradient-to-r from-teal-50 to-blue-50 py-4 rounded-2xl border border-teal-100 mt-6 shadow-inner">
           <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600 mb-1">{score}</p>
           <p className="text-sm font-bold text-gray-500 tracking-widest uppercase">Points / 100</p>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div className="p-5 rounded-xl bg-teal-50 border border-teal-200 shadow-sm">
          <p className="font-bold text-teal-800 text-sm tracking-wide uppercase mb-1">Quick insight</p>
          <p className="text-base text-teal-900">{insight}</p>
        </div>
        <div className="p-5 rounded-xl bg-blue-50 border border-blue-200 shadow-sm">
          <p className="font-bold text-blue-800 text-sm tracking-wide uppercase mb-1">Suggestion</p>
          <p className="text-base text-blue-900">{suggestion}</p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 mt-6">
        <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-900">
          This check reflects your current performance and is not a medical diagnosis.
        </p>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => window.location.reload()}
          className="flex-1 py-4 text-center border-2 border-teal-300 text-teal-700 bg-white rounded-xl font-bold hover:bg-teal-50 transition-all active:scale-[0.98]"
        >
          Take New Version
        </button>
        <Link
          href="/dashboard"
          className="flex-1 py-4 text-center bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
        >
          Back to Dashboard
        </Link>
      </div>
    </>
  );
}
