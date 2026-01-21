
import React, { useState, useEffect } from 'react';
import { performCloudRestore } from '../utils/db';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [statusText, setStatusText] = useState('Access Vault');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn || isUnlocked) return;

    setIsLoggingIn(true);
    setStatusText('Unlocking...');
    setError('');
    
    // Simulate auth check
    if (username === 'charan' && password === 'daymark') {
      try {
        setStatusText('Restoring Moments...');
        await performCloudRestore(username);
        
        setIsUnlocked(true);
        setStatusText('Workspace Ready');
        localStorage.setItem('daymark_auth', 'true');
        
        // Wait for animation to finish before calling onLogin
        setTimeout(onLogin, 1200);
      } catch (err) {
        console.error('Login Restore failed', err);
        setError('Network interruption. Try again.');
        setIsLoggingIn(false);
        setStatusText('Access Vault');
      }
    } else {
      setTimeout(() => {
        setError('The mark is incorrect.');
        setIsLoggingIn(false);
        setStatusText('Access Vault');
      }, 1200);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-6 selection:bg-[#a31621]/20 relative overflow-hidden transition-colors duration-1000">
      
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className={`absolute top-[-10%] right-[-10%] w-[60rem] h-[60rem] rounded-full bg-[#a31621]/[0.03] blur-[120px] transition-all duration-[3000ms] ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'}`} />
        <div className={`absolute bottom-[-10%] left-[-10%] w-[50rem] h-[50rem] rounded-full bg-[#a31621]/[0.02] blur-[100px] transition-all duration-[3000ms] delay-500 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-20 opacity-0'}`} />
        
        {/* Subtle "Flow" lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03] dark:opacity-[0.05]" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0 50 Q 25 40 50 50 T 100 50" fill="none" stroke="currentColor" strokeWidth="0.1" />
          <path d="M0 60 Q 30 70 60 60 T 100 60" fill="none" stroke="currentColor" strokeWidth="0.05" />
        </svg>
      </div>

      <div className={`w-full max-w-sm transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        
        {/* Aesthetic Branding Block */}
        <div className="text-center mb-16 relative">
          <div className={`inline-flex items-center justify-center p-6 bg-white dark:bg-stone-900 rounded-3xl mb-10 shadow-2xl border border-stone-100 dark:border-stone-800 transition-all duration-1000 
            ${isUnlocked ? 'scale-110 border-[#a31621]/40' : (isLoggingIn ? 'scale-105 border-[#a31621]/20' : 'hover:scale-105')}
            ${isUnlocked ? 'lock-open' : (isLoggingIn ? 'lock-shake' : '')}`}>
            
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#a31621]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                {/* Shackle */}
                <path className="lock-shackle" d="M7 11V7a5 5 0 0 1 10 0v4" />
                {/* Body */}
                <rect className="lock-body" x="3" y="11" width="18" height="11" rx="2" ry="2" />
                {/* Keyhole */}
                <path d="M12 16v2" />
                <circle cx="12" cy="16" r="1" />
            </svg>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-stone-800 dark:text-stone-100 tracking-[0.3em] uppercase mb-4 transition-all duration-700">
            DayMark
          </h1>
          <div className="h-0.5 w-12 bg-[#a31621]/20 mx-auto mb-6"></div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-stone-400 dark:text-stone-600 font-bold">
            {isUnlocked ? 'Access Granted' : 'Enter to Mark...'}
          </p>
        </div>

        {/* Floating Form */}
        <form 
          onSubmit={handleSubmit} 
          className={`bg-white/40 dark:bg-stone-900/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-stone-100 dark:border-stone-800/50 shadow-2xl space-y-8 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        >
          <div className="space-y-6">
            <div className="group">
              <label className="block text-[9px] uppercase tracking-[0.3em] text-stone-400 group-focus-within:text-[#a31621] mb-3 font-bold pl-1 transition-colors">Identifier</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  className="w-full bg-white dark:bg-stone-900/60 border border-stone-50 dark:border-stone-800 rounded-2xl px-6 py-4 focus:ring-1 focus:ring-[#a31621]/10 focus:border-[#a31621]/20 transition-all outline-none text-stone-700 dark:text-stone-200 text-sm placeholder:text-stone-200 dark:placeholder:text-stone-800"
                  placeholder="username"
                  disabled={isLoggingIn || isUnlocked}
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-[9px] uppercase tracking-[0.3em] text-stone-400 group-focus-within:text-[#a31621] mb-3 font-bold pl-1 transition-colors">Secret Mark</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="w-full bg-white dark:bg-stone-900/60 border border-stone-50 dark:border-stone-800 rounded-2xl px-6 py-4 focus:ring-1 focus:ring-[#a31621]/10 focus:border-[#a31621]/20 transition-all outline-none text-stone-700 dark:text-stone-200 text-sm placeholder:text-stone-200 dark:placeholder:text-stone-800"
                  placeholder="••••••••"
                  disabled={isLoggingIn || isUnlocked}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-[9px] text-center uppercase tracking-widest font-bold animate-bounce">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button 
              type="submit"
              disabled={isLoggingIn || isUnlocked}
              className={`w-full py-5 rounded-2xl text-[10px] uppercase tracking-[0.4em] font-bold transition-all duration-700 relative overflow-hidden group/btn
                ${isLoggingIn || isUnlocked
                  ? 'bg-stone-100 dark:bg-stone-800 text-stone-400 cursor-not-allowed' 
                  : 'bg-stone-800 dark:bg-[#a31621] text-white dark:text-stone-900 hover:shadow-[0_20px_40px_-10px_rgba(163,22,33,0.3)] hover:-translate-y-1 active:translate-y-0 active:scale-95'
                }`}
            >
              <span className="relative z-10">{statusText}</span>
              <div className={`absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500 ${isUnlocked ? 'hidden' : ''}`} />
            </button>
          </div>
        </form>
        
        {/* Subtle Footer */}
        <div className={`mt-16 text-center transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
           <div className="flex items-center justify-center gap-4 mb-8">
             <div className="h-px flex-1 bg-stone-100 dark:bg-stone-900"></div>
             <div className="w-1 h-1 rounded-full bg-[#a31621]/30"></div>
             <div className="h-px flex-1 bg-stone-100 dark:bg-stone-900"></div>
           </div>
           <p className="text-[9px] uppercase tracking-[0.5em] text-stone-400 dark:text-stone-700 font-bold mb-2">
             Hari Charan Katta &bull; {new Date().getFullYear()}
           </p>
           <p className="text-[8px] uppercase tracking-[0.2em] text-stone-200 dark:text-stone-800 italic">
             Encrypted & Persistent
           </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
