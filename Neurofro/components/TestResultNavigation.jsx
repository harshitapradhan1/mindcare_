"use client";
import { useRouter } from 'next/navigation';
import { Brain, BarChart3, TrendingUp, ArrowRight } from 'lucide-react';

export default function TestResultNavigation({ testName, score = null }) {
  const router = useRouter();

  return (
    <div className="mt-8 bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-6 border-2 border-teal-200">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">View Your Results</h3>
        <p className="text-gray-600 text-sm">
          Your test results have been saved to your NeuroTwin profile for analysis
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-4">
        <button
          onClick={() => router.push('/neurotwin')}
          className="flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-xl border-2 border-teal-300 hover:border-teal-500 hover:shadow-lg transition-all group"
        >
          <div className="bg-gradient-to-br from-teal-500 to-blue-600 p-3 rounded-xl group-hover:scale-110 transition-transform">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-900">NeuroTwin</div>
            <div className="text-sm text-gray-600">View cognitive profile</div>
          </div>
          <ArrowRight className="w-4 h-4 text-teal-600 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => router.push('/dashboard')}
          className="flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-xl border-2 border-purple-300 hover:border-purple-500 hover:shadow-lg transition-all group"
        >
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-xl group-hover:scale-110 transition-transform">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-900">Dashboard</div>
            <div className="text-sm text-gray-600">See all your data</div>
          </div>
          <ArrowRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => router.push('/profile')}
          className="flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-xl border-2 border-indigo-300 hover:border-indigo-500 hover:shadow-lg transition-all group"
        >
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl group-hover:scale-110 transition-transform">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-900">Profile</div>
            <div className="text-sm text-gray-600">Test history & stats</div>
          </div>
          <ArrowRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {score !== null && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-teal-200">
            <span className="text-sm text-gray-600">Test Score:</span>
            <span className="text-lg font-bold text-teal-600">{score}</span>
          </div>
        </div>
      )}
    </div>
  );
}

