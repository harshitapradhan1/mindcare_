"use client";
import { useState, useEffect } from 'react';
import NeuroDriftDashboard from '@/components/NeuroDriftDashboard';
import EmotionAnalysisWidget from '@/components/EmotionAnalysisWidget';
import NeuroAgeCard from '@/components/NeuroAgeCard';
import NeuroCoachChat from '@/components/NeuroCoachChat';
import NeuroRiskRadar from '@/components/NeuroRiskRadar';
import CareNetworkDashboard from '@/components/CareNetworkDashboard';
import HealthPassport from '@/components/HealthPassport';
import TestResultsAnalysis from '@/components/TestResultsAnalysis';
import ProfessionalSupportCard from '@/components/ProfessionalSupportCard';
import CognitiveReportCard from '@/components/CognitiveReportCard';
import QuickCheckCard from '@/components/QuickCheckCard';
import { FileText } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';

export default function DashboardPage() {
  const [userId, setUserId] = useState(null);
  const [baseAge, setBaseAge] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('userId');
      setUserId(storedUserId || 'demo-user-123');
      setLoading(false);
    }
  }, []);

  return (
    <AuthGuard>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Cognitive Dashboard</h1>
          <p className="text-gray-600">Comprehensive view of your cognitive health</p>
        </div>

        {/* Quick Cognitive Check - Top section */}
        <div className="mb-6">
          <QuickCheckCard userId={userId} />
        </div>

        {/* Your Cognitive Report - Main section */}
        <div className="mb-6">
          <CognitiveReportCard userId={userId} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* NeuroAge Card */}
          <div className="lg:col-span-1">
            <NeuroAgeCard userId={userId} baseAge={baseAge} region="global" />
          </div>

          {/* Emotion Analysis */}
          <div className="lg:col-span-2">
            <EmotionAnalysisWidget />
          </div>
        </div>

        {/* NeuroCoach Chat */}
        <div className="mb-6">
          <NeuroCoachChat userId={userId} />
        </div>

        {/* NeuroRisk Radar */}
        <div className="mb-6">
          <NeuroRiskRadar userId={userId} />
        </div>

        {/* NeuroDrift Dashboard */}
        <div className="mb-6">
          <NeuroDriftDashboard userId={userId} />
        </div>

        {/* CareNetwork Dashboard */}
        <div className="mb-6">
          <CareNetworkDashboard patientId={userId} userRole="patient" />
        </div>

        {/* Health Passport */}
        <div className="mb-6">
          <HealthPassport userId={userId} />
        </div>

        {/* Test Results Analysis */}
        <div className="mb-6">
          <TestResultsAnalysis userId={userId} />
        </div>

        {/* Simplify Report - Convert complex reports to simple language */}
        <div className="mb-6">
          <a
            href="/simplify-report"
            className="block bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl hover:border-teal-200 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-teal-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 mb-2">Simplify My Report</h3>
                <p className="text-sm text-gray-600">
                  Upload or paste your report to get a simple explanation in easy language.
                </p>
              </div>
            </div>
          </a>
        </div>

        {/* Mind Journal - Daily Reflection */}
        <div className="mb-6">
          <a
            href="/journal"
            className="block bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl hover:border-blue-200 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                <div className="text-2xl">📓</div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 mb-2">Mind Journal</h3>
                <p className="text-sm text-gray-600">
                  Write or speak your daily reflection to track your cognitive wellness journey.
                </p>
              </div>
            </div>
          </a>
        </div>

        {/* Professional Support - Optional, calm, non-intrusive */}
        <div className="mb-6">
          <ProfessionalSupportCard variant="card" />
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-4">
          <a
            href="/tests/memory-match"
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all text-center"
          >
            <div className="text-4xl mb-3">🧠</div>
            <h3 className="font-bold text-gray-900 mb-2">Memory Match</h3>
            <p className="text-sm text-gray-600">Test your short-term recall</p>
          </a>
          <a
            href="/tests/stroop"
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all text-center"
          >
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="font-bold text-gray-900 mb-2">Stroop Test</h3>
            <p className="text-sm text-gray-600">Cognitive speed test</p>
          </a>
          <a
            href="/tests/speech"
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all text-center"
          >
            <div className="text-4xl mb-3">🎤</div>
            <h3 className="font-bold text-gray-900 mb-2">Speech Analysis</h3>
            <p className="text-sm text-gray-600">Voice pattern assessment</p>
          </a>
          <a
            href="/tests/face"
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all text-center"
          >
            <div className="text-4xl mb-3">📷</div>
            <h3 className="font-bold text-gray-900 mb-2">Facial Analysis</h3>
            <p className="text-sm text-gray-600">Face recognition test</p>
          </a>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}

