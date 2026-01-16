
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CalendarEvent } from './types';
import { 
  getDaysInMonth, 
  getFirstDayOfMonth, 
  formatMonthName, 
  isToday, 
  getNextEvents 
} from './utils/dateUtils';
import { 
  getAllEvents, 
  saveEventToDB, 
  deleteEventFromDB,
  getAllNoteDates,
  getDailyNote
} from './utils/db';
import EventModal from './components/EventModal';
import Countdown from './components/Countdown';
import DailyMarkNote from './components/DailyMarkNote';
import UpcomingEventsOverlay from './components/UpcomingEventsOverlay';

type ViewMode = 'yearly' | 'monthly' | 'weekly' | 'daily';

const MonthIcon: React.FC<{ month: number }> = ({ month }) => {
  const icons = [
    <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />,
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />,
    <path d="M12 20V10m0 0a5 5 0 015-5m-5 5a5 5 0 00-5-5m5 15c-3 0-5.5-2.5-5.5-5.5S9 9 12 9s5.5 2.5 5.5 5.5-2.5 5.5-5.5 5.5z" />,
    <path d="M20 17.58A5 5 0 0018 8h-1.26A8 8 0 104 16.25M8 16v4m4-2v4m4-2v4" />,
    <path d="M12 12m-3 0a3 3 0 106 0a3 3 0 10-6 0M12 7V3m0 18v-4M7 12H3m18 0h-4m-1.5-5.5l3-3m-15 15l3-3m0-15l3 3m9 9l3 3" />,
    <path d="M12 12m-4 0a4 4 0 108 0a4 4 0 10-8 0M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />,
    <path d="M2 6c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2s2.5-2 5-2c1.3 0 1.9.5 2.5 1M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2s2.5-2 5-2c1.3 0 1.9.5 2.5 1M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2s2.5-2 5-2c1.3 0 1.9.5 2.5 1" />,
    <path d="M21 21H3L12 3l9 18zM12 13l-3 3M12 13l3 3" />,
    <path d="M20.39 3.11a2.39 2.39 0 00-3.38 0L3.11 17a2.39 2.39 0 000 3.39 2.39 2.39 0 003.38 0L20.39 6.5a2.39 2.39 0 000-3.39zM11.5 12.5l3-3" />,
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />,
    <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" />,
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  ];

  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#F5AFAF] group-hover/month:scale-110 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      {icons[month]}
    </svg>
  );
};

interface MonthProps {
  year: number;
  month: number;
  events: CalendarEvent[];
  noteDates: string[];
  onDateClick: (day: number, month: number, eventToEdit?: CalendarEvent) => void;
  clickedDateId: string | null;
  justSavedDateStr: string | null;
  large?: boolean;
}

const MonthView: React.FC<MonthProps> = ({ year, month, events, noteDates, onDateClick, clickedDateId, justSavedDateStr, large = false }) => {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <div className={`${large ? 'p-12 rounded-[3.5rem]' : 'p-8 rounded-[2.5rem]'} bg-white dark:bg-stone-900/60 backdrop-blur-md border border-stone-200 dark:border-stone-800 flex flex-col h-full shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-700 ease-out group/month`}>
      <div className={`flex items-center justify-between ${large ? 'mb-12' : 'mb-8'} px-1`}>
        <div className="flex items-center gap-4">
          <MonthIcon month={month} />
          <h3 className={`${large ? 'text-3xl' : 'text-[14px]'} font-bold text-stone-700 dark:text-stone-200 tracking-[0.2em] uppercase`}>
            {formatMonthName(month)}
          </h3>
        </div>
      </div>
      
      <div className={`grid grid-cols-7 ${large ? 'gap-y-6 gap-x-4' : 'gap-y-3 gap-x-2'} flex-1 text-center`}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
          <div key={`${month}-${d}-${idx}`} className={`${large ? 'text-xs' : 'text-[8px]'} uppercase tracking-widest text-stone-400 dark:text-stone-600 font-bold mb-2`}>
            {d}
          </div>
        ))}
        
        {blanks.map(b => (
          <div key={`blank-${month}-${b}`} className="aspect-square"></div>
        ))}

        {days.map(d => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const dayEvents = events.filter(e => e.date === dateStr);
          const hasEvents = dayEvents.length > 0;
          const hasNote = noteDates.includes(dateStr);
          const today = isToday(year, month, d);
          const isClicked = clickedDateId === `${month}-${d}`;
          const isJustSaved = justSavedDateStr === dateStr;

          return (
            <div key={`${month}-${d}`} className="relative group/day">
              <button
                onClick={() => onDateClick(d, month)}
                className={`w-full calendar-date-btn group relative aspect-square flex flex-col items-center justify-center rounded-2xl overflow-hidden
                  ${isClicked ? 'date-pulse z-20' : ''}
                  ${isJustSaved ? 'success-flourish z-20' : ''}
                  ${today 
                    ? 'bg-[#F5AFAF] text-white shadow-xl shadow-[#F5AFAF]/30 z-10' 
                    : 'text-stone-400 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-[#F5AFAF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none ${today ? 'hidden' : ''}`} />
                
                {/* Journal/Mark Indicator */}
                {hasNote && !today && (
                  <div className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full bg-[#F5AFAF]/60 animate-pulse" />
                )}

                <span className={`relative z-10 ${large ? 'text-3xl' : 'text-[15px]'} font-bold`}>
                  {d}
                </span>
                
                {/* Event Indicator Dot - specifically #a53860 as requested */}
                <div className={`absolute z-10 ${large ? 'bottom-3' : 'bottom-1.5'} flex gap-1 h-1.5 items-center justify-center w-full`}>
                  {hasEvents && (
                    <div 
                      className={`rounded-full transition-all ${large ? 'w-2 h-2' : 'w-1.5 h-1.5'} ${today ? 'bg-white' : 'bg-[#a53860]'}`} 
                    />
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const WeeklyView: React.FC<{ year: number, month: number, day: number, events: CalendarEvent[], noteDates: string[], onDateClick: (d: number, m: number, eventToEdit?: CalendarEvent) => void }> = ({ year, month, day, events, noteDates, onDateClick }) => {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  
  const startOfWeek = useMemo(() => {
    const d = new Date(year, month, day);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }, [year, month, day]);
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  const handleEventClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedEventId(prev => prev === id ? null : id);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 max-w-6xl mx-auto px-4 month-transition">
      {weekDays.map((date, idx) => {
        const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const dayEvents = events.filter(e => e.date === dStr);
        const hasNote = noteDates.includes(dStr);
        const today = isToday(date.getFullYear(), date.getMonth(), date.getDate());

        return (
          <div key={idx} onClick={() => onDateClick(date.getDate(), date.getMonth())} className={`p-6 rounded-[2.5rem] bg-white dark:bg-stone-900/40 backdrop-blur-md border border-stone-200 dark:border-stone-800 flex flex-col gap-4 min-h-[300px] shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer ${today ? 'ring-2 ring-[#F5AFAF]/30' : ''}`}>
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-widest text-stone-400 dark:text-stone-500 font-bold mb-2">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-4xl font-bold ${today ? 'text-[#F5AFAF]' : 'text-stone-700 dark:text-stone-200'}`}>
                  {date.getDate()}
                </span>
                {hasNote && <div className="w-2 h-2 rounded-full bg-[#F5AFAF] mt-2" title="Journal Mark" />}
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-1">
              {dayEvents.map(e => (
                <div 
                  key={e.id} 
                  onClick={(event) => handleEventClick(event, e.id)}
                  className={`text-[11px] p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/50 text-stone-600 dark:text-stone-300 transition-all duration-300 ${expandedEventId === e.id ? 'shadow-inner' : 'truncate'}`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: e.color || '#F5AFAF' }} />
                      <span className="font-bold truncate">{e.title}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const DailyView: React.FC<{ year: number, month: number, day: number, events: CalendarEvent[], noteDates: string[], onDateClick: (d: number, m: number, eventToEdit?: CalendarEvent) => void }> = ({ year, month, day, events, noteDates, onDateClick }) => {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const dayEvents = events.filter(e => e.date === dStr).sort((a,b) => (a.startTime || '').localeCompare(b.startTime || ''));
  const hasNote = noteDates.includes(dStr);
  const today = isToday(year, month, day);

  useEffect(() => {
    const fetchNote = async () => {
      const note = await getDailyNote(dStr);
      setNoteContent(note);
    };
    fetchNote();
  }, [dStr, noteDates]);

  const handleEventClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedEventId(prev => prev === id ? null : id);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-stone-900/40 backdrop-blur-md p-8 md:p-12 rounded-[3.5rem] border border-stone-200 dark:border-stone-800 shadow-2xl month-transition" onClick={() => onDateClick(day, month)}>
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-16">
        <div>
          <h3 className="text-stone-400 dark:text-stone-500 text-sm uppercase tracking-[0.4em] font-bold mb-3">Focus</h3>
          <h2 className="text-4xl md:text-6xl font-bold text-stone-800 dark:text-stone-100">
            {new Date(dStr + 'T12:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'long', weekday: 'long' })}
          </h2>
          {hasNote && <p className="text-[#F5AFAF] text-[10px] uppercase tracking-[0.2em] font-bold mt-2">Day is Marked</p>}
        </div>
        {today && <span className="w-fit bg-[#F5AFAF] text-white px-6 py-2 rounded-full text-[11px] uppercase tracking-[0.2em] font-bold shadow-lg shadow-[#F5AFAF]/20">Today</span>}
      </div>

      {noteContent && (
        <div className="mb-12 p-8 bg-stone-50 dark:bg-stone-800/50 rounded-3xl border border-stone-100 dark:border-stone-800">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#F5AFAF] font-bold block mb-4">Daily Reflection</span>
          <p className="font-serif italic text-stone-600 dark:text-stone-300 text-lg leading-relaxed">
            {noteContent}
          </p>
        </div>
      )}

      <div className="space-y-8">
        <h3 className="text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 font-bold mb-6">Recorded Moments</h3>
        {dayEvents.length > 0 ? dayEvents.map(e => (
          <div key={e.id} className="flex gap-4 md:gap-8 items-start group cursor-pointer" onClick={(event) => handleEventClick(event, e.id)}>
            <div className="text-[11px] md:text-[12px] font-bold text-stone-400 dark:text-stone-600 tracking-widest pt-1.5 w-14 md:w-16 text-right shrink-0 tabular-nums">
              {e.startTime || 'All Day'}
            </div>
            <div className="flex-1 pb-8 border-b border-stone-100 dark:border-stone-800 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full transition-transform duration-500 ${expandedEventId === e.id ? 'scale-150' : ''}`} style={{ backgroundColor: e.color || '#F5AFAF' }} />
                  <h4 className="text-xl md:text-2xl font-bold text-stone-700 dark:text-stone-200">{e.title}</h4>
                </div>
              </div>
              <div className={`transition-all duration-500 overflow-hidden ${expandedEventId === e.id ? 'max-h-96 opacity-100 mt-4' : 'max-h-6 opacity-60 truncate'}`}>
                <p className="text-stone-500 dark:text-stone-400 text-sm md:text-base leading-relaxed italic">{e.description || 'A quiet, unrecorded moment...'}</p>
              </div>
            </div>
          </div>
        )) : (
          <div className="py-24 text-center text-stone-300 dark:text-stone-700">
            <p className="italic text-3xl mb-4 opacity-50">A clean slate...</p>
            <p className="text-[11px] uppercase tracking-[0.4em] font-bold">Tap to mark the day</p>
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
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [noteDates, setNoteDates] = useState<string[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showEventsOverlay, setShowEventsOverlay] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [clickedDateId, setClickedDateId] = useState<string|null>(null);
  const [justSavedDateStr, setJustSavedDateStr] = useState<string|null>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const activeDateStr = useMemo(() => {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(viewDay).padStart(2, '0')}`;
  }, [viewYear, viewMonth, viewDay]);

  const refreshData = useCallback(async () => {
    try {
      const storedEvents = await getAllEvents();
      const storedNoteDates = await getAllNoteDates();
      setEvents(storedEvents);
      setNoteDates(storedNoteDates);
    } catch (e) {
      console.error('DayMark Refresh Error:', e);
    }
  }, []);

  useEffect(() => {
    const loadInitial = async () => {
      await refreshData();
      setIsLoading(false);
    };
    loadInitial();
  }, [refreshData]);

  const upcomingEvents = useMemo(() => getNextEvents(events, 10), [events]);

  const handleDateClick = (day: number, month: number, eventToEdit?: CalendarEvent) => {
    setViewDay(day);
    setViewMonth(month);
    const dateStr = `${viewYear}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateId = `${month}-${day}`;
    setClickedDateId(dateId);
    
    setTimeout(() => {
      const firstEvent = events.find(e => e.date === dateStr);
      
      setSelectedDate(dateStr);
      setEditingEvent(eventToEdit || firstEvent || null);
      setIsModalOpen(true);
      setClickedDateId(null);
    }, 200);
  };

  const handleSaveEvent = async (event: CalendarEvent) => {
    try {
      await saveEventToDB(event);
      await refreshData();
      
      setJustSavedDateStr(event.date);
      setTimeout(() => {
        setJustSavedDateStr(null);
      }, 1200);
    } catch (e) {
      console.error('DayMark Save Error:', e);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteEventFromDB(id);
      await refreshData();
    } catch (e) {
      console.error('DayMark Delete Error:', e);
    }
  };

  const navigate = useCallback((offset: number) => {
    if (viewMode === 'yearly') {
      setViewYear(prev => prev + offset);
    } else if (viewMode === 'monthly') {
      const d = new Date(viewYear, viewMonth + offset, 1);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    } else if (viewMode === 'weekly') {
      const d = new Date(viewYear, viewMonth, viewDay + (offset * 7));
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      setViewDay(d.getDate());
    } else if (viewMode === 'daily') {
      const d = new Date(viewYear, viewMonth, viewDay + offset);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      setViewDay(d.getDate());
    }
  }, [viewMode, viewYear, viewMonth, viewDay]);

  const jumpToToday = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setViewDay(today.getDate());
  };

  const months = Array.from({ length: 12 }, (_, i) => i);

  const navLabel = useMemo(() => {
    const d = new Date(viewYear, viewMonth, viewDay);
    if (viewMode === 'yearly') return viewYear.toString();
    if (viewMode === 'monthly') return `${formatMonthName(viewMonth)} ${viewYear}`;
    if (viewMode === 'weekly') {
      const start = new Date(viewYear, viewMonth, viewDay - d.getDay());
      const end = new Date(viewYear, viewMonth, viewDay - d.getDay() + 6);
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }, [viewMode, viewYear, viewMonth, viewDay]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-black">
        <div className="text-stone-400 dark:text-stone-600 italic text-2xl animate-pulse">Entering DayMark...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-black text-stone-800 dark:text-stone-200 px-4 py-12 md:py-24 max-w-7xl mx-auto selection:bg-[#F5AFAF]/20 overflow-x-hidden transition-colors duration-700">
      
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-[0.05] overflow-hidden -z-10">
        <svg className="absolute -top-32 -right-32 w-[30rem] h-[30rem] text-[#F5AFAF]" fill="currentColor" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" /></svg>
        <svg className="absolute -bottom-32 -left-32 w-[30rem] h-[30rem] text-[#F5AFAF]" fill="currentColor" viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" /></svg>
      </div>

      <header className="mb-16 text-center fade-in relative">
        <div className="absolute top-0 right-0 p-4 flex gap-4">
           <button 
             onClick={() => setShowEventsOverlay(true)}
             className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 hover:text-[#F5AFAF] transition-all hover:scale-105 active:scale-95 shadow-sm group"
             aria-label="Toggle Events Overlay"
           >
             <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Events</span>
             <div className="flex items-center justify-center bg-stone-100 dark:bg-stone-800 rounded-full h-6 min-w-[24px] px-1.5 transition-colors group-hover:bg-[#F5AFAF]/10 group-hover:text-[#F5AFAF]">
                <span className="text-[10px] font-bold">{upcomingEvents.length}</span>
             </div>
           </button>

           <button 
             onClick={() => setIsDarkMode(!isDarkMode)}
             className="p-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 hover:text-[#F5AFAF] transition-all hover:scale-110 active:scale-95 shadow-sm"
             aria-label="Toggle Theme"
           >
             {isDarkMode ? (
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
               </svg>
             ) : (
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
               </svg>
             )}
           </button>
        </div>

        <div className="inline-flex items-center justify-center p-4 bg-[#F5AFAF]/10 rounded-3xl mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#F5AFAF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
          </svg>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-stone-800 dark:text-stone-100 tracking-[0.3em] uppercase mb-6 md:pl-6">
          DayMark
        </h1>
        <div className="h-px w-20 bg-[#F5AFAF]/30 mx-auto mb-12"></div>
        
        <Countdown upcomingEvents={upcomingEvents} />
      </header>

      {/* Persistent Control Bar Section */}
      <div className="flex flex-col gap-10 mb-16 fade-in px-4">
        {/* View Selection Tabs */}
        <div className="flex items-center justify-center gap-2 bg-white dark:bg-stone-900/40 p-2 rounded-full backdrop-blur-md border border-stone-200 dark:border-stone-800 max-w-sm mx-auto shadow-sm w-full">
          {(['yearly', 'monthly', 'weekly', 'daily'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex-1 px-3 py-2.5 rounded-full text-[10px] uppercase tracking-[0.3em] font-bold transition-all duration-500 ${viewMode === mode ? 'bg-[#F5AFAF] text-white shadow-lg' : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/50'}`}
            >
              {mode[0]}<span className="hidden sm:inline">{mode.slice(1)}</span>
            </button>
          ))}
        </div>

        {/* Navigation Strip - Stable Alignment */}
        <div className="flex items-center justify-between max-w-4xl mx-auto w-full gap-4">
          <button onClick={() => navigate(-1)} className="group flex items-center gap-4 text-stone-400 dark:text-stone-700 hover:text-stone-800 dark:hover:text-stone-200 transition-all shrink-0">
            <div className="p-3 rounded-2xl group-hover:bg-[#F5AFAF]/10 transition-colors border border-transparent group-hover:border-[#F5AFAF]/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </div>
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold hidden md:inline">Prev</span>
          </button>
          
          <div className="flex flex-col items-center gap-1 md:gap-2 text-center flex-1 min-w-0">
            <h2 className="text-2xl md:text-5xl font-bold text-stone-800 dark:text-stone-100 tracking-[0.05em] leading-tight truncate w-full">
              {navLabel}
            </h2>
            <button 
              onClick={jumpToToday}
              className="text-[9px] uppercase tracking-[0.3em] text-[#F5AFAF] hover:text-[#a53860] dark:hover:text-white transition-colors font-bold py-1"
            >
              Today
            </button>
          </div>

          <button onClick={() => navigate(1)} className="group flex items-center gap-4 text-stone-400 dark:text-stone-700 hover:text-stone-800 dark:hover:text-stone-200 transition-all text-right shrink-0">
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold hidden md:inline">Next</span>
            <div className="p-3 rounded-2xl group-hover:bg-[#F5AFAF]/10 transition-colors border border-transparent group-hover:border-[#F5AFAF]/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>
        </div>

        {/* Secondary Month Navigator - Preserves space when hidden to avoid jumps if possible */}
        <div className={`transition-all duration-500 overflow-hidden ${viewMode === 'monthly' ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
          <div className="flex justify-center flex-wrap gap-2 md:gap-3 max-w-4xl mx-auto py-2">
            {months.map(m => (
              <button 
                key={m} 
                onClick={() => setViewMonth(m)} 
                className={`px-4 py-1.5 rounded-full text-[9px] uppercase tracking-[0.2em] font-bold transition-all duration-300 ${viewMonth === m ? 'bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 scale-105 shadow-md' : 'text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400'}`}
              >
                {formatMonthName(m).slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DailyMarkNote date={activeDateStr} onNoteSaved={refreshData} />

      <main className="fade-in min-h-[50vh]" style={{animationDelay: '0.2s'}}>
        {viewMode === 'yearly' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12 md:gap-14">
            {months.map(m => (
              <MonthView 
                key={m} 
                year={viewYear} 
                month={m} 
                events={events} 
                noteDates={noteDates}
                onDateClick={handleDateClick} 
                clickedDateId={clickedDateId}
                justSavedDateStr={justSavedDateStr}
              />
            ))}
          </div>
        )}

        {viewMode === 'monthly' && (
          <div className="max-w-5xl mx-auto px-4">
             <div className="month-transition" key={`${viewYear}-${viewMonth}`}>
               <MonthView 
                 year={viewYear} 
                 month={viewMonth} 
                 events={events} 
                 noteDates={noteDates}
                 onDateClick={handleDateClick} 
                 clickedDateId={clickedDateId} 
                 justSavedDateStr={justSavedDateStr}
                 large 
               />
             </div>
          </div>
        )}

        {viewMode === 'weekly' && (
          <WeeklyView year={viewYear} month={viewMonth} day={viewDay} events={events} noteDates={noteDates} onDateClick={handleDateClick} />
        )}

        {viewMode === 'daily' && (
          <DailyView year={viewYear} month={viewMonth} day={viewDay} events={events} noteDates={noteDates} onDateClick={handleDateClick} />
        )}
      </main>

      <footer className="mt-20 text-center text-stone-400 dark:text-stone-700 text-[10px] uppercase tracking-[0.5em] pb-24 flex flex-col items-center gap-6">
        <div className="h-px w-12 bg-stone-200 dark:bg-stone-800"></div>
        <span className="italic capitalize text-stone-500 text-sm">Crafted for Clarity &bull; {new Date().getFullYear()}</span>
      </footer>

      <EventModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        selectedDate={selectedDate}
        initialEvent={editingEvent}
        onNoteUpdated={refreshData}
      />

      <UpcomingEventsOverlay
        isOpen={showEventsOverlay}
        onClose={() => setShowEventsOverlay(false)}
        upcomingEvents={upcomingEvents}
      />
    </div>
  );
};

export default App;
