"use client";
import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // In production, send to error tracking service (e.g., Sentry)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border-2 border-red-100">
            <div className="text-center mb-6">
              <div className="inline-block bg-gradient-to-br from-red-500 to-orange-600 p-5 rounded-2xl mb-4 shadow-xl">
                <AlertCircle className="w-14 h-14 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Something went wrong</h1>
              <p className="text-gray-600">
                We encountered an unexpected error. Don't worry, your data is safe.
              </p>
            </div>

            <div className="bg-red-50 rounded-xl p-4 border-2 border-red-200 mb-6">
              <p className="text-sm text-gray-700">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl font-semibold hover:from-teal-600 hover:to-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>
              <Link
                href="/"
                className="w-full px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Go Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}



