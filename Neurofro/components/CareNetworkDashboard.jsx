"use client";
import { useState, useEffect } from 'react';
import { Users, Bell, AlertCircle, CheckCircle, UserPlus, Stethoscope } from 'lucide-react';

export default function CareNetworkDashboard({ patientId, userRole = 'patient' }) {
  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = 'http://localhost:5002/api';

  useEffect(() => {
    if (patientId) {
      fetchCareNetwork();
    }
  }, [patientId]);

  const fetchCareNetwork = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/carenetwork/${patientId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': patientId
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No network exists yet - this is normal
          setNetwork(null);
          setError(null);
          setLoading(false);
          return;
        }
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setNetwork(data);
      } else {
        setError(data.error || 'Failed to load CareNetwork');
      }
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('ERR_CONNECTION_REFUSED')) {
        // Silently fail - don't show error for connection issues
        setNetwork(null);
        setError(null);
      } else {
      setError(err.message || 'Failed to fetch CareNetwork');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-teal-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!network) {
    return (
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-8 text-center">
        <Users className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">No CareNetwork Yet</h3>
        <p className="text-gray-600 mb-4">Set up your care network to enable family and doctor notifications</p>
        <button
          onClick={() => {/* Create network modal */}}
          className="px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
        >
          Create CareNetwork
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with CARE NETWORK Image */}
      <div className="bg-gradient-to-r from-teal-500 to-blue-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">Care Network</h2>
            <p className="text-teal-100">Family and healthcare provider connections</p>
          </div>
          <div className="flex items-center gap-4">
            {/* CARE NETWORK Image */}
            <div className="relative w-48 h-48 md:w-56 md:h-56 flex-shrink-0 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm overflow-hidden">
              <img 
                src="/images/care-network.png" 
                alt="Care Network - Connected network of people"
                className="w-full h-full object-contain p-2 relative z-10"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const placeholder = e.target.nextElementSibling;
                  if (placeholder) placeholder.style.display = 'flex';
                }}
                onLoad={(e) => {
                  const placeholder = e.target.nextElementSibling;
                  if (placeholder) placeholder.style.display = 'none';
                }}
              />
              {/* Fallback placeholder - hidden by default, shown if image fails */}
              <div className="absolute inset-0 flex items-center justify-center text-white/80 text-center p-4" style={{ display: 'none' }}>
                <div>
                  <Users className="w-16 h-16 mx-auto mb-2 opacity-80" />
                  <div className="text-sm font-semibold">CARE NETWORK</div>
                </div>
              </div>
            </div>
            <Users className="w-12 h-12 text-white/80 hidden md:block" />
          </div>
        </div>
      </div>

      {/* Network Members */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Family Members */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <UserPlus className="w-6 h-6 text-teal-600" />
            <h3 className="text-xl font-bold text-gray-900">Family Members</h3>
          </div>
          {network.carenetwork.family_members && network.carenetwork.family_members.length > 0 ? (
            <div className="space-y-2">
              {network.carenetwork.family_members.map((member, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{member.name || member}</p>
                    <p className="text-sm text-gray-600">{member.relation || 'Family Member'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No family members added</p>
          )}
        </div>

        {/* Doctors */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <Stethoscope className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">Healthcare Providers</h3>
          </div>
          {network.carenetwork.doctors && network.carenetwork.doctors.length > 0 ? (
            <div className="space-y-2">
              {network.carenetwork.doctors.map((doctor, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{doctor.name || doctor}</p>
                    <p className="text-sm text-gray-600">{doctor.specialty || 'Healthcare Provider'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No doctors added</p>
          )}
        </div>
      </div>

      {/* Notifications */}
      {network.notifications && network.notifications.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-6 h-6 text-yellow-600" />
            <h3 className="text-xl font-bold text-gray-900">Recent Alerts</h3>
          </div>
          <div className="space-y-3">
            {network.notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-xl border-2 ${
                  notification.type === 'metric_drop'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {notification.type === 'metric_drop' ? (
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">{notification.message}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(notification.timestamp).toLocaleString()}
                    </p>
                    {notification.drop_percentage && (
                      <p className="text-sm text-red-700 font-semibold mt-1">
                        Drop: {notification.drop_percentage}%
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


