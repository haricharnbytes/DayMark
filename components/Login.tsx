
import React, { useState } from 'react';
import { performCloudRestore } from '../utils/db';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [statusText, setStatusText] = useState('Enter Workspace');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setStatusText('Unlocking...');
    
    // Simulate auth check
    if (username === 'charan' && password === 'daymark') {
      try {
        setStatusText('Pulling Cloud Data...');
        await performCloudRestore(username);
        
        localStorage.setItem('daymark_auth', 'true');
        setStatusText('Welcome Back');
        setTimeout(onLogin, 500);
      } catch (err) {
        console.error('Login Restore failed', err);
        setError('Connection failed. Try again.');
        setIsLoggingIn(false);
        setStatusText('Enter Workspace');
      }
    } else {
      setTimeout(() => {
        setError('Invalid credentials');
        setIsLoggingIn(false);
        setStatusText('Enter Workspace');
      }, 800);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-black flex items-center justify-center p-6 selection:bg-[#F5AFAF]/20">
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-[0.05] overflow-hidden -z-10">
        <svg className="absolute -top-32 -right-32 w-[40rem] h-[40rem] text-[#F5AFAF]" fill="currentColor" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" /></svg>
        <svg className="absolute -bottom-32 -left-32 w-[40rem] h-[40rem] text-[#F5AFAF]" fill="currentColor" viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" /></svg>
      </div>

      <div className="w-full max-w-md fade-in">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-5 bg-[#F5AFAF]/10 rounded-full mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#F5AFAF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-stone-800 dark:text-stone-100 tracking-[0.4em] uppercase mb-4">
            DayMark
          </h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400 dark:text-stone-600 font-bold">Cloud-Enabled Workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-stone-900/40 backdrop-blur-xl p-10 rounded-[3rem] border border-stone-200 dark:border-stone-800 shadow-2xl space-y-8">
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 mb-2 font-bold pl-2">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                className="w-full bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 rounded-2xl px-6 py-4 focus:ring-1 focus:ring-[#F5AFAF]/30 transition-all outline-none text-stone-700 dark:text-stone-200 text-sm"
                placeholder=""
                disabled={isLoggingIn}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 mb-2 font-bold pl-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="w-full bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 rounded-2xl px-6 py-4 focus:ring-1 focus:ring-[#F5AFAF]/30 transition-all outline-none text-stone-700 dark:text-stone-200 text-sm"
                placeholder=""
                disabled={isLoggingIn}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-[10px] text-center uppercase tracking-widest font-bold animate-pulse">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoggingIn}
            className={`w-full py-5 rounded-2xl text-[11px] uppercase tracking-[0.3em] font-bold transition-all duration-500 shadow-xl
              ${isLoggingIn 
                ? 'bg-[#F5AFAF]/20 text-[#F5AFAF] cursor-not-allowed' 
                : 'bg-stone-800 dark:bg-[#F5AFAF] text-white dark:text-stone-900 hover:scale-[1.02] active:scale-[0.98] shadow-[#F5AFAF]/10'
              }`}
          >
            {statusText}
          </button>
        </form>
        
        <div className="mt-12 text-center">
           <div className="h-px w-12 bg-stone-200 dark:bg-stone-800 mx-auto mb-6"></div>
           <p className="text-[10px] uppercase tracking-[0.5em] text-stone-400 dark:text-stone-700">Universal Access Enabled &bull; {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
