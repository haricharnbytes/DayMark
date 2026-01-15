
import React, { useState, useEffect, useMemo } from 'react';
import { CalendarEvent } from './types';
import { 
  getDaysInMonth, 
  getFirstDayOfMonth, 
  formatMonthName, 
  isToday, 
  getNextEvent 
} from './utils/dateUtils';
import EventModal from './components/EventModal';
import Countdown from './components/Countdown';

const MonthIcon: React.FC<{ month: number }> = ({ month }) => {
  const icons = [
    // Jan: Snowflake
    <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />,
    // Feb: Heart
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />,
    // Mar: Sprout
    <path d="M7 20h10M12 20V8M12 8c0-3.314-2.686-6-6-6M12 8c0-3.314 2.686-6 6-6" />,
    // Apr: Cloud Rain
    <path d="M16 13a4 4 0 00-8 0 4 4 0 000 8h8a4 4 0 000-8zM8 22l-1 1M12 22l-1 1M16 22l-1 1" />,
    // May: Flower
    <path d="M12 7.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9zM12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4" />,
    // Jun: Sun
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 17a5 5 0 100-10 5 5 0 000 10z" />,
    // Jul: Waves / Beach
    <path d="M2 6c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />,
    // Aug: Star / Compass
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
    // Sep: Leaf
    <path d="M11 20a7 7 0 01-7-7c0-2.3 1.3-4.3 3.3-5.3L11 3l3.7 4.7c2 1 3.3 3 3.3 5.3a7 7 0 01-7 7zM11 3v17" />,
    // Oct: Moon
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />,
    // Nov: Coffee / Cozy
    <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" />,
    // Dec: Sparkles
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
  ];

  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      className="h-3 w-3 text-stone-300" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor" 
      strokeWidth={2}
    >
      {icons[month]}
    </svg>
  );
};

interface MonthProps {
  year: number;
  month: number;
  events: CalendarEvent[];
  onDateClick: (day: number, month: number) => void;
  clickedDateId: string | null;
}

const MonthView: React.FC<MonthProps> = ({ year, month, events, onDateClick, clickedDateId }) => {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] p-7 border border-stone-100 flex flex-col h-full shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ease-out group/month">
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-2.5">
          <MonthIcon month={month} />
          <h3 className="text-[10px] font-semibold text-stone-500 tracking-[0.2em] uppercase">
            {formatMonthName(month)}
          </h3>
        </div>
        <div className="opacity-0 group-hover/month:opacity-100 transition-opacity duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-stone-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-y-1.5 gap-x-1 flex-1 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
          <div key={`${month}-${d}-${idx}`} className="text-[7px] uppercase tracking-widest text-stone-300 font-bold mb-3">
            {d}
          </div>
        ))}
        
        {blanks.map(b => (
          <div key={`blank-${month}-${b}`} className="aspect-square"></div>
        ))}

        {days.map(d => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const dayEvents = events.filter(e => e.date === dateStr);
          const today = isToday(year, month, d);
          const isClicked = clickedDateId === `${month}-${d}`;

          return (
            <button
              key={`${month}-${d}`}
              onClick={() => onDateClick(d, month)}
              className={`group relative aspect-square flex flex-col items-center justify-center rounded-xl transition-all duration-300
                ${isClicked ? 'date-pulse scale-110' : ''}
                ${today ? 'bg-stone-800 text-white shadow-lg scale-110 z-10' : 'hover:bg-stone-100 text-stone-500 hover:text-stone-800'}`}
            >
              <span className={`text-[11px] font-medium transition-colors`}>
                {d}
              </span>
              
              <div className="absolute bottom-1.5 flex gap-0.5 h-1 items-center justify-center w-full">
                {dayEvents.map((e) => (
                  <div 
                    key={e.id} 
                    className={`rounded-full transition-all
                      ${e.isImportant ? 'w-1 h-1' : 'w-0.5 h-0.5 opacity-60'}`}
                    style={{ backgroundColor: today ? '#ffffff' : (e.color || '#d6d3d1') }}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('ethereal_events');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [clickedDateId, setClickedDateId] = useState<string|null>(null);

  useEffect(() => {
    localStorage.setItem('ethereal_events', JSON.stringify(events));
  }, [events]);

  const nextEvent = useMemo(() => getNextEvent(events), [events]);

  const handleDateClick = (day: number, month: number) => {
    const dateId = `${month}-${day}`;
    setClickedDateId(dateId);
    
    setTimeout(() => {
      const dateStr = `${viewYear}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const existing = events.find(e => e.date === dateStr);
      
      setSelectedDate(dateStr);
      setEditingEvent(existing || null);
      setIsModalOpen(true);
      setClickedDateId(null);
    }, 250);
  };

  const handleSaveEvent = (event: CalendarEvent) => {
    setEvents(prev => {
      const idx = prev.findIndex(e => e.id === event.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = event;
        return updated;
      }
      return [...prev, event];
    });
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const changeYear = (offset: number) => {
    setViewYear(prev => prev + offset);
  };

  const months = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="min-h-screen bg-[#fcfbf8] px-4 py-12 md:py-20 max-w-7xl mx-auto selection:bg-stone-200 overflow-x-hidden">
      
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-[0.03] overflow-hidden -z-10">
        <svg className="absolute -top-24 -right-24 w-96 h-96 text-stone-900" fill="currentColor" viewBox="0 0 100 100">
           <circle cx="50" cy="50" r="40" />
        </svg>
      </div>

      {/* Header & Hero Section */}
      <header className="mb-24 text-center fade-in">
        <div className="inline-flex items-center justify-center p-3 bg-stone-100/50 rounded-2xl mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
          </svg>
        </div>
        <h1 className="text-4xl font-extralight text-stone-800 tracking-[0.4em] uppercase mb-4 pl-4">
          DayMark
        </h1>
        <div className="h-px w-16 bg-stone-200 mx-auto mb-16"></div>
        
        <Countdown targetEvent={nextEvent} />
      </header>

      {/* Year Navigation */}
      <div className="flex items-center justify-between mb-16 fade-in max-w-4xl mx-auto px-4" style={{animationDelay: '0.1s'}}>
        <button 
          onClick={() => changeYear(-1)}
          className="group flex items-center gap-3 text-stone-300 hover:text-stone-800 transition-all"
        >
          <div className="p-2 rounded-full group-hover:bg-stone-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-medium hidden sm:inline">{viewYear - 1}</span>
        </button>

        <div className="flex flex-col items-center">
          <h2 className="text-5xl font-extralight text-stone-800 tracking-[0.25em] relative">
            {viewYear}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              <div className="w-1 h-1 rounded-full bg-stone-200"></div>
              <div className="w-1 h-1 rounded-full bg-stone-300"></div>
              <div className="w-1 h-1 rounded-full bg-stone-200"></div>
            </div>
          </h2>
        </div>

        <button 
          onClick={() => changeYear(1)}
          className="group flex items-center gap-3 text-stone-300 hover:text-stone-800 transition-all text-right"
        >
          <span className="text-[10px] uppercase tracking-[0.2em] font-medium hidden sm:inline">{viewYear + 1}</span>
          <div className="p-2 rounded-full group-hover:bg-stone-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>

      {/* 12 Months Grid */}
      <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10 fade-in" style={{animationDelay: '0.2s'}}>
        {months.map(m => (
          <MonthView 
            key={m}
            year={viewYear}
            month={m}
            events={events}
            onDateClick={handleDateClick}
            clickedDateId={clickedDateId}
          />
        ))}
      </main>

      {/* Bottom Action Icon */}
      <div className="flex justify-center mt-24 fade-in" style={{animationDelay: '0.4s'}}>
        <div className="p-4 bg-white rounded-full shadow-sm border border-stone-100 animate-bounce cursor-default">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-stone-300 text-[9px] uppercase tracking-[0.4em] pb-16 flex flex-col items-center gap-4">
        <div className="h-px w-8 bg-stone-200"></div>
        <span>The art of intentional living &bull; {new Date().getFullYear()}</span>
      </footer>

      {/* Event Modal */}
      <EventModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        selectedDate={selectedDate}
        initialEvent={editingEvent}
      />
    </div>
  );
};

export default App;
