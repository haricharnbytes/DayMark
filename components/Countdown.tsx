
import React, { useState, useEffect } from 'react';
import { CalendarEvent, CountdownState } from '../types';

interface CountdownProps {
  targetEvent: CalendarEvent | null;
}

const Countdown: React.FC<CountdownProps> = ({ targetEvent }) => {
  const [timeLeft, setTimeLeft] = useState<CountdownState | null>(null);

  useEffect(() => {
    if (!targetEvent) {
      setTimeLeft(null);
      return;
    }

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(`${targetEvent.date}T${targetEvent.time || '00:00'}`).getTime();
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

  if (!targetEvent || !timeLeft) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-stone-300 border border-dashed border-stone-200 rounded-[2rem] max-w-sm mx-auto bg-stone-50/30">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-[10px] tracking-[0.25em] uppercase italic">No moments pending</p>
      </div>
    );
  }

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <span className="text-5xl md:text-6xl font-extralight text-stone-800 tabular-nums tracking-tighter">
        {value.toString().padStart(2, '0')}
      </span>
      <span className="text-[9px] uppercase tracking-[0.3em] text-stone-400 mt-2 font-medium">{label}</span>
    </div>
  );

  return (
    <div className="flex flex-col items-center fade-in px-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-px w-4 bg-stone-200"></div>
        <div className="flex items-center gap-2 text-stone-400 text-[10px] tracking-[0.35em] uppercase font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Upcoming
        </div>
        <div className="h-px w-4 bg-stone-200"></div>
      </div>
      
      <h3 className="text-xl font-light text-stone-600 mb-10 tracking-wide text-center max-w-md italic">
        "{targetEvent.title}"
      </h3>
      
      <div className="flex items-center gap-5 md:gap-12 bg-white/50 py-10 px-8 md:px-14 rounded-[3rem] shadow-sm border border-stone-100/50 backdrop-blur-sm">
        <TimeBlock value={timeLeft.days} label="Days" />
        <div className="text-stone-200 text-3xl font-thin pb-4">:</div>
        <TimeBlock value={timeLeft.hours} label="Hours" />
        <div className="text-stone-200 text-3xl font-thin pb-4">:</div>
        <TimeBlock value={timeLeft.minutes} label="Min" />
        <div className="text-stone-200 text-3xl font-thin pb-4">:</div>
        <TimeBlock value={timeLeft.seconds} label="Sec" />
      </div>
    </div>
  );
};

export default Countdown;
