"use client";
import { useState, useEffect } from 'react';
import { Brain, Trophy, RefreshCw, Clock } from 'lucide-react';
import TestResultNavigation from '@/components/TestResultNavigation';
import GameAccessControl from '@/components/GameAccessControl';

export default function MemoryMatchGame() {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState(4); // 4x4 grid

  const symbols = ['🎯', '🧠', '⚡', '💎', '🌟', '🎨', '🚀', '🎪'];

  useEffect(() => {
    initializeGame();
  }, [difficulty]);

  useEffect(() => {
    let interval;
    if (!gameOver && cards.length > 0) {
      interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameOver, cards]);

  const initializeGame = () => {
    const totalCards = difficulty * difficulty;
    const pairs = totalCards / 2;
    const selectedSymbols = symbols.slice(0, pairs);
    const cardPairs = [...selectedSymbols, ...selectedSymbols];
    
    // Shuffle
    const shuffled = cardPairs.sort(() => Math.random() - 0.5);
    
    setCards(shuffled.map((symbol, index) => ({ id: index, symbol })));
    setFlipped([]);
    setMatched([]);
    setScore(0);
    setMoves(0);
    setTime(0);
    setGameOver(false);
    setIsProcessing(false);
  };

  const [isProcessing, setIsProcessing] = useState(false);

  const handleCardClick = (cardId) => {
    // Prevent rapid clicking and multiple card flips
    if (
      isProcessing ||
      flipped.length === 2 || 
      flipped.includes(cardId) || 
      matched.includes(cardId) ||
      gameOver
    ) {
      return;
    }

    setIsProcessing(true);
    const newFlipped = [...flipped, cardId];
    setFlipped(newFlipped);
    setMoves(prev => prev + 1);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      const card1 = cards.find(c => c.id === first);
      const card2 = cards.find(c => c.id === second);

      if (card1.symbol === card2.symbol) {
        // Match found
        setMatched(prev => [...prev, first, second]);
        setScore(prev => prev + 10);
        setFlipped([]);
        setIsProcessing(false);
      } else {
        // No match - flip back after delay
        setTimeout(() => {
          setFlipped([]);
          setIsProcessing(false);
        }, 1000);
      }
    } else {
      // Only one card flipped - allow next click
      setIsProcessing(false);
    }
  };

  const submitResults = async (finalScore) => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : 'demo-user-123';
    const pairs = matched.length / 2;
    const API_BASE = typeof window !== 'undefined' ? '/api/backend' : 'http://localhost:5002/api';
    
    try {
      await fetch(`${API_BASE}/neurotwin/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          test_results: {
            test_type: 'memory-match',
            score: finalScore,
            moves: moves,
            time: time,
            pairs: pairs,
            difficulty: difficulty
          }
        })
      });
    } catch (error) {
      console.error('Error submitting results to NeuroTwin:', error);
    }
  };

  useEffect(() => {
    if (matched.length === cards.length && cards.length > 0) {
      setGameOver(true);
      // Calculate final score with better formula
      const movesBonus = Math.max(0, Math.floor(200 / (moves + 1)));
      const timeBonus = Math.max(0, Math.floor(200 / (time + 1)));
      const finalScore = score + movesBonus + timeBonus;
      setScore(finalScore);
      // Submit results to NeuroTwin
      submitResults(finalScore);
    }
  }, [matched, cards, score, moves, time]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <GameAccessControl gameId="memory-match">
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="w-10 h-10 text-teal-600" />
            <h1 className="text-4xl font-bold text-gray-900">Memory Match</h1>
          </div>
          <p className="text-gray-600">Test your short-term memory recall</p>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 text-center">
            <div className="text-2xl font-bold text-teal-600">{score}</div>
            <div className="text-sm text-gray-600">Score</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 text-center">
            <div className="text-2xl font-bold text-blue-600">{moves}</div>
            <div className="text-sm text-gray-600">Moves</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 text-center">
            <div className="text-2xl font-bold text-purple-600">{formatTime(time)}</div>
            <div className="text-sm text-gray-600">Time</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 text-center">
            <div className="text-2xl font-bold text-orange-600">{matched.length / 2}</div>
            <div className="text-sm text-gray-600">Pairs</div>
          </div>
        </div>

        {/* Game Board */}
        <div 
          className="grid gap-3 mb-6 mx-auto"
          style={{
            gridTemplateColumns: `repeat(${difficulty}, 1fr)`,
            maxWidth: `${difficulty * 100}px`
          }}
        >
          {cards.map(card => {
            const isFlipped = flipped.includes(card.id);
            const isMatched = matched.includes(card.id);
            
            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                disabled={isFlipped || isMatched || gameOver || isProcessing}
                className={`
                  aspect-square rounded-xl font-bold text-4xl transition-all duration-300
                  ${isFlipped || isMatched 
                    ? 'bg-gradient-to-br from-teal-400 to-blue-500 text-white shadow-lg scale-105' 
                    : 'bg-white hover:bg-gray-50 text-gray-400 shadow-md hover:shadow-lg'
                  }
                  ${isMatched ? 'opacity-50' : ''}
                  ${gameOver ? 'cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {isFlipped || isMatched ? card.symbol : '?'}
              </button>
            );
          })}
        </div>

        {/* Game Over */}
        {gameOver && (
          <>
          <div className="bg-gradient-to-r from-teal-500 to-blue-600 rounded-2xl p-8 text-white text-center shadow-xl mb-6">
            <Trophy className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2">Congratulations!</h2>
            <p className="text-teal-100 mb-4">You completed the memory match!</p>
            <div className="text-4xl font-bold mb-6">{score}</div>
            <button
              onClick={initializeGame}
              className="bg-white text-teal-600 rounded-xl px-8 py-3 font-bold hover:bg-teal-50 transition-all flex items-center justify-center gap-2 mx-auto"
            >
              <RefreshCw className="w-5 h-5" />
              Play Again
            </button>
          </div>
            
            {/* Navigation to NeuroTwin and Dashboard */}
            <TestResultNavigation 
              testName="Memory Match"
              score={score}
            />
          </>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(parseInt(e.target.value))}
            className="px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            disabled={!gameOver && cards.length > 0}
          >
            <option value={4}>Easy (4x4)</option>
            <option value={6}>Medium (6x6)</option>
            <option value={8}>Hard (8x8)</option>
          </select>
          <button
            onClick={initializeGame}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Reset
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-6 py-2 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
    </GameAccessControl>
  );
}

