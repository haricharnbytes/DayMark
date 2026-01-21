
import React, { useState, useEffect } from 'react';
import { CalendarEvent, CountdownState } from '../types';

interface CountdownProps {
  upcomingEvents: CalendarEvent[];
}

const CountdownItem: React.FC<{ targetEvent: CalendarEvent }> = ({ targetEvent }) => {
  const [timeLeft, setTimeLeft] = useState<CountdownState | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(`${targetEvent.date}T${targetEvent.startTime || '00:00'}`).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft(null);
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetEvent]);

  if (!timeLeft) return null;

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex items-baseline gap-1">
      <span className="text-xl font-medium text-stone-700 dark:text-stone-200 tabular-nums">
        {value.toString().padStart(2, '0')}
      </span>
      <span className="text-[7px] uppercase tracking-[0.1em] text-stone-400 dark:text-stone-500 font-bold">{label[0]}</span>
    </div>
  );

  return (
    <div className="flex items-center gap-3">
      <TimeBlock value={timeLeft.days} label="Days" />
      <span className="text-stone-200 dark:text-stone-700 text-xs font-light">:</span>
      <TimeBlock value={timeLeft.hours} label="Hours" />
      <span className="text-stone-200 dark:text-stone-700 text-xs font-light">:</span>
      <TimeBlock value={timeLeft.minutes} label="Min" />
      <span className="text-stone-200 dark:text-stone-700 text-xs font-light">:</span>
      <TimeBlock value={timeLeft.seconds} label="Sec" />
    </div>
  );
};

const Countdown: React.FC<CountdownProps> = ({ upcomingEvents }) => {
  if (upcomingEvents.length === 0) {
    return (
      <div className="flex items-center justify-center gap-3 py-4 text-stone-300 dark:text-stone-700 max-w-xs mx-auto">
        <div className="w-1 h-1 rounded-full bg-stone-200 dark:bg-stone-800"></div>
        <p className="text-[9px] tracking-[0.3em] uppercase italic font-medium">Awaiting the next moment</p>
        <div className="w-1 h-1 rounded-full bg-stone-200 dark:bg-stone-800"></div>
      </div>
    );
  }

  const mainEvent = upcomingEvents[0];
  const otherEvents = upcomingEvents.slice(1);

  return (
    <div className="flex flex-col items-center fade-in">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-px w-3 bg-[#a31621]/20"></div>
        <div className="flex items-center gap-1.5 text-[#a31621] text-[8px] tracking-[0.3em] uppercase font-bold">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#a31621] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#a31621]"></span>
          </span>
          Up Next
        </div>
        <div className="h-px w-3 bg-[#a31621]/20"></div>
      </div>
      
      <div className="flex flex-col gap-4 w-full max-w-xl">
        {/* Main Countdown */}
        <div className="inline-flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6 bg-white/60 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-700 py-4 px-8 rounded-3xl backdrop-blur-md shadow-sm">
          <h3 className="text-sm font-serif font-medium text-stone-700 dark:text-stone-200 italic tracking-wide">
            "{mainEvent.title}"
          </h3>
          <div className="h-px w-4 md:w-px md:h-4 bg-stone-200 dark:bg-stone-700"></div>
          <CountdownItem targetEvent={mainEvent} />
        </div>

        {/* Subsequent Events List */}
        {otherEvents.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 px-2">
            {otherEvents.map((event) => (
              <div key={event.id} className="bg-white/30 dark:bg-stone-800/20 backdrop-blur-sm border border-stone-100/50 dark:border-stone-700/50 rounded-2xl p-2.5 flex flex-col items-center text-center transition-all hover:bg-white/50 dark:hover:bg-stone-700/30">
                <span className="text-[7px] uppercase tracking-widest text-stone-400 dark:text-stone-600 font-bold mb-1">
                  {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-[10px] text-stone-600 dark:text-stone-400 font-medium truncate w-full px-2">
                  {event.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Countdown;
