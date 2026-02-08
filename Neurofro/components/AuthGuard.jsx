"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Lock, ArrowRight } from 'lucide-react';

export default function AuthGuard({ children }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authStatus = localStorage.getItem('isAuthenticated');
      setIsAuthenticated(authStatus === 'true');
      setLoading(false);

      // If not authenticated, redirect to signup
      if (authStatus !== 'true') {
        // Small delay to prevent flash
        setTimeout(() => {
          router.push('/signup');
        }, 100);
      }
    }
  }, [router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-teal-600 mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show access denied message
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border-2 border-red-200">
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-br from-red-500 to-orange-600 p-5 rounded-2xl mb-4 shadow-xl">
              <Lock className="w-14 h-14 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Restricted</h1>
            <p className="text-gray-600">You need to sign up and login to access this page</p>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-3">Authentication Required</h3>
            <p className="text-gray-700 mb-4">
              Please sign up for an account first, then login to access all features including cognitive tests, 
              NeuroTwin profile, and dashboard.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/signup')}
              className="w-full px-6 py-4 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl hover:from-teal-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl font-bold text-lg flex items-center justify-center gap-2"
            >
              <Brain className="w-5 h-5" />
              Sign Up Now
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push('/login')}
              className="w-full px-6 py-4 bg-white border-2 border-teal-500 text-teal-600 rounded-xl hover:bg-teal-50 transition-all font-semibold text-lg"
            >
              Already have an account? Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
}

