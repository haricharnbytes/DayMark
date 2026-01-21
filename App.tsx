
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
import EventModal, { ICON_MAP } from './components/EventModal';
import Countdown from './components/Countdown';
import DailyMarkNote from './components/DailyMarkNote';
import UpcomingEventsOverlay from './components/UpcomingEventsOverlay';
import SyncOverlay from './components/SyncOverlay';
import Login from './components/Login';

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
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#F5AFAF] group-hover/month:scale-110 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      {icons[month]}
    </svg>
  );
};

interface MonthProps {
  year: number;
  month: number;
  events: CalendarEvent[];
  noteDates: string[];
  activeDateStr: string;
  onDateClick: (day: number, month: number, eventToEdit?: CalendarEvent) => void;
  clickedDateId: string | null;
  justSavedDateStr: string | null;
  large?: boolean;
}

const MonthView: React.FC<MonthProps> = ({ year, month, events, noteDates, activeDateStr, onDateClick, clickedDateId, justSavedDateStr, large = false }) => {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <div className={`${large ? 'p-8 rounded-[2.5rem]' : 'p-4 rounded-[1.5rem]'} bg-white dark:bg-stone-900/60 backdrop-blur-md border border-stone-200 dark:border-stone-800 flex flex-col h-full shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-700 ease-out group/month mx-auto w-full`}>
      <div className={`flex items-center justify-between ${large ? 'mb-8' : 'mb-2.5'} px-1`}>
        <div className="flex items-center gap-3">
          {!large && <MonthIcon month={month} />}
          <h3 className={`${large ? 'text-2xl' : 'text-[11px]'} font-bold text-stone-700 dark:text-stone-200 tracking-[0.2em] uppercase`}>
            {formatMonthName(month)}
          </h3>
        </div>
      </div>
      
      <div className={`grid grid-cols-7 ${large ? 'gap-y-4 gap-x-3' : 'gap-y-1.5 gap-x-1'} flex-1 text-center`}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
          <div key={`${month}-${d}-${idx}`} className={`${large ? 'text-xs' : 'text-[7px]'} uppercase tracking-widest text-stone-400 dark:text-stone-600 font-bold mb-0.5`}>
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
          const primaryEventColor = hasEvents ? (dayEvents[0].color || '#F5AFAF') : '#F5AFAF';
          const hasNote = noteDates.includes(dateStr);
          const today = isToday(year, month, d);
          const active = activeDateStr === dateStr;
          const isClicked = clickedDateId === `${month}-${d}`;
          const isJustSaved = justSavedDateStr === dateStr;

          return (
            <div key={`${month}-${d}`} className="relative group/day">
              <button
                onClick={() => onDateClick(d, month)}
                className={`w-full calendar-date-btn group relative aspect-square flex flex-col items-center justify-center rounded-lg overflow-hidden
                  ${isClicked ? 'date-pulse z-20' : ''}
                  ${isJustSaved ? 'success-flourish z-20' : ''}
                  ${active ? 'ring-1.5 ring-[#F5AFAF]/60 shadow-lg shadow-[#F5AFAF]/5 z-10' : ''}
                  ${today 
                    ? 'bg-[#F5AFAF] text-white shadow-xl shadow-[#F5AFAF]/30 z-10' 
                    : 'text-stone-400 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-[#F5AFAF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none ${today ? 'hidden' : ''}`} />
                
                {hasNote && !today && (
                  <div className={`absolute ${large ? 'top-2 right-2 w-1.5 h-1.5' : 'top-1 right-1 w-0.5 h-0.5'} rounded-full bg-[#F5AFAF]/60 animate-pulse`} />
                )}

                <span className={`relative z-10 ${large ? 'text-xl' : 'text-[12px]'} font-bold`}>
                  {d}
                </span>
                
                {/* Event Indicator Dot */}
                <div className={`absolute z-10 ${large ? 'bottom-2' : 'bottom-1'} flex gap-1 h-1 items-center justify-center w-full`}>
                  {hasEvents && (
                    <div 
                      className={`rounded-full transition-all ${large ? 'w-1.5 h-1.5 shadow-[0_0_5px_rgba(0,0,0,0.1)]' : 'w-1 h-1'} ${today ? 'bg-white' : ''}`}
                      style={!today ? { backgroundColor: primaryEventColor } : {}}
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
    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 w-full month-transition">
      {weekDays.map((date, idx) => {
        const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const dayEvents = events.filter(e => e.date === dStr);
        const hasNote = noteDates.includes(dStr);
        const today = isToday(date.getFullYear(), date.getMonth(), date.getDate());

        return (
          <div key={idx} onClick={() => onDateClick(date.getDate(), date.getMonth())} className={`p-6 rounded-[2.5rem] bg-white dark:bg-stone-900/40 backdrop-blur-md border border-stone-200 dark:border-stone-800 flex flex-col gap-4 min-h-[400px] shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer ${today ? 'ring-2 ring-[#F5AFAF]/30' : ''}`}>
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-widest text-stone-400 dark:text-stone-500 font-bold mb-2">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-5xl font-bold ${today ? 'text-[#F5AFAF]' : 'text-stone-700 dark:text-stone-200'}`}>
                  {date.getDate()}
                </span>
                {hasNote && <div className="w-2.5 h-2.5 rounded-full bg-[#F5AFAF] mt-2" title="Journal Mark" />}
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-1 mt-4">
              {dayEvents.map(e => (
                <div 
                  key={e.id} 
                  onClick={(event) => handleEventClick(event, e.id)}
                  className={`text-[12px] p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/50 text-stone-600 dark:text-stone-300 transition-all duration-300 ${expandedEventId === e.id ? 'shadow-inner' : 'truncate'}`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/5 dark:border-white/10" style={{ backgroundColor: e.color || '#F5AFAF' }} />
                    <span className="font-bold truncate">{e.title}</span>
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
  const [noteContent, setNoteContent] = useState('');
  const [now, setNow] = useState(Date.now());
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

    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, [dStr, noteDates]);

  const getMomentStatus = (e: CalendarEvent) => {
    const startTime = new Date(`${e.date}T${e.startTime || '00:00'}`).getTime();
    const endTime = new Date(`${e.date}T${e.endTime || '23:59'}`).getTime();
    
    if (now < startTime) return 'upcoming';
    if (now >= startTime && now <= endTime) return 'active';
    return 'passed';
  };

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-stone-900/40 backdrop-blur-md p-8 md:p-16 rounded-[4rem] border border-stone-200 dark:border-stone-800 shadow-2xl month-transition cursor-pointer" onClick={() => onDateClick(day, month)}>
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-10 mb-20">
        <div>
          <h3 className="text-stone-400 dark:text-stone-500 text-sm uppercase tracking-[0.4em] font-bold mb-4">Daily View</h3>
          <h2 className="text-5xl md:text-7xl font-bold text-stone-800 dark:text-stone-100">
            {new Date(dStr + 'T12:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'long', weekday: 'long' })}
          </h2>
          {hasNote && <p className="text-[#F5AFAF] text-xs uppercase tracking-[0.3em] font-bold mt-4">Marked Day</p>}
        </div>
        {today && <span className="w-fit bg-[#F5AFAF] text-white px-8 py-3 rounded-full text-xs uppercase tracking-[0.3em] font-bold shadow-xl shadow-[#F5AFAF]/20">Today</span>}
      </div>

      {noteContent && (
        <div className="mb-16 p-10 bg-stone-50 dark:bg-stone-800/50 rounded-[2.5rem] border border-stone-100 dark:border-stone-800">
          <span className="text-xs uppercase tracking-[0.3em] text-[#F5AFAF] font-bold block mb-6">Reflection</span>
          <p className="font-serif italic text-stone-600 dark:text-stone-300 text-2xl leading-relaxed">
            {noteContent}
          </p>
        </div>
      )}

      <div className="space-y-12">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xs uppercase tracking-[0.3em] text-stone-400 dark:text-stone-500 font-bold">Recorded Moments</h3>
          <button 
            className="text-xs uppercase tracking-widest text-[#F5AFAF] font-bold bg-[#F5AFAF]/10 px-6 py-2 rounded-full hover:bg-[#F5AFAF]/20 transition-all"
            onClick={(e) => { e.stopPropagation(); onDateClick(day, month); }}
          >
            Add New
          </button>
        </div>
        {dayEvents.length > 0 ? dayEvents.map(e => {
          const status = getMomentStatus(e);
          return (
            <div key={e.id} className="flex gap-8 md:gap-12 items-start group cursor-pointer" onClick={(event) => { event.stopPropagation(); onDateClick(day, month, e); }}>
              <div className="text-sm font-bold text-stone-400 dark:text-stone-600 tracking-widest pt-2 w-20 md:w-24 text-right shrink-0 tabular-nums">
                {e.startTime || 'Day'}
              </div>
              <div className="flex-1 pb-10 border-b border-stone-100 dark:border-stone-800 last:border-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full transition-transform duration-500 group-hover:scale-125 border border-black/5 dark:border-white/10 ${status === 'passed' ? 'opacity-40' : ''}`} style={{ backgroundColor: e.color || '#F5AFAF' }} />
                    <h4 className={`text-2xl md:text-3xl font-bold transition-opacity duration-500 ${status === 'passed' ? 'text-stone-400 dark:text-stone-600' : 'text-stone-700 dark:text-stone-200'}`}>{e.title}</h4>
                  </div>
                  {status === 'active' && (
                    <span className="text-[10px] uppercase tracking-[0.3em] bg-[#F5AFAF]/10 text-[#F5AFAF] px-4 py-1.5 rounded-full font-bold animate-pulse">Live</span>
                  )}
                </div>
                <p className={`text-lg leading-relaxed italic truncate transition-opacity duration-500 ${status === 'passed' ? 'text-stone-300 dark:text-stone-700' : 'text-stone-500 dark:text-stone-400'}`}>
                  {e.description || '...'}
                </p>
              </div>
            </div>
          );
        }) : (
          <div className="py-32 text-center text-stone-300 dark:text-stone-700">
            <p className="italic text-4xl mb-6 opacity-30">A clean slate...</p>
            <p className="text-xs uppercase tracking-[0.4em] font-bold opacity-50">Tap anywhere to record</p>
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('daymark_auth') === 'true';
  });
  const [viewMode, setViewMode] = useState<ViewMode>('yearly');
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewDay, setViewDay] = useState(new Date().getDate());
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : false;
  });

  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [noteDates, setNoteDates] = useState<string[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showEventsOverlay, setShowEventsOverlay] = useState(false);
  const [showSyncOverlay, setShowSyncOverlay] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [clickedDateId, setClickedDateId] = useState<string|null>(null);
  const [justSavedDateStr, setJustSavedDateStr] = useState<string|null>(null);

  useEffect(() => {
    const onStart = () => setSyncStatus('syncing');
    const onEnd = () => { setSyncStatus('idle'); refreshData(); };
    const onError = () => setSyncStatus('error');

    window.addEventListener('daymark-sync-start', onStart);
    window.addEventListener('daymark-sync-complete', onEnd);
    window.addEventListener('daymark-sync-error', onError);

    return () => {
      window.removeEventListener('daymark-sync-start', onStart);
      window.removeEventListener('daymark-sync-complete', onEnd);
      window.removeEventListener('daymark-sync-error', onError);
    };
  }, []);

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
    if (!isAuthenticated) return;
    try {
      const storedEvents = await getAllEvents();
      const storedNoteDates = await getAllNoteDates();
      setEvents(storedEvents || []);
      setNoteDates(storedNoteDates || []);
    } catch (e) {
      console.error('DayMark Refresh Error:', e);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const loadInitial = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }
      try {
        await refreshData();
      } catch (e) {
        console.error('Initialization failed:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitial();
  }, [refreshData, isAuthenticated]);

  const upcomingEvents = useMemo(() => getNextEvents(events, 10), [events]);

  const handleDateClick = (day: number, month: number, eventToEdit?: CalendarEvent) => {
    const targetDateStr = `${viewYear}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    setViewDay(day);
    setViewMonth(month);

    setSelectedDate(targetDateStr);
    setEditingEvent(eventToEdit || null);
    setIsModalOpen(true);
    
    const dateId = `${month}-${day}`;
    setClickedDateId(dateId);
    setTimeout(() => setClickedDateId(null), 300);
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

  const handleLogout = () => {
    localStorage.removeItem('daymark_auth');
    localStorage.removeItem('daymark_cloud_id');
    localStorage.removeItem('daymark_last_sync');
    setIsAuthenticated(false);
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-8">
          <div className="w-16 h-16 border-t-2 border-[#F5AFAF] rounded-full animate-spin"></div>
          <div className="text-[#F5AFAF] tracking-[0.5em] uppercase text-xs font-bold animate-pulse">Entering DayMark</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-stone-800 dark:text-stone-200 px-6 md:px-12 py-12 md:py-20 w-full selection:bg-[#F5AFAF]/20 overflow-x-hidden transition-colors duration-700">
      
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-[0.05] overflow-hidden -z-10">
        <svg className="absolute -top-32 -right-32 w-[40rem] h-[40rem] text-[#F5AFAF]" fill="currentColor" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" /></svg>
        <svg className="absolute -bottom-32 -left-32 w-[40rem] h-[40rem] text-[#F5AFAF]" fill="currentColor" viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" /></svg>
      </div>

      <header className="mb-20 text-center fade-in relative">
        <div className="absolute top-0 right-0 flex gap-4">
           <button 
             onClick={() => setShowSyncOverlay(true)}
             className={`flex items-center gap-4 px-6 py-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 hover:text-[#F5AFAF] transition-all hover:scale-105 active:scale-95 shadow-sm group ${syncStatus === 'syncing' ? 'ring-2 ring-[#F5AFAF]/20' : ''}`}
             aria-label="Cloud Status"
           >
             <span className="text-xs uppercase tracking-[0.3em] font-bold">
               {syncStatus === 'syncing' ? 'Syncing' : 'Cloud'}
             </span>
             <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${syncStatus === 'syncing' ? 'animate-spin text-[#F5AFAF]' : ''} ${syncStatus === 'error' ? 'text-red-400' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
             </svg>
           </button>

           <button 
             onClick={() => setShowEventsOverlay(true)}
             className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 hover:text-[#F5AFAF] transition-all hover:scale-105 active:scale-95 shadow-sm group"
             aria-label="Toggle Events Overlay"
           >
             <span className="text-xs uppercase tracking-[0.3em] font-bold">Moments</span>
             <div className="flex items-center justify-center bg-stone-100 dark:bg-stone-800 rounded-full h-7 min-w-[28px] px-2 transition-colors group-hover:bg-[#F5AFAF]/10 group-hover:text-[#F5AFAF]">
                <span className="text-xs font-bold">{events.length}</span>
             </div>
           </button>

           <button 
             onClick={() => setIsDarkMode(!isDarkMode)}
             className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 hover:text-[#F5AFAF] transition-all hover:scale-110 active:scale-95 shadow-sm"
             aria-label="Toggle Theme"
           >
             {isDarkMode ? (
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
               </svg>
             ) : (
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
               </svg>
             )}
           </button>

           <button 
             onClick={handleLogout}
             className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 hover:text-red-400 transition-all hover:scale-110 active:scale-95 shadow-sm"
             aria-label="Logout"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
             </svg>
           </button>
        </div>

        <div className="inline-flex items-center justify-center p-6 bg-[#F5AFAF]/10 rounded-full mb-10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#F5AFAF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
          </svg>
        </div>
        <h1 className="text-5xl md:text-8xl font-bold text-stone-800 dark:text-stone-100 tracking-[0.4em] uppercase mb-8">
          DayMark
        </h1>
        <div className="h-0.5 w-32 bg-[#F5AFAF]/20 mx-auto mb-16"></div>
        
        <Countdown upcomingEvents={upcomingEvents} />
      </header>

      {/* Persistent Control Bar Section */}
      <div className="flex flex-col gap-12 mb-20 fade-in w-full">
        {/* View Selection Tabs */}
        <div className="flex items-center justify-center gap-3 bg-white dark:bg-stone-900/40 p-3 rounded-full backdrop-blur-md border border-stone-200 dark:border-stone-800 max-w-lg mx-auto shadow-sm w-full">
          {(['yearly', 'monthly', 'weekly', 'daily'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex-1 px-4 py-3 rounded-full text-xs uppercase tracking-[0.3em] font-bold transition-all duration-500 ${viewMode === mode ? 'bg-[#F5AFAF] text-white shadow-xl' : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/50'}`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Navigation Strip */}
        <div className="flex items-center justify-between w-full gap-8">
          <button onClick={() => navigate(-1)} className="group flex items-center gap-6 text-stone-400 dark:text-stone-700 hover:text-stone-800 dark:hover:text-stone-200 transition-all shrink-0">
            <div className="p-4 rounded-3xl group-hover:bg-[#F5AFAF]/10 transition-colors border border-transparent group-hover:border-[#F5AFAF]/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </div>
            <span className="text-xs uppercase tracking-[0.3em] font-bold hidden xl:inline">Previous</span>
          </button>
          
          <div className="flex flex-col items-center gap-3 text-center flex-1 min-w-0">
            <h2 className="text-3xl md:text-6xl font-bold text-stone-800 dark:text-stone-100 tracking-[0.1em] leading-tight truncate w-full">
              {navLabel}
            </h2>
            <button 
              onClick={jumpToToday}
              className="text-[10px] uppercase tracking-[0.4em] text-[#F5AFAF] hover:text-[#a53860] dark:hover:text-white transition-colors font-bold py-2"
            >
              Back to Today
            </button>
          </div>

          <button onClick={() => navigate(1)} className="group flex items-center gap-6 text-stone-400 dark:text-stone-700 hover:text-stone-800 dark:hover:text-stone-200 transition-all text-right shrink-0">
            <span className="text-xs uppercase tracking-[0.3em] font-bold hidden xl:inline">Next</span>
            <div className="p-4 rounded-3xl group-hover:bg-[#F5AFAF]/10 transition-colors border border-transparent group-hover:border-[#F5AFAF]/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>
        </div>

        {/* Secondary Month Navigator */}
        <div className={`transition-all duration-500 overflow-hidden ${viewMode === 'monthly' ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
          <div className="flex justify-center flex-wrap gap-3 py-2">
            {months.map(m => (
              <button 
                key={m} 
                onClick={() => setViewMonth(m)} 
                className={`px-6 py-2 rounded-full text-[10px] uppercase tracking-[0.3em] font-bold transition-all duration-300 ${viewMonth === m ? 'bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 scale-105 shadow-xl' : 'text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400'}`}
              >
                {formatMonthName(m)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DailyMarkNote date={activeDateStr} onNoteSaved={refreshData} />

      <main className="fade-in min-h-[60vh] w-full" style={{animationDelay: '0.2s'}}>
        {viewMode === 'yearly' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
            {months.map(m => (
              <MonthView 
                key={m} 
                year={viewYear} 
                month={m} 
                events={events} 
                noteDates={noteDates}
                activeDateStr={activeDateStr}
                onDateClick={handleDateClick} 
                clickedDateId={clickedDateId}
                justSavedDateStr={justSavedDateStr}
              />
            ))}
          </div>
        )}

        {viewMode === 'monthly' && (
          <div className="w-full max-w-4xl mx-auto px-4">
             <div className="month-transition" key={`${viewYear}-${viewMonth}`}>
               <MonthView 
                 year={viewYear} 
                 month={viewMonth} 
                 events={events} 
                 noteDates={noteDates}
                 activeDateStr={activeDateStr}
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

      <footer className="mt-32 text-center text-stone-400 dark:text-stone-700 text-[11px] uppercase tracking-[0.6em] pb-32 flex flex-col items-center gap-8">
        <div className="h-px w-20 bg-stone-200 dark:bg-stone-800"></div>
        <div className="flex flex-col gap-4">
          <span className="italic capitalize text-stone-500 text-lg">Mindful Tracking &bull; DayMark &bull; {new Date().getFullYear()}</span>
          <button 
            onClick={handleLogout}
            className="text-[9px] uppercase tracking-[0.3em] text-stone-500 hover:text-[#F5AFAF] transition-colors"
          >
            Lock Workspace
          </button>
        </div>
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

      <SyncOverlay 
        isOpen={showSyncOverlay} 
        onClose={() => setShowSyncOverlay(false)}
        onSyncComplete={refreshData}
      />
    </div>
  );
};

export default App;
