
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
    <span className="text-[10px] uppercase tracking-widest text-stone-300 dark:text-stone-700 font-bold">Recently Passed</span>
  );

  if (status === 'active') return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F5AFAF] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F5AFAF]"></span>
      </span>
      <span className="text-[10px] uppercase tracking-widest text-[#F5AFAF] font-bold animate-pulse">Moment In Progress</span>
    </div>
  );

  if (!timeLeft) return null;

  const format = (val: number) => val.toString().padStart(2, '0');

  return (
    <div className="flex gap-4 items-baseline">
      <div className="flex flex-col items-center">
        <span className="text-xl font-bold text-stone-700 dark:text-stone-200 tabular-nums">{format(timeLeft.days)}</span>
        <span className="text-[7px] uppercase tracking-widest text-stone-400 font-bold">D</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-xl font-bold text-stone-700 dark:text-stone-200 tabular-nums">{format(timeLeft.hours)}</span>
        <span className="text-[7px] uppercase tracking-widest text-stone-400 font-bold">H</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-xl font-bold text-stone-700 dark:text-stone-200 tabular-nums">{format(timeLeft.minutes)}</span>
        <span className="text-[7px] uppercase tracking-widest text-stone-400 font-bold">M</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-xl font-bold text-[#F5AFAF] tabular-nums">{format(timeLeft.seconds)}</span>
        <span className="text-[7px] uppercase tracking-widest text-stone-400 font-bold">S</span>
      </div>
    </div>
  );
};

interface UpcomingEventsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  upcomingEvents: CalendarEvent[];
}

const UpcomingEventsOverlay: React.FC<UpcomingEventsOverlayProps> = ({ isOpen, onClose, upcomingEvents }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5 dark:bg-black/80 backdrop-blur-xl transition-all p-4 md:p-8">
      <div className="bg-white dark:bg-stone-900 rounded-[3rem] p-10 w-full max-w-2xl shadow-2xl border border-stone-100 dark:border-stone-800 fade-in flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center mb-10">
          <div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#F5AFAF] font-bold block mb-1">Queue</span>
            <h2 className="text-3xl font-bold text-stone-800 dark:text-stone-100 uppercase tracking-[0.1em]">Upcoming Moments</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-stone-300 dark:text-stone-600 hover:text-[#F5AFAF] transition-all p-3 bg-stone-50 dark:bg-stone-800 rounded-2xl"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-4 space-y-6 custom-scrollbar">
          {upcomingEvents.length === 0 ? (
            <div className="py-20 text-center text-stone-300 dark:text-stone-700">
              <p className="italic text-2xl mb-2">A quiet horizon...</p>
              <p className="text-[10px] uppercase tracking-[0.3em] font-bold">No upcoming events recorded</p>
            </div>
          ) : (
            upcomingEvents.map((event, idx) => (
              <div 
                key={event.id} 
                className="group bg-stone-50 dark:bg-stone-800/50 p-6 rounded-3xl border border-stone-100 dark:border-stone-800 transition-all hover:bg-white dark:hover:bg-stone-800 hover:shadow-xl hover:shadow-[#F5AFAF]/5 flex flex-col md:flex-row md:items-center justify-between gap-6"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: event.color || '#F5AFAF' }} />
                    <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">
                      {new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-1">{event.title}</h3>
                  <p className="text-[11px] text-stone-400 dark:text-stone-500 font-medium tracking-wide">
                    {event.startTime || 'All Day'} — {event.endTime || 'End'}
                  </p>
                </div>
                
                <div className="pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-stone-100 dark:border-stone-700 md:pl-8 min-w-[140px] flex justify-end">
                  <IndividualCountdown targetEvent={event} />
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="mt-10 pt-8 border-t border-stone-100 dark:border-stone-800 text-center">
          <p className="text-[9px] uppercase tracking-[0.4em] text-stone-400 font-bold">
            Stay mindful of the time remaining
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpcomingEventsOverlay;
