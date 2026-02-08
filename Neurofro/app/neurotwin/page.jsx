"use client";
import { useState, useEffect } from 'react';
import NeuroTwinDashboard from '@/components/NeuroTwinDashboard';
import AuthGuard from '@/components/AuthGuard';

export default function NeuroTwinPage() {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user ID from localStorage (since we're using local storage auth)
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        setUserId(storedUserId);
        } else {
        // Fallback to demo user if no userId found
          setUserId('demo-user-123');
        }
        setLoading(false);
    } else {
      setUserId('demo-user-123');
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-teal-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <NeuroTwinDashboard userId={userId} />
      </div>
    </div>
    </AuthGuard>
  );
}


