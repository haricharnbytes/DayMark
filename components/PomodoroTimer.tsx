
import React, { useState, useEffect, useRef, useCallback } from 'react';

type TimerMode = 'Focus' | 'Flow' | 'Rest' | 'Deep Rest' | 'Custom';

interface TimerConfig {
  label: TimerMode;
  minutes: number;
  color: string;
}

const CONFIGS: TimerConfig[] = [
  { label: 'Focus', minutes: 25, color: '#a31621' },
  { label: 'Flow', minutes: 50, color: '#d9a58e' },
  { label: 'Rest', minutes: 5, color: '#b9c9b7' },
  { label: 'Deep Rest', minutes: 15, color: '#6594B1' },
];

const PomodoroTimer: React.FC = () => {
  const [mode, setMode] = useState<TimerMode>('Focus');
  const [customMinutes, setCustomMinutes] = useState<number>(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isEditingCustom, setIsEditingCustom] = useState(false);

  const timerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getCurrentConfig = useCallback((): TimerConfig => {
    const found = CONFIGS.find(c => c.label === mode);
    if (found) return found;
    return { label: 'Custom', minutes: customMinutes, color: '#A8A29E' };
  }, [mode, customMinutes]);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  const sendNotification = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('DayMark Timer', {
        body: 'Time is up buddy get back to work!',
        icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23a31621" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Ccircle cx="12" cy="12" r="10"%3E%3C/circle%3E%3Cpolyline points="12 6 12 12 16 14"%3E%3C/polyline%3E%3C/svg%3E',
      });
    }
  }, []);

  const playAlarm = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      
      const playBeep = (time: number, frequency: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Use a triangle wave for a softer but still piercing sound
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(frequency, time);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.3, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.4);
      };

      // Create an alertive triple-beep sequence
      const now = ctx.currentTime;
      playBeep(now, 880); // A5
      playBeep(now + 0.5, 880);
      playBeep(now + 1.0, 1109); // C#6 (Major third higher, more urgent)
      
    } catch (e) {
      console.warn('Audio feedback failed', e);
    }
  }, []);

  const switchMode = (newMode: TimerMode) => {
    setIsActive(false);
    setMode(newMode);
    if (newMode === 'Custom') {
      setTimeLeft(customMinutes * 60);
      setIsEditingCustom(true);
    } else {
      const cfg = CONFIGS.find(c => c.label === newMode)!;
      setTimeLeft(cfg.minutes * 60);
      setIsEditingCustom(false);
    }
    setProgress(0);
  };

  const handleCustomMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val > 0 && val <= 999) {
      setCustomMinutes(val);
      if (mode === 'Custom' && !isActive) {
        setTimeLeft(val * 60);
        setProgress(0);
      }
    }
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      playAlarm();
      sendNotification();
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, playAlarm, sendNotification]);

  useEffect(() => {
    const currentConfig = getCurrentConfig();
    const totalSeconds = currentConfig.minutes * 60;
    setProgress(((totalSeconds - timeLeft) / totalSeconds) * 100);
  }, [timeLeft, getCurrentConfig]);

  const toggleTimer = () => {
    if (!isActive) {
      requestNotificationPermission();
    }
    setIsActive(!isActive);
    setIsEditingCustom(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentConfig = getCurrentConfig();

  return (
    <div className="w-full max-w-sm h-full fade-in flex flex-col">
      <div className="bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-200 dark:border-stone-800 shadow-xl overflow-hidden relative flex flex-col flex-1 transition-all duration-500">
        
        {/* Header - Matching DailyMarkNote but smaller */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-50 dark:border-stone-800 bg-stone-50/30 dark:bg-stone-900/50">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-serif text-stone-800 dark:text-stone-200 italic">
              Mindful Interval
            </h2>
            <div className={`w-1 h-1 rounded-full ${isActive ? 'bg-[#a31621] animate-pulse' : 'bg-stone-300 dark:bg-stone-700'}`} />
          </div>
          
          <span className="text-[7px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-600 font-bold whitespace-nowrap">
            {isActive ? 'Active' : 'Standby'}
          </span>
        </div>

        <div className="p-6 flex flex-col items-center justify-center flex-1">
          <div className="flex justify-center gap-1.5 mb-6 flex-wrap">
            {CONFIGS.map(cfg => (
              <button
                key={cfg.label}
                onClick={() => switchMode(cfg.label)}
                className={`px-3 py-1 rounded-full text-[8px] uppercase tracking-[0.1em] font-bold transition-all
                  ${mode === cfg.label 
                    ? 'bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 shadow-md' 
                    : 'text-stone-400 dark:text-stone-600 hover:text-stone-600'
                  }`}
              >
                {cfg.label}
              </button>
            ))}
            <button
              onClick={() => switchMode('Custom')}
              className={`px-3 py-1 rounded-full text-[8px] uppercase tracking-[0.1em] font-bold transition-all
                ${mode === 'Custom' 
                  ? 'bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 shadow-md' 
                  : 'text-stone-400 dark:text-stone-600 hover:text-stone-600'
                }`}
            >
              Custom
            </button>
          </div>

          <div className="relative mb-6 flex flex-col items-center">
             {/* Smaller Main Display Area */}
             <div className="relative w-36 h-36 flex flex-col items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="66"
                    stroke="currentColor"
                    strokeWidth="1"
                    fill="transparent"
                    className="text-stone-50 dark:text-stone-800"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="66"
                    stroke={currentConfig.color}
                    strokeWidth="2.5"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 66}
                    strokeDashoffset={2 * Math.PI * 66 * (1 - progress / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>

                {mode === 'Custom' && isEditingCustom && !isActive ? (
                  <div className="relative z-10 flex flex-col items-center">
                    <input 
                      autoFocus
                      type="number"
                      value={customMinutes}
                      onChange={handleCustomMinutesChange}
                      onBlur={() => setIsEditingCustom(false)}
                      className="w-16 text-center bg-transparent border-none outline-none font-bold text-3xl text-stone-800 dark:text-stone-100 tabular-nums"
                      min="1"
                      max="999"
                    />
                    <span className="text-[7px] uppercase tracking-[0.2em] text-stone-400 font-bold mt-1">Mins</span>
                  </div>
                ) : (
                  <div className="relative z-10 flex flex-col items-center">
                    <span className="text-4xl font-bold text-stone-800 dark:text-stone-100 tabular-nums tracking-tighter">
                      {formatTime(timeLeft)}
                    </span>
                    <span className="text-[7px] uppercase tracking-[0.2em] text-stone-400 font-bold mt-1">
                      {mode}
                    </span>
                  </div>
                )}
             </div>
          </div>

          <div className="flex gap-4 items-center">
            <button
              onClick={toggleTimer}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 shadow-lg
                ${isActive 
                  ? 'bg-stone-100 dark:bg-stone-800 text-stone-400' 
                  : 'bg-stone-800 dark:bg-[#a31621] text-white dark:text-stone-900 scale-105 shadow-[#a31621]/10'
                }`}
            >
              {isActive ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 9v6m4-6v6" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
              )}
            </button>
            
            <button
              onClick={() => switchMode(mode)}
              className="p-2.5 rounded-full text-stone-300 dark:text-stone-700 hover:text-stone-500 transition-colors"
              aria-label="Reset"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {mode === 'Custom' && !isActive && (
               <button
               onClick={() => setIsEditingCustom(!isEditingCustom)}
               className={`p-2.5 rounded-full transition-colors ${isEditingCustom ? 'text-[#a31621]' : 'text-stone-300 dark:text-stone-700 hover:text-stone-500'}`}
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
               </svg>
             </button>
            )}
          </div>
        </div>

        {/* Bottom Progress Accent */}
        <div 
          className="absolute bottom-0 left-0 h-1 transition-all duration-1000 opacity-30" 
          style={{ width: `${progress}%`, backgroundColor: currentConfig.color }}
        />
      </div>
    </div>
  );
};

export default PomodoroTimer;
