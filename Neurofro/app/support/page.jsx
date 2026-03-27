"use client";

import { MessageCircle } from "lucide-react";
import Link from "next/link";
import ProfessionalSupportCard from "@/components/ProfessionalSupportCard";
import AuthGuard from "@/components/AuthGuard";

/**
 * Support page - Optional professional guidance
 * Calm, non-alarming, ethical UX
 */
export default function SupportPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 mb-4">
              <MessageCircle className="w-8 h-8 text-teal-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Support & Guidance
            </h1>
            <p className="text-gray-600">
              Optional professional support when you need it
            </p>
          </div>

          {/* Main support card */}
          <div className="mb-8">
            <ProfessionalSupportCard variant="card" />
          </div>

          {/* Reassurance note */}
          <div className="bg-teal-50/50 rounded-xl p-6 border border-teal-100 text-center">
            <p className="text-sm text-gray-600">
              This is an optional resource. Your cognitive wellness journey is
              yours to pace. Connect with an expert only when it feels right for
              you.
            </p>
          </div>

          {/* Back to dashboard */}
          <div className="mt-8 text-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-semibold"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
