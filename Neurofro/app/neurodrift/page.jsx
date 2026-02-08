"use client";
import { useState, useEffect } from 'react';
import NeuroDriftDashboard from '@/components/NeuroDriftDashboard';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export default function NeuroDriftPage() {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const auth = getAuth();
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setUserId(user.uid);
        } else {
          setUserId('demo-user-123');
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (error) {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <NeuroDriftDashboard userId={userId} />
      </div>
    </div>
  );
}


