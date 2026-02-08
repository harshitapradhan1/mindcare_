"use client";
import { useState, useEffect, useRef } from "react";
import { Brain, Clock, CheckCircle, ArrowRight, ChevronRight, Eye, Type } from "lucide-react";
import Link from "next/link";
import TestResultNavigation from "@/components/TestResultNavigation";

const WORD_SETS = [
  ["apple", "river", "chair", "cloud", "book", "bridge", "garden", "doctor", "pillow", "camera"],
  ["school", "orange", "ladder", "window", "market", "bicycle", "flower", "ticket", "mountain", "table"],
  ["mango", "train", "mirror", "forest", "ocean", "library", "kitchen", "guitar", "butterfly", "diamond"],
  ["sunset", "piano", "island", "temple", "candle", "tiger", "castle", "volcano", "rainbow", "dragon"],
];

function normalizeWords(str) {
  return str
    .toLowerCase()
    .split(/[\s,]+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

export default function DelayedRecallTest() {
  const [phase, setPhase] = useState("instructions"); // instructions | encode | recall-mode | recall | results
  const [recallMode, setRecallMode] = useState("free"); // free | recognition
  const [targetWords, setTargetWords] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [selectedWords, setSelectedWords] = useState(new Set());
  const [metrics, setMetrics] = useState(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showAllWords, setShowAllWords] = useState(false);
  const [encodeTimer, setEncodeTimer] = useState(45);
  const timerRef = useRef(null);

  useEffect(() => {
    const stored = typeof window !== "undefined"
      ? localStorage.getItem("delayed_recall_targets")
      : null;

    if (stored) {
      setTargetWords(JSON.parse(stored));
      setPhase("recall-mode");
    }
  }, []);

  useEffect(() => {
    if (phase === "encode" && !showAllWords && currentWordIndex < targetWords.length) {
      timerRef.current = setTimeout(() => {
        if (currentWordIndex < targetWords.length - 1) {
          setCurrentWordIndex(currentWordIndex + 1);
        } else {
          setShowAllWords(true);
        }
      }, 2000); // Show each word for 2 seconds
      return () => clearTimeout(timerRef.current);
    }
  }, [phase, currentWordIndex, targetWords.length, showAllWords]);

  useEffect(() => {
    if (phase === "encode" && showAllWords && encodeTimer > 0) {
      timerRef.current = setTimeout(() => {
        setEncodeTimer(encodeTimer - 1);
      }, 1000);
      return () => clearTimeout(timerRef.current);
    }
  }, [phase, encodeTimer, showAllWords]);

  const handleFinishEncoding = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("delayed_recall_encoded_at", new Date().toISOString());
    }
    setPhase("recall-mode");
  };

  const handleSubmitRecall = async () => {
    const targets = new Set(targetWords.map((w) => w.toLowerCase()));
    let hits = 0;
    let intrusions = 0;
    const seen = new Set();

    if (recallMode === "free") {
      const recalled = normalizeWords(userInput);
      recalled.forEach((word) => {
        if (targets.has(word)) {
          if (!seen.has(word)) {
            hits += 1;
            seen.add(word);
          }
        } else {
          intrusions += 1;
        }
      });
    } else {
      // Recognition mode
      selectedWords.forEach((word) => {
        if (targets.has(word.toLowerCase())) {
          hits += 1;
        } else {
          intrusions += 1;
        }
      });
    }

    const totalTargets = targetWords.length;
    const accuracy = totalTargets > 0 ? hits / totalTargets : 0;
    const delayedRecallScore = Math.max(0, accuracy - intrusions * 0.05);

    const resultMetrics = {
      hits,
      intrusions,
      misses: Math.max(0, totalTargets - hits),
      accuracy,
      delayed_recall_score: delayedRecallScore,
      recall_mode: recallMode,
    };
    setMetrics(resultMetrics);
    setPhase("results");

    if (typeof window !== "undefined") {
      localStorage.removeItem("delayed_recall_targets");
      localStorage.removeItem("delayed_recall_encoded_at");
    }

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
            test_type: "delayed-recall",
            hits,
            intrusions,
            misses: Math.max(0, totalTargets - hits),
            accuracy,
            delayed_recall_score: delayedRecallScore,
            recall_mode: recallMode,
          },
        }),
      });
    } catch (err) {
      console.error("Error submitting delayed recall:", err);
    }
  };

  const toggleWordSelection = (word) => {
    setSelectedWords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(word)) {
        newSet.delete(word);
      } else {
        newSet.add(word);
      }
      return newSet;
    });
  };

  // Generate distractor words for recognition mode
  const generateDistractors = () => {
    const allWords = new Set(targetWords);
    const distractors = [];
    const distractorPool = [
      "tree", "car", "house", "bird", "fish", "star", "moon", "sun", "road", "door",
      "phone", "paper", "pen", "cup", "plate", "shoe", "hat", "bag", "key", "lock",
      "box", "ball", "toy", "game", "card", "ring", "coin", "map", "flag", "rope"
    ];
    
    while (distractors.length < targetWords.length && distractors.length < distractorPool.length) {
      const word = distractorPool[Math.floor(Math.random() * distractorPool.length)];
      if (!allWords.has(word) && !distractors.includes(word)) {
        distractors.push(word);
      }
    }
    
    return [...targetWords, ...distractors].sort(() => Math.random() - 0.5);
  };

  if (phase === "instructions") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl p-8 border-2 border-emerald-100">
          <Link
            href="/tests"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-4 transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span className="font-semibold">Back to Tests</span>
          </Link>
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl shadow-lg">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">Delayed Recall Activity</h1>
            </div>
            <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200 mb-6 text-left">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Eye className="w-5 h-5 text-emerald-600" />
                How it works
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>You&apos;ll see a list of items to remember</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Take your time to notice and remember them</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Later, you&apos;ll be asked what you recall</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>This activity helps track how well information is retained over time</span>
                </li>
              </ul>
            </div>
            <p className="text-xs text-gray-500 mb-6 italic">
              These activities are designed for self-awareness and cognitive tracking. They are not medical tests or diagnoses.
            </p>
            <button
              onClick={() => {
                const chosen = WORD_SETS[Math.floor(Math.random() * WORD_SETS.length)];
                setTargetWords(chosen);
                setCurrentWordIndex(0);
                setShowAllWords(false);
                setEncodeTimer(45);
                if (typeof window !== "undefined") {
                  localStorage.setItem("delayed_recall_targets", JSON.stringify(chosen));
                  localStorage.setItem("delayed_recall_encoded_at", new Date().toISOString());
                }
                setPhase("encode");
              }}
              className="w-full px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-lg hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <ChevronRight className="w-6 h-6" />
              Start Learning Phase
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "encode") {
    if (targetWords.length === 0) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
          <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl p-8 border-2 border-emerald-100">
            <p className="text-center text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl p-8 border-2 border-emerald-100">
          <Link
            href="/tests"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-4 transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span className="font-semibold">Back to Tests</span>
          </Link>
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Learning Phase</h1>
            </div>
            <p className="text-gray-600 mb-6">
              Try to remember these items. You&apos;ll be asked about them later.
            </p>
          </div>

          {!showAllWords ? (
            <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl p-12 mb-6 border-2 border-emerald-300">
              <div className="text-center">
                <div className="text-6xl font-bold text-emerald-700 mb-4 animate-pulse">
                  {targetWords[currentWordIndex]}
                </div>
                <div className="text-sm text-gray-600 mt-4">
                  Word {currentWordIndex + 1} of {targetWords.length}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 rounded-xl p-6 border-2 border-emerald-200 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-lg">All words to remember</h3>
                <div className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold">
                  {encodeTimer}s
                </div>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                {targetWords.map((w, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 rounded-lg bg-white text-emerald-700 border-2 border-emerald-300 text-base font-semibold shadow-md"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}

          {showAllWords && (
            <button
              onClick={handleFinishEncoding}
              className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center justify-center gap-2 text-lg"
            >
              <CheckCircle className="w-5 h-5" />
              I&apos;m ready to recall later
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase === "recall-mode") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl p-8 border-2 border-emerald-100">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Clock className="w-8 h-8 text-emerald-600" />
              <h2 className="text-2xl font-bold text-gray-900">Recall Phase</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Choose how you&apos;d like to recall the items:
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => {
                setRecallMode("free");
                setPhase("recall");
              }}
              className="p-6 rounded-xl border-2 border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
            >
              <Type className="w-8 h-8 text-emerald-600 mb-3" />
              <div className="font-bold text-gray-900 mb-2">Free Recall</div>
              <div className="text-sm text-gray-600">
                Type or write all the items you remember
              </div>
            </button>
            <button
              onClick={() => {
                setRecallMode("recognition");
                setPhase("recall");
              }}
              className="p-6 rounded-xl border-2 border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
            >
              <CheckCircle className="w-8 h-8 text-emerald-600 mb-3" />
              <div className="font-bold text-gray-900 mb-2">Recognition</div>
              <div className="text-sm text-gray-600">
                Select the correct items from a list
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "recall") {
    if (targetWords.length === 0) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
          <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl p-8 border-2 border-emerald-100">
            <p className="text-center text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    if (recallMode === "free") {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
          <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl p-8 border-2 border-emerald-100">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-6 h-6 text-emerald-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                What do you remember?
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Type as many of the words as you can remember. There is no penalty for leaving blanks.
            </p>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              rows={6}
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Type the words you remember, separated by spaces or commas..."
            />
            <button
              onClick={handleSubmitRecall}
              className="w-full mt-4 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center justify-center gap-2 text-lg"
            >
              <CheckCircle className="w-5 h-5" />
              Submit Recall
            </button>
          </div>
        </div>
      );
    } else {
      const allOptions = generateDistractors();
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl p-8 border-2 border-emerald-100">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Select the items you saw earlier
              </h2>
            </div>
            <p className="text-gray-600 mb-6">
              Click on the words you remember seeing in the learning phase.
            </p>
            <div className="flex flex-wrap gap-3 mb-6">
              {allOptions.map((word, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleWordSelection(word)}
                  className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                    selectedWords.has(word)
                      ? "bg-emerald-600 text-white border-2 border-emerald-700 shadow-lg scale-105"
                      : "bg-gray-100 text-gray-700 border-2 border-gray-300 hover:border-emerald-400 hover:bg-emerald-50"
                  }`}
                >
                  {word}
                </button>
              ))}
            </div>
            <div className="mb-4 text-sm text-gray-600">
              Selected: {selectedWords.size} items
            </div>
            <button
              onClick={handleSubmitRecall}
              className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center justify-center gap-2 text-lg"
            >
              <CheckCircle className="w-5 h-5" />
              Submit Selection
            </button>
          </div>
        </div>
      );
    }
  }

  if (phase === "results" && metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-emerald-100 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Delayed Recall Summary
              </h2>
            </div>
            <p className="text-gray-600 mb-6 text-sm">
              This activity helps track how well information is retained over time. These numbers are for self-awareness only and are not a medical diagnosis.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl p-6 border-2 border-emerald-300">
                <div className="text-xs text-emerald-800 font-semibold mb-2">Correct Recalls</div>
                <div className="text-4xl font-bold text-emerald-900">
                  {metrics.hits}
                </div>
                <div className="text-xs text-emerald-700 mt-1">out of {targetWords.length}</div>
              </div>
              <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl p-6 border-2 border-amber-300">
                <div className="text-xs text-amber-800 font-semibold mb-2">Intrusions</div>
                <div className="text-4xl font-bold text-amber-900">
                  {metrics.intrusions}
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl p-6 border-2 border-blue-300">
                <div className="text-xs text-blue-800 font-semibold mb-2">Misses</div>
                <div className="text-4xl font-bold text-blue-900">
                  {metrics.misses}
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-6 border-2 border-purple-300">
                <div className="text-xs text-purple-800 font-semibold mb-2">Accuracy</div>
                <div className="text-4xl font-bold text-purple-900">
                  {(metrics.accuracy * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
          <TestResultNavigation 
            testName="Delayed Recall" 
            score={metrics.delayed_recall_score * 100} 
          />
        </div>
      </div>
    );
  }

  return null;
}
