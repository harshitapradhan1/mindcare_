"use client";
import { useState, useEffect, useRef } from 'react';
import { Brain, Play, Pause, RotateCcw, CheckCircle, X, Clock, Target } from 'lucide-react';
import TestResultNavigation from '@/components/TestResultNavigation';

export default function NBackTest() {
  const [gameState, setGameState] = useState('setup'); // setup, playing, results
  const [nLevel, setNLevel] = useState(2); // 1-back, 2-back, 3-back
  const [currentSequence, setCurrentSequence] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0, falseAlarms: 0 });
  const [reactionTimes, setReactionTimes] = useState([]);
  const [isMatch, setIsMatch] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [rounds, setRounds] = useState(0);
  const [maxRounds] = useState(30);

  const timerRef = useRef(null);
  const reactionStartRef = useRef(null);
  const sequenceRef = useRef([]);

  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  const generateSequence = () => {
    const seq = [];
    for (let i = 0; i < maxRounds; i++) {
      seq.push(letters[Math.floor(Math.random() * letters.length)]);
    }
    // Ensure some matches for n-back
    for (let i = nLevel; i < maxRounds; i += Math.floor(Math.random() * 5) + 3) {
      seq[i] = seq[i - nLevel];
    }
    return seq;
  };

  const startGame = () => {
    const seq = generateSequence();
    sequenceRef.current = seq;
    setCurrentSequence(seq);
    setCurrentIndex(0);
    setScore({ correct: 0, total: 0, falseAlarms: 0 });
    setReactionTimes([]);
    setTimeLeft(120);
    setRounds(0);
    setGameState('playing');
    setShowFeedback(false);
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const endGame = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setGameState('results');
    submitResults();
  };

  const handleMatch = () => {
    if (gameState !== 'playing') return;
    
    const reactionTime = reactionStartRef.current 
      ? Date.now() - reactionStartRef.current 
      : 0;
    
    const isCorrect = currentIndex >= nLevel && 
      currentSequence[currentIndex] === currentSequence[currentIndex - nLevel];
    
    if (isCorrect) {
      setScore(prev => ({ ...prev, correct: prev.correct + 1, total: prev.total + 1 }));
      setIsMatch(true);
    } else {
      setScore(prev => ({ ...prev, falseAlarms: prev.falseAlarms + 1, total: prev.total + 1 }));
      setIsMatch(false);
    }
    
    setReactionTimes(prev => [...prev, reactionTime]);
    setShowFeedback(true);
    
    setTimeout(() => {
      nextRound();
    }, 500);
  };

  const handleNoMatch = () => {
    if (gameState !== 'playing') return;
    
    const isCorrect = currentIndex < nLevel || 
      currentSequence[currentIndex] !== currentSequence[currentIndex - nLevel];
    
    if (isCorrect) {
      setScore(prev => ({ ...prev, total: prev.total + 1 }));
      setIsMatch(true);
    } else {
      setScore(prev => ({ ...prev, total: prev.total + 1 }));
      setIsMatch(false);
    }
    
    setShowFeedback(true);
    
    setTimeout(() => {
      nextRound();
    }, 500);
  };

  const nextRound = () => {
    setShowFeedback(false);
    reactionStartRef.current = Date.now();
    
    if (currentIndex >= maxRounds - 1) {
      endGame();
      return;
    }
    
    setCurrentIndex(prev => prev + 1);
    setRounds(prev => prev + 1);
  };

  useEffect(() => {
    if (gameState === 'playing' && currentIndex < maxRounds) {
      reactionStartRef.current = Date.now();
      const timer = setTimeout(() => {
        if (gameState === 'playing') {
          nextRound();
        }
      }, 2000); // 2 seconds per item
      
      return () => clearTimeout(timer);
    }
  }, [currentIndex, gameState]);

  const submitResults = async () => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : 'demo-user-123';
    const accuracy = score.total > 0 ? (score.correct / score.total) * 100 : 0;
    const avgReactionTime = reactionTimes.length > 0 
      ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
      : 0;
    const API_BASE = typeof window !== 'undefined' ? '/api/backend' : 'http://localhost:5002/api';

    try {
      // Submit to backend (with error handling)
      const predictResponse = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accuracy: accuracy / 100,
          reaction_time: avgReactionTime / 1000,
          retries: score.falseAlarms,
          level: nLevel,
          total_time: 120 - timeLeft
        })
      });

      if (!predictResponse.ok) {
        const errorData = await predictResponse.json().catch(() => ({}));
        console.warn('Prediction API error (using fallback):', errorData.error || 'Unknown error');
      }

      // Update NeuroTwin (always try this, even if prediction fails)
      try {
        await fetch(`${API_BASE}/neurotwin/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            test_results: {
              test_type: 'n-back',
              n_level: nLevel,
              accuracy: accuracy / 100,
              reaction_time: avgReactionTime / 1000,
              false_alarms: score.falseAlarms,
              rounds: rounds
            }
          })
        });
      } catch (neurotwinError) {
        console.error('Error updating NeuroTwin:', neurotwinError);
        // Don't fail the whole submission if NeuroTwin update fails
      }
    } catch (error) {
      console.error('Error submitting results:', error);
      // Results are still shown to user even if submission fails
    }
  };

  const resetGame = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setGameState('setup');
    setCurrentIndex(0);
    setScore({ correct: 0, total: 0, falseAlarms: 0 });
    setReactionTimes([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mb-4">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">N-Back Test</h1>
            <p className="text-gray-600">Working Memory & Attention Assessment</p>
          </div>

          {gameState === 'setup' && (
            <div className="space-y-6">
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Instructions</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• You'll see a sequence of letters appear one at a time</li>
                  <li>• Press <strong>"Match"</strong> if the current letter matches the one from <strong>{nLevel} positions ago</strong></li>
                  <li>• Press <strong>"No Match"</strong> if it doesn't match</li>
                  <li>• Test duration: 2 minutes or 30 rounds</li>
                  <li>• This measures working memory and sustained attention</li>
                </ul>
              </div>

              <div className="flex items-center justify-center gap-4">
                <label className="text-lg font-semibold text-gray-700">N-Level:</label>
                <select
                  value={nLevel}
                  onChange={(e) => setNLevel(Number(e.target.value))}
                  className="px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                >
                  <option value={1}>1-Back (Easier)</option>
                  <option value={2}>2-Back (Standard)</option>
                  <option value={3}>3-Back (Harder)</option>
                </select>
              </div>

              <button
                onClick={startGame}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl py-4 font-bold text-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-6 h-6" />
                Start Test
              </button>
            </div>
          )}

          {gameState === 'playing' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 px-4 py-2 rounded-xl">
                    <span className="text-sm font-semibold text-purple-700">Round: {rounds + 1}/{maxRounds}</span>
                  </div>
                  <div className="bg-blue-100 px-4 py-2 rounded-xl">
                    <Clock className="w-4 h-4 inline mr-2" />
                    <span className="text-sm font-semibold text-blue-700">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Score</div>
                  <div className="text-2xl font-bold text-gray-900">{score.correct}/{score.total}</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-12 border-2 border-purple-200">
                <div className="text-center">
                  {showFeedback ? (
                    <div className={`text-8xl font-bold ${isMatch ? 'text-green-600' : 'text-red-600'}`}>
                      {isMatch ? <CheckCircle className="w-32 h-32 mx-auto" /> : <X className="w-32 h-32 mx-auto" />}
                    </div>
                  ) : (
                    <>
                      <div className="text-9xl font-bold text-purple-600 mb-4">
                        {currentSequence[currentIndex]}
                      </div>
                      <p className="text-gray-600 text-lg mt-4">
                        Does this match the letter from {nLevel} positions ago?
                      </p>
                    </>
                  )}
                </div>
              </div>

              {!showFeedback && (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleMatch}
                    className="bg-green-500 hover:bg-green-600 text-white rounded-xl py-6 font-bold text-lg transition-all"
                  >
                    Match
                  </button>
                  <button
                    onClick={handleNoMatch}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-xl py-6 font-bold text-lg transition-all"
                  >
                    No Match
                  </button>
                </div>
              )}

              <button
                onClick={endGame}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl py-3 font-semibold transition-all"
              >
                End Test Early
              </button>
            </div>
          )}

          {gameState === 'results' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Test Complete!</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
                  <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-green-700">{score.correct}</div>
                  <div className="text-sm text-green-600">Correct Matches</div>
                </div>
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
                  <X className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-red-700">{score.falseAlarms}</div>
                  <div className="text-sm text-red-600">False Alarms</div>
                </div>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
                  <Brain className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-blue-700">
                    {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
                  </div>
                  <div className="text-sm text-blue-600">Accuracy</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">Performance Metrics</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>N-Level:</span>
                    <span className="font-semibold">{nLevel}-Back</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Rounds:</span>
                    <span className="font-semibold">{rounds}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Reaction Time:</span>
                    <span className="font-semibold">
                      {reactionTimes.length > 0 
                        ? (reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length / 1000).toFixed(2)
                        : '0.00'}s
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={resetGame}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl py-3 font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  Try Again
                </button>
                <a
                  href="/tests"
                  className="flex-1 bg-white border-2 border-gray-300 text-gray-700 rounded-xl py-3 font-bold hover:bg-gray-50 transition-all text-center"
                >
                  Back to Tests
                </a>
              </div>

              {/* Navigation to NeuroTwin and Dashboard */}
              <TestResultNavigation 
                testName="N-Back Test"
                score={score.correct}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

