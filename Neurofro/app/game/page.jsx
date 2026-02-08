'use client';
import { useState, useEffect, useRef } from 'react';
import { Brain, Activity, Clock, Target, TrendingUp, Award, ChevronRight, AlertCircle, CheckCircle, Info, Zap, Heart } from 'lucide-react';

export default function StroopTestGame() {
  const [gameState, setGameState] = useState('setup');
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(20);
  const [gameLevel, setGameLevel] = useState(3);
  const [gameTime, setGameTime] = useState(60);

  const [startTime, setStartTime] = useState(null);
  const [roundStartTime, setRoundStartTime] = useState(null);
  const [currentWord, setCurrentWord] = useState('');
  const [currentColor, setCurrentColor] = useState('');
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);

  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timerRef = useRef(null);
  const gameTimerRef = useRef(null);

  const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
  const words = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE'];

  const colorStyles = {
    red: 'text-red-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600'
  };

  const getSeverityConfig = (severity) => {
    const configs = {
      low: {
        bgClass: 'from-green-50 to-emerald-50',
        borderClass: 'border-green-300',
        textClass: 'text-green-900',
        icon: <CheckCircle className="w-8 h-8 text-green-600" />,
        badge: 'bg-green-200 text-green-900'
      },
      medium: {
        bgClass: 'from-yellow-50 to-amber-50',
        borderClass: 'border-yellow-300',
        textClass: 'text-yellow-900',
        icon: <AlertCircle className="w-8 h-8 text-yellow-600" />,
        badge: 'bg-yellow-200 text-yellow-900'
      },
      high: {
        bgClass: 'from-red-50 to-rose-50',
        borderClass: 'border-red-300',
        textClass: 'text-red-900',
        icon: <AlertCircle className="w-8 h-8 text-red-600" />,
        badge: 'bg-red-200 text-red-900'
      }
    };
    return configs[severity] || configs.low;
  };

  const generateNewRound = () => {
    const word = words[Math.floor(Math.random() * words.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];
    setCurrentWord(word);
    setCurrentColor(color);
    setRoundStartTime(Date.now());
  };

  const startGame = () => {
    setGameState('playing');
    setCurrentRound(0);
    setCorrectAnswers(0);
    setWrongAnswers(0);
    setReactionTimes([]);
    setTimeLeft(gameTime);
    setStartTime(Date.now());

    gameTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    generateNewRound();
  };

  const endGame = () => {
    setGameState('finished');
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
    }
    calculateAndSubmitResults();
  };

  const handleColorClick = (selectedColor) => {
    if (gameState !== 'playing') return;

    const reactionTime = (Date.now() - roundStartTime) / 1000;
    const isCorrect = selectedColor.toLowerCase() === currentColor.toLowerCase();

    setReactionTimes(prev => [...prev, reactionTime]);

    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
    } else {
      setWrongAnswers(prev => prev + 1);
    }

    const nextRound = currentRound + 1;
    setCurrentRound(nextRound);

    if (nextRound >= totalRounds) {
      endGame();
    } else {
      generateNewRound();
    }
  };

  const calculateAndSubmitResults = async () => {
    const totalAttempts = correctAnswers + wrongAnswers;
    const accuracy = totalAttempts > 0 ? correctAnswers / totalAttempts : 0;
    const avgReactionTime = reactionTimes.length > 0
      ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
      : 1.0;

    const formData = {
      accuracy: Math.round(accuracy * 100) / 100,
      reaction_time: Math.round(avgReactionTime * 100) / 100,
      retries: wrongAnswers,
      level: gameLevel,
      total_time: gameTime,
    };

    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:5002/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      setResult(data);

      // Update NeuroTwin profile
      try {
        const userId = 'demo-user-123'; // In production, get from auth
        await fetch('http://localhost:5002/api/neurotwin/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            test_results: formData
          }),
        });
      } catch (neurotwinError) {
        console.error('Error updating NeuroTwin:', neurotwinError);
        // Don't fail the main request if NeuroTwin update fails
      }
    } catch (error) {
      console.error('Error submitting results:', error);
      setResult({ error: 'Failed to submit results' });
    }

    setIsSubmitting(false);
  };

  const resetGame = () => {
    setGameState('setup');
    setResult(null);
    setCurrentRound(0);
    setCorrectAnswers(0);
    setWrongAnswers(0);
    setReactionTimes([]);
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
    }
  };

  if (gameState === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          {/* Header with Image */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-teal-500 to-blue-600 p-3 rounded-xl shadow-lg">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">
                Stroop Cognitive Test
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Test your cognitive processing speed and executive function by identifying the color of the text, not the word itself
            </p>
            
            {/* Demo Image Section */}
            <div className="relative max-w-2xl mx-auto mb-8">
              <img 
                src="https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&h=400&fit=crop"
                alt="Brain cognitive test illustration"
                className="w-full h-64 object-cover rounded-2xl shadow-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-2xl"></div>
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <div className="flex items-center gap-2 justify-center">
                  <Zap className="w-6 h-6" />
                  <p className="text-lg font-semibold">Measure Your Cognitive Speed & Accuracy</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-teal-100">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-5 text-center border-2 border-teal-200 hover:scale-105 transition-transform">
                <Target className="w-7 h-7 text-teal-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-gray-900">20+</div>
                <div className="text-sm text-gray-600 font-medium">Test Rounds</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 text-center border-2 border-blue-200 hover:scale-105 transition-transform">
                <Clock className="w-7 h-7 text-blue-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-gray-900">60s</div>
                <div className="text-sm text-gray-600 font-medium">Time Limit</div>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 text-center border-2 border-indigo-200 hover:scale-105 transition-transform">
                <Activity className="w-7 h-7 text-indigo-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-gray-900">5</div>
                <div className="text-sm text-gray-600 font-medium">Difficulty Levels</div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">
                  Number of Rounds
                </label>
                <input
                  type="number"
                  value={totalRounds}
                  onChange={(e) => setTotalRounds(parseInt(e.target.value) || 20)}
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-lg font-medium"
                  min="5"
                  max="50"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">
                  Difficulty Level
                </label>
                <select
                  value={gameLevel}
                  onChange={(e) => setGameLevel(parseInt(e.target.value))}
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-lg font-medium"
                >
                  <option value={1}>Level 1 - Easy</option>
                  <option value={2}>Level 2 - Medium</option>
                  <option value={3}>Level 3 - Hard</option>
                  <option value={4}>Level 4 - Expert</option>
                  <option value={5}>Level 5 - Master</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">
                  Time Limit (seconds)
                </label>
                <input
                  type="number"
                  value={gameTime}
                  onChange={(e) => setGameTime(parseInt(e.target.value) || 60)}
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-lg font-medium"
                  min="30"
                  max="300"
                />
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full mt-8 px-8 py-5 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl hover:from-teal-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-2xl font-bold text-lg flex items-center justify-center gap-2 group"
            >
              <span>Start Cognitive Test</span>
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
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
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-teal-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-teal-500 to-blue-600 px-5 py-3 rounded-xl shadow-md">
                  <div className="text-white font-bold text-lg">Round {currentRound + 1}/{totalRounds}</div>
                </div>
                <div className="flex items-center gap-3 text-gray-800">
                  <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-lg border border-green-300">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-bold text-lg">{correctAnswers}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-red-100 px-4 py-2 rounded-lg border border-red-300">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="font-bold text-lg">{wrongAnswers}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gradient-to-br from-teal-50 to-blue-50 px-5 py-3 rounded-xl border-2 border-teal-300">
                <Clock className="w-6 h-6 text-teal-600" />
                <span className="text-2xl font-bold text-teal-700">{timeLeft}s</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-12 border-2 border-teal-100">
            <div className="text-center mb-12">
              <p className="text-gray-700 mb-6 text-xl font-semibold">Select the color that matches:</p>
              <div className={`text-9xl font-black ${colorStyles[currentColor]} mb-8 transition-all drop-shadow-lg`}>
                {currentWord}
              </div>
              <div className="h-2 w-32 bg-gradient-to-r from-teal-500 to-blue-600 mx-auto rounded-full shadow-md"></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorClick(color)}
                  className={`h-24 rounded-xl font-bold text-white text-lg transition-all duration-150 hover:scale-105 active:scale-95 shadow-lg hover:shadow-2xl border-2 border-white ${
                    color === 'red' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                    color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                    color === 'green' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                    color === 'yellow' ? 'bg-gradient-to-br from-yellow-400 to-yellow-500' :
                    color === 'purple' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                    'bg-gradient-to-br from-orange-500 to-orange-600'
                  }`}
                >
                  {color.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-5 mt-6 border-2 border-teal-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-600" />
                <span className="text-gray-700 font-semibold">Accuracy:</span>
                <span className="font-bold text-gray-900 text-lg">
                  {((correctAnswers / (correctAnswers + wrongAnswers || 1)) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <span className="text-gray-700 font-semibold">Level:</span>
                <span className="font-bold text-teal-600 text-lg">{gameLevel}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    const totalAttempts = correctAnswers + wrongAnswers;
    const accuracy = totalAttempts > 0 ? (correctAnswers / totalAttempts * 100).toFixed(1) : '0';
    const avgReactionTime = reactionTimes.length > 0
      ? (reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length).toFixed(2)
      : '0';

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-3xl w-full">
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-br from-teal-500 to-blue-600 p-5 rounded-2xl mb-4 shadow-xl">
              <Award className="w-14 h-14 text-white" />
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-3">Test Complete!</h2>
            <p className="text-gray-600 text-xl">Here are your cognitive assessment results</p>
          </div>

          {/* Success Image */}
          <div className="relative mb-6">
            <img 
              src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=300&fit=crop"
              alt="Medical professional with results"
              className="w-full h-48 object-cover rounded-2xl shadow-xl"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl"></div>
            <div className="absolute bottom-4 left-6 right-6 text-white">
              <div className="flex items-center gap-2">
                <Heart className="w-6 h-6" />
                <p className="text-lg font-semibold">Your cognitive health matters</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6 border-2 border-teal-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Activity className="w-6 h-6 text-teal-600" />
              Performance Metrics
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl p-6 border-2 border-green-300 hover:scale-105 transition-transform">
                <div className="text-sm text-green-800 font-semibold mb-2">Accuracy</div>
                <div className="text-4xl font-bold text-green-900">{accuracy}%</div>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl p-6 border-2 border-blue-300 hover:scale-105 transition-transform">
                <div className="text-sm text-blue-800 font-semibold mb-2">Avg Reaction</div>
                <div className="text-4xl font-bold text-blue-900">{avgReactionTime}s</div>
              </div>
              <div className="bg-gradient-to-br from-teal-100 to-blue-100 rounded-xl p-6 border-2 border-teal-300 hover:scale-105 transition-transform">
                <div className="text-sm text-teal-800 font-semibold mb-2">Correct Answers</div>
                <div className="text-4xl font-bold text-teal-900">{correctAnswers}</div>
              </div>
              <div className="bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl p-6 border-2 border-pink-300 hover:scale-105 transition-transform">
                <div className="text-sm text-pink-800 font-semibold mb-2">Wrong Answers</div>
                <div className="text-4xl font-bold text-pink-900">{wrongAnswers}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-6">
              <div className="bg-gray-100 rounded-xl p-5 border-2 border-gray-300">
                <div className="text-sm text-gray-700 font-semibold mb-1">Difficulty Level</div>
                <div className="text-3xl font-bold text-gray-900">Level {gameLevel}</div>
              </div>
              <div className="bg-gray-100 rounded-xl p-5 border-2 border-gray-300">
                <div className="text-sm text-gray-700 font-semibold mb-1">Time Limit</div>
                <div className="text-3xl font-bold text-gray-900">{gameTime}s</div>
              </div>
            </div>
          </div>

          {isSubmitting && (
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border-2 border-teal-100 text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-teal-600 mb-4"></div>
              <p className="text-gray-700 font-semibold text-lg">Analyzing cognitive patterns...</p>
            </div>
          )}

          {result && !isSubmitting && !result.error && (
            <div className={`bg-gradient-to-br ${getSeverityConfig(result.insights?.severity).bgClass} border-2 ${getSeverityConfig(result.insights?.severity).borderClass} rounded-2xl p-8 mb-6 shadow-xl`}>
              <div className="flex items-center gap-4 mb-6">
                {getSeverityConfig(result.insights?.severity).icon}
                <h3 className="text-3xl font-bold text-gray-900">Cognitive Risk Assessment</h3>
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-700 font-bold text-lg">Classification:</span>
                    <span className={`px-5 py-2 rounded-full text-lg font-bold ${getSeverityConfig(result.insights?.severity).badge}`}>
                      {result.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-bold text-lg">Confidence Level:</span>
                    <span className="text-2xl font-bold text-teal-700">{(result.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>

                {result.insights && (
                  <>
                    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                      <div className="flex items-start gap-3 mb-3">
                        <Info className="w-6 h-6 text-teal-600 mt-1 flex-shrink-0" />
                        <div>
                          <div className="font-bold text-gray-900 mb-2 text-lg">Assessment Message</div>
                          <p className="text-gray-700 leading-relaxed">{result.insights.message}</p>
                        </div>
                      </div>
                    </div>

                    {result.insights.recommendations && result.insights.recommendations.length > 0 && (
                      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                        <div className="font-bold text-gray-900 mb-4 flex items-center gap-3 text-lg">
                          <CheckCircle className="w-6 h-6 text-teal-600" />
                          Recommendations
                        </div>
                        <ul className="space-y-3">
                          {result.insights.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-gray-700">
                              <span className="text-teal-600 font-bold text-xl mt-1">•</span>
                              <span className="leading-relaxed">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}

                {result.analysis_id && (
                  <div className="bg-white rounded-xl p-5 shadow-md text-center border border-gray-200">
                    <span className="text-sm text-gray-600 font-semibold">Analysis ID: </span>
                    <span className="text-sm font-mono font-bold text-gray-900">{result.analysis_id}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {result && result.error && (
            <div className="bg-red-100 border-2 border-red-300 rounded-2xl p-6 mb-6 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-7 h-7 text-red-600" />
                <span className="font-bold text-red-900 text-lg">Error</span>
              </div>
              <p className="text-red-800">{result.error}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="flex-1 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-bold py-5 px-6 rounded-xl transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 text-lg"
            >
              <span>Go to Dashboard</span>
              <ChevronRight className="w-6 h-6" />
            </button>

            <button
              onClick={() => window.location.href = '/speech'}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-5 px-6 rounded-xl transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 text-lg"
            >
              <span>Continue to Speech Test</span>
              <ChevronRight className="w-6 h-6" />
            </button>

            <button
              onClick={resetGame}
              className="flex-1 bg-white hover:bg-gray-50 text-teal-600 border-2 border-teal-600 font-bold py-5 px-6 rounded-xl transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 text-lg"
            >
              <span>Take Another Test</span>
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }
}