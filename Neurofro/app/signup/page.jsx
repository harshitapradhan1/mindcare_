"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, Mail, Lock, Phone, Calendar, Users, Briefcase, 
  Monitor, Eye, Palette, Moon, Sun, CheckCircle, 
  ChevronRight, ChevronLeft, Brain, Shield, FileText,
  ArrowRight, LogIn, Github
} from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [showLogin, setShowLogin] = useState(false);
  const [gameState, setGameState] = useState('signup'); // signup, success
  
  const [formData, setFormData] = useState({
    // Basic Info
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    authMethod: 'password', // 'password' or 'oauth'
    oauthProvider: '', // 'google' or 'github'
    
    // Demographics
    age: '',
    gender: '',
    
    // Role / Use Case
    purpose: '',
    occupation: '',
    
    // Cognitive & Device Info
    screenTime: '8', // Default to 8 hours
    primaryDevice: '',
    screenAwarenessConsent: false,
    
    // Personalization
    aiTone: '',
    theme: 'auto',
    
    // Cognitive Health Baseline
    focusLevel: '',
    memoryLevel: '',
    stressLevel: '',
    
    // Legal
    termsAccepted: false
  });

  // Auto-detect OS and theme on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Auto-detect OS
      const userAgent = window.navigator.userAgent.toLowerCase();
      let detectedOS = 'other';
      if (userAgent.includes('win')) detectedOS = 'windows';
      else if (userAgent.includes('mac')) detectedOS = 'macos';
      else if (userAgent.includes('linux')) detectedOS = 'linux';
      
      // Auto-detect theme preference
      let detectedTheme = 'auto';
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        detectedTheme = 'dark';
      }
      
      // Set defaults if not already set
      setFormData(prev => ({
        ...prev,
        primaryDevice: prev.primaryDevice || detectedOS,
        theme: prev.theme === 'auto' ? detectedTheme : prev.theme
      }));
    }
  }, []);

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const totalSteps = 5;

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSignup();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateStep = (step) => {
    switch(step) {
      case 1:
        // Basic Info: Full Name, Email, Password, Confirm Password
        if (formData.authMethod === 'oauth') {
          return formData.fullName && formData.email && formData.oauthProvider;
        }
        return formData.fullName && formData.email && formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;
      case 2:
        // Personal Details: Age, Gender, Occupation, Purpose
        return formData.age && formData.gender && formData.occupation && formData.purpose;
      case 3:
        // Setup: Screen Time, Device Type, Theme
        return formData.screenTime && formData.primaryDevice && formData.theme;
      case 4:
        // AI Personalization: AI Tone (quiz is optional)
        return formData.aiTone;
      case 5:
        // Permissions & Consent: Screen awareness consent and Terms
        return formData.screenAwarenessConsent && formData.termsAccepted;
      default:
        return false;
    }
  };

  const handleOAuthSignup = async (provider) => {
    // In production, this would redirect to OAuth provider
    // For demo, we'll simulate OAuth signup
    setFormData(prev => ({ 
      ...prev, 
      authMethod: 'oauth',
      oauthProvider: provider,
      // Simulate getting user info from OAuth
      email: provider === 'google' ? 'user@gmail.com' : 'user@github.com',
      fullName: provider === 'google' ? 'Google User' : 'GitHub User'
    }));
    
    // Show message that OAuth will be implemented
    alert(`OAuth signup with ${provider} will be implemented in production. For now, please use email/password signup.`);
  };

  const handleSignup = async () => {
    // Generate user ID
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Store user data locally
    if (typeof window !== 'undefined') {
      // Store userId in profile so it persists
      const profileWithUserId = { ...formData, userId: userId };
      localStorage.setItem('userId', userId);
      localStorage.setItem('username', formData.fullName);
      localStorage.setItem('userEmail', formData.email);
      localStorage.setItem('password', formData.password); // For demo - in production, hash this
      localStorage.setItem('userProfile', JSON.stringify(profileWithUserId));
      
      // Save user data for analysis
      const userRecord = {
        user_id: userId,
        email: formData.email,
        full_name: formData.fullName,
        age: formData.age,
        gender: formData.gender,
        occupation: formData.occupation,
        purpose: formData.purpose,
        screen_time: formData.screenTime,
        primary_device: formData.primaryDevice,
        screen_awareness_consent: formData.screenAwarenessConsent,
        ai_tone: formData.aiTone,
        theme: formData.theme,
        baseline: {
          focus_level: formData.focusLevel,
          memory_level: formData.memoryLevel,
          stress_level: formData.stressLevel
        },
        signup_date: new Date().toISOString()
      };
      
      localStorage.setItem('userRecord', JSON.stringify(userRecord));
      
      // Send to backend for analysis (optional - will work even if backend is down)
      try {
        await fetch('http://localhost:5002/api/neurotwin/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            profile: formData,
            initial_setup: true,
            user_record: userRecord
          })
        });
      } catch (err) {
        console.warn('Backend update optional - profile saved locally:', err);
      }
    }
    
    // Show success message and redirect to login
    setGameState('success');
  };

  const handleLogin = async () => {
    // Simple login check (in production, verify with backend)
    if (typeof window !== 'undefined') {
      const storedProfile = localStorage.getItem('userProfile');
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        if (profile.email === loginData.email) {
          localStorage.setItem('userId', localStorage.getItem('userId') || `user-${Date.now()}`);
          localStorage.setItem('username', profile.fullName);
          localStorage.setItem('isAuthenticated', 'true');
          router.push('/tests');
          return;
        }
      }
      alert('Invalid email or password. Please sign up first.');
    }
  };

  const renderStepContent = () => {
    switch(currentStep) {
      case 1:
        // Step 1: Basic Info - Full Name, Email, Password, Confirm Password
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Step 1: Basic Information</h2>
            
            {/* OAuth Options */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                🔒 Sign up with (or use password below)
              </label>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => handleOAuthSignup('google')}
                  className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all font-semibold"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuthSignup('github')}
                  className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 rounded-xl hover:border-gray-800 hover:bg-gray-50 transition-all font-semibold"
                >
                  <Github className="w-5 h-5" />
                  GitHub
                </button>
              </div>
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">or</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => updateFormData('fullName', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Enter your full name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="your@email.com"
                required
              />
            </div>
            {formData.authMethod === 'password' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateFormData('password', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Create a strong password"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      formData.confirmPassword && formData.password !== formData.confirmPassword
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-300 focus:border-teal-500'
                    }`}
                    placeholder="Confirm your password"
                    required
                  />
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                  )}
                </div>
              </>
            )}
          </div>
        );

      case 2:
        // Step 2: Personal Details - Age, Gender, Occupation, Purpose
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Step 2: Personal Details</h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Age *
              </label>
              <select
                value={formData.age}
                onChange={(e) => updateFormData('age', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
              >
                <option value="">Select age</option>
                {Array.from({ length: 88 }, (_, i) => i + 13).map(age => (
                  <option key={age} value={age}>{age} years</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Gender *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => updateFormData('gender', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Occupation / Field of work *
              </label>
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) => updateFormData('occupation', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="e.g., Software Developer, Student, Researcher"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Purpose of using the assistant *
              </label>
              <textarea
                value={formData.purpose}
                onChange={(e) => updateFormData('purpose', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-h-[100px]"
                placeholder="e.g., Track focus while studying, Enhance productivity while coding"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Tell us how you plan to use the AI assistant</p>
            </div>
          </div>
        );

      case 3:
        // Step 3: Setup - Screen Time (slider), Device Type, Theme
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Step 3: Setup</h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Average screen time per day *
              </label>
              <div className="space-y-3">
                <input
                  type="range"
                  min="0"
                  max="16"
                  step="1"
                  value={formData.screenTime || '8'}
                  onChange={(e) => updateFormData('screenTime', e.target.value)}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0h</span>
                  <span className="font-bold text-teal-600 text-lg">{formData.screenTime || '8'} hours</span>
                  <span>16h+</span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Device Type *
              </label>
              <select
                value={formData.primaryDevice}
                onChange={(e) => updateFormData('primaryDevice', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
              >
                <option value="">Select device</option>
                <option value="windows">Windows</option>
                <option value="macos">macOS</option>
                <option value="linux">Linux</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Theme *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['light', 'dark', 'auto'].map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => updateFormData('theme', theme)}
                    className={`p-4 border-2 rounded-xl transition-all ${
                      formData.theme === theme
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-300 hover:border-teal-300'
                    }`}
                  >
                    {theme === 'light' && <Sun className="w-6 h-6 mx-auto mb-2 text-yellow-600" />}
                    {theme === 'dark' && <Moon className="w-6 h-6 mx-auto mb-2 text-indigo-600" />}
                    {theme === 'auto' && <Monitor className="w-6 h-6 mx-auto mb-2 text-gray-600" />}
                    <div className="text-sm font-semibold capitalize">{theme}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        // Step 4: AI Personalization - AI Tone, Optional Quiz
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Step 4: AI Personalization</h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Preferred AI tone *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['friendly', 'motivational', 'professional', 'calm'].map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => updateFormData('aiTone', tone)}
                    className={`p-4 border-2 rounded-xl transition-all text-left ${
                      formData.aiTone === tone
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-300 hover:border-teal-300'
                    }`}
                  >
                    <div className="font-semibold capitalize text-gray-900">{tone}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {tone === 'friendly' && 'Warm and approachable'}
                      {tone === 'motivational' && 'Encouraging and energetic'}
                      {tone === 'professional' && 'Formal and precise'}
                      {tone === 'calm' && 'Relaxed and soothing'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Optional Mini Quiz */}
            <div className="border-t-2 border-gray-200 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Optional: Mini Quiz</h3>
              <p className="text-sm text-gray-600 mb-4">Help us understand your current cognitive state</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    How would you rate your current focus level?
                  </label>
                  <select
                    value={formData.focusLevel}
                    onChange={(e) => updateFormData('focusLevel', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="">Select (optional)</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="average">Average</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    How would you rate your memory?
                  </label>
                  <select
                    value={formData.memoryLevel}
                    onChange={(e) => updateFormData('memoryLevel', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="">Select (optional)</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="average">Average</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    How would you rate your mood/stress level?
                  </label>
                  <select
                    value={formData.stressLevel}
                    onChange={(e) => updateFormData('stressLevel', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="">Select (optional)</option>
                    <option value="very-low">Very Low</option>
                    <option value="low">Low</option>
                    <option value="moderate">Moderate</option>
                    <option value="high">High</option>
                    <option value="very-high">Very High</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        // Step 5: Permissions & Consent
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Step 5: Permissions & Consent</h2>
            
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.screenAwarenessConsent}
                  onChange={(e) => updateFormData('screenAwarenessConsent', e.target.checked)}
                  className="mt-1 w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                  required
                />
                <div>
                  <div className="font-semibold text-gray-900">
                    I consent to allow the AI to analyze my screen only when granted permission. *
                  </div>
                  <p className="text-sm text-gray-700 mt-1">
                    The AI will only analyze screen content when you explicitly grant permission. This is a legal requirement.
                  </p>
                </div>
              </label>
            </div>

            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <FileText className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Terms of Service</h3>
                  <p className="text-sm text-gray-700">
                    By using MindCare, you agree to our terms of service. This includes consent for 
                    cognitive health assessments, data processing, and screen awareness features (if enabled).
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Privacy Policy</h3>
                  <p className="text-sm text-gray-700">
                    Your data is encrypted and stored securely. We use your information only to provide 
                    personalized cognitive health insights and improve our services. Screen content is 
                    analyzed locally when consent is given.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={(e) => updateFormData('termsAccepted', e.target.checked)}
                  className="mt-1 w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                  required
                />
                <div>
                  <div className="font-semibold text-gray-900">
                    I agree to the Terms of Service and Privacy Policy. *
                  </div>
                  <p className="text-sm text-gray-700 mt-1">
                    Mandatory for compliance (especially for screen data)
                  </p>
                </div>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    const titles = {
      1: 'Basic Information',
      2: 'Personal Details',
      3: 'Setup',
      4: 'AI Personalization',
      5: 'Permissions & Consent'
    };
    return titles[currentStep] || 'Sign Up';
  };

  if (gameState === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border-2 border-teal-100">
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-br from-green-500 to-emerald-600 p-5 rounded-2xl mb-4 shadow-xl">
              <CheckCircle className="w-14 h-14 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Signup Successful!</h1>
            <p className="text-gray-600">Your account has been created successfully</p>
          </div>

          <div className="bg-teal-50 border-2 border-teal-200 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-3">Next Steps:</h3>
            <p className="text-gray-700 mb-4">
              Please login with your email and password to access your profile and start taking cognitive tests.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4" />
              <span>Email: {formData.email}</span>
            </div>
          </div>

          <button
            onClick={() => {
              // Clear auth state so user must login
              if (typeof window !== 'undefined') {
                localStorage.removeItem('isAuthenticated');
              }
              // Redirect to login page
              router.push('/login');
            }}
            className="w-full px-6 py-4 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl hover:from-teal-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl font-bold text-lg flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border-2 border-teal-100">
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-br from-teal-500 to-blue-600 p-3 rounded-xl shadow-lg mb-4">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Login to your MindCare account</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="your.email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Password
              </label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Enter your password"
              />
            </div>
            <button
              onClick={handleLogin}
              className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl hover:from-teal-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl font-bold text-lg flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Login
            </button>
            <button
              onClick={() => setShowLogin(false)}
              className="w-full text-center text-teal-600 hover:text-teal-700 font-semibold mt-4"
            >
              Don't have an account? Sign up
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl border-2 border-teal-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-blue-600 rounded-t-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Create Your Account</h1>
              <p className="text-teal-100">Step {currentStep} of {totalSteps}: {getStepTitle()}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <Brain className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-6">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700">Progress</span>
              <span className="text-sm font-semibold text-teal-600">{Math.round((currentStep / totalSteps) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-teal-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className={`flex-1 h-2 rounded-full ${
                  step <= currentStep ? 'bg-teal-500' : 'bg-gray-200'
                }`}></div>
                {step < totalSteps && (
                  <div className={`w-2 h-2 rounded-full mx-1 ${
                    step < currentStep ? 'bg-teal-500' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="p-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="px-8 pb-8 flex justify-between items-center">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!validateStep(currentStep)}
            className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
              validateStep(currentStep)
                ? 'bg-gradient-to-r from-teal-500 to-blue-600 text-white hover:from-teal-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {currentStep === totalSteps ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Complete Signup
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Login Link */}
        <div className="px-8 pb-8 text-center border-t-2 border-gray-100 pt-6">
          <p className="text-gray-600 mb-4">Already have an account?</p>
          <button
            onClick={() => setShowLogin(true)}
            className="text-teal-600 hover:text-teal-700 font-semibold flex items-center justify-center gap-2 mx-auto"
          >
            <LogIn className="w-4 h-4" />
            Login here
          </button>
        </div>
      </div>
    </div>
  );
}

