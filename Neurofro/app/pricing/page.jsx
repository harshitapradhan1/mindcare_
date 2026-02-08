"use client";
import { useRouter } from 'next/navigation';
import { Brain, HeartHandshake, Sparkles, Check, ArrowRight, FileText, BarChart3 } from 'lucide-react';

export default function PricingPage() {
  const router = useRouter();

  const handleStartFree = () => {
    router.push('/signup');
  };

  const handleEarlySupporter = () => {
    // For now, guide users to sign up / profile.
    // Payment integration can hook in here later.
    router.push('/signup');
  };

  return (
    <div className="min-h-screen bg-[#f7f4ef] py-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/70 border border-slate-200 shadow-sm mb-4">
            <HeartHandshake className="w-4 h-4 text-teal-700" />
            <span className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
              Gentle, transparent pricing for India
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 mb-3">
            MindCare Plans – Calm Support for Your Cognitive Wellness
          </h1>
          <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
            Choose a plan that respects your pace, your privacy, and your budget. No hidden fees,
            no aggressive upsells – just thoughtful tools to help you understand your mind better.
          </p>
          <p className="mt-4 text-xs md:text-sm text-slate-500">
            MindCare is a self-awareness and cognitive fitness tool, <span className="font-semibold">not</span> a medical
            diagnostic product.
          </p>
        </div>

        {/* Early Supporter Banner */}
        <div className="glass-card rounded-3xl p-6 md:p-8 mb-10 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-teal-800 uppercase">
                Early Supporter Offer · Limited Time
              </p>
              <p className="text-sm md:text-base text-slate-700">
                Lifetime access for our earliest supporters in India. You will <span className="font-semibold">never</span> be
                charged again for Pro.
              </p>
            </div>
          </div>
          <div className="ml-auto">
            <p className="text-xs text-slate-500">
              Future versions of MindCare may move to a monthly subscription. Early supporters will retain
              lifetime access forever.
            </p>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-12">
          {/* Free Plan */}
          <div className="glass-card rounded-3xl p-6 md:p-8 border border-slate-200/70">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Free Plan</p>
            <h2 className="text-2xl font-semibold text-slate-900 mb-1">
              Start gently, at your own pace
            </h2>
            <p className="text-sm text-slate-600 mb-5">
              Ideal if you&apos;re just beginning to explore cognitive wellness or prefer very light use.
            </p>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-semibold text-slate-900">₹0</span>
              <span className="text-sm text-slate-500">/ forever</span>
            </div>
            <ul className="space-y-3 text-sm text-slate-700 mb-6">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-teal-700" />
                <span>Access to <span className="font-semibold">2 randomly selected cognitive games per day</span></span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-teal-700" />
                <span><span className="font-semibold">Limited attempts</span> to keep sessions short and gentle</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-teal-700" />
                <span>No long-term progress history yet – play without saving anything</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-teal-700" />
                <span>Great for <span className="font-semibold">awareness, exploration, and habit-building</span></span>
              </li>
            </ul>
            <button
              onClick={handleStartFree}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white text-teal-800 font-semibold py-3 border border-teal-100 hover:border-teal-300 hover:bg-teal-50 transition-all"
            >
              Start with Free
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="mt-2 text-[11px] text-slate-500 text-center">
              No card required · You can upgrade later if you find MindCare helpful.
            </p>
          </div>

          {/* Pro Early Supporter Plan */}
          <div className="relative glass-card rounded-3xl p-6 md:p-8 border border-teal-500/70 shadow-lg">
            <div className="absolute -top-3 left-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-700 text-white text-[11px] font-semibold shadow-md">
              <Sparkles className="w-3 h-3" />
              Early Supporter · Lifetime Access
            </div>
            <p className="text-xs font-semibold text-teal-700 uppercase mt-1 mb-1">Pro Plan</p>
            <h2 className="text-2xl font-semibold text-slate-900 mb-1">
              Gentle structure for regular practice
            </h2>
            <p className="text-sm text-slate-600 mb-5">
              For people who want deeper insight, progress tracking, and a calmer understanding of their
              cognitive patterns.
            </p>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-semibold text-slate-900">₹199</span>
              <span className="text-sm text-slate-500">one-time · inclusive</span>
            </div>
            <p className="text-xs text-emerald-800 mb-4">
              Pay once. <span className="font-semibold">Lifetime access.</span> No renewals, no hidden fees.
              Early supporters will <span className="font-semibold">never</span> be charged again for Pro.
            </p>
            <ul className="space-y-3 text-sm text-slate-700 mb-6">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-teal-700" />
                <span><span className="font-semibold">Full access</span> to all current cognitive games and tests</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-teal-700" />
                <span><span className="font-semibold">Unlimited attempts</span> – practice whenever you like</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-teal-700" />
                <span>
                  A private <span className="font-semibold">progress tracking dashboard</span> to see gentle trends
                  over time
                </span>
              </li>
              <li className="flex items-start gap-2">
                <FileText className="w-4 h-4 mt-0.5 text-teal-700" />
                <span><span className="font-semibold">Downloadable PDF summaries</span> of your test sessions</span>
              </li>
              <li className="flex items-start gap-2">
                <BarChart3 className="w-4 h-4 mt-0.5 text-teal-700" />
                <span>
                  Deeper <span className="font-semibold">NeuroTwin-style insights</span> into attention, memory,
                  and processing patterns
                </span>
              </li>
            </ul>
            <button
              onClick={handleEarlySupporter}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-700 text-white font-semibold py-3 shadow-md hover:shadow-lg hover:from-emerald-600 hover:to-teal-800 transition-all"
            >
              Get Lifetime Access – ₹199
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="mt-2 text-[11px] text-slate-500 text-center">
              This one-time fee helps us keep MindCare privacy-first and independent. We do not auto-charge
              or auto-upgrade your account.
            </p>
          </div>
        </div>

        {/* Feature comparison */}
        <div className="rounded-3xl bg-white/80 border border-slate-200 shadow-sm p-6 md:p-8 mb-8">
          <h3 className="text-xl font-semibold text-slate-900 mb-4">
            Compare plans
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-slate-700">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 pr-4 font-semibold text-slate-500">Feature</th>
                  <th className="py-3 px-4 font-semibold text-slate-700">Free</th>
                  <th className="py-3 px-4 font-semibold text-slate-700">Pro – Early Supporter</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-3 pr-4">Price</td>
                  <td className="py-3 px-4">₹0 forever</td>
                  <td className="py-3 px-4">₹199 one-time · lifetime</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 pr-4">Access to games</td>
                  <td className="py-3 px-4">2 randomly selected games per day</td>
                  <td className="py-3 px-4">All current cognitive games and tests</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 pr-4">Daily limits</td>
                  <td className="py-3 px-4">Limited attempts per game</td>
                  <td className="py-3 px-4">Unlimited attempts, any time</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 pr-4">Progress tracking</td>
                  <td className="py-3 px-4">Not available yet</td>
                  <td className="py-3 px-4">Personal dashboard with gentle trends</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 pr-4">Downloadable reports</td>
                  <td className="py-3 px-4">Not included</td>
                  <td className="py-3 px-4">PDF session summaries</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 pr-4">NeuroTwin / advanced insights</td>
                  <td className="py-3 px-4">Basic in-session feedback</td>
                  <td className="py-3 px-4">Deeper longitudinal insights</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 pr-4">Future pricing changes</td>
                  <td className="py-3 px-4">May change later</td>
                  <td className="py-3 px-4">Lifetime access guaranteed</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Best for</td>
                  <td className="py-3 px-4">Trying MindCare, light daily awareness</td>
                  <td className="py-3 px-4">Regular practice & deeper self-understanding</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Transparency & disclaimer */}
        <div className="max-w-3xl mx-auto text-xs md:text-sm text-slate-600 space-y-3">
          <p>
            <span className="font-semibold">Transparency promise:</span> This is a limited-time early supporter
            offer. Future versions of MindCare may move to a monthly subscription. Early supporters will retain
            lifetime access forever.
          </p>
          <p>
            <span className="font-semibold">Important note:</span> MindCare is a self-awareness and cognitive
            fitness tool. It is not a medical diagnostic product and does not replace professional mental health
            or medical care. If you are experiencing distressing symptoms, please seek help from a qualified
            clinician.
          </p>
        </div>
      </div>
    </div>
  );
}

