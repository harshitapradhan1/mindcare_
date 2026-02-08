"use client";
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Play, RotateCcw, Clock, Target, CheckCircle, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import TestResultNavigation from '@/components/TestResultNavigation';

export default function FlankerTask() {
  const [gameState, setGameState] = useState('setup');
  const [currentStimulus, setCurrentStimulus] = useState(null);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [reactionTimes, setReactionTimes] = useState([]);
  const [round, setRound] = useState(0);
  const [maxRounds] = useState(100);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes

  const timerRef = useRef(null);
  const reactionStartRef = useRef(null);
  const sequenceRef = useRef([]);

  const generateStimulus = () => {
    const directions = ['left', 'right'];
    const center = directions[Math.floor(Math.random() * directions.length)];
    const flankers = directions[Math.floor(Math.random() * directions.length)];
    
    // 50% congruent (flankers match center), 50% incongruent
    const isCongruent = Math.random() < 0.5;
    const finalFlankers = isCongruent ? center : flankers;
    
    return {
      center,
      flankers: finalFlankers,
      isCongruent,
      correctAnswer: center
    };
  };

  const startTest = () => {
    const seq = [];
    for (let i = 0; i < maxRounds; i++) {
      seq.push(generateStimulus());
    }
    sequenceRef.current = seq;
    
    setScore({ correct: 0, incorrect: 0 });
    setReactionTimes([]);
    setRound(0);
    setTimeLeft(180);
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
    setIsCorrect(null);
  };

  const handleResponse = (direction) => {
    if (gameState !== 'playing' || !currentStimulus) return;

    const reactionTime = Date.now() - reactionStartRef.current;
    const correct = direction === currentStimulus.correctAnswer;

    setReactionTimes(prev => [...prev, reactionTime]);
    setIsCorrect(correct);

    if (correct) {
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
        showNextStimulus();
      }
    }, 800);
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
              test_type: 'flanker-task',
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

  const renderArrows = (direction, count = 3) => {
    return Array(count).fill(null).map((_, i) => (
      <ArrowRight 
        key={i} 
        className={`w-12 h-12 ${direction === 'left' ? 'rotate-180' : ''}`}
      />
    ));
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
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl shadow-lg">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">
                Flanker Task
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Test your response inhibition and attention by identifying the direction of the center arrow
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-emerald-100">
            <div className="bg-emerald-50 rounded-xl p-6 mb-6 border border-emerald-200">
              <h3 className="font-bold text-gray-900 mb-3">Instructions</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Look at the center arrow and ignore the surrounding arrows</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Press LEFT if center arrow points left, RIGHT if it points right</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Respond as quickly and accurately as possible</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Complete {maxRounds} trials in 3 minutes</span>
                </li>
              </ul>
            </div>

            <div className="flex justify-center mb-6">
              <div className="bg-gray-100 rounded-xl p-8">
                <div className="flex items-center gap-2 text-6xl">
                  {renderArrows('right', 2)}
                  <ArrowRight className="w-16 h-16 text-emerald-600" />
                  {renderArrows('right', 2)}
                </div>
                <p className="text-center text-sm text-gray-600 mt-4">Example: Press RIGHT</p>
              </div>
            </div>

            <button
              onClick={startTest}
              className="w-full mt-8 px-8 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-2xl font-bold text-lg flex items-center justify-center gap-2 group"
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
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-emerald-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-3 rounded-xl shadow-md">
                  <div className="text-white font-bold text-lg">Trial {round + 1}/{maxRounds}</div>
                </div>
                <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-lg border border-green-300">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-bold text-green-900">{score.correct}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gradient-to-br from-emerald-50 to-teal-50 px-5 py-3 rounded-xl border-2 border-emerald-300">
                <Clock className="w-6 h-6 text-emerald-600" />
                <span className="text-2xl font-bold text-emerald-700">{timeLeft}s</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-12 border-2 border-emerald-100">
            <div className="text-center mb-8">
              <p className="text-gray-700 mb-8 text-xl font-semibold">Which direction does the CENTER arrow point?</p>
              {currentStimulus && (
                <div className="flex items-center justify-center gap-2 text-8xl mb-8">
                  {renderArrows(currentStimulus.flankers, 2)}
                  <div className={`${currentStimulus.center === 'left' ? 'rotate-180' : ''}`}>
                    <ArrowRight className="w-24 h-24 text-emerald-600" />
                  </div>
                  {renderArrows(currentStimulus.flankers, 2)}
                </div>
              )}
              {showFeedback && (
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
                      <span>Incorrect</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <button
                onClick={() => handleResponse('left')}
                className="h-32 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-2xl font-bold text-2xl flex items-center justify-center gap-3"
              >
                <ArrowLeft className="w-10 h-10" />
                <span>LEFT</span>
              </button>
              <button
                onClick={() => handleResponse('right')}
                className="h-32 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-2xl font-bold text-2xl flex items-center justify-center gap-3"
              >
                <span>RIGHT</span>
                <ArrowRight className="w-10 h-10" />
              </button>
            </div>
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
            <div className="inline-block bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-2xl mb-4 shadow-xl">
              <Target className="w-14 h-14 text-white" />
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-3">Test Complete!</h2>
            <p className="text-gray-600 text-xl">Your attention and inhibition assessment results</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6 border-2 border-emerald-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Target className="w-6 h-6 text-emerald-600" />
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
              <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl p-6 border-2 border-emerald-300">
                <div className="text-sm text-emerald-800 font-semibold mb-2">Correct</div>
                <div className="text-4xl font-bold text-emerald-900">{score.correct}</div>
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
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-5 px-6 rounded-xl transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 text-lg"
            >
              <span>Back to Tests</span>
              <ChevronRight className="w-6 h-6" />
            </Link>
            <button
              onClick={resetTest}
              className="flex-1 bg-white hover:bg-gray-50 text-emerald-600 border-2 border-emerald-600 font-bold py-5 px-6 rounded-xl transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 text-lg"
            >
              <RotateCcw className="w-6 h-6" />
              <span>Retake Test</span>
            </button>
          </div>

          {/* Navigation to NeuroTwin and Dashboard */}
          <TestResultNavigation 
            testName="Flanker Task"
            score={score.correct}
          />
        </div>
      </div>
    );
  }
}

