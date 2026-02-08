"use client";
import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Play, RotateCcw, Clock, Target, CheckCircle, X } from 'lucide-react';
import TestResultNavigation from '@/components/TestResultNavigation';

export default function GoNoGoTest() {
  const [gameState, setGameState] = useState('setup');
  const [currentStimulus, setCurrentStimulus] = useState(null);
  const [score, setScore] = useState({ hits: 0, misses: 0, falseAlarms: 0, correctRejections: 0 });
  const [reactionTimes, setReactionTimes] = useState([]);
  const [round, setRound] = useState(0);
  const [maxRounds] = useState(200);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes max

  const timerRef = useRef(null);
  const stimulusTimerRef = useRef(null);
  const reactionStartRef = useRef(null);
  const sequenceRef = useRef([]);

  // Generate sequence: 80% Go, 20% No-Go
  const generateSequence = () => {
    const seq = [];
    for (let i = 0; i < maxRounds; i++) {
      seq.push(Math.random() < 0.8 ? 'GO' : 'NO-GO');
    }
    return seq;
  };

  const startTest = () => {
    const seq = generateSequence();
    sequenceRef.current = seq;
    setScore({ hits: 0, misses: 0, falseAlarms: 0, correctRejections: 0 });
    setReactionTimes([]);
    setRound(0);
    setTimeLeft(300);
    setGameState('playing');
    setShowFeedback(false);
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1 || round >= maxRounds) {
          endTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    showNextStimulus();
  };

  const showNextStimulus = () => {
    if (round >= maxRounds) {
      endTest();
      return;
    }

    const stimulus = sequenceRef.current[round];
    setCurrentStimulus(stimulus);
    reactionStartRef.current = Date.now();
    setShowFeedback(false);

    // Auto-advance after 1.5 seconds if no response
    stimulusTimerRef.current = setTimeout(() => {
      if (gameState === 'playing' && stimulus === 'GO') {
        // Missed a Go signal
        setScore(prev => ({ ...prev, misses: prev.misses + 1 }));
        setFeedbackType('miss');
        setShowFeedback(true);
        setTimeout(() => nextRound(), 500);
      } else if (gameState === 'playing' && stimulus === 'NO-GO') {
        // Correct rejection
        setScore(prev => ({ ...prev, correctRejections: prev.correctRejections + 1 }));
        setFeedbackType('correct');
        setShowFeedback(true);
        setTimeout(() => nextRound(), 500);
      }
    }, 1500);
  };

  const nextRound = () => {
    setRound(prev => prev + 1);
    if (round + 1 < maxRounds) {
      setTimeout(() => showNextStimulus(), 500);
    } else {
      endTest();
    }
  };

  const handleResponse = () => {
    if (gameState !== 'playing' || !currentStimulus) return;

    const reactionTime = Date.now() - reactionStartRef.current;
    
    if (currentStimulus === 'GO') {
      // Hit
      setScore(prev => ({ ...prev, hits: prev.hits + 1 }));
      setReactionTimes(prev => [...prev, reactionTime]);
      setFeedbackType('hit');
    } else {
      // False alarm
      setScore(prev => ({ ...prev, falseAlarms: prev.falseAlarms + 1 }));
      setFeedbackType('falseAlarm');
    }

    if (stimulusTimerRef.current) {
      clearTimeout(stimulusTimerRef.current);
    }

    setShowFeedback(true);
    setTimeout(() => nextRound(), 500);
  };

  const endTest = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (stimulusTimerRef.current) {
      clearTimeout(stimulusTimerRef.current);
    }
    setGameState('results');
    submitResults();
  };

  const submitResults = async () => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : 'demo-user-123';
    const totalGo = score.hits + score.misses;
    const totalNoGo = score.falseAlarms + score.correctRejections;
    const hitRate = totalGo > 0 ? score.hits / totalGo : 0;
    const falseAlarmRate = totalNoGo > 0 ? score.falseAlarms / totalNoGo : 0;
    const avgReactionTime = reactionTimes.length > 0
      ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
      : 0;
    const API_BASE = typeof window !== 'undefined' ? '/api/backend' : 'http://localhost:5002/api';

    try {
      await fetch(`${API_BASE}/neurotwin/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          test_results: {
            test_type: 'go-no-go',
            hits: score.hits,
            misses: score.misses,
            false_alarms: score.falseAlarms,
            correct_rejections: score.correctRejections,
            hit_rate: hitRate,
            false_alarm_rate: falseAlarmRate,
            avg_reaction_time: avgReactionTime,
            rounds: round
          }
        })
      });
    } catch (error) {
      console.error('Error submitting results:', error);
    }
  };

  const resetTest = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (stimulusTimerRef.current) {
      clearTimeout(stimulusTimerRef.current);
    }
    setGameState('setup');
    setRound(0);
    setScore({ hits: 0, misses: 0, falseAlarms: 0, correctRejections: 0 });
    setReactionTimes([]);
    setCurrentStimulus(null);
  };

  const getStimulusColor = () => {
    if (!currentStimulus) return 'bg-gray-200';
    return currentStimulus === 'GO' ? 'bg-green-500' : 'bg-red-500';
  };

  const getFeedbackMessage = () => {
    switch (feedbackType) {
      case 'hit':
        return { text: '✓ Correct!', color: 'text-green-600' };
      case 'miss':
        return { text: '✗ Missed', color: 'text-red-600' };
      case 'falseAlarm':
        return { text: '✗ False Alarm', color: 'text-red-600' };
      case 'correct':
        return { text: '✓ Correct!', color: 'text-green-600' };
      default:
        return { text: '', color: '' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl mb-4">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Go/No-Go Task</h1>
            <p className="text-gray-600">Inhibitory Control & Sustained Attention</p>
          </div>

          {gameState === 'setup' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Instructions</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>GREEN circle:</strong> Press SPACE (Go signal)</li>
                  <li>• <strong>RED circle:</strong> Do NOT press (No-Go signal)</li>
                  <li>• Respond as quickly as possible to green circles</li>
                  <li>• Test: 200 trials or 5 minutes</li>
                  <li>• This measures impulse control and attention</li>
                </ul>
              </div>

              <button
                onClick={startTest}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl py-4 font-bold text-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-6 h-6" />
                Start Test
              </button>
            </div>
          )}

          {gameState === 'playing' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="bg-yellow-100 px-4 py-2 rounded-xl">
                  <Clock className="w-4 h-4 inline mr-2" />
                  <span className="text-sm font-semibold text-yellow-700">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Round</div>
                  <div className="text-2xl font-bold text-gray-900">{round + 1}/{maxRounds}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Hits</div>
                  <div className="text-2xl font-bold text-green-600">{score.hits}</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-12 border-2 border-yellow-200 min-h-[400px] flex items-center justify-center">
                {showFeedback ? (
                  <div className={`text-6xl font-bold ${getFeedbackMessage().color}`}>
                    {getFeedbackMessage().text}
                  </div>
                ) : (
                  <div className="text-center">
                    {currentStimulus && (
                      <div className={`w-48 h-48 rounded-full mx-auto ${getStimulusColor()} shadow-2xl animate-pulse`}></div>
                    )}
                    <p className="mt-6 text-gray-600 text-lg">
                      {currentStimulus === 'GO' 
                        ? 'Press SPACE now!' 
                        : currentStimulus === 'NO-GO'
                        ? 'Do NOT press'
                        : 'Get ready...'}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <p className="text-sm text-gray-700 text-center">
                  Press <strong>SPACE</strong> for green circles only. Do not press for red circles.
                </p>
              </div>

              {/* Keyboard listener */}
              {gameState === 'playing' && !showFeedback && (
                <div
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ') {
                      e.preventDefault();
                      handleResponse();
                    }
                  }}
                  className="hidden"
                />
              )}
            </div>
          )}

          {gameState === 'results' && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Test Complete!</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
                  <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-green-700">{score.hits}</div>
                  <div className="text-sm text-green-600">Hits (Correct Go)</div>
                </div>
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
                  <X className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-red-700">{score.falseAlarms}</div>
                  <div className="text-sm text-red-600">False Alarms</div>
                </div>
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-yellow-700">{score.misses}</div>
                  <div className="text-sm text-yellow-600">Misses</div>
                </div>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
                  <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-blue-700">{score.correctRejections}</div>
                  <div className="text-sm text-blue-600">Correct Rejections</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">Performance Metrics</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>Hit Rate:</span>
                    <span className="font-semibold">
                      {score.hits + score.misses > 0 
                        ? ((score.hits / (score.hits + score.misses)) * 100).toFixed(1) 
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>False Alarm Rate:</span>
                    <span className="font-semibold">
                      {score.falseAlarms + score.correctRejections > 0
                        ? ((score.falseAlarms / (score.falseAlarms + score.correctRejections)) * 100).toFixed(1)
                        : 0}%
                    </span>
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
                  onClick={resetTest}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl py-3 font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
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
                testName="Go/No-Go Task"
                score={score.hits + score.correctRejections - score.falseAlarms - score.misses}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

