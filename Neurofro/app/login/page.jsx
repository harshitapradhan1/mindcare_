"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Brain, User, Lock, LogIn, AlertCircle, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simple authentication - in production, this would call your backend
    // For now, we'll use a simple check or create a demo user
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if user exists (from signup)
    if (typeof window !== 'undefined') {
        const storedProfile = localStorage.getItem('userProfile');
        const storedEmail = localStorage.getItem('userEmail');
        const storedPassword = localStorage.getItem('password');
        
        if (storedProfile && storedEmail && storedEmail === formData.email) {
          // Verify password (in production, use proper hashing)
          if (storedPassword === formData.password || !storedPassword) {
            const profile = JSON.parse(storedProfile);
            // Use existing userId if available, otherwise create new one
            // This ensures data persists across login/logout
            let userId = localStorage.getItem('userId');
            if (!userId) {
              // Try to get userId from stored profile
              userId = profile.userId || `user-${Date.now()}`;
            }
            
            localStorage.setItem('userId', userId);
            localStorage.setItem('username', profile.fullName);
            localStorage.setItem('isAuthenticated', 'true');
            
            // Redirect to profile page
            router.push('/profile');
            return;
          } else {
            setError('Invalid password. Please try again.');
            setLoading(false);
            return;
          }
        } else {
          setError('User not found. Please sign up first.');
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    // Redirect to signup for guest users
    router.push('/signup');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to MindCare</h1>
          <p className="text-gray-600">Sign in to access cognitive tests</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

              <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl py-3 font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
              </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">or</span>
              </div>
            </div>

            <button
              onClick={handleGuestLogin}
              className="mt-6 w-full bg-white border-2 border-teal-500 text-teal-600 rounded-xl py-3 font-bold hover:bg-teal-50 transition-all"
              >
                Continue as Guest
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link href="/signup" className="text-teal-600 hover:text-teal-700 font-semibold">
              Sign Up
              </Link>
          </p>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800 text-center">
            <strong>Note:</strong> For demo purposes, any username/password will work. 
            Your test results will be saved to your session.
          </p>
        </div>
      </div>
    </div>
  );
}
