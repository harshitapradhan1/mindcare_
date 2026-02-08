"use client";
import { useState } from 'react';
import { Download, FileText, QrCode, Loader2, CheckCircle } from 'lucide-react';

export default function HealthPassport({ userId }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = 'http://localhost:5002/api';

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`${API_BASE}/passport/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId || 'demo-user-123'
        },
        body: JSON.stringify({
          user_id: userId || 'demo-user-123'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      // Get PDF blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `health_passport_${userId || 'demo'}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to export passport');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl p-3">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Health Passport</h3>
          <p className="text-sm text-gray-600">Export your complete cognitive health record</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-6 mb-4 border-2 border-teal-200">
        <div className="flex items-start gap-4">
          <QrCode className="w-8 h-8 text-teal-600 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-gray-900 mb-2">What's Included:</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>✓ Current cognitive metrics</li>
              <li>✓ Complete test history</li>
              <li>✓ NeuroTwin predictions</li>
              <li>✓ Risk assessment history</li>
              <li>✓ Doctor verification QR code</li>
            </ul>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-700 text-sm font-semibold">Passport downloaded successfully!</p>
        </div>
      )}

      <button
        onClick={handleExport}
        disabled={loading}
        className="w-full bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl py-4 font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating PDF...
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Download Health Passport
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center mt-4">
        PDF includes QR code for doctor verification
      </p>
    </div>
  );
}


