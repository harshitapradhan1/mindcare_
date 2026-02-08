"use client";
import { useState, useEffect, useRef } from 'react';
import { Brain, Play, RotateCcw, CheckCircle, X, Clock, ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import TestResultNavigation from '@/components/TestResultNavigation';

export default function DigitSpanTest() {
  const [gameState, setGameState] = useState('setup'); // setup, playing, results
  const [testType, setTestType] = useState('forward'); // forward or backward
  const [currentSequence, setCurrentSequence] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(3);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState({ correct: 0, total: 0, maxLevel: 3 });
  const [reactionTimes, setReactionTimes] = useState([]);
  const [showSequence, setShowSequence] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [round, setRound] = useState(0);
  const [maxRounds] = useState(10);

  const timerRef = useRef(null);
  const sequenceStartRef = useRef(null);

  const generateSequence = (length) => {
    const digits = [];
    for (let i = 0; i < length; i++) {
      digits.push(Math.floor(Math.random() * 9) + 1); // 1-9
    }
    return digits;
  };

  const startGame = () => {
    setCurrentLevel(3);
    setScore({ correct: 0, total: 0, maxLevel: 3 });
    setReactionTimes([]);
    setRound(0);
    setGameState('playing');
    startRound();
  };

  const startRound = () => {
    const seq = generateSequence(currentLevel);
    setCurrentSequence(seq);
    setUserInput('');
    setShowSequence(true);
    setIsCorrect(null);
    sequenceStartRef.current = Date.now();

    // Show sequence for 1 second per digit
    setTimeout(() => {
      setShowSequence(false);
    }, seq.length * 1000);
  };

  const handleInputChange = (e) => {
    setUserInput(e.target.value.replace(/\D/g, '')); // Only digits
  };

  const handleSubmit = () => {
    if (!userInput) return;

    const reactionTime = Date.now() - sequenceStartRef.current;
    setReactionTimes(prev => [...prev, reactionTime]);

    let expectedSequence;
    if (testType === 'forward') {
      expectedSequence = currentSequence.join('');
    } else {
      expectedSequence = [...currentSequence].reverse().join('');
    }

    const correct = userInput === expectedSequence;
    setIsCorrect(correct);

    if (correct) {
        setScore(prev => {
          const newScore = { 
          ...prev, 
        correct: prev.correct + 1,
        total: prev.total + 1,
        maxLevel: Math.max(prev.maxLevel, currentLevel)
          };

      // Increase difficulty after 2 correct answers at same level
          if ((prev.correct + 1) % 2 === 0) {
            setCurrentLevel(current => current + 1);
      }
          
          return newScore;
        });
      } else {
        setScore(prev => ({ 
          ...prev, 
        total: prev.total + 1
      }));
      // Decrease difficulty on error
      if (currentLevel > 3) {
        setCurrentLevel(current => current - 1);
      }
    }

    setTimeout(() => {
      const nextRound = round + 1;
      if (nextRound >= maxRounds) {
        endGame();
      } else {
        setRound(nextRound);
        startRound();
      }
    }, 1500);
  };

  const endGame = () => {
    setGameState('results');
    submitResults();
  };

  const submitResults = async () => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : 'demo-user-123';
    const accuracy = score.total > 0 ? (score.correct / score.total) * 100 : 0;
    const avgReactionTime = reactionTimes.length > 0 
      ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
      : 0;
    const API_BASE = typeof window !== 'undefined' ? '/api/backend' : 'http://localhost:5002/api';

    try {
      const predictResponse = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accuracy: accuracy / 100,
          reaction_time: avgReactionTime / 1000,
          retries: score.total - score.correct,
          level: score.maxLevel,
          total_time: maxRounds * 3
        })
      });

      if (!predictResponse.ok) {
        console.warn('Prediction API error:', await predictResponse.text());
      }

      try {
        await fetch(`${API_BASE}/neurotwin/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            test_results: {
              test_type: 'digit-span',
              test_mode: testType,
              accuracy: accuracy / 100,
              reaction_time: avgReactionTime / 1000,
              max_level: score.maxLevel,
              rounds: maxRounds
            }
          })
        });
      } catch (neurotwinError) {
        console.error('Error updating NeuroTwin:', neurotwinError);
      }
    } catch (error) {
      console.error('Error submitting results:', error);
    }
  };

  const resetGame = () => {
    setGameState('setup');
    setCurrentLevel(3);
    setScore({ correct: 0, total: 0, maxLevel: 3 });
    setReactionTimes([]);
    setRound(0);
    setUserInput('');
  };

  if (gameState === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <Link href="/tests" className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-4 transition-colors">
            <ChevronRight className="w-4 h-4 rotate-180" />
            <span className="font-semibold">Back to Tests</span>
          </Link>

            <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-3 rounded-xl shadow-lg">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">
                Digit Span Test
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Test your working memory by recalling sequences of digits in forward or backward order
            </p>
            </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-violet-100">
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-800 mb-3">
                Test Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setTestType('forward')}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    testType === 'forward'
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-gray-200 hover:border-violet-300'
                  }`}
                >
                  <ArrowRight className="w-8 h-8 mx-auto mb-2 text-violet-600" />
                  <div className="font-bold text-gray-900">Forward</div>
                  <div className="text-sm text-gray-600">Recall in same order</div>
                </button>
                <button
                  onClick={() => setTestType('backward')}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    testType === 'backward'
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-gray-200 hover:border-violet-300'
                  }`}
                >
                  <ArrowLeft className="w-8 h-8 mx-auto mb-2 text-violet-600" />
                  <div className="font-bold text-gray-900">Backward</div>
                  <div className="text-sm text-gray-600">Recall in reverse order</div>
                </button>
              </div>
            </div>

            <div className="bg-violet-50 rounded-xl p-6 mb-6 border border-violet-200">
              <h3 className="font-bold text-gray-900 mb-3">Instructions</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                  <span>You'll see a sequence of digits displayed one by one</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                  <span>{testType === 'forward' ? 'Enter the digits in the same order' : 'Enter the digits in reverse order'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                  <span>Difficulty increases as you succeed</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                  <span>Complete {maxRounds} rounds</span>
                </li>
              </ul>
            </div>

            <button
              onClick={startGame}
              className="w-full mt-8 px-8 py-5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl hover:from-violet-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-2xl font-bold text-lg flex items-center justify-center gap-2 group"
            >
              <Play className="w-6 h-6" />
              <span>Start Test</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'playing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-violet-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-violet-500 to-purple-600 px-5 py-3 rounded-xl shadow-md">
                  <div className="text-white font-bold text-lg">Round {round + 1}/{maxRounds}</div>
              </div>
                <div className="flex items-center gap-2 bg-violet-100 px-4 py-2 rounded-lg">
                  <Brain className="w-5 h-5 text-violet-600" />
                  <span className="font-bold text-violet-900">Level: {currentLevel} digits</span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-lg border border-green-300">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-bold text-green-900">{score.correct}/{score.total}</span>
                </div>
              </div>
            </div>

          <div className="bg-white rounded-2xl shadow-2xl p-12 border-2 border-violet-100">
            {showSequence ? (
              <div className="text-center">
                <p className="text-gray-700 mb-8 text-xl font-semibold">Watch the sequence:</p>
                <div className="flex justify-center items-center gap-4 mb-8">
                  {currentSequence.map((digit, idx) => (
                    <div
                      key={idx}
                      className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-xl flex items-center justify-center text-4xl font-bold shadow-lg animate-pulse"
                    >
                      {digit}
                    </div>
                  ))}
                </div>
                <p className="text-gray-500">Remember this sequence...</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-700 mb-6 text-xl font-semibold">
                  Enter the digits {testType === 'forward' ? 'in order' : 'in reverse order'}:
                </p>
                <input
                  type="text"
                  value={userInput}
                  onChange={handleInputChange}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                  className="text-4xl font-mono text-center w-full px-6 py-4 border-4 border-violet-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-violet-200 focus:border-violet-500 mb-6"
                  placeholder="Enter digits..."
                  autoFocus
                />
                {isCorrect !== null && (
                  <div className={`mb-4 p-4 rounded-xl ${
                    isCorrect ? 'bg-green-100 border-2 border-green-300' : 'bg-red-100 border-2 border-red-300'
                  }`}>
                    {isCorrect ? (
                      <div className="flex items-center justify-center gap-2 text-green-700 font-bold">
                        <CheckCircle className="w-6 h-6" />
                        <span>Correct!</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-red-700 font-bold">
                        <X className="w-6 h-6" />
                        <span>Incorrect. Expected: {testType === 'forward' ? currentSequence.join('') : [...currentSequence].reverse().join('')}</span>
                      </div>
                    )}
                  </div>
                )}
                <button
                  onClick={handleSubmit}
                  className="px-8 py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl hover:from-violet-600 hover:to-purple-700 transition-all shadow-lg font-bold text-lg"
                >
                  Submit
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'results') {
    const accuracy = score.total > 0 ? (score.correct / score.total) * 100 : 0;
    const avgReactionTime = reactionTimes.length > 0
      ? (reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length / 1000).toFixed(2)
      : '0';

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-3xl w-full">
            <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-br from-violet-500 to-purple-600 p-5 rounded-2xl mb-4 shadow-xl">
              <Brain className="w-14 h-14 text-white" />
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-3">Test Complete!</h2>
            <p className="text-gray-600 text-xl">Your working memory assessment results</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6 border-2 border-violet-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Brain className="w-6 h-6 text-violet-600" />
              Performance Metrics
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl p-6 border-2 border-green-300">
                <div className="text-sm text-green-800 font-semibold mb-2">Accuracy</div>
                <div className="text-4xl font-bold text-green-900">{accuracy.toFixed(1)}%</div>
              </div>
              <div className="bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl p-6 border-2 border-violet-300">
                <div className="text-sm text-violet-800 font-semibold mb-2">Max Level</div>
                <div className="text-4xl font-bold text-violet-900">{score.maxLevel} digits</div>
            </div>
              <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl p-6 border-2 border-blue-300">
                <div className="text-sm text-blue-800 font-semibold mb-2">Avg Reaction</div>
                <div className="text-4xl font-bold text-blue-900">{avgReactionTime}s</div>
              </div>
              <div className="bg-gradient-to-br from-teal-100 to-blue-100 rounded-xl p-6 border-2 border-teal-300">
                <div className="text-sm text-teal-800 font-semibold mb-2">Correct Answers</div>
                <div className="text-4xl font-bold text-teal-900">{score.correct}/{score.total}</div>
              </div>
              </div>
            </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
                href="/tests"
              className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-bold py-5 px-6 rounded-xl transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 text-lg"
              >
                <span>Back to Tests</span>
              <ChevronRight className="w-6 h-6" />
            </Link>
            <button
              onClick={resetGame}
              className="flex-1 bg-white hover:bg-gray-50 text-violet-600 border-2 border-violet-600 font-bold py-5 px-6 rounded-xl transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 text-lg"
            >
              <RotateCcw className="w-6 h-6" />
              <span>Retake Test</span>
            </button>
          </div>

          {/* Navigation to NeuroTwin and Dashboard */}
          <TestResultNavigation 
            testName="Digit Span Test"
            score={score.maxLevel}
          />
        </div>
      </div>
    );
  }
}
