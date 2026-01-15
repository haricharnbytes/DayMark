
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
      <div className="flex flex-col items-center justify-center p-12 text-stone-300">
        <p className="text-sm tracking-widest uppercase italic">No upcoming events scheduled</p>
      </div>
    );
  }

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <span className="text-4xl md:text-5xl font-light text-stone-700 tabular-nums">
        {value.toString().padStart(2, '0')}
      </span>
      <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mt-1">{label}</span>
    </div>
  );

  return (
    <div className="flex flex-col items-center fade-in">
      <div className="mb-2 text-stone-400 text-xs tracking-[0.3em] uppercase">Coming up</div>
      <h3 className="text-lg font-medium text-stone-600 mb-8">{targetEvent.title}</h3>
      <div className="flex items-center gap-6 md:gap-12">
        <TimeBlock value={timeLeft.days} label="Days" />
        <div className="text-stone-200 text-4xl mb-4 font-thin">:</div>
        <TimeBlock value={timeLeft.hours} label="Hours" />
        <div className="text-stone-200 text-4xl mb-4 font-thin">:</div>
        <TimeBlock value={timeLeft.minutes} label="Minutes" />
        <div className="text-stone-200 text-4xl mb-4 font-thin">:</div>
        <TimeBlock value={timeLeft.seconds} label="Seconds" />
      </div>
    </div>
  );
};

export default Countdown;
