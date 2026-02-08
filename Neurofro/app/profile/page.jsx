"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { 
  User, Mail, Calendar, Users, Briefcase, Monitor, 
  Palette, Moon, Sun, Brain, Activity, TrendingUp, TrendingDown,
  Clock, Zap, Target, CheckCircle, Edit, LogOut,
  BarChart3, FileText, Shield, Crown, Coins, ArrowUpRight
} from 'lucide-react';
import CreditBalance from '@/components/CreditBalance';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [testHistory, setTestHistory] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [creditHistory, setCreditHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Load user profile
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('userId');
      setUserId(storedUserId);
      
      const storedProfile = localStorage.getItem('userProfile');
      const storedRecord = localStorage.getItem('userRecord');
      
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      }
      
      if (storedRecord) {
        const record = JSON.parse(storedRecord);
        // Load test history from localStorage or backend
        loadTestHistory();
      }
      
      // Load subscription and credit info
      if (storedUserId) {
        loadSubscription(storedUserId);
        loadCreditHistory(storedUserId);
      }
      
      setLoading(false);
    }
  }, []);

  const loadTestHistory = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (userId) {
        const API_BASE = typeof window !== 'undefined' ? '/api/backend' : 'http://localhost:5002/api';
        const response = await fetch(`${API_BASE}/neurotwin/${userId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.history) {
            setTestHistory(data.history);
          } else if (data.test_history) {
            setTestHistory(data.test_history);
          }
        } else if (response.status === 404) {
          // Profile doesn't exist yet - this is normal for new users
          setTestHistory([]);
        }
      }
    } catch (error) {
      console.error('Error loading test history:', error);
      // Silently fail - don't break the page if history can't be loaded
      setTestHistory([]);
    }
  };

  const loadSubscription = async (userId) => {
    try {
      const API_BASE = typeof window !== 'undefined' ? '/api/backend' : 'http://localhost:5002/api';
      const response = await fetch(`${API_BASE}/user/subscription?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
        // Update localStorage
        if (data.plan) {
          localStorage.setItem('userPlan', data.plan);
        }
      } else if (response.status === 404) {
        // No subscription - use default
        setSubscription({ plan: 'Free', status: 'active' });
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      // Use default subscription on error
      setSubscription({ plan: 'Free', status: 'active' });
    }
  };

  const loadCreditHistory = async (userId) => {
    try {
      const API_BASE = typeof window !== 'undefined' ? '/api/backend' : 'http://localhost:5002/api';
      const response = await fetch(`${API_BASE}/user/credits?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.history) {
          setCreditHistory(data.history);
        }
      } else if (response.status === 404) {
        // No credit history yet
        setCreditHistory([]);
      }
    } catch (error) {
      console.error('Error loading credit history:', error);
      // Silently fail - don't break the page
      setCreditHistory([]);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('userRecord');
    }
    router.push('/signup');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-teal-600 mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No profile found. Please sign up first.</p>
          <button
            onClick={() => router.push('/signup')}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl hover:from-teal-600 hover:to-blue-700 transition-all font-semibold"
          >
            Go to Signup
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border-2 border-teal-100">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
              <p className="text-gray-600">View and manage your cognitive health profile</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Subscription & Credits Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Subscription Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-teal-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Crown className="w-5 h-5 text-teal-600" />
                Subscription
              </h2>
              <button
                onClick={() => router.push('/pricing')}
                className="text-sm text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
              >
                Upgrade
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
            {subscription ? (
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Current Plan</div>
                  <div className="text-2xl font-bold text-gray-900 capitalize">{subscription.plan || 'Free'}</div>
                </div>
                {subscription.expiry && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Expires</div>
                    <div className="font-semibold text-gray-900">
                      {new Date(subscription.expiry).toLocaleDateString()}
                    </div>
                  </div>
                )}
                {subscription.status && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Status</div>
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      subscription.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {subscription.status}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-600">Loading subscription info...</div>
            )}
          </div>

          {/* Credit Balance Component */}
          <CreditBalance userId={userId} />
        </div>

        {/* Credit History */}
        {creditHistory.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-teal-100 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Coins className="w-5 h-5 text-teal-600" />
              Credit History
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {creditHistory.slice(0, 10).map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {entry.action === 'used' ? (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    )}
                    <div>
                      <div className="font-semibold text-gray-900 capitalize">{entry.action}</div>
                      <div className="text-sm text-gray-600">{entry.feature || 'N/A'}</div>
                    </div>
                  </div>
                  <div className={`font-bold ${
                    entry.action === 'used' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {entry.action === 'used' ? '-' : '+'}{entry.amount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-teal-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-teal-600" />
                Basic Information
              </h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Full Name</div>
                  <div className="font-semibold text-gray-900">{profile.fullName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Email</div>
                  <div className="font-semibold text-gray-900 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {profile.email}
                  </div>
                </div>
                {profile.phone && (
                  <div>
                  <div className="text-sm text-gray-500 mb-1">Phone</div>
                  <div className="font-semibold text-gray-900">{profile.phone}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Demographics */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-teal-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                Demographics
              </h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Age</div>
                  <div className="font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {profile.age} years
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Gender</div>
                  <div className="font-semibold text-gray-900 capitalize">{profile.gender}</div>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-teal-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-teal-600" />
                Preferences
              </h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500 mb-1">AI Tone</div>
                  <div className="font-semibold text-gray-900 capitalize">{profile.aiTone}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Theme</div>
                  <div className="font-semibold text-gray-900 capitalize flex items-center gap-2">
                    {profile.theme === 'light' && <Sun className="w-4 h-4" />}
                    {profile.theme === 'dark' && <Moon className="w-4 h-4" />}
                    {profile.theme === 'auto' && <Monitor className="w-4 h-4" />}
                    {profile.theme}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Activity & Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Role & Purpose */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-teal-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-teal-600" />
                Role & Purpose
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Purpose</div>
                  <div className="font-semibold text-gray-900 capitalize">{profile.purpose?.replace('-', ' ')}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Occupation</div>
                  <div className="font-semibold text-gray-900">{profile.occupation}</div>
                </div>
              </div>
            </div>

            {/* Device & Screen Info */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-teal-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-teal-600" />
                Device & Screen Info
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Screen Time</div>
                  <div className="font-semibold text-gray-900">{profile.screenTime} hours/day</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Primary Device</div>
                  <div className="font-semibold text-gray-900 capitalize">{profile.primaryDevice}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-sm text-gray-500 mb-1">Screen Awareness</div>
                  <div className="flex items-center gap-2">
                    {profile.screenAwarenessConsent ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                    )}
                    <span className="font-semibold text-gray-900">
                      {profile.screenAwarenessConsent ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cognitive Baseline */}
            {(profile.focusLevel || profile.memoryLevel || profile.stressLevel) && (
              <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-teal-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-teal-600" />
                Cognitive Baseline
              </h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {profile.focusLevel && (
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                      <div className="text-sm text-blue-700 mb-1">Focus Level</div>
                      <div className="font-bold text-blue-900 capitalize">{profile.focusLevel}</div>
                    </div>
                  )}
                  {profile.memoryLevel && (
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                      <div className="text-sm text-purple-700 mb-1">Memory Level</div>
                      <div className="font-bold text-purple-900 capitalize">{profile.memoryLevel}</div>
                    </div>
                  )}
                  {profile.stressLevel && (
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                      <div className="text-sm text-orange-700 mb-1">Stress Level</div>
                      <div className="font-bold text-orange-900 capitalize">{profile.stressLevel?.replace('-', ' ')}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-teal-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600" />
                Quick Actions
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() => router.push('/tests')}
                  className="p-4 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl hover:from-teal-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl font-semibold flex items-center justify-center gap-2"
                >
                  <Brain className="w-5 h-5" />
                  Take Cognitive Tests
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="p-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl font-semibold flex items-center justify-center gap-2"
                >
                  <BarChart3 className="w-5 h-5" />
                  View Dashboard
                </button>
                <button
                  onClick={() => router.push('/neurotwin')}
                  className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-semibold flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-5 h-5" />
                  NeuroTwin Profile
                </button>
                <button
                  onClick={() => router.push('/screen-assistant')}
                  className="p-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl font-semibold flex items-center justify-center gap-2"
                >
                  <Monitor className="w-5 h-5" />
                  Screen Assistant
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}

