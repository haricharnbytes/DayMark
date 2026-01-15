
import React, { useState, useEffect, useMemo } from 'react';
import { CalendarEvent } from './types';
import { 
  getDaysInMonth, 
  getFirstDayOfMonth, 
  formatMonthName, 
  isToday, 
  getNextEvents 
} from './utils/dateUtils';
import EventModal from './components/EventModal';
import Countdown from './components/Countdown';

type ViewMode = 'yearly' | 'monthly' | 'weekly' | 'daily';

const MonthIcon: React.FC<{ month: number }> = ({ month }) => {
  const icons = [
    <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07M12 4l2 2m-4 0l2-2M20 12l-2 2m0-4l2 2M12 20l-2-2m4 0l-2 2M4 12l2-2m0 4l-2-2" />,
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />,
    <path d="M12 20V10m0 0a5 5 0 015-5m-5 5a5 5 0 00-5-5m5 15c-3 0-5.5-2.5-5.5-5.5S9 9 12 9s5.5 2.5 5.5 5.5-2.5 5.5-5.5 5.5z" />,
    <path d="M20 17.58A5 5 0 0018 8h-1.26A8 8 0 104 16.25M8 16v4m4-2v4m4-2v4" />,
    <path d="M12 12m-3 0a3 3 0 106 0a3 3 0 10-6 0M12 7V3m0 18v-4M7 12H3m18 0h-4m-1.5-5.5l3-3m-15 15l3-3m0-15l3 3m9 9l3 3" />,
    <path d="M12 3V1m0 22v-2m9-9h2M1 12h2m15.364-6.364l1.414-1.414M4.222 19.778l1.414-1.414M18.364 18.364l1.414 1.414M4.222 4.222l1.414 1.414M12 17a5 5 0 100-10 5 5 0 000 10z" />,
    <path d="M2 10c1.5 0 2.5 1 4 1s2.5-1 4-1 2.5 1 4 1 2.5-1 4-1 2.5 1 4 1M2 14c1.5 0 2.5 1 4 1s2.5-1 4-1 2.5 1 4 1 2.5-1 4-1 2.5 1 4 1M2 18c1.5 0 2.5 1 4 1s2.5-1 4-1 2.5 1 4 1 2.5-1 4-1 2.5 1 4 1" />,
    <path d="M3 21l3-3m-3.5 1L5 16.5M10 12l.5 2.5M16 6l5-5M15 13l-3-3m0 0l-2 2m2-2l2-2m-2 2l-2-2m2 2l2 2M19 5l-1-1m2 2l-1-1" />,
    <path d="M20.39 3.11a2.39 2.39 0 00-3.38 0L3.11 17a2.39 2.39 0 000 3.39 2.39 2.39 0 003.38 0L20.39 6.5a2.39 2.39 0 000-3.39zM11.5 12.5l3-3" />,
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79zM15 6l.5 1.5.5-1.5-.5-1.5L15 6z" />,
    <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" />,
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4m-12.4-6.4l2.8 2.8m5.6 5.6l2.8 2.8m-11.2 0l2.8-2.8m5.6-5.6l2.8-2.8" />
  ];

  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#F5AFAF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
  large?: boolean;
}

const MonthView: React.FC<MonthProps> = ({ year, month, events, onDateClick, clickedDateId, large = false }) => {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <div className={`${large ? 'p-10 rounded-[3rem]' : 'p-7 rounded-[2.5rem]'} bg-white/60 backdrop-blur-md border border-stone-100 flex flex-col h-full shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ease-out group/month`}>
      <div className={`flex items-center justify-between ${large ? 'mb-10' : 'mb-6'} px-1`}>
        <div className="flex items-center gap-3">
          <MonthIcon month={month} />
          <h3 className={`${large ? 'text-2xl' : 'text-[12px]'} font-semibold text-stone-600 tracking-[0.15em] uppercase font-serif`}>
            {formatMonthName(month)}
          </h3>
        </div>
      </div>
      
      <div className={`grid grid-cols-7 ${large ? 'gap-y-4 gap-x-2' : 'gap-y-1.5 gap-x-1'} flex-1 text-center`}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
          <div key={`${month}-${d}-${idx}`} className={`${large ? 'text-[10px]' : 'text-[7px]'} uppercase tracking-widest text-stone-300 font-bold mb-3`}>
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
            <div key={`${month}-${d}`} className="relative group/day">
              <button
                onClick={() => onDateClick(d, month)}
                className={`w-full group relative aspect-square flex flex-col items-center justify-center rounded-xl transition-all duration-300
                  ${isClicked ? 'date-pulse scale-110' : ''}
                  ${today ? 'bg-[#F5AFAF] text-white shadow-lg shadow-[#F5AFAF]/20 scale-110 z-10' : 'hover:bg-stone-100 text-stone-500 hover:text-stone-800'}`}
              >
                <span className={`${large ? 'text-base' : 'text-[11px]'} font-medium transition-colors`}>
                  {d}
                </span>
                
                {/* Event indicator dots */}
                <div className={`absolute ${large ? 'bottom-2.5' : 'bottom-1.5'} flex gap-0.5 h-1 items-center justify-center w-full`}>
                  {dayEvents.slice(0, 3).map((e) => (
                    <div 
                      key={e.id} 
                      className={`rounded-full transition-all ${e.isImportant ? (large ? 'w-1.5 h-1.5' : 'w-1 h-1') : (large ? 'w-1 h-1' : 'w-0.5 h-0.5')} opacity-80`} 
                      style={{ backgroundColor: today ? '#ffffff' : (e.color || '#d6d3d1') }} 
                    />
                  ))}
                  {dayEvents.length > 3 && (
                     <div className={`rounded-full ${large ? 'w-1 h-1' : 'w-0.5 h-0.5'} bg-stone-300`} />
                  )}
                </div>
              </button>

              {/* Event Tooltip on Hover */}
              {dayEvents.length > 0 && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-stone-100 opacity-0 pointer-events-none group-hover/day:opacity-100 transition-all duration-300 z-[60] scale-95 group-hover/day:scale-100 origin-bottom">
                  <div className="text-[9px] uppercase tracking-widest text-[#F5AFAF] font-bold mb-2 border-b border-stone-100 pb-1 flex justify-between">
                    <span>{dayEvents.length} Moment{dayEvents.length > 1 ? 's' : ''}</span>
                    <span className="italic">{dateStr}</span>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                    {dayEvents.map((e) => (
                      <div key={e.id} className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: e.color || '#F5AFAF' }} />
                          <span className="text-[11px] font-medium text-stone-700 truncate font-serif">{e.title}</span>
                        </div>
                        {e.time && (
                          <span className="text-[8px] text-stone-400 pl-3 uppercase tracking-tighter tabular-nums">{e.time}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-[6px] border-transparent border-t-white/95"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const WeeklyView: React.FC<{ year: number, month: number, day: number, events: CalendarEvent[], onDateClick: (d: number, m: number) => void }> = ({ year, month, day, events, onDateClick }) => {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  
  const startOfWeek = new Date(year, month, day);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedEventId(expandedEventId === id ? null : id);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 max-w-6xl mx-auto px-4">
      {weekDays.map((date, idx) => {
        const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const dayEvents = events.filter(e => e.date === dStr);
        const today = isToday(date.getFullYear(), date.getMonth(), date.getDate());

        return (
          <div key={idx} onClick={() => onDateClick(date.getDate(), date.getMonth())} className={`p-6 rounded-[2rem] bg-white/60 backdrop-blur-md border border-stone-100 flex flex-col gap-4 min-h-[250px] shadow-sm hover:shadow-md transition-all cursor-pointer ${today ? 'ring-2 ring-[#F5AFAF]/30' : ''}`}>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className={`text-2xl font-serif font-bold ${today ? 'text-[#F5AFAF]' : 'text-stone-700'}`}>
                {date.getDate()}
              </span>
            </div>
            <div className="flex flex-col gap-2 flex-1">
              {dayEvents.map(e => (
                <div 
                  key={e.id} 
                  onClick={(event) => toggleExpand(event, e.id)}
                  className={`text-[10px] p-2 rounded-lg bg-stone-50 border border-stone-100/50 text-stone-600 transition-all duration-300 ${expandedEventId === e.id ? 'shadow-inner' : 'truncate'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: e.color || '#F5AFAF' }} />
                    <span className="font-medium">{e.title}</span>
                  </div>
                  {expandedEventId === e.id && e.description && (
                    <div className="mt-1 text-stone-400 text-[9px] leading-relaxed border-t border-stone-100/50 pt-1.5">
                      {e.description}
                    </div>
                  )}
                </div>
              ))}
              {dayEvents.length === 0 && <div className="text-[9px] text-stone-300 italic">No events</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const DailyView: React.FC<{ year: number, month: number, day: number, events: CalendarEvent[], onDateClick: (d: number, m: number) => void }> = ({ year, month, day, events, onDateClick }) => {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const dayEvents = events.filter(e => e.date === dStr).sort((a,b) => (a.time || '').localeCompare(b.time || ''));
  const today = isToday(year, month, day);

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedEventId(expandedEventId === id ? null : id);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white/60 backdrop-blur-md p-10 rounded-[3rem] border border-stone-100 shadow-xl" onClick={() => onDateClick(day, month)}>
      <div className="flex justify-between items-end mb-12">
        <div>
          <h3 className="text-stone-400 text-xs uppercase tracking-[0.3em] font-bold mb-2">Today's Focus</h3>
          <h2 className="text-5xl font-serif font-bold text-stone-800">
            {new Date(year, month, day).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}
          </h2>
        </div>
        {today && <span className="bg-[#F5AFAF] text-white px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold">Today</span>}
      </div>

      <div className="space-y-6">
        {dayEvents.length > 0 ? dayEvents.map(e => (
          <div key={e.id} className="flex gap-6 items-start group cursor-pointer" onClick={(event) => toggleExpand(event, e.id)}>
            <div className="text-[11px] font-bold text-stone-300 tracking-tighter pt-1 w-12 text-right shrink-0">
              {e.time || 'All Day'}
            </div>
            <div className="flex-1 pb-6 border-b border-stone-100 last:border-0">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full transition-transform duration-300 ${expandedEventId === e.id ? 'scale-125' : ''}`} style={{ backgroundColor: e.color || '#F5AFAF' }} />
                <h4 className="text-lg font-medium text-stone-700">{e.title}</h4>
              </div>
              <div className={`transition-all duration-300 overflow-hidden ${expandedEventId === e.id ? 'max-h-96 opacity-100 mt-2' : 'max-h-6 opacity-60 truncate'}`}>
                <p className="text-stone-400 text-sm leading-relaxed">{e.description || 'No notes added'}</p>
              </div>
            </div>
          </div>
        )) : (
          <div className="py-20 text-center text-stone-300">
            <p className="italic font-serif text-lg mb-2">A quiet day</p>
            <p className="text-[10px] uppercase tracking-widest">Tap to add a moment</p>
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('yearly');
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewDay, setViewDay] = useState(new Date().getDate());

  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem('ethereal_events');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load events from localStorage', e);
      return [];
    }
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [clickedDateId, setClickedDateId] = useState<string|null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('ethereal_events', JSON.stringify(events));
    } catch (e) {
      console.error('Failed to save events to localStorage', e);
    }
  }, [events]);

  const upcomingEvents = useMemo(() => getNextEvents(events, 5), [events]);

  const handleDateClick = (day: number, month: number) => {
    setViewDay(day);
    setViewMonth(month);
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

  const ViewSwitcher = () => (
    <div className="flex items-center justify-center gap-2 mb-12 bg-white/40 p-1.5 rounded-full backdrop-blur-sm border border-stone-100 max-w-sm mx-auto shadow-sm">
      {(['yearly', 'monthly', 'weekly', 'daily'] as ViewMode[]).map((mode) => (
        <button
          key={mode}
          onClick={() => setViewMode(mode)}
          className={`flex-1 px-4 py-2 rounded-full text-[9px] uppercase tracking-[0.2em] font-bold transition-all duration-300 ${viewMode === mode ? 'bg-[#F5AFAF] text-white shadow-md' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100/50'}`}
        >
          {mode}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FCF8F8] px-4 py-12 md:py-20 max-w-7xl mx-auto selection:bg-[#F5AFAF]/20 overflow-x-hidden">
      
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-[0.05] overflow-hidden -z-10">
        <svg className="absolute -top-24 -right-24 w-96 h-96 text-[#F5AFAF]" fill="currentColor" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" /></svg>
        <svg className="absolute -bottom-24 -left-24 w-96 h-96 text-[#F5AFAF]" fill="currentColor" viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" /></svg>
      </div>

      <header className="mb-12 text-center fade-in">
        <div className="inline-flex items-center justify-center p-3 bg-[#F5AFAF]/10 rounded-2xl mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#F5AFAF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
          </svg>
        </div>
        <h1 className="text-5xl font-bold text-stone-800 tracking-[0.2em] uppercase mb-4 pl-4 font-serif">
          DayMark
        </h1>
        <div className="h-px w-16 bg-[#F5AFAF]/30 mx-auto mb-10"></div>
        
        <Countdown upcomingEvents={upcomingEvents} />
      </header>

      <ViewSwitcher />

      {(viewMode === 'yearly' || viewMode === 'monthly') && (
        <div className="flex items-center justify-between mb-16 fade-in max-w-4xl mx-auto px-4" style={{animationDelay: '0.1s'}}>
          <button onClick={() => changeYear(-1)} className="group flex items-center gap-3 text-stone-300 hover:text-stone-800 transition-all">
            <div className="p-2 rounded-full group-hover:bg-[#F5AFAF]/10 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-medium hidden sm:inline font-serif">{viewYear - 1}</span>
          </button>
          <div className="flex flex-col items-center">
            <h2 className="text-6xl font-bold text-stone-800 tracking-[0.1em] relative font-serif">
              {viewYear}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                <div className="w-1 h-1 rounded-full bg-[#F5AFAF]/20"></div>
                <div className="w-1 h-1 rounded-full bg-[#F5AFAF]/40"></div>
                <div className="w-1 h-1 rounded-full bg-[#F5AFAF]/20"></div>
              </div>
            </h2>
          </div>
          <button onClick={() => changeYear(1)} className="group flex items-center gap-3 text-stone-300 hover:text-stone-800 transition-all text-right">
            <span className="text-[10px] uppercase tracking-[0.2em] font-medium hidden sm:inline font-serif">{viewYear + 1}</span>
            <div className="p-2 rounded-full group-hover:bg-[#F5AFAF]/10 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>
        </div>
      )}

      <main className="fade-in" style={{animationDelay: '0.2s'}}>
        {viewMode === 'yearly' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10">
            {months.map(m => (
              <MonthView key={m} year={viewYear} month={m} events={events} onDateClick={handleDateClick} clickedDateId={clickedDateId} />
            ))}
          </div>
        )}

        {viewMode === 'monthly' && (
          <div className="max-w-4xl mx-auto px-4">
             <div className="flex justify-center flex-wrap gap-2 md:gap-4 mb-10">
                {months.map(m => (
                  <button key={m} onClick={() => setViewMonth(m)} className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all ${viewMonth === m ? 'bg-stone-800 text-white shadow-lg' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100/50'}`}>
                    {formatMonthName(m).slice(0,3)}
                  </button>
                ))}
             </div>
             <div key={`${viewYear}-${viewMonth}`} className="month-transition">
               <MonthView year={viewYear} month={viewMonth} events={events} onDateClick={handleDateClick} clickedDateId={clickedDateId} large />
             </div>
          </div>
        )}

        {viewMode === 'weekly' && (
          <WeeklyView year={viewYear} month={viewMonth} day={viewDay} events={events} onDateClick={handleDateClick} />
        )}

        {viewMode === 'daily' && (
          <DailyView year={viewYear} month={viewMonth} day={viewDay} events={events} onDateClick={handleDateClick} />
        )}
      </main>

      <div className="flex justify-center mt-24 fade-in" style={{animationDelay: '0.4s'}}>
        <div className="p-4 bg-white rounded-full shadow-sm border border-stone-100 animate-bounce cursor-default">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#F5AFAF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      <footer className="mt-16 text-center text-stone-300 text-[9px] uppercase tracking-[0.4em] pb-16 flex flex-col items-center gap-4">
        <div className="h-px w-8 bg-stone-200"></div>
        <span className="font-serif italic capitalize text-stone-400 text-xs">The art of intentional living &bull; {new Date().getFullYear()}</span>
      </footer>

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
