"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Brain,
  Activity,
  ShieldCheck,
  HeartHandshake,
  Sparkles,
  TimerReset,
  Leaf,
  Waves,
  PlayCircle,
  ArrowRight,
  Compass,
  Smile,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  const handleStartScreening = () => {
    window.location.href = "/dashboard";
  };

  const handleWatchDemo = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        document.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, []);

  const featureCards = [
    {
      title: "Gentle assessments",
      body: "Soft, guided flows that feel like a wellness check-in, not a test.",
      icon: <Compass className="w-6 h-6 text-emerald-700" />,
    },
    {
      title: "Human-centered insights",
      body: "We translate data into calming narratives and next steps you can trust.",
      icon: <HeartHandshake className="w-6 h-6 text-emerald-700" />,
    },
    {
      title: "Protected by design",
      body: "HIPAA-aware patterns, local-first storage options, and clear privacy cues.",
      icon: <ShieldCheck className="w-6 h-6 text-emerald-700" />,
    },
  ];

  const flowSteps = [
    {
      title: "Arrive & breathe",
      desc: "A calm welcome, adaptive lighting gradients, and brief priming to reduce anxiety.",
      icon: <Waves className="w-6 h-6 text-emerald-700" />,
    },
    {
      title: "Guided check-ins",
      desc: "Short, evidence-based tasks across attention, memory, speech, and emotion.",
      icon: <TimerReset className="w-6 h-6 text-emerald-700" />,
    },
    {
      title: "Modern wellness report",
      desc: "Clear summaries with supportive tone, trends, and a simple “next best step.”",
      icon: <Sparkles className="w-6 h-6 text-emerald-700" />,
    },
  ];

  const games = [
    { title: "Stroop Calm", tag: "Focus", color: "from-emerald-100 to-emerald-50" },
    { title: "N-Back Lite", tag: "Memory", color: "from-teal-100 to-teal-50" },
    { title: "Trail Weave", tag: "Planning", color: "from-sky-100 to-sky-50" },
    { title: "Memory Match", tag: "Recall", color: "from-amber-100 to-amber-50" },
  ];

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-24 w-96 h-96 bg-emerald-200/40 blur-3xl rounded-full" />
          <div className="absolute top-10 right-0 w-80 h-80 bg-teal-200/50 blur-3xl rounded-full" />
        </div>

        <div className="max-w-6xl mx-auto px-4 pt-14 pb-8 relative">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/80 border border-white/60 shadow-sm backdrop-blur">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-emerald-700">Cognitive wellness, reimagined</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mt-10">
            <div className="space-y-8">
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-slate-900 tracking-tight">
                A calmer way to
                <span className="block text-emerald-800">understand your mind.</span>
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl">
                MindCare blends clinical-grade assessments with a modern wellness aesthetic.
                Soft visuals, clear language, and gentle pacing help you focus on feeling better—not just scoring higher.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  onClick={handleStartScreening}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-700 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2"
                >
                  <span>Start free screening</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={handleWatchDemo}
                  className="px-6 py-3 rounded-2xl bg-white text-slate-800 font-semibold border border-white/70 shadow-sm hover:border-emerald-200 hover:text-emerald-800 transition-all flex items-center justify-center space-x-2"
                >
                  <PlayCircle className="w-5 h-5 text-emerald-700" />
                  <span>See how it works</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Calm sessions", value: "10K+" },
                  { label: "Avg relief", value: "92%" },
                  { label: "Languages", value: "15+" },
                ].map((item) => (
                  <div key={item.label} className="glass-card rounded-2xl px-4 py-3 text-center">
                    <div className="text-2xl font-bold text-emerald-800">{item.value}</div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -top-8 -left-6 w-24 h-24 bg-emerald-200/40 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 right-0 w-28 h-28 bg-teal-200/40 rounded-full blur-2xl" />

              <div className="grid gap-4">
                <div className="glass-card rounded-3xl p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg">
                      <Brain className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-500 font-semibold">Cognitive rhythm</div>
                      <div className="text-xl font-bold text-slate-900">Stable</div>
                    </div>
                  </div>
                  <span className="text-emerald-700 font-semibold">+6.2%</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-3xl bg-gradient-to-br from-white to-emerald-50 p-5 shadow-sm">
                    <div className="flex items-center space-x-3 mb-3">
                      <Activity className="w-5 h-5 text-emerald-700" />
                      <span className="text-sm font-semibold text-slate-600">Attention flow</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">87</div>
                    <div className="text-xs text-emerald-700 font-semibold mt-1">calm focus</div>
                  </div>
                  <div className="rounded-3xl bg-gradient-to-br from-white to-teal-50 p-5 shadow-sm">
                    <div className="flex items-center space-x-3 mb-3">
                      <Smile className="w-5 h-5 text-teal-700" />
                      <span className="text-sm font-semibold text-slate-600">Mood balance</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">A+</div>
                    <div className="text-xs text-emerald-700 font-semibold mt-1">steady & bright</div>
                  </div>
                </div>

                <div className="glass-card rounded-3xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <HeartHandshake className="w-5 h-5 text-emerald-700" />
                    <span className="text-sm font-semibold text-slate-600">Care network</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-slate-900">Supportive</div>
                      <div className="text-sm text-slate-500">family + clinician linked</div>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold">
                      3
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-16 bg-[#fdfbf7]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-700">Design shift</p>
              <h2 className="text-3xl font-bold text-slate-900">Modern Wellness aesthetic</h2>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {featureCards.map((card) => (
              <div key={card.title} className="glass-card rounded-3xl p-6 flex flex-col space-y-3">
                <div className="h-11 w-11 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  {card.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-900">{card.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="glass-card rounded-3xl p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
              <div>
                <p className="text-sm font-semibold text-emerald-700">Calm, guided flow</p>
                <h2 className="text-3xl font-bold text-slate-900">Arrive, check-in, and exhale</h2>
                <p className="text-slate-600 mt-2">Three gentle steps designed to lower anxiety and boost signal quality.</p>
              </div>
              <button
                onClick={scrollToFeatures}
                className="px-5 py-3 rounded-2xl bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-600/30 transition-all flex items-center space-x-2 w-full md:w-auto justify-center"
              >
                <span>Explore insights</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {flowSteps.map((step, idx) => (
                <div key={step.title} className="rounded-3xl bg-white/80 border border-white/70 p-6 flex flex-col space-y-3 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
                      {step.icon}
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Step {idx + 1}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">{step.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#fdfbf7]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items=center gap-3 mb-6">
            <div className="h-10 w-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-700">Games Lab</p>
              <h2 className="text-3xl font-bold text-slate-900">Soft starts, meaningful signals</h2>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {games.map((game) => (
              <div
                key={game.title}
                className={`rounded-3xl bg-gradient-to-br ${game.color} p-5 shadow-sm border border-white/70`}
              >
                <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">{game.tag}</div>
                <div className="text-lg font-semibold text-slate-900">{game.title}</div>
                <div className="mt-3 text-sm text-slate-600">Gentle pacing, adaptive difficulty, and clear breathing prompts.</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="glass-card rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 space-y-3">
              <p className="text-sm font-semibold text-emerald-700">Care & trust</p>
              <h3 className="text-3xl font-bold text-slate-900">Designed to feel like a wellness studio</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                No neon grids or matrix effects—just soft stone surfaces, rounded super-ellipses, and breathable spacing.
                Every screen is written in human language, with privacy cues and supportive guidance.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Rounded-3xl", "Glassmorphism", "Organic blobs", "Clinical yet warm"].map((pill) => (
                  <span
                    key={pill}
                    className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-100"
                  >
                    {pill}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex-1 w-full">
              <div className="rounded-[28px] overflow-hidden shadow-xl border border-white/70 bg-white">
                <img
                  src="/images/mindcare-banner.png"
                  alt="MindCare calm visuals"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div className="p-4 text-sm text-slate-600">If the banner is missing, add it to /public/images/mindcare-banner.png</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}






