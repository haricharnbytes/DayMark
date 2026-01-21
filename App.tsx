
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
  getDailyNote,
  checkAndPullCloudUpdates
} from './utils/db';
import EventModal, { ICON_MAP } from './components/EventModal';
import Countdown from './components/Countdown';
import DailyMarkNote from './components/DailyMarkNote';
import PomodoroTimer from './components/PomodoroTimer';
import UpcomingEventsOverlay from './components/UpcomingEventsOverlay';
import SyncOverlay from './components/SyncOverlay';
import Login from './components/Login';

type ViewMode = 'yearly' | 'monthly' | 'weekly' | 'daily';

const MonthIcon: React.FC<{ month: number }> = ({ month }) => {
  const icons = [
    // Jan - Star
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
    // Feb - Heart
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />,
    // Mar - Leaf
    <path d="M11 20A7 7 0 014.05 13a2.98 2.98 0 000-2.01A7 7 0 0111 4h1a7 7 0 0111 4h1a7 7 0 017 7 2.99 2.99 0 000 2.01A7 7 0 0112 20h-1z M12 4v16" />,
    // Apr - Flower
    <path d="M12 12m-3 0a3 3 0 106 0a3 3 0 10-6 0 M12 7c-1-4-7-4-8 0s4 7 8 8c4-1 8-4 8-8s-7-4-8 0 M12 17c1 4 7 4 8 0s-4-7-8-8c-4 1-8 4-8 8s7 4 8 0" />,
    // May - Sun
    <path d="M12 12m-4 0a4 4 0 108 0a4 4 0 10-8 0M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />,
    // Jun - Sunglasses
    <path d="M2 10h5a3 3 0 013 3v1a3 3 0 01-3 3H5a3 3 0 01-3-3v-1a3 3 0 013-3z M14 10h5a3 3 0 013 3v1a3 3 0 01-3 3h-2a3 3 0 01-3-3v-1a3 3 0 013-3z M10 13h4" />,
    // Jul - Sparkle
    <path d="M12 3l1.912 5.885L20 10.8l-5.088 1.915L12 18.6l-2.912-5.885L4 10.8l5.088-1.915z M5 3l1 1 M19 3l-1 1 M5 19l1-1 M19 19l-1-1" />,
    // Aug - Bolt
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
    // Sep - Book
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5a2.5 2.5 0 01-2.5-2.5V4.5z" />,
    // Oct - Pumpkin
    <path d="M12 22c-4 0-7-3-7-7s2-8 6-8 2-2 3-2 1 2 1 2 4 1 4 8-3 7-7 7z M12 10v4" />,
    // Nov - Maple Leaf
    <path d="M12 22v-3.5 M12 18.5l2-2.5 3.5.5-1.5-3.5 3-2.5-4-1-1-4-1 4-4 1 3 2.5-1.5 3.5 3.5-.5z" />,
    // Dec - Snowflake
    <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
  ];

  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#a31621] group-hover/month:scale-110 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
    <div className={`${large ? 'p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem]' : 'p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem]'} bg-white dark:bg-stone-900/60 backdrop-blur-md border border-stone-200 dark:border-stone-800 flex flex-col h-full shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-700 ease-out group/month mx-auto w-full`}>
      <div className={`flex items-center justify-between ${large ? 'mb-5 md:mb-8' : 'mb-3 md:mb-4'} px-1`}>
        <div className="flex items-center gap-2 md:gap-3">
          {!large && <MonthIcon month={month} />}
          <h3 className={`${large ? 'text-2xl md:text-3xl' : 'text-[11px] md:text-[12px]'} font-bold text-stone-700 dark:text-stone-200 tracking-[0.15em] md:tracking-[0.2em] uppercase`}>
            {formatMonthName(month)}
          </h3>
        </div>
      </div>
      
      <div className={`grid grid-cols-7 ${large ? 'gap-y-3 md:gap-y-5 gap-x-2 md:gap-x-4' : 'gap-y-1 md:gap-y-2 gap-x-1'} flex-1 text-center`}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
          <div key={`${month}-${d}-${idx}`} className={`${large ? 'text-[11px] md:text-sm' : 'text-[7px] md:text-[8px]'} uppercase tracking-widest text-stone-400 dark:text-stone-600 font-bold mb-1`}>
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
          const primaryEventColor = hasEvents ? (dayEvents[0].color || '#a31621') : '#a31621';
          const hasNote = noteDates.includes(dateStr);
          const today = isToday(year, month, d);
          const active = activeDateStr === dateStr;
          const isClicked = clickedDateId === `${month}-${d}`;
          const isJustSaved = justSavedDateStr === dateStr;

          return (
            <div key={`${month}-${d}`} className="relative group/day">
              <button
                onClick={() => onDateClick(d, month)}
                className={`w-full calendar-date-btn group relative aspect-square flex flex-col items-center justify-center rounded-lg md:rounded-xl overflow-hidden
                  ${isClicked ? 'date-pulse z-20' : ''}
                  ${isJustSaved ? 'success-flourish z-20' : ''}
                  ${active ? 'ring-1 md:ring-2 ring-[#a31621]/60 shadow-lg shadow-[#a31621]/5 z-10' : ''}
                  ${today 
                    ? 'bg-[#a31621] text-white shadow-xl shadow-[#a31621]/30 z-10' 
                    : 'text-stone-400 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-[#a31621]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none ${today ? 'hidden' : ''}`} />
                
                {hasNote && !today && (
                  <div className={`absolute ${large ? 'top-2 right-2 w-2 h-2' : 'top-1 right-1 w-1 h-1'} rounded-full bg-[#a31621]/60 animate-pulse`} />
                )}

                <span className={`relative z-10 ${large ? 'text-xl md:text-2xl' : 'text-[11px] md:text-[14px]'} font-bold`}>
                  {d}
                </span>
                
                <div className={`absolute z-10 ${large ? 'bottom-2 md:bottom-2.5' : 'bottom-1 md:bottom-1.5'} flex gap-1 h-1 items-center justify-center w-full`}>
                  {hasEvents && (
                    <div 
                      className={`rounded-full transition-all ${large ? 'w-1.5 md:w-2 h-1.5 md:h-2 shadow-[0_0_3px_rgba(0,0,0,0.1)]' : 'w-1 h-1 md:w-1.5 md:h-1.5'} ${today ? 'bg-white' : ''}`}
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
    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 md:gap-5 w-full month-transition">
      {weekDays.map((date, idx) => {
        const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const dayEvents = events.filter(e => e.date === dStr);
        const hasNote = noteDates.includes(dStr);
        const today = isToday(date.getFullYear(), date.getMonth(), date.getDate());

        return (
          <div key={idx} onClick={() => onDateClick(date.getDate(), date.getMonth())} className={`p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] bg-white dark:bg-stone-900/40 backdrop-blur-md border border-stone-200 dark:border-stone-800 flex flex-col gap-4 md:gap-5 min-h-[220px] md:min-h-[400px] shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer ${today ? 'ring-2 ring-[#a31621]/40' : ''}`}>
            <div className="flex flex-col">
              <span className="text-[11px] md:text-[12px] uppercase tracking-widest text-stone-400 dark:text-stone-500 font-bold mb-1.5">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <div className="flex items-center gap-3">
                <span className={`text-3xl md:text-5xl font-bold ${today ? 'text-[#a31621]' : 'text-stone-700 dark:text-stone-200'}`}>
                  {date.getDate()}
                </span>
                {hasNote && <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#a31621] mt-1.5" title="Journal Mark" />}
              </div>
            </div>
            <div className="flex flex-col gap-2 md:gap-3 flex-1 mt-3 md:mt-5">
              {dayEvents.map(e => (
                <div 
                  key={e.id} 
                  onClick={(event) => handleEventClick(event, e.id)}
                  className={`text-[11px] md:text-[13px] p-3 md:p-4 rounded-xl md:rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/50 text-stone-600 dark:text-stone-300 transition-all duration-300 ${expandedEventId === e.id ? 'shadow-inner' : 'truncate'}`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-2.5 h-2.5 md:w-2.5 md:h-2.5 rounded-full shrink-0 border border-black/5 dark:border-white/10" style={{ backgroundColor: e.color || '#a31621' }} />
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
    <div className="max-w-4xl mx-auto bg-white dark:bg-stone-900/40 backdrop-blur-md p-8 md:p-16 rounded-[3rem] md:rounded-[4rem] border border-stone-200 dark:border-stone-800 shadow-2xl month-transition cursor-pointer" onClick={() => onDateClick(day, month)}>
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 md:gap-10 mb-10 md:mb-20">
        <div>
          <h3 className="text-stone-400 dark:text-stone-500 text-[11px] md:text-[14px] uppercase tracking-[0.4em] font-bold mb-3 md:mb-4">Daily View</h3>
          <h2 className="text-4xl md:text-7xl font-bold text-stone-800 dark:text-stone-100">
            {new Date(dStr + 'T12:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'long', weekday: 'long' })}
          </h2>
          {hasNote && <p className="text-[#a31621] text-[11px] md:text-[13px] uppercase tracking-[0.3em] font-bold mt-3 md:mt-4">Marked Day</p>}
        </div>
        {today && <span className="w-fit bg-[#a31621] text-white px-8 md:px-9 py-3 md:py-3.5 rounded-full text-[11px] md:text-[12px] uppercase tracking-[0.3em] font-bold shadow-xl shadow-[#a31621]/30">Today</span>}
      </div>

      {noteContent && (
        <div className="mb-10 md:mb-16 p-8 md:p-10 bg-stone-50 dark:bg-stone-800/50 rounded-[2rem] md:rounded-[3rem] border border-stone-100 dark:border-stone-800">
          <span className="text-[11px] md:text-[12px] uppercase tracking-[0.3em] text-[#a31621] font-bold block mb-5 md:mb-6">Reflection</span>
          <p className="font-serif italic text-stone-600 dark:text-stone-300 text-2xl md:text-2xl leading-relaxed">
            {noteContent}
          </p>
        </div>
      )}

      <div className="space-y-10 md:space-y-14">
        <div className="flex justify-between items-center mb-8 md:mb-10">
          <h3 className="text-[11px] md:text-[12px] uppercase tracking-[0.3em] text-stone-400 dark:text-stone-500 font-bold">Recorded Moments</h3>
          <button 
            className="text-[11px] md:text-[12px] uppercase tracking-widest text-[#a31621] font-bold bg-[#a31621]/10 px-6 md:px-7 py-2.5 rounded-full hover:bg-[#a31621]/20 transition-all"
            onClick={(e) => { e.stopPropagation(); onDateClick(day, month); }}
          >
            Add New
          </button>
        </div>
        {dayEvents.length > 0 ? dayEvents.map(e => {
          const status = getMomentStatus(e);
          return (
            <div key={e.id} className="flex gap-6 md:gap-12 items-start group cursor-pointer" onClick={(event) => { event.stopPropagation(); onDateClick(day, month, e); }}>
              <div className="text-[12px] md:text-[15px] font-bold text-stone-400 dark:text-stone-600 tracking-widest pt-2 md:pt-2.5 w-20 md:w-28 text-right shrink-0 tabular-nums">
                {e.startTime || 'Day'}
              </div>
              <div className="flex-1 pb-10 md:pb-12 border-b border-stone-100 dark:border-stone-800 last:border-0">
                <div className="flex items-center justify-between mb-4 md:mb-5">
                  <div className="flex items-center gap-4 md:gap-5">
                    <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full transition-transform duration-500 group-hover:scale-125 border border-black/5 dark:border-white/10 ${status === 'passed' ? 'opacity-40' : ''}`} style={{ backgroundColor: e.color || '#a31621' }} />
                    <h4 className={`text-2xl md:text-4xl font-bold transition-opacity duration-500 ${status === 'passed' ? 'text-stone-400 dark:text-stone-600' : 'text-stone-700 dark:text-stone-200'}`}>{e.title}</h4>
                  </div>
                  {status === 'active' && (
                    <span className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] bg-[#a31621]/10 text-[#a31621] px-4 md:px-5 py-1.5 md:py-2 rounded-full font-bold animate-pulse">Live</span>
                  )}
                </div>
                <p className={`text-lg md:text-xl leading-relaxed italic truncate transition-opacity duration-500 ${status === 'passed' ? 'text-stone-300 dark:text-stone-700' : 'text-stone-500 dark:text-stone-400'}`}>
                  {e.description || '...'}
                </p>
              </div>
            </div>
          );
        }) : (
          <div className="py-20 md:py-32 text-center text-stone-300 dark:text-stone-700">
            <p className="italic text-3xl md:text-4xl mb-6 md:mb-8 opacity-30">A clean slate...</p>
            <p className="text-[11px] md:text-[12px] uppercase tracking-[0.4em] font-bold opacity-50">Tap anywhere to record</p>
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
  
  // Real-time Clock State
  const [now, setNow] = useState(new Date());

  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'synced'>('idle');
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
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

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
    const onStart = () => setSyncStatus('syncing');
    const onEnd = () => { 
      setSyncStatus('synced'); 
      refreshData();
      setTimeout(() => setSyncStatus('idle'), 3000);
    };
    const onError = () => setSyncStatus('error');

    window.addEventListener('daymark-sync-start', onStart);
    window.addEventListener('daymark-sync-complete', onEnd);
    window.addEventListener('daymark-sync-error', onError);

    // Setup background polling for bi-directional sync (every 15s)
    const pollInterval = setInterval(() => {
      if (isAuthenticated) checkAndPullCloudUpdates();
    }, 15000);

    return () => {
      window.removeEventListener('daymark-sync-start', onStart);
      window.removeEventListener('daymark-sync-complete', onEnd);
      window.removeEventListener('daymark-sync-error', onError);
      clearInterval(pollInterval);
    };
  }, [refreshData, isAuthenticated]);

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

  // Calculate clock hand rotations
  const hourDeg = (now.getHours() % 12) * 30 + now.getMinutes() * 0.5;
  const minDeg = now.getMinutes() * 6;
  const secDeg = now.getSeconds() * 6;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-12">
          <div className="w-20 h-20 border-t-2 border-[#a31621] rounded-full animate-spin"></div>
          <div className="text-[#a31621] tracking-[0.5em] uppercase text-sm font-bold animate-pulse">Entering DayMark</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-stone-800 dark:text-stone-200 px-6 md:px-20 py-8 md:py-16 w-full selection:bg-[#a31621]/20 overflow-x-hidden transition-colors duration-1000">
      
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-[0.03] overflow-hidden -z-10">
        <svg className="absolute -top-48 -right-48 w-[40rem] md:w-[60rem] h-[40rem] md:h-[60rem] text-[#a31621]" fill="currentColor" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" /></svg>
        <svg className="absolute -bottom-48 -left-48 w-[40rem] md:w-[60rem] h-[40rem] md:h-[60rem] text-[#a31621]" fill="currentColor" viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" /></svg>
      </div>

      {/* HEADER SECTION */}
      <header className="mb-12 md:mb-16 text-center fade-in relative min-h-[140px] md:min-h-[80px]">
        {/* Top Control Bar (Floating) */}
        <div className="flex flex-wrap justify-center md:absolute md:top-0 md:left-0 gap-3 md:gap-4 mb-6 md:mb-0">
           <button 
             onClick={() => setShowSyncOverlay(true)}
             className={`flex items-center gap-3 md:gap-4 px-4 md:px-5 py-3 md:py-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 hover:text-[#a31621] transition-all hover:scale-105 active:scale-95 shadow-sm group ${syncStatus === 'syncing' ? 'ring-2 ring-[#a31621]/20' : ''}`}
             aria-label="Cloud Status"
           >
             <span className="text-[10px] uppercase tracking-[0.25em] font-bold whitespace-nowrap">
               {syncStatus === 'syncing' ? 'Sync' : 'Cloud'}
             </span>
             <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${syncStatus === 'syncing' ? 'animate-spin text-[#a31621]' : ''} ${syncStatus === 'error' ? 'text-red-400' : ''} ${syncStatus === 'synced' ? 'text-green-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
             </svg>
           </button>

           <button 
             onClick={() => setShowEventsOverlay(true)}
             className="flex items-center gap-3 md:gap-4 px-4 md:px-5 py-3 md:py-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 hover:text-[#a31621] transition-all hover:scale-105 active:scale-95 shadow-sm group"
             aria-label="Toggle Events Overlay"
           >
             <span className="text-[10px] uppercase tracking-[0.25em] font-bold whitespace-nowrap">Moments</span>
             <div className="flex items-center justify-center bg-stone-100 dark:bg-stone-800 rounded-full h-6 md:h-7 min-w-[24px] md:min-w-[28px] px-2 transition-colors group-hover:bg-[#a31621]/10 group-hover:text-[#a31621]">
                <span className="text-[10px] md:text-xs font-bold">{events.length}</span>
             </div>
           </button>
        </div>

        <div className="flex flex-wrap justify-center md:absolute md:top-0 md:right-0 gap-3 md:gap-4 mb-8 md:mb-0">
           <button 
             onClick={() => setIsDarkMode(!isDarkMode)}
             className="p-3 md:p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 hover:text-[#a31621] transition-all hover:scale-110 active:scale-95 shadow-sm"
             aria-label="Toggle Theme"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
             </svg>
           </button>

           <button 
             onClick={handleLogout}
             className="p-3 md:p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 hover:text-red-400 transition-all hover:scale-110 active:scale-95 shadow-sm"
             aria-label="Logout"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4" />
             </svg>
           </button>
        </div>

        {/* Scaled Brand Mark Clock (Compact) */}
        <div className="group relative inline-flex flex-col items-center justify-center p-6 md:p-7 bg-white dark:bg-stone-900 rounded-[2.5rem] mb-4 md:mb-6 shadow-2xl border border-stone-100 dark:border-stone-800 transition-all duration-700 hover:scale-105">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 md:h-14 md:w-14 text-stone-800 dark:text-stone-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="11" strokeWidth="0.2" strokeOpacity="0.1" />
            
            {/* Hands */}
            <line 
              x1="12" y1="12" x2="12" y2="8" 
              strokeWidth="1.8" 
              strokeLinecap="round"
              style={{ transformOrigin: '12px 12px', transform: `rotate(${hourDeg}deg)` }}
              className="transition-transform duration-1000"
            />
            <line 
              x1="12" y1="12" x2="12" y2="5" 
              strokeWidth="1" 
              strokeLinecap="round"
              style={{ transformOrigin: '12px 12px', transform: `rotate(${minDeg}deg)` }}
              className="transition-transform duration-500"
            />
            <line 
              x1="12" y1="12" x2="12" y2="4.5" 
              stroke="#a31621"
              strokeWidth="0.5" 
              strokeLinecap="round"
              style={{ transformOrigin: '12px 12px', transform: `rotate(${secDeg}deg)` }}
              className="transition-transform duration-75"
            />
            <circle cx="12" cy="12" r="0.8" fill="#a31621" />
          </svg>

          {/* Symmetrical Time Display */}
          <div className="mt-4">
            <span className="text-xl md:text-2xl font-bold tracking-[0.2em] text-stone-300 dark:text-stone-700 tabular-nums">
              {now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          <div className="absolute inset-0 rounded-[2.5rem] bg-[#a31621]/5 animate-pulse -z-10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-stone-800 dark:text-stone-100 tracking-[0.3em] md:tracking-[0.4em] uppercase mb-4 md:mb-6">
          DayMark
        </h1>
        <div className="h-0.5 w-12 md:w-32 bg-[#a31621]/20 mx-auto mb-10 md:mb-12"></div>
        
        <Countdown upcomingEvents={upcomingEvents} />
      </header>

      {/* PERSISTENT CONTROL BAR (Tightened Spacing) */}
      <div className="flex flex-col gap-8 md:gap-12 mb-12 md:mb-16 fade-in w-full max-w-7xl mx-auto">
        {/* View Selection */}
        <div className="flex items-center justify-center gap-2 md:gap-3 bg-white dark:bg-stone-900/40 p-2 md:p-3 rounded-[2rem] backdrop-blur-md border border-stone-200 dark:border-stone-800 max-w-lg mx-auto shadow-sm w-full">
          {(['yearly', 'monthly', 'weekly', 'daily'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex-1 px-4 md:px-5 py-2.5 md:py-3 rounded-full text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold transition-all duration-500 ${viewMode === mode ? 'bg-[#a31621] text-white shadow-xl' : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/50'}`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Navigation Strip */}
        <div className="flex items-center justify-between w-full gap-4 md:gap-8 px-4">
          <button onClick={() => navigate(-1)} className="group flex items-center gap-4 text-stone-400 dark:text-stone-700 hover:text-stone-800 dark:hover:text-stone-200 transition-all shrink-0">
            <div className="p-3 md:p-4 rounded-[1.5rem] group-hover:bg-[#a31621]/10 transition-colors border border-transparent">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
            </div>
          </button>
          
          <div className="flex flex-col items-center gap-1 md:gap-3 text-center flex-1 min-w-0">
            <h2 className="text-2xl md:text-5xl font-bold text-stone-800 dark:text-stone-100 tracking-[0.05em] md:tracking-[0.1em] leading-tight truncate w-full">
              {navLabel}
            </h2>
            <button 
              onClick={jumpToToday}
              className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-[#a31621] hover:text-[#a53860] transition-colors font-bold py-1.5"
            >
              Today
            </button>
          </div>

          <button onClick={() => navigate(1)} className="group flex items-center gap-4 text-stone-400 dark:text-stone-700 hover:text-stone-800 dark:hover:text-stone-200 transition-all text-right shrink-0">
            <div className="p-3 md:p-4 rounded-[1.5rem] group-hover:bg-[#a31621]/10 transition-colors border border-transparent">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>
        </div>
      </div>

      {/* FEATURE ROW (Tightened Bottom Margin) */}
      <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 md:gap-10 max-w-5xl mx-auto mb-16 md:mb-20 px-4 w-full h-auto">
        <div className="flex-1 min-w-0 flex items-stretch">
          <PomodoroTimer />
        </div>
        <div className="flex-1 min-w-0 flex items-stretch">
          <DailyMarkNote date={activeDateStr} onNoteSaved={refreshData} />
        </div>
      </div>

      {/* MAIN CALENDAR CONTENT */}
      <main className="fade-in min-h-[50vh] w-full max-w-[1500px] mx-auto" style={{animationDelay: '0.2s'}}>
        {viewMode === 'yearly' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-8 w-full px-4">
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
          <div className="w-full max-w-5xl mx-auto px-4 md:px-8">
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
          <div className="px-4 md:px-8">
            <WeeklyView year={viewYear} month={viewMonth} day={viewDay} events={events} noteDates={noteDates} onDateClick={handleDateClick} />
          </div>
        )}

        {viewMode === 'daily' && (
          <div className="px-4 md:px-8">
            <DailyView year={viewYear} month={viewMonth} day={viewDay} events={events} noteDates={noteDates} onDateClick={handleDateClick} />
          </div>
        )}
      </main>

      <footer className="mt-16 md:mt-32 text-center text-stone-400 dark:text-stone-700 text-[10px] md:text-xs uppercase tracking-[0.5em] pb-16 md:pb-32 flex flex-col items-center gap-10">
        <div className="h-px w-20 md:w-32 bg-stone-200 dark:bg-stone-800"></div>
        <div className="flex flex-col gap-4">
          <span className="italic capitalize text-stone-500 text-lg md:text-2xl">Mindful Tracking &bull; DayMark </span>
          
          <div className="flex flex-col gap-2">
             <span className="text-[10px] md:text-sm tracking-[0.3em] font-bold text-stone-500">Hari Charan Katta &bull; {new Date().getFullYear()}</span>
          </div>
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
