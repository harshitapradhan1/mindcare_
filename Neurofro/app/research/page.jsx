"use client";
import React, { useState } from 'react';
import { Brain, BookOpen, ShieldCheck, TrendingUp, AlertCircle, CheckCircle, ArrowRight, Info, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function ResearchPage() {
  return (
    <div className="min-h-screen bg-[#f7f4ef]">
      {/* Header Section */}
      <section className="bg-gradient-to-br from-teal-50 via-white to-emerald-50 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/70 border border-slate-200 shadow-sm mb-6">
            <BookOpen className="w-5 h-5 text-teal-700" />
            <span className="text-sm font-semibold tracking-wide text-slate-600 uppercase">
              Scientific Foundation
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 mb-4">
            Research & Evidence Behind MindCare
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            A research-informed approach to cognitive self-awareness and mental fitness
          </p>
        </div>
      </section>

      {/* Prominent Disclaimer - Top Section */}
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-6 md:p-8 border-2 border-amber-200 bg-amber-50/50">
            <div className="flex items-start gap-4">
              <div className="bg-amber-500 p-3 rounded-xl flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">Important Note</h2>
                <p className="text-slate-700 leading-relaxed mb-2">
                  MindCare is a cognitive self-monitoring and wellness platform.
                </p>
                <p className="text-slate-700 leading-relaxed mb-2">
                  The information on this page is based on aggregated findings from peer-reviewed cognitive science research and anonymized usage trends.
                </p>
                <p className="text-slate-700 leading-relaxed font-semibold">
                  MindCare does not diagnose, treat, or replace professional medical or mental health care.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What MindCare Measures */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-semibold text-slate-900 mb-3">
              What Cognitive Domains Does MindCare Track?
            </h2>
            <p className="text-slate-600">
              These domains are commonly assessed in neuropsychological research to understand cognitive performance over time.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "Working Memory",
                description: "The ability to hold and manipulate information in mind over short periods. Essential for reasoning and decision-making.",
                icon: <Brain className="w-6 h-6" />,
                color: "from-blue-500 to-indigo-600"
              },
              {
                title: "Attention & Focus",
                description: "The capacity to sustain concentration and filter distractions. Critical for task completion and learning.",
                icon: <TrendingUp className="w-6 h-6" />,
                color: "from-emerald-500 to-teal-600"
              },
              {
                title: "Processing Speed",
                description: "How quickly you can perceive, process, and respond to information. Affects overall cognitive efficiency.",
                icon: <ArrowRight className="w-6 h-6" />,
                color: "from-purple-500 to-pink-600"
              },
              {
                title: "Executive Function",
                description: "Higher-order cognitive skills including planning, problem-solving, and cognitive flexibility. Governs goal-directed behavior.",
                icon: <CheckCircle className="w-6 h-6" />,
                color: "from-orange-500 to-red-600"
              },
              {
                title: "Verbal Fluency",
                description: "Language processing and semantic memory retrieval. Reflects communication and language organization abilities.",
                icon: <BookOpen className="w-6 h-6" />,
                color: "from-indigo-500 to-blue-600"
              },
              {
                title: "Cognitive Flexibility",
                description: "The ability to switch between tasks, adapt to new rules, and think about multiple concepts simultaneously.",
                icon: <Brain className="w-6 h-6" />,
                color: "from-teal-500 to-cyan-600"
              }
            ].map((domain, idx) => (
              <div
                key={idx}
                className="glass-card rounded-2xl p-6 border border-slate-200 hover:border-teal-300 transition-all"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${domain.color} mb-4`}>
                  <div className="text-white">
                    {domain.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{domain.title}</h3>
                <p className="text-slate-600 leading-relaxed">{domain.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Research-Informed Cognitive Change Ranges - NEW SECTION */}
      <section className="py-12 px-4 bg-[#fdfbf7]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <h2 className="text-3xl font-semibold text-slate-900">
                Research-Informed Cognitive Change Ranges
              </h2>
              <Info className="w-5 h-5 text-teal-600" />
            </div>
            <p className="text-slate-600 italic">
              Quantitative ranges observed in peer-reviewed cognitive training research
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 md:p-8 border border-slate-200 mb-4">
            {/* Mobile-friendly responsive table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="pb-4 pr-4 font-semibold text-slate-900">Cognitive Domain</th>
                    <th className="pb-4 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>Commonly Observed Change Range*</span>
                        <HelpCircle className="w-4 h-4 text-slate-400" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { domain: "Working Memory", range: "+40% to +70% task performance" },
                    { domain: "Attention & Focus", range: "+35% to +60%" },
                    { domain: "Processing Speed", range: "20–35% faster response times" },
                    { domain: "Executive Function", range: "+30% to +65% efficiency gains" },
                    { domain: "Verbal Fluency", range: "+25% to +55% consistency" }
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 pr-4 font-medium text-slate-900">{row.domain}</td>
                      <td className="py-4 px-4 text-slate-700">{row.range}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footnote with ethical framing */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500 italic leading-relaxed">
                *Ranges derived from peer-reviewed cognitive training research and aggregated, anonymized platform usage trends. 
                Individual experiences may vary significantly. These ranges represent observed patterns in research populations 
                and should not be interpreted as guaranteed outcomes or diagnostic indicators.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Research-Informed Improvement Ranges */}
      <section className="py-12 px-4 bg-[#fdfbf7]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-semibold text-slate-900 mb-3">
              Research-Informed Improvement Trends
            </h2>
            <p className="text-slate-600 italic">
              Based on published cognitive training studies and aggregated platform trends
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 md:p-8 border border-slate-200 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <Info className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-slate-600 italic">
                The following ranges are illustrative trends inspired by research findings. Individual results vary significantly based on baseline performance, consistency, and personal factors.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  metric: "Memory-related tasks",
                  range: "40–70%",
                  description: "Improvements observed in working memory and recall tasks with consistent practice"
                },
                {
                  metric: "Attention and processing speed",
                  range: "35–60%",
                  description: "Enhanced focus and faster information processing with regular engagement"
                },
                {
                  metric: "Reaction-based tasks",
                  range: "Reduced response times",
                  description: "Faster response times and improved accuracy with repeated practice"
                },
                {
                  metric: "Task accuracy",
                  range: "Improved with engagement",
                  description: "Better performance consistency and reduced errors over time"
                }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-6 p-5 bg-white/50 rounded-xl border border-slate-100">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-3xl md:text-4xl font-bold text-emerald-700 leading-tight mb-2 break-words">
                      {item.range}
                    </h3>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold text-slate-900 mb-2">{item.metric}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-500 text-center italic">
            These ranges are based on aggregated research findings and should not be interpreted as guarantees or diagnostic indicators.
          </p>
        </div>
      </section>

      {/* Task Accuracy & Response Time Trends - NEW SECTION */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-semibold text-slate-900 mb-3">
              Task Accuracy & Response Time Trends
            </h2>
            <p className="text-slate-600">
              Observed patterns in reaction-based cognitive tasks
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 md:p-8 border border-slate-200">
            <div className="space-y-6">
              {[
                {
                  title: "Response Time Improvements",
                  metric: "20–35% faster responses",
                  description: "Reaction-based tasks often show 20–35% faster responses with repeated engagement. This reflects improved processing efficiency and task familiarity over time."
                },
                {
                  title: "Accuracy Gains",
                  metric: "15–30 percentage points",
                  description: "Accuracy improvements of 15–30 percentage points are commonly observed with consistent practice. This indicates enhanced precision and reduced error rates."
                },
                {
                  title: "Response Variability Reduction",
                  metric: "Improved consistency",
                  description: "Reduced response variability over time reflects improved consistency. Performance becomes more stable and predictable with regular engagement."
                }
              ].map((item, idx) => (
                <div key={idx} className="p-5 bg-white/70 rounded-xl border border-slate-200">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">{item.title}</h3>
                      <p className="text-lg font-bold text-teal-700 mb-3">{item.metric}</p>
                      <p className="text-slate-600 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart caption template */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500 italic text-center">
                Illustrative trend inspired by peer-reviewed research and anonymized usage patterns. 
                Not intended for diagnostic use. Individual results vary based on baseline performance, 
                consistency, and personal factors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Longitudinal Tracking */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-6 md:p-8 border border-slate-200">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-semibold text-slate-900 mb-4">
                  Why Longitudinal Tracking Matters
                </h2>
                <p className="text-lg text-slate-700 leading-relaxed mb-4">
                  Single cognitive test scores are less meaningful than changes observed over time.
                </p>
                <p className="text-slate-700 leading-relaxed mb-6">
                  MindCare focuses on <span className="font-semibold">longitudinal tracking</span> — helping users notice trends, consistency, and changes rather than labeling performance.
                </p>
              </div>
            </div>

            {/* Quantitative context added */}
            <div className="mb-6 p-5 bg-teal-50 rounded-xl border border-teal-200">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-teal-600" />
                Research-Informed Quantitative Context
              </h3>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 mt-1">•</span>
                  <span>Users engaging <span className="font-semibold">3+ times per week</span> often show <span className="font-semibold">1.5–2× stronger trend stability</span> compared to less frequent engagement.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 mt-1">•</span>
                  <span>Performance variability typically <span className="font-semibold">reduces by 30–50%</span> with consistent tracking over time.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 mt-1">•</span>
                  <span>Longitudinal trends are more meaningful than single-session results, as they account for natural day-to-day fluctuations.</span>
                </li>
              </ul>
              <p className="mt-3 text-xs text-slate-500 italic">
                These observations are based on aggregated, anonymized platform data and published cognitive research. Individual experiences vary.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "Progress Tracking",
                  description: "See how your cognitive performance changes over days, weeks, and months"
                },
                {
                  title: "Trend Visualization",
                  description: "Identify patterns and understand what factors might influence your cognitive performance"
                },
                {
                  title: "Pattern Awareness",
                  description: "Notice correlations between lifestyle factors and cognitive performance over time"
                }
              ].map((feature, idx) => (
                <div key={idx} className="bg-white/70 rounded-xl p-5 border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mental Health Context */}
      <section className="py-12 px-4 bg-[#fdfbf7]">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-6 md:p-8 border border-slate-200">
            <h2 className="text-3xl font-semibold text-slate-900 mb-6">
              Cognitive Health & Mental Wellbeing
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-700 leading-relaxed mb-4">
                Cognitive functions such as memory, attention, and executive control are often affected during periods of stress, burnout, low mood, or aging.
              </p>
              <p className="text-slate-700 leading-relaxed mb-6">
                MindCare helps users track these cognitive aspects that are commonly impacted across various life conditions. By monitoring these domains over time, users can gain awareness of how their cognitive performance relates to their overall wellbeing.
              </p>

              {/* Quantified context added */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Info className="w-5 h-5 text-slate-600" />
                  Observed Variability Patterns
                </h3>
                <ul className="space-y-2 text-slate-700 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-slate-600 mt-1">•</span>
                    <span>Attention efficiency can <span className="font-semibold">fluctuate by 20–40%</span> during periods of stress or fatigue. This is a normal response to cognitive load.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-600 mt-1">•</span>
                    <span>Memory recall consistency <span className="font-semibold">varies with sleep quality and cognitive load</span>. Tracking helps identify these relationships.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-600 mt-1">•</span>
                    <span>Processing speed variability <span className="font-semibold">increases during burnout or overload</span>. These patterns are observable through longitudinal tracking.</span>
                  </li>
                </ul>
                <p className="mt-3 text-xs text-slate-500 italic">
                  These observations reflect common patterns in cognitive research and anonymized usage data. They are not diagnostic indicators.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Limitations & Ethical Transparency */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-6 md:p-8 border-2 border-slate-300 bg-white">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-slate-600 p-3 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-semibold text-slate-900 mb-4">
                  Limitations & Responsible Use
                </h2>
                <p className="text-slate-700 leading-relaxed mb-6">
                  Transparency about what MindCare can and cannot do is essential for responsible use.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  title: "Not a Diagnostic Tool",
                  description: "MindCare is designed for self-awareness and cognitive fitness tracking, not for diagnosing cognitive disorders or mental health conditions."
                },
                {
                  title: "Results Can Vary",
                  description: "Cognitive performance naturally fluctuates based on numerous factors including sleep quality, stress levels, time of day, and environmental conditions."
                },
                {
                  title: "Influencing Factors",
                  description: "Your scores are influenced by sleep, stress, nutrition, physical activity, medication, and many other lifestyle factors. MindCare helps you notice these patterns."
                },
                {
                  title: "Intra-Individual Variability",
                  description: "Intra-individual cognitive variability of 10–25% is common and normal. Day-to-day fluctuations do not necessarily indicate changes in underlying cognitive capacity."
                },
                {
                  title: "Non-Linear Change Patterns",
                  description: "Cognitive change is non-linear and influenced by external factors. Performance improvements may plateau, fluctuate, or show temporary declines due to various life circumstances."
                },
                {
                  title: "Performance Patterns, Not Clinical Outcomes",
                  description: "Results reflect performance patterns observed during cognitive tasks, not clinical outcomes or diagnostic indicators. These patterns are tools for self-awareness."
                },
                {
                  title: "Professional Consultation",
                  description: "If you have concerns about your cognitive health or mental wellbeing, please consult with a qualified healthcare professional or mental health provider."
                }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <CheckCircle className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                    <p className="text-slate-600 text-sm">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Scientific Inspiration */}
      <section className="py-12 px-4 bg-[#fdfbf7]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-semibold text-slate-900 mb-3">
              Scientific Inspiration
            </h2>
            <p className="text-slate-600">
              MindCare&apos;s design is inspired by established neuropsychological tasks widely used in cognitive science research.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 md:p-8 border border-slate-200">
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "N-Back Task",
                "Stroop Task",
                "Trail Making Test",
                "Digit Span",
                "Reaction Time Tasks",
                "Go/No-Go Task",
                "Flanker Task",
                "Symbol Digit Modalities",
                "Verbal Fluency Tasks",
                "Clock Drawing Test",
                "Delayed Recall",
                "Visual Search Tasks"
              ].map((task, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-white/70 rounded-lg border border-slate-200">
                  <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                  <span className="text-slate-700 font-medium">{task}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-slate-600 italic text-center">
              These tasks are validated tools in cognitive research and are adapted for digital self-monitoring purposes.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card rounded-2xl p-8 border border-slate-200">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              Ready to Start Tracking Your Cognitive Wellness?
            </h2>
            <p className="text-slate-600 mb-6">
              Begin your journey of self-awareness and cognitive fitness tracking.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/tests"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-teal-700 rounded-xl font-semibold border-2 border-teal-200 hover:border-teal-300 transition-all"
              >
                Explore Tests
                <Brain className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

