"use client";
import { useState, useEffect } from 'react';
import { Coins, Plus, TrendingDown, TrendingUp, Zap, Monitor, Brain, BarChart3 } from 'lucide-react';

const creditCosts = {
  chat: { cost: 1, label: 'AI Chat', icon: <Zap className="w-4 h-4" /> },
  screen_analysis: { cost: 3, label: 'Screen Analysis', icon: <Monitor className="w-4 h-4" /> },
  cognitive_test: { cost: 5, label: 'Cognitive Test', icon: <Brain className="w-4 h-4" /> },
  focus_report: { cost: 10, label: 'Focus Report', icon: <BarChart3 className="w-4 h-4" /> }
};

export default function CreditBalance({ userId, onBuyCredits }) {
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPurchase, setShowPurchase] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchCredits();
    }
  }, [userId]);

  const fetchCredits = async () => {
    try {
      const response = await fetch(`http://localhost:5002/api/user/credits?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setCredits(data.balance || 0);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyCredits = async (amount = 100) => {
    try {
      const response = await fetch('http://localhost:5002/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          type: 'credits',
          amount: amount
        })
      });

      const data = await response.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error) {
      console.error('Error purchasing credits:', error);
    }
  };

  const creditPercentage = credits > 0 ? Math.min((credits / 100) * 100, 100) : 0;
  const isLow = credits < 20;

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${isLow ? 'bg-red-100' : 'bg-blue-100'}`}>
            <Coins className={`w-5 h-5 ${isLow ? 'text-red-600' : 'text-blue-600'}`} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Credits</h3>
            <p className="text-xs text-gray-500">Available balance</p>
          </div>
        </div>
        <button
          onClick={() => setShowPurchase(!showPurchase)}
          className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Buy More
        </button>
      </div>

      {/* Credit Balance */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold text-gray-900">{credits}</span>
          <span className="text-gray-600 text-sm">credits</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full transition-all ${
              isLow ? 'bg-red-500' : creditPercentage > 50 ? 'bg-green-500' : 'bg-yellow-500'
            }`}
            style={{ width: `${creditPercentage}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500">
          {isLow ? '⚠️ Low credits - Consider purchasing more' : `${Math.round(creditPercentage)}% remaining`}
        </p>
      </div>

      {/* Credit Costs */}
      <div className="border-t-2 border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-700 mb-2">Credit Costs:</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(creditCosts).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 text-xs text-gray-600">
              <div className="text-blue-600">{value.icon}</div>
              <span>{value.label}:</span>
              <span className="font-semibold">{value.cost}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Buy Credits</h3>
            
            <div className="space-y-3 mb-6">
              {[
                { amount: 100, price: 2, popular: false },
                { amount: 500, price: 8, popular: true },
                { amount: 1000, price: 15, popular: false }
              ].map((option) => (
                <button
                  key={option.amount}
                  onClick={() => handleBuyCredits(option.amount)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    option.popular
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-900">{option.amount} Credits</div>
                      <div className="text-sm text-gray-600">${option.price}</div>
                    </div>
                    {option.popular && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        Best Value
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowPurchase(false)}
              className="w-full py-2 text-gray-600 hover:text-gray-900 font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

