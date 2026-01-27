
import React, { useState, useEffect } from 'react';
import { CalendarEvent, CountdownState } from '../types';

interface IndividualCountdownProps {
  targetEvent: CalendarEvent;
}

const IndividualCountdown: React.FC<IndividualCountdownProps> = ({ targetEvent }) => {
  const [timeLeft, setTimeLeft] = useState<CountdownState | null>(null);
  const [status, setStatus] = useState<'upcoming' | 'active' | 'passed'>('upcoming');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const targetStart = new Date(`${targetEvent.date}T${targetEvent.startTime || '00:00'}`).getTime();
      const targetEnd = new Date(`${targetEvent.date}T${targetEvent.endTime || '23:59'}`).getTime();
      
      const difference = targetStart - now;

      if (now > targetEnd) {
        setStatus('passed');
        setTimeLeft(null);
        return;
      }

      if (now >= targetStart && now <= targetEnd) {
        setStatus('active');
        setTimeLeft(null);
        return;
      }

      setStatus('upcoming');
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [targetEvent]);

  if (status === 'passed') return (
    <span className="text-[10px] uppercase tracking-widest text-stone-300 dark:text-stone-700 font-bold">Passed</span>
  );

  if (status === 'active') return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#a31621] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#a31621]"></span>
      </span>
      <span className="text-[10px] uppercase tracking-widest text-[#a31621] font-bold animate-pulse">Now</span>
    </div>
  );

  if (!timeLeft) return null;

  const format = (val: number) => val.toString().padStart(2, '0');

  return (
    <div className="flex gap-3 items-baseline">
      <div className="flex flex-col items-center">
        <span className="text-lg font-bold text-stone-700 dark:text-stone-200 tabular-nums leading-none">{format(timeLeft.days)}</span>
        <span className="text-[6px] uppercase tracking-widest text-stone-400 font-bold mt-1">D</span>
      </div>
      <span className="text-stone-200 dark:text-stone-700 text-[10px]">:</span>
      <div className="flex flex-col items-center">
        <span className="text-lg font-bold text-stone-700 dark:text-stone-200 tabular-nums leading-none">{format(timeLeft.hours)}</span>
        <span className="text-[6px] uppercase tracking-widest text-stone-400 font-bold mt-1">H</span>
      </div>
      <span className="text-stone-200 dark:text-stone-700 text-[10px]">:</span>
      <div className="flex flex-col items-center">
        <span className="text-lg font-bold text-stone-700 dark:text-stone-200 tabular-nums leading-none">{format(timeLeft.minutes)}</span>
        <span className="text-[6px] uppercase tracking-widest text-stone-400 font-bold mt-1">M</span>
      </div>
    </div>
  );
};

interface UpcomingEventsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  upcomingEvents: CalendarEvent[];
  onEditEvent: (event: CalendarEvent) => void;
}

const UpcomingEventsOverlay: React.FC<UpcomingEventsOverlayProps> = ({ isOpen, onClose, upcomingEvents, onEditEvent }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 dark:bg-black/90 backdrop-blur-xl transition-all p-4 md:p-8">
      <div className="bg-white dark:bg-stone-900 rounded-[3rem] p-8 md:p-12 w-full max-w-3xl shadow-2xl border border-stone-100 dark:border-stone-800 fade-in flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-12">
          <div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#a31621] font-bold block mb-1">Queue</span>
            <h2 className="text-4xl font-bold text-stone-800 dark:text-stone-100 tracking-tight">Timeline</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-stone-300 dark:text-stone-600 hover:text-[#a31621] transition-all p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:rotate-90 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
          {upcomingEvents.length === 0 ? (
            <div className="py-24 text-center text-stone-300 dark:text-stone-700">
              <p className="italic text-3xl mb-4 font-serif">Quiet horizons...</p>
              <p className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-60">No pending moments in your timeline</p>
            </div>
          ) : (
            upcomingEvents.map((event, idx) => (
              <div 
                key={event.id} 
                className="group relative bg-stone-50/50 dark:bg-stone-800/20 p-6 md:p-8 rounded-[2rem] border border-stone-100 dark:border-stone-800 transition-all hover:bg-white dark:hover:bg-stone-800 hover:shadow-2xl hover:shadow-[#a31621]/10 flex flex-col md:flex-row md:items-center justify-between gap-6"
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div 
                      className="w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500" 
                      style={{ backgroundColor: `${event.color || '#a31621'}15`, color: event.color || '#a31621' }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-black">
                        {new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                      </span>
                      <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 tracking-tight">{event.title}</h3>
                    </div>
                  </div>
                  {event.description && (
                    <p className="text-xs text-stone-400 dark:text-stone-500 line-clamp-1 mb-2 pl-14">{event.description}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-8 pl-14 md:pl-0">
                  <IndividualCountdown targetEvent={event} />
                  
                  <div className="h-10 w-px bg-stone-100 dark:bg-stone-800 hidden md:block"></div>
                  
                  <button 
                    onClick={() => { onEditEvent(event); onClose(); }}
                    className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 text-stone-400 hover:text-[#a31621] hover:border-[#a31621]/30 transition-all shadow-sm group/edit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover/edit:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>

                {/* Importance Indicator */}
                {event.isImportant && (
                  <div className="absolute top-4 right-4 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#a31621] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#a31621]"></span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        <div className="mt-12 pt-8 border-t border-stone-50 dark:border-stone-800 text-center">
          <p className="text-[9px] uppercase tracking-[0.6em] text-stone-400 dark:text-stone-600 font-black">
            Timeline synchronised with your local vault
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpcomingEventsOverlay;
