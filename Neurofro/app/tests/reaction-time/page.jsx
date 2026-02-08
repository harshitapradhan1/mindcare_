"use client";
import { useState, useEffect, useRef } from 'react';
import { Zap, Play, RotateCcw, Clock, Target, CheckCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import TestResultNavigation from '@/components/TestResultNavigation';

export default function ReactionTimeTest() {
  const [gameState, setGameState] = useState('setup');
  const [waiting, setWaiting] = useState(false);
  const [showStimulus, setShowStimulus] = useState(false);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [round, setRound] = useState(0);
  const [maxRounds] = useState(30);
  const [currentReactionTime, setCurrentReactionTime] = useState(null);
  const [startTime, setStartTime] = useState(null);

  const timerRef = useRef(null);
  const waitTimerRef = useRef(null);

  const startTest = () => {
    setReactionTimes([]);
    setRound(0);
    setGameState('playing');
    startRound();
  };

  const startRound = () => {
    setWaiting(true);
    setShowStimulus(false);
    setCurrentReactionTime(null);

    // Random wait between 1-4 seconds
    const waitTime = Math.random() * 3000 + 1000;
    
    waitTimerRef.current = setTimeout(() => {
      setWaiting(false);
      setShowStimulus(true);
      setStartTime(Date.now());
    }, waitTime);
  };

  const handleClick = () => {
    if (!showStimulus || !startTime) return;

    const reactionTime = Date.now() - startTime;
    setCurrentReactionTime(reactionTime);
    setReactionTimes(prev => [...prev, reactionTime]);

    setTimeout(() => {
      const nextRound = round + 1;
      if (nextRound >= maxRounds) {
        endTest();
      } else {
        setRound(nextRound);
        startRound();
      }
    }, 1000);
  };

  const endTest = () => {
    if (waitTimerRef.current) {
      clearTimeout(waitTimerRef.current);
    }
    setGameState('results');
    submitResults();
  };

  const submitResults = async () => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : 'demo-user-123';
    const avgReactionTime = reactionTimes.length > 0 
      ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
      : 0;
    const minReactionTime = reactionTimes.length > 0 ? Math.min(...reactionTimes) : 0;
    const maxReactionTime = reactionTimes.length > 0 ? Math.max(...reactionTimes) : 0;
    const API_BASE = typeof window !== 'undefined' ? '/api/backend' : 'http://localhost:5002/api';

    try {
      const predictResponse = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accuracy: 0.95, // High accuracy expected for simple reaction
          reaction_time: avgReactionTime / 1000,
          retries: 0,
          level: 1,
          total_time: maxRounds * 2
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
              test_type: 'reaction-time',
              avg_reaction_time: avgReactionTime / 1000,
              reaction_time: avgReactionTime / 1000, // Also include for compatibility
              min_reaction_time: minReactionTime / 1000,
              max_reaction_time: maxReactionTime / 1000,
              consistency: reactionTimes.length > 1 ? 1 - (Math.max(...reactionTimes) - Math.min(...reactionTimes)) / Math.max(...reactionTimes) : 1.0,
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
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-xl shadow-lg">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">
                Reaction Time Test
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Measure your processing speed and alertness by reacting as quickly as possible to visual stimuli
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-amber-100">
            <div className="bg-amber-50 rounded-xl p-6 mb-6 border border-amber-200">
              <h3 className="font-bold text-gray-900 mb-3">Instructions</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>Wait for the screen to turn green</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>Click as quickly as possible when you see green</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>Don't click too early - wait for the signal</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>Complete {maxRounds} trials</span>
                </li>
              </ul>
            </div>

            <button
              onClick={startTest}
              className="w-full mt-8 px-8 py-5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-2xl font-bold text-lg flex items-center justify-center gap-2 group"
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
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-amber-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 px-5 py-3 rounded-xl shadow-md">
                  <div className="text-white font-bold text-lg">Trial {round + 1}/{maxRounds}</div>
                </div>
              </div>
              {currentReactionTime && (
                <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-lg border border-green-300">
                  <Zap className="w-5 h-5 text-green-600" />
                  <span className="font-bold text-green-900">{currentReactionTime}ms</span>
                </div>
              )}
            </div>
          </div>

          <div 
            onClick={handleClick}
            className={`h-96 rounded-2xl shadow-2xl border-4 transition-all cursor-pointer flex items-center justify-center ${
              waiting 
                ? 'bg-red-500 border-red-600 hover:bg-red-600' 
                : showStimulus 
                ? 'bg-green-500 border-green-600 hover:bg-green-600 animate-pulse' 
                : 'bg-gray-300 border-gray-400'
            }`}
          >
            <div className="text-center">
              {waiting ? (
                <div className="text-white">
                  <div className="text-6xl font-bold mb-4">WAIT</div>
                  <div className="text-2xl">Don't click yet!</div>
                </div>
              ) : showStimulus ? (
                <div className="text-white">
                  <Zap className="w-24 h-24 mx-auto mb-4" />
                  <div className="text-6xl font-bold mb-4">CLICK NOW!</div>
                  <div className="text-2xl">As fast as you can!</div>
                </div>
              ) : (
                <div className="text-gray-600">
                  <div className="text-4xl font-bold">Get Ready...</div>
                </div>
              )}
            </div>
          </div>

          {reactionTimes.length > 0 && (
            <div className="bg-white rounded-xl p-4 mt-6 border-2 border-amber-100">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Average Reaction Time</div>
                <div className="text-3xl font-bold text-amber-600">
                  {(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length).toFixed(0)}ms
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameState === 'results') {
    const avgReactionTime = reactionTimes.length > 0
      ? (reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length).toFixed(0)
      : '0';
    const minReactionTime = reactionTimes.length > 0 ? Math.min(...reactionTimes).toFixed(0) : '0';
    const maxReactionTime = reactionTimes.length > 0 ? Math.max(...reactionTimes).toFixed(0) : '0';

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-3xl w-full">
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-br from-amber-500 to-orange-600 p-5 rounded-2xl mb-4 shadow-xl">
              <Zap className="w-14 h-14 text-white" />
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-3">Test Complete!</h2>
            <p className="text-gray-600 text-xl">Your reaction time assessment results</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6 border-2 border-amber-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Zap className="w-6 h-6 text-amber-600" />
              Performance Metrics
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl p-6 border-2 border-amber-300">
                <div className="text-sm text-amber-800 font-semibold mb-2">Average</div>
                <div className="text-4xl font-bold text-amber-900">{avgReactionTime}ms</div>
              </div>
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl p-6 border-2 border-green-300">
                <div className="text-sm text-green-800 font-semibold mb-2">Fastest</div>
                <div className="text-4xl font-bold text-green-900">{minReactionTime}ms</div>
              </div>
              <div className="bg-gradient-to-br from-red-100 to-rose-100 rounded-xl p-6 border-2 border-red-300">
                <div className="text-sm text-red-800 font-semibold mb-2">Slowest</div>
                <div className="text-4xl font-bold text-red-900">{maxReactionTime}ms</div>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl p-6 border-2 border-blue-300">
                <div className="text-sm text-blue-800 font-semibold mb-2">Trials</div>
                <div className="text-4xl font-bold text-blue-900">{reactionTimes.length}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/tests"
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-5 px-6 rounded-xl transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 text-lg"
            >
              <span>Back to Tests</span>
              <ChevronRight className="w-6 h-6" />
            </Link>
            <button
              onClick={resetTest}
              className="flex-1 bg-white hover:bg-gray-50 text-amber-600 border-2 border-amber-600 font-bold py-5 px-6 rounded-xl transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 text-lg"
            >
              <RotateCcw className="w-6 h-6" />
              <span>Retake Test</span>
            </button>
          </div>

          {/* Navigation to NeuroTwin and Dashboard */}
          <TestResultNavigation 
            testName="Reaction Time Test"
            score={reactionTimes.length > 0 ? Math.round(1000 / (reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)) : null}
          />
        </div>
      </div>
    );
  }
}

