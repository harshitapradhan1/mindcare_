"use client";
import React, { useState, useEffect } from 'react';
import { Brain, Menu, X, LogIn, LogOut, User, MessageCircle, FileText } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check authentication status from localStorage
    if (typeof window !== 'undefined') {
      const authStatus = localStorage.getItem('isAuthenticated');
      const storedUsername = localStorage.getItem('username');
      
      setIsAuthenticated(authStatus === 'true');
      setUsername(storedUsername || '');
      
      // Listen for storage changes (e.g., when user logs in/out in another tab)
      const handleStorageChange = () => {
        const newAuthStatus = localStorage.getItem('isAuthenticated');
        const newUsername = localStorage.getItem('username');
        setIsAuthenticated(newAuthStatus === 'true');
        setUsername(newUsername || '');
      };
      
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  const handleLogin = () => {
    router.push('/login');
  };
  
  const handleSignup = () => {
    router.push('/signup');
  };
  
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      // Clear all user data on logout for security
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('password');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('userRecord');
      localStorage.removeItem('userPlan');
      // Clear daily games selection
      const today = new Date().toDateString();
      localStorage.removeItem(`dailyGames_${today}`);
      localStorage.removeItem('dailyGamesDate');
      
      setIsAuthenticated(false);
      setUsername('');
      router.push('/signup');
    }
  };

  const AuthButtons = ({ isMobile = false }) => {
    // Always show login/signup buttons until mounted to prevent hydration mismatch
    if (!mounted) {
      return (
        <div className={`flex items-center space-x-3 ${isMobile ? 'flex-col space-y-3 space-x-0 w-full' : ''}`}>
          <button 
            onClick={handleLogin} 
            className={`flex items-center justify-center space-x-2 px-5 py-2.5 text-teal-600 hover:text-teal-700 font-semibold transition-colors border-2 border-teal-500 hover:border-teal-600 rounded-lg hover:bg-teal-50 ${isMobile ? 'w-full' : ''}`}>
              <LogIn className="w-4 h-4" />
              <span>Login</span>
          </button>
          <button 
            onClick={handleSignup} 
            className={`px-6 py-2.5 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-lg hover:from-teal-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg font-semibold ${isMobile ? 'w-full' : ''}`}>
            Sign Up
          </button>
        </div>
      );
     }
      
    if (isAuthenticated) {
      return (
        <div className={`flex items-center space-x-3 ${isMobile ? 'flex-col space-y-3 space-x-0 w-full' : ''}`}>
           <button 
             onClick={() => router.push('/profile')}
             className={`flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-lg hover:from-teal-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg font-semibold ${isMobile ? 'w-full' : ''}`}>
             <User className="w-4 h-4" />
             <span>Profile</span>
           </button>
           <div className={`flex items-center space-x-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-lg ${isMobile ? 'w-full justify-center' : ''}`}>
             <span className="text-sm font-semibold text-teal-700">{username || 'User'}</span>
           </div>
           <button 
             onClick={handleLogout} 
             className={`flex items-center justify-center space-x-2 px-4 py-2.5 text-gray-700 hover:text-teal-600 font-semibold transition-colors border-2 border-gray-300 hover:border-teal-500 rounded-lg hover:bg-teal-50 ${isMobile ? 'w-full' : ''}`}>
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      );
    }

    return (
      <div className={`flex items-center space-x-3 ${isMobile ? 'flex-col space-y-3 space-x-0 w-full' : ''}`}>
        <button 
          onClick={handleLogin} 
          className={`flex items-center justify-center space-x-2 px-5 py-2.5 text-teal-600 hover:text-teal-700 font-semibold transition-colors border-2 border-teal-500 hover:border-teal-600 rounded-lg hover:bg-teal-50 ${isMobile ? 'w-full' : ''}`}>
            <LogIn className="w-4 h-4" />
            <span>Login</span>
        </button>
        <button 
          onClick={handleSignup} 
          className={`px-6 py-2.5 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-lg hover:from-teal-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg font-semibold ${isMobile ? 'w-full' : ''}`}>
          Sign Up
        </button>
      </div>
    );
  };

  return (
    <nav className="sticky top-4 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="glass-card rounded-full px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/')}>
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm text-slate-500 font-semibold">MindCare</span>
              <span className="text-lg font-bold text-slate-900">Modern Wellness</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden xl:flex items-center justify-center flex-1 mx-4 gap-x-4 2xl:gap-x-6 text-sm font-semibold text-slate-600">
            <Link href="/dashboard" className="hover:text-teal-700 transition-colors whitespace-nowrap">Dashboard</Link>
            <Link href="/neurotwin" className="hover:text-teal-700 transition-colors whitespace-nowrap">NeuroTwin</Link>
            <Link href="/tests" className="hover:text-teal-700 transition-colors whitespace-nowrap">Tests</Link>
            <Link href="/simplify-report" className="hover:text-teal-700 transition-colors flex items-center gap-1 whitespace-nowrap">
              <FileText className="w-4 h-4" />
              Simplify Report
            </Link>
            <Link href="/support" className="hover:text-teal-700 transition-colors flex items-center gap-1 whitespace-nowrap">
              <MessageCircle className="w-4 h-4" />
              Support
            </Link>
            <Link href="/research" className="hover:text-teal-700 transition-colors whitespace-nowrap">Research</Link>
            <Link href="/pricing" className="hover:text-teal-700 transition-colors whitespace-nowrap">Pricing</Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden xl:flex items-center flex-shrink-0">
            <AuthButtons />
          </div>

          {/* Mobile menu button */}
          <button 
            className="xl:hidden p-2 rounded-xl hover:bg-white/70 transition-colors border border-white/60 glass-card"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-teal-700" /> : <Menu className="w-6 h-6 text-teal-700" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden glass-card mx-4 mt-2 rounded-3xl shadow-xl">
          <div className="px-4 py-4 space-y-3">
            <Link href="/dashboard" className="block px-4 py-3 text-slate-700 hover:bg-white/70 rounded-xl transition-colors font-semibold">Dashboard</Link>
            <Link href="/neurotwin" className="block px-4 py-3 text-slate-700 hover:bg-white/70 rounded-xl transition-colors font-semibold">NeuroTwin</Link>
            <Link href="/tests" className="block px-4 py-3 text-slate-700 hover:bg-white/70 rounded-xl transition-colors font-semibold">Tests</Link>
            <Link href="/simplify-report" className="block px-4 py-3 text-slate-700 hover:bg-white/70 rounded-xl transition-colors font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Simplify Report
            </Link>
            <Link href="/support" className="block px-4 py-3 text-slate-700 hover:bg-white/70 rounded-xl transition-colors font-semibold flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Support
            </Link>
            <Link href="/research" className="block px-4 py-3 text-slate-700 hover:bg-white/70 rounded-xl transition-colors font-semibold">Research</Link>
            <Link href="/pricing" className="block px-4 py-3 text-slate-700 hover:bg-white/70 rounded-xl transition-colors font-semibold">Pricing</Link>
            <div className="border-t border-white/60 pt-4">
              <AuthButtons isMobile={true} />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;