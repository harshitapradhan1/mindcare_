"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import { 
  Brain, 
  Activity, 
  MessageSquare, 
  Eye, 
  Target, 
  Clock, 
  Award,
  ArrowRight,
  LogOut,
  User,
  CheckCircle,
  Zap,
  AlertTriangle,
  Search,
  Mic
} from 'lucide-react';

export default function TestsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState('Guest');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('userId');
      const storedUsername = localStorage.getItem('username');
      const storedAuth = localStorage.getItem('isAuthenticated');
      
      if (storedUserId && storedAuth === 'true') {
        setUserId(storedUserId);
        setUsername(storedUsername || 'Guest');
        setIsAuthenticated(true);
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('isAuthenticated');
    }
    router.push('/signup');
  };

  const cognitiveTests = [
    {
      id: 'n-back',
      title: 'N-Back Test',
      description: 'Working memory and sustained attention assessment using n-back paradigm',
      icon: <Brain className="w-8 h-8" />,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'from-purple-50 to-pink-50',
      borderColor: 'border-purple-200',
      link: '/tests/n-back',
      difficulty: 'Medium',
      duration: '2-3 min',
      skills: ['Working Memory', 'Sustained Attention', 'Cognitive Load'],
      validated: true
    },
    {
      id: 'stroop',
      title: 'Stroop Test',
      description: 'Test your attention and cognitive flexibility by matching word colors',
      icon: <Target className="w-8 h-8" />,
      color: 'from-indigo-500 to-purple-600',
      bgColor: 'from-indigo-50 to-purple-50',
      borderColor: 'border-indigo-200',
      link: '/tests/stroop',
      difficulty: 'Medium',
      duration: '5-10 min',
      skills: ['Attention Control', 'Cognitive Flexibility', 'Processing Speed'],
      validated: true
    },
    {
      id: 'trail-making',
      title: 'Trail Making Test',
      description: 'Executive function and cognitive flexibility - connect numbers and letters',
      icon: <Activity className="w-8 h-8" />,
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'from-blue-50 to-cyan-50',
      borderColor: 'border-blue-200',
      link: '/tests/trail-making',
      difficulty: 'Medium',
      duration: '3-5 min',
      skills: ['Executive Function', 'Visual Attention', 'Cognitive Flexibility'],
      validated: true
    },
    {
      id: 'symbol-digit',
      title: 'Symbol Digit Test',
      description: 'Processing speed and visual scanning - match symbols to digits quickly',
      icon: <Zap className="w-8 h-8" />,
      color: 'from-orange-500 to-red-600',
      bgColor: 'from-orange-50 to-red-50',
      borderColor: 'border-orange-200',
      link: '/tests/symbol-digit',
      difficulty: 'Easy',
      duration: '90 sec',
      skills: ['Processing Speed', 'Visual Scanning', 'Attention'],
      validated: true
    },
    {
      id: 'go-no-go',
      title: 'Go/No-Go Task',
      description: 'Inhibitory control and sustained attention - respond to Go, ignore No-Go',
      icon: <AlertTriangle className="w-8 h-8" />,
      color: 'from-yellow-500 to-orange-600',
      bgColor: 'from-yellow-50 to-orange-50',
      borderColor: 'border-yellow-200',
      link: '/tests/go-no-go',
      difficulty: 'Medium',
      duration: '5 min',
      skills: ['Inhibitory Control', 'Sustained Attention', 'Impulse Control'],
      validated: true
    },
    {
      id: 'memory',
      title: 'Memory Match',
      description: 'Test your working memory with card matching exercises',
      icon: <Brain className="w-8 h-8" />,
      color: 'from-cyan-500 to-blue-600',
      bgColor: 'from-cyan-50 to-blue-50',
      borderColor: 'border-cyan-200',
      link: '/tests/memory-match',
      difficulty: 'Easy',
      duration: '5-15 min',
      skills: ['Working Memory', 'Visual Memory', 'Concentration']
    },
    {
      id: 'speech',
      title: 'Speech Analysis',
      description: 'Analyze your speech patterns for cognitive health indicators',
      icon: <MessageSquare className="w-8 h-8" />,
      color: 'from-teal-500 to-green-600',
      bgColor: 'from-teal-50 to-green-50',
      borderColor: 'border-teal-200',
      link: '/tests/speech',
      difficulty: 'Easy',
      duration: '3-5 min',
      skills: ['Verbal Fluency', 'Speech Patterns', 'Language Processing'],
      validated: true
    },
    {
      id: 'face',
      title: 'Facial Analysis',
      description: 'Facial recognition and emotion analysis for cognitive assessment',
      icon: <Eye className="w-8 h-8" />,
      color: 'from-rose-500 to-pink-600',
      bgColor: 'from-rose-50 to-pink-50',
      borderColor: 'border-rose-200',
      link: '/tests/face',
      difficulty: 'Easy',
      duration: '2-3 min',
      skills: ['Facial Recognition', 'Emotion Processing', 'Visual Attention'],
      validated: true
    },
    {
      id: 'digit-span',
      title: 'Digit Span Test',
      description: 'Working memory assessment - recall digit sequences forward or backward',
      icon: <Brain className="w-8 h-8" />,
      color: 'from-violet-500 to-purple-600',
      bgColor: 'from-violet-50 to-purple-50',
      borderColor: 'border-violet-200',
      link: '/tests/digit-span',
      difficulty: 'Medium',
      duration: '5-10 min',
      skills: ['Working Memory', 'Memory Retention', 'Sequential Processing'],
      validated: true
    },
    {
      id: 'flanker-task',
      title: 'Flanker Task',
      description: 'Response inhibition and attention - identify center arrow direction',
      icon: <Target className="w-8 h-8" />,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'from-emerald-50 to-teal-50',
      borderColor: 'border-emerald-200',
      link: '/tests/flanker-task',
      difficulty: 'Medium',
      duration: '3-5 min',
      skills: ['Response Inhibition', 'Attention Control', 'Executive Control'],
      validated: true
    },
    {
      id: 'reaction-time',
      title: 'Reaction Time Test',
      description: 'Measure processing speed and alertness with simple reaction tasks',
      icon: <Zap className="w-8 h-8" />,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'from-amber-50 to-orange-50',
      borderColor: 'border-amber-200',
      link: '/tests/reaction-time',
      difficulty: 'Easy',
      duration: '2-3 min',
      skills: ['Processing Speed', 'Alertness', 'Motor Response'],
      validated: true
    },
    {
      id: 'dual-task',
      title: 'Dual Task Challenge',
      description: 'Divided attention and multitasking - perform two tasks simultaneously',
      icon: <Activity className="w-8 h-8" />,
      color: 'from-indigo-500 to-purple-600',
      bgColor: 'from-indigo-50 to-purple-50',
      borderColor: 'border-indigo-200',
      link: '/tests/dual-task',
      difficulty: 'Hard',
      duration: '5 min',
      skills: ['Divided Attention', 'Multitasking', 'Cognitive Load Management'],
      validated: true
    },
    {
      id: 'visual-search',
      title: 'Visual Search Test',
      description: 'Processing speed and visual attention - find target symbols quickly',
      icon: <Search className="w-8 h-8" />,
      color: 'from-pink-500 to-rose-600',
      bgColor: 'from-pink-50 to-rose-50',
      borderColor: 'border-pink-200',
      link: '/tests/visual-search',
      difficulty: 'Easy',
      duration: '3 min',
      skills: ['Visual Attention', 'Processing Speed', 'Detail Orientation'],
      validated: true
    },
    {
      id: 'delayed-recall',
      title: 'Delayed Recall',
      description: 'Remember everyday words over a short delay to assess long-term memory.',
      icon: <Brain className="w-8 h-8" />,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'from-emerald-50 to-teal-50',
      borderColor: 'border-emerald-200',
      link: '/tests/delayed-recall',
      difficulty: 'Medium',
      duration: '10–20 min (with delay)',
      skills: ['Episodic Memory', 'Consolidation'],
      validated: true
    },
    {
      id: 'verbal-fluency',
      title: 'Verbal Fluency',
      description: 'Say as many words as you can in a category or starting with a letter.',
      icon: <Mic className="w-8 h-8" />,
      color: 'from-indigo-500 to-sky-600',
      bgColor: 'from-indigo-50 to-sky-50',
      borderColor: 'border-indigo-200',
      link: '/tests/verbal-fluency',
      difficulty: 'Medium',
      duration: '2–3 min',
      skills: ['Language', 'Executive Retrieval', 'Semantic Memory'],
      validated: true
    },
    {
      id: 'clock-drawing',
      title: 'Clock Drawing',
      description: 'Digital clock-drawing task for planning and visuospatial skills.',
      icon: <Clock className="w-8 h-8" />,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'from-amber-50 to-orange-50',
      borderColor: 'border-amber-200',
      link: '/tests/clock-drawing',
      difficulty: 'Medium',
      duration: '2–4 min',
      skills: ['Executive Function', 'Visuospatial', 'Memory'],
      validated: true
    }
  ];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        {/* Introduction */}
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Cognitive Test
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select a test below to assess different aspects of your cognitive health. 
            Complete multiple tests for a comprehensive assessment.
          </p>
        </div>

        {/* Test Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {cognitiveTests.map((test) => (
            <Link
              key={test.id}
              href={test.link}
              className="group bg-white rounded-2xl border-2 border-gray-200 hover:border-teal-300 p-6 transition-all hover:shadow-xl hover:scale-[1.02]"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`bg-gradient-to-br ${test.color} p-4 rounded-xl text-white flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  {test.icon}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        {test.title}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {test.description}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {test.validated && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                        ✓ Validated
                      </span>
                    )}
                    {test.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{test.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      <span>{test.difficulty}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Info Section */}
        <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-8 border-2 border-teal-200">
          <div className="flex items-start gap-4">
            <div className="bg-teal-500 p-3 rounded-xl">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                About Cognitive Testing
              </h3>
              <p className="text-gray-700 mb-4">
                These tests are designed to assess various cognitive functions including memory, 
                attention, processing speed, and verbal fluency. Regular testing can help track 
                your cognitive health over time.
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <Activity className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <span>Results are saved to your profile for tracking progress</span>
                </li>
                <li className="flex items-start gap-2">
                  <Brain className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <span>Complete multiple tests for a comprehensive assessment</span>
                </li>
                <li className="flex items-start gap-2">
                  <Award className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <span>Your results contribute to your NeuroTwin profile</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-white border-2 border-teal-500 text-teal-600 rounded-xl hover:bg-teal-50 transition-all font-semibold"
          >
            View Dashboard
          </Link>
          <Link
            href="/neurotwin"
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
          >
            View NeuroTwin
          </Link>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}

