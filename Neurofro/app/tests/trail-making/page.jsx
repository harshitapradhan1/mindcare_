"use client";
import { useState, useRef, useEffect } from 'react';
import { Activity, Play, RotateCcw, Clock, Target, CheckCircle } from 'lucide-react';
import TestResultNavigation from '@/components/TestResultNavigation';

export default function TrailMakingTest() {
  const [testPhase, setTestPhase] = useState('setup'); // setup, partA, partB, results
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [errors, setErrors] = useState(0);
  const [currentTarget, setCurrentTarget] = useState(1);
  const canvasRef = useRef(null);
  const [partATime, setPartATime] = useState(0);
  const [partBTime, setPartBTime] = useState(0);

  // Part A: Numbers 1-25
  const numbersA = Array.from({ length: 25 }, (_, i) => i + 1);
  
  // Part B: Numbers 1-13 and Letters A-L
  const numbersB = Array.from({ length: 13 }, (_, i) => i + 1);
  const lettersB = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const sequenceB = [];
  for (let i = 0; i < 13; i++) {
    sequenceB.push(numbersB[i]);
    sequenceB.push(lettersB[i]);
  }

  const startPartA = () => {
    setTestPhase('partA');
    setStartTime(Date.now());
    setSelectedNumbers([]);
    setErrors(0);
    setCurrentTarget(1);
  };

  const startPartB = () => {
    setTestPhase('partB');
    setStartTime(Date.now());
    setSelectedNumbers([]);
    setErrors(0);
    setCurrentTarget(1);
  };

  const handleNumberClick = (value, isLetter = false) => {
    if (testPhase === 'partA') {
      if (value === currentTarget && !selectedNumbers.includes(value)) {
        setSelectedNumbers([...selectedNumbers, value]);
        setCurrentTarget(value + 1);
        
        if (value === 25) {
          // Part A complete
          const time = (Date.now() - startTime) / 1000;
          setPartATime(time);
          setTimeout(() => {
            setTestPhase('partB');
            setStartTime(Date.now());
            setSelectedNumbers([]);
            setErrors(0);
            setCurrentTarget(1);
          }, 2000);
        }
      } else if (value !== currentTarget) {
        setErrors(prev => prev + 1);
      }
    } else if (testPhase === 'partB') {
      const expectedSequence = sequenceB[currentTarget - 1];
      const isExpectedNumber = !isLetter && value === expectedSequence;
      const isExpectedLetter = isLetter && value === expectedSequence;
      
      if ((isExpectedNumber || isExpectedLetter) && !selectedNumbers.includes(`${isLetter ? 'L' : 'N'}-${value}`)) {
        setSelectedNumbers([...selectedNumbers, `${isLetter ? 'L' : 'N'}-${value}`]);
        setCurrentTarget(currentTarget + 1);
        
        if (currentTarget === 24) {
          // Part B complete
          const time = (Date.now() - startTime) / 1000;
          setPartBTime(time);
          setEndTime(Date.now());
          setTestPhase('results');
          submitResults();
        }
      } else {
        setErrors(prev => prev + 1);
      }
    }
  };

  const submitResults = async () => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : 'demo-user-123';
    const totalTime = partATime + partBTime;
    const bMinusA = partBTime - partATime; // Cognitive flexibility measure
    const API_BASE = typeof window !== 'undefined' ? '/api/backend' : 'http://localhost:5002/api';

    try {
      await fetch(`${API_BASE}/neurotwin/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          test_results: {
            test_type: 'trail-making',
            part_a_time: partATime,
            part_b_time: partBTime,
            total_time: totalTime,
            b_minus_a: bMinusA,
            errors: errors
          }
        })
      });
    } catch (error) {
      console.error('Error submitting results:', error);
    }
  };

  const resetTest = () => {
    setTestPhase('setup');
    setPartATime(0);
    setPartBTime(0);
    setSelectedNumbers([]);
    setErrors(0);
    setCurrentTarget(1);
  };

  const renderPartA = () => {
    const positions = [];
    const cols = 5;
    numbersA.forEach((num, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      positions.push({ num, row, col, x: col * 120 + 60, y: row * 80 + 60 });
    });

    return (
      <div className="relative bg-white rounded-xl p-8 border-2 border-gray-300" style={{ minHeight: '500px' }}>
        <div className="mb-4 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Part A: Connect Numbers 1-25</h3>
          <p className="text-gray-600">Click numbers in order from 1 to 25</p>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Current Target: </span>
            <span className="text-2xl font-bold text-blue-600">{currentTarget}</span>
          </div>
        </div>
        
        <svg className="w-full" style={{ height: '400px' }}>
          {positions.map((pos, idx) => {
            const isSelected = selectedNumbers.includes(pos.num);
            const isCurrent = pos.num === currentTarget;
            const isCompleted = pos.num < currentTarget;
            
            return (
              <g key={pos.num}>
                {idx > 0 && selectedNumbers.includes(positions[idx - 1].num) && (
                  <line
                    x1={positions[idx - 1].x}
                    y1={positions[idx - 1].y}
                    x2={pos.x}
                    y2={pos.y}
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />
                )}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isCurrent ? 25 : 20}
                  fill={isCurrent ? '#3b82f6' : isCompleted ? '#10b981' : isSelected ? '#6b7280' : '#e5e7eb'}
                  stroke={isCurrent ? '#1e40af' : '#9ca3af'}
                  strokeWidth="2"
                  className="cursor-pointer hover:scale-110 transition-transform"
                  onClick={() => handleNumberClick(pos.num)}
                />
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm font-bold fill-white pointer-events-none"
                >
                  {pos.num}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const renderPartB = () => {
    const positions = [];
    sequenceB.forEach((item, idx) => {
      const row = Math.floor(idx / 4);
      const col = idx % 4;
      const isNumber = typeof item === 'number';
      positions.push({ 
        value: item, 
        isNumber, 
        row, 
        col, 
        x: col * 150 + 75, 
        y: row * 100 + 60 
      });
    });

    return (
      <div className="relative bg-white rounded-xl p-8 border-2 border-gray-300" style={{ minHeight: '500px' }}>
        <div className="mb-4 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Part B: Alternate Numbers and Letters</h3>
          <p className="text-gray-600">Click 1-A-2-B-3-C... in order</p>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Current Target: </span>
            <span className="text-2xl font-bold text-purple-600">
              {sequenceB[currentTarget - 1]}
            </span>
          </div>
        </div>
        
        <svg className="w-full" style={{ height: '400px' }}>
          {positions.map((pos, idx) => {
            const key = `${pos.isNumber ? 'N' : 'L'}-${pos.value}`;
            const isSelected = selectedNumbers.includes(key);
            const isCurrent = idx === currentTarget - 1;
            const isCompleted = idx < currentTarget - 1;
            
            return (
              <g key={idx}>
                {idx > 0 && selectedNumbers.includes(`${positions[idx - 1].isNumber ? 'N' : 'L'}-${positions[idx - 1].value}`) && (
                  <line
                    x1={positions[idx - 1].x}
                    y1={positions[idx - 1].y}
                    x2={pos.x}
                    y2={pos.y}
                    stroke="#8b5cf6"
                    strokeWidth="2"
                  />
                )}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isCurrent ? 25 : 20}
                  fill={isCurrent ? '#8b5cf6' : isCompleted ? '#10b981' : isSelected ? '#6b7280' : '#e5e7eb'}
                  stroke={isCurrent ? '#6d28d9' : '#9ca3af'}
                  strokeWidth="2"
                  className="cursor-pointer hover:scale-110 transition-transform"
                  onClick={() => handleNumberClick(pos.value, !pos.isNumber)}
                />
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm font-bold fill-white pointer-events-none"
                >
                  {pos.value}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 p-4">
      <div className="max-w-6xl mx-auto py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl mb-4">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Trail Making Test</h1>
            <p className="text-gray-600">Executive Function & Cognitive Flexibility</p>
          </div>

          {testPhase === 'setup' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Instructions</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>Part A:</strong> Connect numbers 1-25 in order as quickly as possible</li>
                  <li>• <strong>Part B:</strong> Alternate between numbers and letters (1-A-2-B-3-C...)</li>
                  <li>• Complete both parts as fast as you can</li>
                  <li>• This measures visual attention, processing speed, and cognitive flexibility</li>
                </ul>
              </div>

              <button
                onClick={startPartA}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl py-4 font-bold text-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-6 h-6" />
                Start Test
              </button>
            </div>
          )}

          {(testPhase === 'partA' || testPhase === 'partB') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="bg-blue-100 px-4 py-2 rounded-xl">
                  <Clock className="w-4 h-4 inline mr-2" />
                  <span className="text-sm font-semibold text-blue-700">
                    {startTime ? ((Date.now() - startTime) / 1000).toFixed(1) : '0.0'}s
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Errors</div>
                  <div className="text-2xl font-bold text-red-600">{errors}</div>
                </div>
              </div>

              {testPhase === 'partA' && renderPartA()}
              {testPhase === 'partB' && renderPartB()}
            </div>
          )}

          {testPhase === 'results' && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Test Complete!</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Part A (Numbers)</h3>
                  <div className="text-4xl font-bold text-blue-700 mb-2">{partATime.toFixed(1)}s</div>
                  <p className="text-sm text-gray-600">Time to complete</p>
                </div>
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Part B (Alternating)</h3>
                  <div className="text-4xl font-bold text-purple-700 mb-2">{partBTime.toFixed(1)}s</div>
                  <p className="text-sm text-gray-600">Time to complete</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">Performance Metrics</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>Total Time:</span>
                    <span className="font-semibold">{(partATime + partBTime).toFixed(1)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>B - A (Flexibility Score):</span>
                    <span className="font-semibold">{(partBTime - partATime).toFixed(1)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Errors:</span>
                    <span className="font-semibold">{errors}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={resetTest}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl py-3 font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
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
                testName="Trail-Making Test"
                score={Math.max(0, 200 - (partATime + partBTime))}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

