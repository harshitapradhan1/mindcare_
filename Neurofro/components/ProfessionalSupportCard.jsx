"use client";

import { useState } from "react";
import { MessageCircle, X, ExternalLink } from "lucide-react";

const SUPPORT_LINK = "https://chatpro-mu.vercel.app";

/**
 * ProfessionalSupportCard - Optional "Talk to a Professional" feature
 * Opens external support chat in modal (iframe) for better UX
 * Ethical UX: calm, optional, non-alarming language
 */
export default function ProfessionalSupportCard({ variant = "card" }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openInModal = () => {
    setIsModalOpen(true);
  };

  const openInNewTab = () => {
    window.open(SUPPORT_LINK, "_blank", "noopener,noreferrer");
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Handle escape key
  const handleKeyDown = (e) => {
    if (e.key === "Escape") closeModal();
  };

  return (
    <>
      <div
        className={`bg-white rounded-2xl border-2 border-teal-100 shadow-lg overflow-hidden transition-all hover:shadow-xl hover:border-teal-200 ${
          variant === "compact" ? "p-5" : "p-6"
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Need additional support?
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              If you&apos;d like professional guidance, you can connect with an expert.
              This is optional and based on your preference.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={openInModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-teal-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
              >
                <MessageCircle className="w-4 h-4" />
                Talk to a Professional
              </button>
              <button
                onClick={openInNewTab}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-teal-600 hover:text-teal-700 font-semibold border-2 border-teal-200 hover:border-teal-300 rounded-xl transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                Open in new tab
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal with iframe - better UX, stays in context */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          aria-labelledby="support-modal-title"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] max-h-[700px] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-teal-50/50">
              <h2
                id="support-modal-title"
                className="text-lg font-bold text-gray-900 flex items-center gap-2"
              >
                <MessageCircle className="w-5 h-5 text-teal-600" />
                Talk to a Professional
              </h2>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            {/* iframe - external support chat */}
            <div className="flex-1 min-h-0 relative">
              <iframe
                src={SUPPORT_LINK}
                title="Connect with a professional"
                className="absolute inset-0 w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
