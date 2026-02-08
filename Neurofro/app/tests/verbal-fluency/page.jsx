"use client";
import { useState, useEffect, useRef } from "react";
import { Mic, Brain, Clock, CheckCircle, ArrowRight, Play, RotateCcw, ChevronRight } from "lucide-react";
import Link from "next/link";
import TestResultNavigation from "@/components/TestResultNavigation";

function normalizeWords(str) {
  return str
    .toLowerCase()
    .split(/[\s,]+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

const CATEGORIES = [
  { name: "Animals", examples: "e.g., dog, cat, bird, fish" },
  { name: "Fruits", examples: "e.g., apple, banana, orange, grape" },
  { name: "Vehicles", examples: "e.g., car, bus, bike, plane" },
  { name: "Colors", examples: "e.g., red, blue, green, yellow" },
  { name: "Body Parts", examples: "e.g., hand, foot, eye, ear" },
];

const LETTERS = ["S", "F", "A", "T", "C", "P"];

export default function VerbalFluencyTest() {
  const [mode, setMode] = useState("category"); // category | letter
  const [phase, setPhase] = useState("setup"); // setup | playing | results
  const [selectedCategory, setSelectedCategory] = useState("Animals");
  const [selectedLetter, setSelectedLetter] = useState("S");
  const [userInput, setUserInput] = useState("");
  const [detectedWords, setDetectedWords] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining]);

  const handleTimeUp = () => {
    handleSubmit();
  };

  const startTest = () => {
    setUserInput("");
    setDetectedWords([]);
    setMetrics(null);
    setTimeRemaining(60);
    setIsRunning(true);
    setPhase("playing");
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setUserInput(value);
    
    // Auto-detect words as user types
    const words = normalizeWords(value);
    setDetectedWords(words);
  };

  const handleSubmit = async () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const words = normalizeWords(userInput);
    const seen = new Set();
    let repetitions = 0;

    words.forEach((w) => {
      if (seen.has(w)) repetitions += 1;
      else seen.add(w);
    });

    const uniqueWords = seen.size;
    const durationSec = 60 - timeRemaining || 60;
    const speechRateWpm = durationSec > 0 ? (words.length / durationSec) * 60 : 0;

    const resultMetrics = {
      unique_words: uniqueWords,
      total_words: words.length,
      repetitions,
      speech_rate_wpm: speechRateWpm,
      duration_sec: durationSec,
    };
    setMetrics(resultMetrics);
    setPhase("results");

    const userId =
      typeof window !== "undefined"
        ? localStorage.getItem("userId") || "demo-user-123"
        : "demo-user-123";
    const API_BASE =
      typeof window !== "undefined" ? "/api/backend" : "http://localhost:5002/api";

    try {
      await fetch(`${API_BASE}/neurotwin/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          test_results: {
            test_type: "verbal-fluency",
            variant: mode,
            category: mode === "category" ? selectedCategory : null,
            letter: mode === "letter" ? selectedLetter : null,
            duration_sec: durationSec,
            unique_words: uniqueWords,
            total_words: words.length,
            repetitions,
            speech_rate_wpm: speechRateWpm,
          },
        }),
      });
    } catch (err) {
      console.error("Error submitting verbal fluency:", err);
    }
  };

  const resetTest = () => {
    setPhase("setup");
    setUserInput("");
    setDetectedWords([]);
    setMetrics(null);
    setTimeRemaining(60);
    setIsRunning(false);
  };

  if (phase === "setup") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl p-8 border-2 border-indigo-100">
          <Link
            href="/tests"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-4 transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span className="font-semibold">Back to Tests</span>
          </Link>
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-indigo-500 to-sky-600 p-3 rounded-xl shadow-lg">
                <Mic className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">Verbal Fluency Activity</h1>
            </div>
            <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200 mb-6 text-left">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-600" />
                How it works
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span>Name as many words as you can in 60 seconds</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span>Speak naturally or type your words</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span>This activity tracks language fluency and mental retrieval speed over time</span>
                </li>
              </ul>
            </div>
            <p className="text-xs text-gray-500 mb-6 italic">
              These activities are designed for self-awareness and cognitive tracking. They are not medical tests or diagnoses.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setMode("category")}
              className={`p-6 rounded-xl border-2 text-left transition-all ${
                mode === "category"
                  ? "border-indigo-500 bg-indigo-50 shadow-lg"
                  : "border-gray-200 hover:border-indigo-300"
              }`}
            >
              <div className="font-bold text-lg text-gray-900 mb-2">Category Fluency</div>
              <div className="text-sm text-gray-600">
                Name items from a category (e.g., animals, fruits, vehicles)
              </div>
            </button>
            <button
              onClick={() => setMode("letter")}
              className={`p-6 rounded-xl border-2 text-left transition-all ${
                mode === "letter"
                  ? "border-indigo-500 bg-indigo-50 shadow-lg"
                  : "border-gray-200 hover:border-indigo-300"
              }`}
            >
              <div className="font-bold text-lg text-gray-900 mb-2">Letter Fluency</div>
              <div className="text-sm text-gray-600">
                Name words starting with a specific letter
              </div>
            </button>
          </div>

          {mode === "category" && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Choose a category:
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedCategory === cat.name
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{cat.name}</div>
                    <div className="text-xs text-gray-600 mt-1">{cat.examples}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "letter" && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Choose a letter:
              </label>
              <div className="flex flex-wrap gap-3">
                {LETTERS.map((letter) => (
                  <button
                    key={letter}
                    onClick={() => setSelectedLetter(letter)}
                    className={`w-16 h-16 rounded-lg border-2 font-bold text-2xl transition-all ${
                      selectedLetter === letter
                        ? "border-indigo-500 bg-indigo-500 text-white shadow-lg scale-110"
                        : "border-gray-300 text-gray-700 hover:border-indigo-400"
                    }`}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={startTest}
            className="w-full mt-6 px-8 py-4 bg-gradient-to-r from-indigo-500 to-sky-600 text-white rounded-xl font-bold text-lg hover:from-indigo-600 hover:to-sky-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <Play className="w-6 h-6" />
            <span>Start 60-Second Task</span>
          </button>
        </div>
      </div>
    );
  }

  if (phase === "playing") {
    const prompt = mode === "category"
      ? `Name as many ${selectedCategory.toLowerCase()} as you can`
      : `Name as many words starting with "${selectedLetter}" as you can`;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl p-8 border-2 border-indigo-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Mic className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-900">Verbal Fluency Task</h2>
            </div>
            <div className={`px-6 py-3 rounded-xl font-bold text-2xl ${
              timeRemaining <= 10 
                ? "bg-red-500 text-white animate-pulse" 
                : "bg-indigo-600 text-white"
            }`}>
              {timeRemaining}s
            </div>
          </div>

          <div className="bg-indigo-50 rounded-xl p-6 border-2 border-indigo-200 mb-6">
            <p className="text-center text-lg font-semibold text-gray-900 mb-2">
              {prompt}
            </p>
            <p className="text-center text-sm text-gray-600">
              Type or speak your words (separated by spaces or commas)
            </p>
          </div>

          <textarea
            value={userInput}
            onChange={handleInputChange}
            rows={6}
            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
            placeholder="Start typing or speaking your words..."
            autoFocus
          />

          {detectedWords.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-2">
                Words detected: <span className="font-bold text-indigo-600">{detectedWords.length}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {detectedWords.slice(-10).map((word, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-indigo-100 text-indigo-700 text-sm font-medium border border-indigo-200"
                  >
                    {word}
                  </span>
                ))}
                {detectedWords.length > 10 && (
                  <span className="px-3 py-1 rounded-lg bg-gray-200 text-gray-600 text-sm">
                    +{detectedWords.length - 10} more
                  </span>
                )}
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            className="w-full px-6 py-4 bg-gradient-to-r from-indigo-500 to-sky-600 text-white rounded-xl font-bold hover:from-indigo-600 hover:to-sky-700 transition-all flex items-center justify-center gap-2 text-lg"
          >
            <CheckCircle className="w-5 h-5" />
            Submit Words
          </button>

          <p className="mt-4 text-xs text-gray-500 text-center">
            In a future version, this task will use your spoken words via the speech analysis pipeline.
          </p>
        </div>
      </div>
    );
  }

  if (phase === "results" && metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-indigo-100 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-8 h-8 text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Verbal Fluency Summary
              </h2>
            </div>
            <p className="text-gray-600 mb-6 text-sm">
              This task is inspired by validated verbal fluency assessments and is meant for self-awareness only, not diagnosis.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-indigo-100 to-sky-100 rounded-xl p-6 border-2 border-indigo-300">
                <div className="text-xs text-indigo-800 font-semibold mb-2">Unique Words</div>
                <div className="text-4xl font-bold text-indigo-900">
                  {metrics.unique_words}
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl p-6 border-2 border-emerald-300">
                <div className="text-xs text-emerald-800 font-semibold mb-2">Total Words</div>
                <div className="text-4xl font-bold text-emerald-900">
                  {metrics.total_words}
                </div>
              </div>
              <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl p-6 border-2 border-amber-300">
                <div className="text-xs text-amber-800 font-semibold mb-2">Repetitions</div>
                <div className="text-4xl font-bold text-amber-900">
                  {metrics.repetitions}
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-6 border-2 border-purple-300">
                <div className="text-xs text-purple-800 font-semibold mb-2">Words/Min</div>
                <div className="text-4xl font-bold text-purple-900">
                  {metrics.speech_rate_wpm.toFixed(1)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Link
              href="/tests"
              className="flex-1 bg-gradient-to-r from-indigo-500 to-sky-600 hover:from-indigo-600 hover:to-sky-700 text-white font-bold py-5 px-6 rounded-xl transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 text-lg"
            >
              <span>Back to Tests</span>
              <ChevronRight className="w-6 h-6" />
            </Link>
            <button
              onClick={resetTest}
              className="flex-1 bg-white hover:bg-gray-50 text-indigo-600 border-2 border-indigo-600 font-bold py-5 px-6 rounded-xl transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 text-lg"
            >
              <RotateCcw className="w-6 h-6" />
              <span>Retake Test</span>
            </button>
          </div>

          <TestResultNavigation 
            testName="Verbal Fluency" 
            score={metrics.unique_words} 
          />
        </div>
      </div>
    );
  }

  return null;
}
