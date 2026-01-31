
import React from 'react';
import { CalendarEvent } from '../types';

interface ImportantMomentsProps {
  events: CalendarEvent[];
  onEditEvent: (event: CalendarEvent) => void;
}

const ImportantMoments: React.FC<ImportantMomentsProps> = ({ events, onEditEvent }) => {
  const importantEvents = events
    .filter(e => e.isImportant)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5); // Keep it minimal

  if (importantEvents.length === 0) return null;

  return (
    <div className="mt-8 flex flex-col gap-4 fade-in max-w-[200px] w-full">
      <div className="flex items-center gap-2 px-2">
        <span className="text-[9px] uppercase tracking-[0.4em] text-[#a31621] font-black">Priority</span>
        <div className="h-px flex-1 bg-stone-100 dark:bg-stone-800"></div>
      </div>
      
      <div className="space-y-2">
        {importantEvents.map((event) => (
          <button
            key={event.id}
            onClick={() => onEditEvent(event)}
            className="w-full text-left group bg-white/40 dark:bg-stone-900/40 hover:bg-white dark:hover:bg-stone-800 p-4 rounded-2xl border border-stone-100 dark:border-stone-800 transition-all duration-300 hover:shadow-lg hover:shadow-[#a31621]/5 hover:-translate-y-0.5"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#a31621] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#a31621]"></span>
              </div>
              <div className="flex flex-col gap-1 overflow-hidden">
                <span className="text-[10px] font-bold text-stone-800 dark:text-stone-200 truncate group-hover:text-[#a31621] transition-colors">
                  {event.title}
                </span>
                <span className="text-[7px] uppercase tracking-widest text-stone-400 font-black">
                  {new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ImportantMoments;
