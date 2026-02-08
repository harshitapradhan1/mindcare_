"use client";
import { useState, useEffect, useRef } from 'react';
import { Activity, Play, RotateCcw, Clock, Brain, CheckCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import TestResultNavigation from '@/components/TestResultNavigation';

export default function DualTaskChallenge() {
  const [gameState, setGameState] = useState('setup');
  const [task1, setTask1] = useState(null); // Math problem
  const [task2, setTask2] = useState(null); // Color/shape
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedColor, setSelectedColor] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [reactionTimes, setReactionTimes] = useState([]);
  const [round, setRound] = useState(0);
  const [maxRounds] = useState(20);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [showFeedback, setShowFeedback] = useState(false);

  const timerRef = useRef(null);
  const roundStartRef = useRef(null);
  const colors = ['red', 'blue', 'green', 'yellow'];
  const shapes = ['circle', 'square', 'triangle'];

  const generateTasks = () => {
    // Task 1: Simple math (e.g., 5 + 3)
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operation = Math.random() < 0.5 ? '+' : '-';
    const answer = operation === '+' ? num1 + num2 : num1 - num2;
    
    // Task 2: Color and shape
    const color = colors[Math.floor(Math.random() * colors.length)];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];

    return {
      task1: { num1, num2, operation, answer },
      task2: { color, shape }
    };
  };

  const startTest = () => {
    setScore({ correct: 0, total: 0 });
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

    startRound();
  };

  const startRound = () => {
    const tasks = generateTasks();
    setTask1(tasks.task1);
    setTask2(tasks.task2);
    setUserAnswer('');
    setSelectedColor(null);
    setShowFeedback(false);
    roundStartRef.current = Date.now();
  };

  const handleSubmit = () => {
    if (!userAnswer || !selectedColor) return;

    const reactionTime = Date.now() - roundStartRef.current;
    setReactionTimes(prev => [...prev, reactionTime]);

    const mathCorrect = parseInt(userAnswer) === task1.answer;
    const colorCorrect = selectedColor === task2.color;
    const bothCorrect = mathCorrect && colorCorrect;

    setScore(prev => ({
      ...prev,
      correct: bothCorrect ? prev.correct + 1 : prev.correct,
      total: prev.total + 1
    }));

    setShowFeedback(true);
    setTimeout(() => {
      const nextRound = round + 1;
      if (nextRound >= maxRounds) {
        endTest();
      } else {
        setRound(nextRound);
        startRound();
      }
    }, 1500);
  };

  const endTest = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
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
          level: 1,
          total_time: 300 - timeLeft
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
              test_type: 'dual-task',
              accuracy: accuracy / 100,
              reaction_time: avgReactionTime / 1000,
              incorrect: score.total - score.correct,
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

  const resetTest = () => {
    setGameState('setup');
    setScore({ correct: 0, total: 0 });
    setReactionTimes([]);
    setRound(0);
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
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg">
                <Activity className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">
                Dual Task Challenge
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Test your divided attention and multitasking ability by performing two tasks simultaneously
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-indigo-100">
            <div className="bg-indigo-50 rounded-xl p-6 mb-6 border border-indigo-200">
              <h3 className="font-bold text-gray-900 mb-3">Instructions</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Task 1:</strong> Solve the math problem</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Task 2:</strong> Select the color of the shape shown</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span>You must complete BOTH tasks correctly to score</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span>Complete {maxRounds} rounds in 5 minutes</span>
                </li>
              </ul>
            </div>

            <button
              onClick={startTest}
              className="w-full mt-8 px-8 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-2xl font-bold text-lg flex items-center justify-center gap-2 group"
            >
              <Play className="w-6 h-6" />
              <span>Start Challenge</span>
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
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-indigo-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 px-5 py-3 rounded-xl shadow-md">
                  <div className="text-white font-bold text-lg">Round {round + 1}/{maxRounds}</div>
                </div>
                <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-lg border border-green-300">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-bold text-green-900">{score.correct}/{score.total}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gradient-to-br from-indigo-50 to-purple-50 px-5 py-3 rounded-xl border-2 border-indigo-300">
                <Clock className="w-6 h-6 text-indigo-600" />
                <span className="text-2xl font-bold text-indigo-700">{timeLeft}s</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Task 1: Math */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-indigo-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Brain className="w-6 h-6 text-indigo-600" />
                Task 1: Math Problem
              </h3>
              {task1 && (
                <div className="text-center">
                  <div className="text-6xl font-bold text-gray-900 mb-6">
                    {task1.num1} {task1.operation} {task1.num2} = ?
                  </div>
                  <input
                    type="number"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="text-4xl font-mono text-center w-full px-6 py-4 border-4 border-indigo-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500"
                    placeholder="?"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Task 2: Color/Shape */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-indigo-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-6 h-6 text-indigo-600" />
                Task 2: Select Color
              </h3>
              {task2 && (
                <div className="text-center">
                  <div className="mb-6">
                    <div className={`w-32 h-32 mx-auto ${
                      task2.shape === 'square' ? 'rounded-lg' : 
                      task2.shape === 'triangle' ? 'rounded-none' : 'rounded-full'
                    } ${
                      task2.color === 'red' ? 'bg-red-500' :
                      task2.color === 'blue' ? 'bg-blue-500' :
                      task2.color === 'green' ? 'bg-green-500' :
                      'bg-yellow-500'
                    }`}></div>
                    <p className="text-gray-600 mt-4 text-lg">What color is this shape?</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {colors.map(color => {
                      const colorClasses = {
                        red: {
                          selected: 'bg-red-600 text-white border-4 border-red-800',
                          unselected: 'bg-red-200 text-red-900 border-2 border-red-300 hover:bg-red-300'
                        },
                        blue: {
                          selected: 'bg-blue-600 text-white border-4 border-blue-800',
                          unselected: 'bg-blue-200 text-blue-900 border-2 border-blue-300 hover:bg-blue-300'
                        },
                        green: {
                          selected: 'bg-green-600 text-white border-4 border-green-800',
                          unselected: 'bg-green-200 text-green-900 border-2 border-green-300 hover:bg-green-300'
                        },
                        yellow: {
                          selected: 'bg-yellow-600 text-white border-4 border-yellow-800',
                          unselected: 'bg-yellow-200 text-yellow-900 border-2 border-yellow-300 hover:bg-yellow-300'
                        }
                      };
                      
                      return (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`p-4 rounded-xl font-bold transition-all ${
                            selectedColor === color
                              ? colorClasses[color].selected
                              : colorClasses[color].unselected
                          }`}
                        >
                          {color.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {showFeedback && (
            <div className="bg-white rounded-xl p-4 mb-6 border-2 border-indigo-100">
              <div className="text-center text-lg font-semibold text-gray-900">
                {score.correct === score.total ? '✓ Both tasks correct!' : '✗ One or both tasks incorrect'}
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!userAnswer || !selectedColor}
            className="w-full px-8 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Both Answers
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'results') {
    const accuracy = score.total > 0 
      ? ((score.correct / score.total) * 100).toFixed(1) 
      : '0';
    const avgReactionTime = reactionTimes.length > 0
      ? (reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length / 1000).toFixed(2)
      : '0';

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-3xl w-full">
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-2xl mb-4 shadow-xl">
              <Activity className="w-14 h-14 text-white" />
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-3">Challenge Complete!</h2>
            <p className="text-gray-600 text-xl">Your divided attention assessment results</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6 border-2 border-indigo-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Activity className="w-6 h-6 text-indigo-600" />
              Performance Metrics
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl p-6 border-2 border-green-300">
                <div className="text-sm text-green-800 font-semibold mb-2">Accuracy</div>
                <div className="text-4xl font-bold text-green-900">{accuracy}%</div>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl p-6 border-2 border-blue-300">
                <div className="text-sm text-blue-800 font-semibold mb-2">Avg Reaction</div>
                <div className="text-4xl font-bold text-blue-900">{avgReactionTime}s</div>
              </div>
              <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl p-6 border-2 border-indigo-300">
                <div className="text-sm text-indigo-800 font-semibold mb-2">Correct</div>
                <div className="text-4xl font-bold text-indigo-900">{score.correct}/{score.total}</div>
              </div>
              <div className="bg-gradient-to-br from-teal-100 to-blue-100 rounded-xl p-6 border-2 border-teal-300">
                <div className="text-sm text-teal-800 font-semibold mb-2">Rounds</div>
                <div className="text-4xl font-bold text-teal-900">{round}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/tests"
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-5 px-6 rounded-xl transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 text-lg"
            >
              <span>Back to Tests</span>
              <ChevronRight className="w-6 h-6" />
            </Link>
            <button
              onClick={resetTest}
              className="flex-1 bg-white hover:bg-gray-50 text-indigo-600 border-2 border-indigo-600 font-bold py-5 px-6 rounded-xl transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 text-lg"
            >
              <RotateCcw className="w-6 h-6" />
              <span>Retake Challenge</span>
            </button>
          </div>

          {/* Navigation to NeuroTwin and Dashboard */}
          <TestResultNavigation 
            testName="Dual Task Test"
            score={score.correct}
          />
        </div>
      </div>
    );
  }
}

