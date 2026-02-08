"use client";
import { useState, useEffect, useRef } from 'react';
import { Search, Play, RotateCcw, Clock, Target, CheckCircle, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import TestResultNavigation from '@/components/TestResultNavigation';

export default function VisualSearchTest() {
  const [gameState, setGameState] = useState('setup');
  const [grid, setGrid] = useState([]);
  const [target, setTarget] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [reactionTimes, setReactionTimes] = useState([]);
  const [round, setRound] = useState(0);
  const [maxRounds] = useState(20);
  const [timeLeft, setTimeLeft] = useState(180);
  const [showFeedback, setShowFeedback] = useState(false);

  const timerRef = useRef(null);
  const roundStartRef = useRef(null);
  const gridSize = 6;

  const generateGrid = () => {
    const symbols = ['○', '△', '□', '◇', '☆', '●'];
    const newGrid = [];
    const targetSymbol = symbols[Math.floor(Math.random() * symbols.length)];
    const targetPos = {
      row: Math.floor(Math.random() * gridSize),
      col: Math.floor(Math.random() * gridSize)
    };

    for (let i = 0; i < gridSize; i++) {
      const row = [];
      for (let j = 0; j < gridSize; j++) {
        if (i === targetPos.row && j === targetPos.col) {
          row.push(targetSymbol);
        } else {
          row.push(symbols[Math.floor(Math.random() * symbols.length)]);
        }
      }
      newGrid.push(row);
    }

    return { grid: newGrid, target: { symbol: targetSymbol, pos: targetPos } };
  };

  const startTest = () => {
    setScore({ correct: 0, incorrect: 0 });
    setReactionTimes([]);
    setRound(0);
    setTimeLeft(180);
    setGameState('playing');
    startRound();
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1 || round >= maxRounds) {
          endTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startRound = () => {
    const { grid: newGrid, target: newTarget } = generateGrid();
    setGrid(newGrid);
    setTarget(newTarget);
    setSelectedCell(null);
    setShowFeedback(false);
    roundStartRef.current = Date.now();
  };

  const handleCellClick = (row, col) => {
    if (gameState !== 'playing' || selectedCell) return;

    const reactionTime = Date.now() - roundStartRef.current;
    setReactionTimes(prev => [...prev, reactionTime]);
    
    const isCorrect = row === target.pos.row && col === target.pos.col;
    setSelectedCell({ row, col });

    if (isCorrect) {
      setScore(prev => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setScore(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
    }

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
    const accuracy = score.correct + score.incorrect > 0 
      ? (score.correct / (score.correct + score.incorrect)) * 100 
      : 0;
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
          retries: score.incorrect,
          level: 1,
          total_time: 180 - timeLeft
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
              test_type: 'visual-search',
              accuracy: accuracy / 100,
              reaction_time: avgReactionTime / 1000,
              incorrect: score.incorrect,
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
    setScore({ correct: 0, incorrect: 0 });
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
              <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-3 rounded-xl shadow-lg">
                <Search className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">
                Visual Search Test
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Test your processing speed and visual attention by finding the target symbol quickly
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-pink-100">
            <div className="bg-pink-50 rounded-xl p-6 mb-6 border border-pink-200">
              <h3 className="font-bold text-gray-900 mb-3">Instructions</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-pink-600 flex-shrink-0 mt-0.5" />
                  <span>Find the target symbol shown at the top</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-pink-600 flex-shrink-0 mt-0.5" />
                  <span>Click on it as quickly as possible</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-pink-600 flex-shrink-0 mt-0.5" />
                  <span>Speed and accuracy both matter</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-pink-600 flex-shrink-0 mt-0.5" />
                  <span>Complete {maxRounds} rounds in 3 minutes</span>
                </li>
              </ul>
            </div>

            <button
              onClick={startTest}
              className="w-full mt-8 px-8 py-5 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl hover:from-pink-600 hover:to-rose-700 transition-all shadow-lg hover:shadow-2xl font-bold text-lg flex items-center justify-center gap-2 group"
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
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-pink-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-pink-500 to-rose-600 px-5 py-3 rounded-xl shadow-md">
                  <div className="text-white font-bold text-lg">Round {round + 1}/{maxRounds}</div>
                </div>
                <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-lg border border-green-300">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-bold text-green-900">{score.correct}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gradient-to-br from-pink-50 to-rose-50 px-5 py-3 rounded-xl border-2 border-pink-300">
                <Clock className="w-6 h-6 text-pink-600" />
                <span className="text-2xl font-bold text-pink-700">{timeLeft}s</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-pink-100 mb-6">
            <div className="text-center mb-6">
              <p className="text-xl font-bold text-gray-900 mb-4">Find this symbol:</p>
              <div className="text-8xl">{target?.symbol}</div>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {grid.map((row, rowIdx) =>
                row.map((cell, colIdx) => {
                  const isSelected = selectedCell?.row === rowIdx && selectedCell?.col === colIdx;
                  const isTarget = target?.pos.row === rowIdx && target?.pos.col === colIdx;
                  
                  return (
                    <button
                      key={`${rowIdx}-${colIdx}`}
                      onClick={() => handleCellClick(rowIdx, colIdx)}
                      disabled={!!selectedCell}
                      className={`aspect-square text-4xl rounded-lg transition-all ${
                        isSelected
                          ? isTarget
                            ? 'bg-green-500 text-white scale-110 border-4 border-green-700'
                            : 'bg-red-500 text-white scale-110 border-4 border-red-700'
                          : isTarget && showFeedback
                          ? 'bg-yellow-300 border-4 border-yellow-600'
                          : 'bg-gray-100 hover:bg-gray-200 border-2 border-gray-300'
                      } disabled:cursor-not-allowed`}
                    >
                      {cell}
                    </button>
                  );
                })
              )}
            </div>

            {showFeedback && (
              <div className={`mt-4 p-4 rounded-xl text-center font-bold ${
                selectedCell?.row === target?.pos.row && selectedCell?.col === target?.pos.col
                  ? 'bg-green-100 text-green-700 border-2 border-green-300'
                  : 'bg-red-100 text-red-700 border-2 border-red-300'
              }`}>
                {selectedCell?.row === target?.pos.row && selectedCell?.col === target?.pos.col
                  ? '✓ Correct!'
                  : '✗ Incorrect'}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'results') {
    const accuracy = score.correct + score.incorrect > 0 
      ? ((score.correct / (score.correct + score.incorrect)) * 100).toFixed(1) 
      : '0';
    const avgReactionTime = reactionTimes.length > 0
      ? (reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length / 1000).toFixed(2)
      : '0';

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-3xl w-full">
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-br from-pink-500 to-rose-600 p-5 rounded-2xl mb-4 shadow-xl">
              <Search className="w-14 h-14 text-white" />
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-3">Test Complete!</h2>
            <p className="text-gray-600 text-xl">Your visual search assessment results</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6 border-2 border-pink-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Search className="w-6 h-6 text-pink-600" />
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
              <div className="bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl p-6 border-2 border-pink-300">
                <div className="text-sm text-pink-800 font-semibold mb-2">Correct</div>
                <div className="text-4xl font-bold text-pink-900">{score.correct}</div>
              </div>
              <div className="bg-gradient-to-br from-red-100 to-rose-100 rounded-xl p-6 border-2 border-red-300">
                <div className="text-sm text-red-800 font-semibold mb-2">Incorrect</div>
                <div className="text-4xl font-bold text-red-900">{score.incorrect}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/tests"
              className="flex-1 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold py-5 px-6 rounded-xl transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 text-lg"
            >
              <span>Back to Tests</span>
              <ChevronRight className="w-6 h-6" />
            </Link>
            <button
              onClick={resetTest}
              className="flex-1 bg-white hover:bg-gray-50 text-pink-600 border-2 border-pink-600 font-bold py-5 px-6 rounded-xl transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 text-lg"
            >
              <RotateCcw className="w-6 h-6" />
              <span>Retake Test</span>
            </button>
          </div>

          {/* Navigation to NeuroTwin and Dashboard */}
          <TestResultNavigation 
            testName="Visual Search Test"
            score={score.correct}
          />
        </div>
      </div>
    );
  }
}

