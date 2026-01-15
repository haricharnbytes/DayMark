
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

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('ethereal_events');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    localStorage.setItem('ethereal_events', JSON.stringify(events));
  }, [events]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const nextEvent = useMemo(() => getNextEvent(events), [events]);

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const existing = events.find(e => e.date === dateStr);
    
    setSelectedDate(dateStr);
    setEditingEvent(existing || null);
    setIsModalOpen(true);
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

  const changeMonth = (offset: number) => {
    const next = new Date(year, month + offset, 1);
    setCurrentDate(next);
  };

  return (
    <div className="min-h-screen bg-[#fcfbf8] px-6 py-12 md:py-20 max-w-5xl mx-auto selection:bg-stone-200">
      
      {/* Header & Hero Section */}
      <header className="mb-20 text-center fade-in">
        <h1 className="text-3xl font-light text-stone-800 tracking-widest uppercase mb-4">
          Daymark
        </h1>
        <div className="h-px w-12 bg-stone-300 mx-auto mb-16"></div>
        
        <Countdown targetEvent={nextEvent} />
      </header>

      {/* Calendar Section */}
      <main className="bg-white/40 backdrop-blur-sm rounded-[2rem] p-8 md:p-12 shadow-sm border border-stone-100 fade-in" style={{animationDelay: '0.2s'}}>
        <div className="flex items-center justify-between mb-12">
          <div className="flex flex-col">
            <h2 className="text-2xl font-light text-stone-700">
              {formatMonthName(month)} 
              <span className="text-stone-300 ml-2">{year}</span>
            </h2>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => changeMonth(-1)}
              className="p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-50 rounded-full transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <button 
               onClick={() => changeMonth(1)}
              className="p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-50 rounded-full transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        <div className="calendar-grid gap-y-8">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-[10px] uppercase tracking-[0.2em] text-stone-300 font-medium mb-4">
              {d}
            </div>
          ))}
          
          {blanks.map(b => (
            <div key={`blank-${b}`} className="h-16 md:h-24"></div>
          ))}

          {days.map(d => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.date === dateStr);
            const today = isToday(year, month, d);

            return (
              <button
                key={d}
                onClick={() => handleDateClick(d)}
                className={`group relative h-16 md:h-24 flex flex-col items-center justify-center rounded-2xl transition-all duration-300
                  ${today ? 'bg-stone-100/50' : 'hover:bg-stone-50/50'}`}
              >
                <span className={`text-lg md:text-xl font-light mb-1 transition-colors
                  ${today ? 'text-stone-800 font-medium' : 'text-stone-500 group-hover:text-stone-700'}`}
                >
                  {d}
                </span>
                
                <div className="flex gap-1 h-1.5 items-center justify-center">
                  {dayEvents.map((e) => (
                    <div 
                      key={e.id} 
                      className={`rounded-full transition-all
                        ${e.isImportant ? 'w-2 h-2 opacity-100' : 'w-1.5 h-1.5 opacity-60'}`}
                      style={{ backgroundColor: e.color || '#d6d3d1' }}
                    />
                  ))}
                </div>
                
                {today && (
                  <span className="absolute bottom-2 text-[8px] uppercase tracking-widest text-stone-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    Today
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 text-center text-stone-300 text-[10px] uppercase tracking-widest pb-12">
        A mindful tool for planning quiet moments &bull; {new Date().getFullYear()}
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
