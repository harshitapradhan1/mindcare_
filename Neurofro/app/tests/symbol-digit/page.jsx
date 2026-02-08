"use client";
import { useState, useEffect, useRef } from 'react';
import { Zap, Play, RotateCcw, Clock, Target, CheckCircle } from 'lucide-react';
import TestResultNavigation from '@/components/TestResultNavigation';

export default function SymbolDigitTest() {
  const [gameState, setGameState] = useState('setup');
  const [timeLeft, setTimeLeft] = useState(90);
  const [score, setScore] = useState(0);
  const [currentSymbol, setCurrentSymbol] = useState(null);
  const [selectedDigit, setSelectedDigit] = useState(null);
  const [completed, setCompleted] = useState(0);
  const [errors, setErrors] = useState(0);
  const [startTime, setStartTime] = useState(null);

  const symbolKey = {
    '▲': 1, '■': 2, '●': 3, '★': 4, '◆': 5,
    '▼': 6, '□': 7, '○': 8, '☆': 9, '◇': 0
  };

  const symbols = Object.keys(symbolKey);
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  const timerRef = useRef(null);
  const sequenceRef = useRef([]);

  const generateSequence = () => {
    const seq = [];
    for (let i = 0; i < 100; i++) {
      seq.push(symbols[Math.floor(Math.random() * symbols.length)]);
    }
    return seq;
  };

  const startTest = () => {
    const seq = generateSequence();
    sequenceRef.current = seq;
    setCurrentSymbol(seq[0]);
    setScore(0);
    setCompleted(0);
    setErrors(0);
    setTimeLeft(90);
    setStartTime(Date.now());
    setGameState('playing');
    setSelectedDigit(null);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const endTest = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setGameState('results');
    submitResults();
  };

  const handleDigitSelect = (digit) => {
    if (gameState !== 'playing' || !currentSymbol) return;

    const correctDigit = symbolKey[currentSymbol];
    if (digit === correctDigit) {
      setScore(prev => prev + 1);
      setCompleted(prev => prev + 1);
      nextSymbol();
    } else {
      setErrors(prev => prev + 1);
      setSelectedDigit(null);
    }
  };

  const nextSymbol = () => {
    if (completed >= sequenceRef.current.length - 1) {
      endTest();
      return;
    }
    setCurrentSymbol(sequenceRef.current[completed + 1]);
    setSelectedDigit(null);
  };

  const submitResults = async () => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : 'demo-user-123';
    const totalTime = 90 - timeLeft;
    const symbolsPerMinute = (completed / totalTime) * 60;
    const API_BASE = typeof window !== 'undefined' ? '/api/backend' : 'http://localhost:5002/api';

    try {
      await fetch(`${API_BASE}/neurotwin/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          test_results: {
            test_type: 'symbol-digit',
            completed: completed,
            accuracy: score / (score + errors),
            symbols_per_minute: symbolsPerMinute,
            errors: errors,
            total_time: totalTime
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
    setGameState('setup');
    setScore(0);
    setCompleted(0);
    setErrors(0);
    setCurrentSymbol(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Symbol Digit Modalities Test</h1>
            <p className="text-gray-600">Processing Speed & Visual Scanning</p>
          </div>

          {gameState === 'setup' && (
            <div className="space-y-6">
              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Instructions</h3>
                <ul className="space-y-2 text-gray-700 mb-4">
                  <li>• Match each symbol to its corresponding digit using the key below</li>
                  <li>• Work as quickly and accurately as possible</li>
                  <li>• Test duration: 90 seconds</li>
                  <li>• This measures processing speed and visual attention</li>
                </ul>
                
                <div className="bg-white rounded-lg p-4 border-2 border-orange-300">
                  <h4 className="font-bold text-gray-900 mb-3">Symbol Key:</h4>
                  <div className="grid grid-cols-5 gap-3">
                    {Object.entries(symbolKey).map(([symbol, digit]) => (
                      <div key={symbol} className="text-center">
                        <div className="text-3xl mb-1">{symbol}</div>
                        <div className="text-xl font-bold text-orange-600">{digit}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={startTest}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl py-4 font-bold text-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-6 h-6" />
                Start Test
              </button>
            </div>
          )}

          {gameState === 'playing' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="bg-orange-100 px-4 py-2 rounded-xl">
                  <Clock className="w-4 h-4 inline mr-2" />
                  <span className="text-sm font-semibold text-orange-700">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Completed</div>
                  <div className="text-2xl font-bold text-gray-900">{completed}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Score</div>
                  <div className="text-2xl font-bold text-green-600">{score}</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-12 border-2 border-orange-200">
                <div className="text-center mb-8">
                  <div className="text-9xl font-bold text-orange-600 mb-4">
                    {currentSymbol}
                  </div>
                  <p className="text-gray-600 text-lg">Select the matching digit:</p>
                </div>

                <div className="grid grid-cols-5 gap-4">
                  {digits.map((digit) => (
                    <button
                      key={digit}
                      onClick={() => handleDigitSelect(digit)}
                      className={`bg-white border-2 rounded-xl py-6 text-3xl font-bold transition-all hover:scale-110 ${
                        selectedDigit === digit
                          ? 'border-orange-500 bg-orange-100'
                          : 'border-gray-300 hover:border-orange-400'
                      }`}
                    >
                      {digit}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={endTest}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl py-3 font-semibold transition-all"
              >
                End Test Early
              </button>
            </div>
          )}

          {gameState === 'results' && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Test Complete!</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
                  <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-green-700">{score}</div>
                  <div className="text-sm text-green-600">Correct Matches</div>
                </div>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
                  <Zap className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-blue-700">
                    {((score / (90 - timeLeft)) * 60).toFixed(1)}
                  </div>
                  <div className="text-sm text-blue-600">Symbols/Minute</div>
                </div>
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-red-700">{errors}</div>
                  <div className="text-sm text-red-600">Errors</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">Performance Metrics</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>Total Time:</span>
                    <span className="font-semibold">{(90 - timeLeft).toFixed(1)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Accuracy:</span>
                    <span className="font-semibold">
                      {score + errors > 0 ? ((score / (score + errors)) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing Speed:</span>
                    <span className="font-semibold">
                      {((score / (90 - timeLeft)) * 60).toFixed(1)} symbols/min
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={resetTest}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl py-3 font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
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
                testName="Symbol-Digit Test"
                score={score}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

