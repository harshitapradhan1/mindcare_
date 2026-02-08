"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, Lock, ArrowRight, Calendar } from 'lucide-react';
import Link from 'next/link';

/**
 * GameAccessControl Component
 * 
 * Manages free vs pro user access to games:
 * - Free users: 2 randomly selected games per day
 * - Pro users: All games, unlimited access
 */
export default function GameAccessControl({ gameId, children }) {
  const router = useRouter();
  const [userPlan, setUserPlan] = useState('free');
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dailyGames, setDailyGames] = useState([]);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [gameId]);

  const checkAccess = async () => {
    try {
      const userId = typeof window !== 'undefined' 
        ? localStorage.getItem('userId') 
        : null;

      if (!userId) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      // Get user subscription/plan
      const storedPlan = localStorage.getItem('userPlan');
      let plan = storedPlan || 'free';

      // Try to fetch from backend
      try {
        const API_BASE = typeof window !== 'undefined' ? '/api/backend' : 'http://localhost:5002/api';
        const response = await fetch(`${API_BASE}/user/subscription?user_id=${userId}`);
        if (response.ok) {
          const data = await response.json();
          plan = data.plan?.toLowerCase() || 'free';
          localStorage.setItem('userPlan', plan);
        }
      } catch (err) {
        console.warn('Could not fetch subscription, using stored plan');
      }

      setUserPlan(plan);
      setIsPro(plan === 'pro' || plan === 'premium' || plan === 'enterprise');

      if (isPro || plan === 'pro' || plan === 'premium' || plan === 'enterprise') {
        // Pro users have access to all games
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // Free users: Check daily game selection
      const today = new Date().toDateString();
      const storedDailyGames = localStorage.getItem(`dailyGames_${today}`);
      const storedDate = localStorage.getItem('dailyGamesDate');

      if (storedDailyGames && storedDate === today) {
        // Use existing daily games
        const games = JSON.parse(storedDailyGames);
        setDailyGames(games);
        setHasAccess(games.includes(gameId));
      } else {
        // Generate new daily games for today
        const allGames = [
          'n-back', 'stroop', 'trail-making', 'symbol-digit', 'go-no-go',
          'memory-match', 'speech', 'face', 'digit-span', 'flanker-task',
          'reaction-time', 'dual-task', 'visual-search', 'delayed-recall',
          'verbal-fluency', 'clock-drawing'
        ];
        
        // Randomly select 2 games
        const shuffled = [...allGames].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 2);
        
        localStorage.setItem(`dailyGames_${today}`, JSON.stringify(selected));
        localStorage.setItem('dailyGamesDate', today);
        
        setDailyGames(selected);
        setHasAccess(selected.includes(gameId));
      }

      setLoading(false);
    } catch (error) {
      console.error('Error checking game access:', error);
      setHasAccess(false);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-teal-600 mb-4"></div>
          <p className="text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show upgrade prompt for free users
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 border-2 border-amber-100">
        <div className="text-center mb-6">
          <div className="inline-block bg-gradient-to-br from-amber-500 to-orange-600 p-5 rounded-2xl mb-4 shadow-xl">
            <Lock className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upgrade to Pro</h1>
          <p className="text-gray-600 text-lg">
            This game is not available in your free plan today
          </p>
        </div>

        <div className="bg-amber-50 rounded-xl p-6 border-2 border-amber-200 mb-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            Free Plan Daily Games
          </h3>
          <p className="text-gray-700 mb-3">
            As a free user, you get <span className="font-bold">2 randomly selected games per day</span>.
          </p>
          {dailyGames.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Today's available games:</p>
              <div className="flex flex-wrap gap-2">
                {dailyGames.map((game) => (
                  <Link
                    key={game}
                    href={`/tests/${game}`}
                    className="px-4 py-2 bg-white rounded-lg border-2 border-amber-300 text-amber-700 font-semibold hover:bg-amber-100 transition-all"
                  >
                    {game.replace('-', ' ')}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-6 border-2 border-teal-200 mb-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Crown className="w-5 h-5 text-teal-600" />
            Pro Plan Benefits
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-teal-600 mt-1">✓</span>
              <span>Access to <span className="font-bold">ALL games</span> anytime</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-600 mt-1">✓</span>
              <span><span className="font-bold">Unlimited attempts</span> on any game</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-600 mt-1">✓</span>
              <span>Personal dashboard with <span className="font-bold">progress tracking</span></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-600 mt-1">✓</span>
              <span><span className="font-bold">Lifetime access</span> - one-time payment</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/pricing"
            className="flex-1 px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-lg"
          >
            <Crown className="w-5 h-5" />
            Upgrade to Pro
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/tests"
            className="flex-1 px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
            Back to Tests
          </Link>
        </div>
      </div>
    </div>
  );
}



