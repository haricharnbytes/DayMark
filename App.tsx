
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
import ContributionGraph from './components/ContributionGraph';
import ImportantMoments from './components/ImportantMoments';
import Login from './components/Login';

type ViewMode = 'yearly' | 'monthly' | 'weekly' | 'daily';

const MonthIcon: React.FC<{ month: number }> = ({ month }) => {
  const icons = [
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />,
    <path d="M11 20A7 7 0 014.05 13a2.98 2.98 0 000-2.01A7 7 0 0111 4h1a7 7 0 0111 4h1a7 7 0 017 7 2.99 2.99 0 000 2.01A7 7 0 0112 20h-1z M12 4v16" />,
    <path d="M12 12m-3 0a3 3 0 106 0a3 3 0 10-6 0 M12 7c-1-4-7-4-8 0s4 7 8 8c4-1 8-4 8-8s-7-4-8 0 M12 17c1 4 7 4 8 0s-4-7-8-8c-4 1-8 4-8 8s7 4 8 0" />,
    <path d="M12 12m-4 0a4 4 0 108 0a4 4 0 10-8 0M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />,
    <path d="M2 10h5a3 3 0 013 3v1a3 3 0 01-3 3H5a3 3 0 01-3-3v-1a3 3 0 013-3z M14 10h5a3 3 0 013 3v1a3 3 0 01-3 3h-2a3 3 0 01-3-3v-1a3 3 0 013-3z M10 13h4" />,
    <path d="M12 3l1.912 5.885L20 10.8l-5.088 1.915L12 18.6l-2.912-5.885L4 10.8l5.088-1.915z M5 3l1 1 M19 3l-1 1 M5 19l1-1 M19 19l-1-1" />,
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5a2.5 2.5 0 01-2.5-2.5V4.5z" />,
    <path d="M12 22c-4 0-7-3-7-7s2-8 6-8 2-2 3-2 1 2 1 2 4 1 4 8-3 7-7 7z M12 10v4" />,
    <path d="M12 22v-3.5 M12 18.5l2-2.5 3.5.5-1.5-3.5 3-2.5-4-1-1-4-1 4-4 1 3 2.5-1.5 3.5 3.5-.5z" />,
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
                  ${active ? 'ring-1 md:ring-2 ring-[#a31621]/60 shadow-lg z-10' : ''}
                  ${today 
                    ? 'bg-[#a31621] text-white shadow-xl z-10' 
                    : 'text-stone-400 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
              >
                {/* Event Mark strictly for events */}
                {hasEvents && !today && (
                  <div className={`absolute ${large ? 'top-2 right-2 w-2 h-2' : 'top-1 right-1 w-1 h-1'} rounded-full bg-[#a31621]/80 animate-pulse`} />
                )}

                <span className={`relative z-10 ${large ? 'text-xl md:text-2xl' : 'text-[11px] md:text-[14px]'} font-bold`}>
                  {d}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const WeeklyView: React.FC<{ year: number, month: number, day: number, events: CalendarEvent[], noteDates: string[], onDateClick: (d: number, m: number, eventToEdit?: CalendarEvent) => void }> = ({ year, month, day, events, noteDates, onDateClick }) => {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 md:gap-5 w-full month-transition">
      {weekDays.map((date, idx) => {
        const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const dayEvents = events.filter(e => e.date === dStr);
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
                {dayEvents.length > 0 && <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#a31621] mt-1.5" />}
              </div>
            </div>
            <div className="flex flex-col gap-2 md:gap-3 flex-1 mt-3 md:mt-5">
              {dayEvents.map(e => (
                <div key={e.id} className="text-[11px] md:text-[13px] p-3 md:p-4 rounded-xl md:rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/50 text-stone-600 dark:text-stone-300 truncate">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: e.color || '#a31621' }} />
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
  const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const dayEvents = events.filter(e => e.date === dStr).sort((a,b) => (a.startTime || '').localeCompare(b.startTime || ''));
  const today = isToday(year, month, day);

  useEffect(() => {
    getDailyNote(dStr).then(setNoteContent);
  }, [dStr, noteDates]);

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-stone-900/40 backdrop-blur-md p-8 md:p-16 rounded-[3rem] md:rounded-[4rem] border border-stone-200 dark:border-stone-800 shadow-2xl month-transition cursor-pointer" onClick={() => onDateClick(day, month)}>
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 md:gap-10 mb-10 md:mb-20">
        <div>
          <h3 className="text-stone-400 dark:text-stone-500 text-[11px] md:text-[14px] uppercase tracking-[0.4em] font-bold mb-3 md:mb-4">Daily View</h3>
          <h2 className="text-4xl md:text-7xl font-bold text-stone-800 dark:text-stone-100">
            {new Date(dStr + 'T12:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'long', weekday: 'long' })}
          </h2>
        </div>
        {today && <span className="w-fit bg-[#a31621] text-white px-8 md:px-9 py-3 md:py-3.5 rounded-full text-[11px] md:text-[12px] uppercase tracking-[0.3em] font-bold shadow-xl shadow-[#a31621]/30">Today</span>}
      </div>

      {noteContent && (
        <div className="mb-10 md:mb-16 p-8 md:p-10 bg-stone-50 dark:bg-stone-800/50 rounded-[2rem] md:rounded-[3rem] border border-stone-100 dark:border-stone-800">
          <span className="text-[11px] md:text-[12px] uppercase tracking-[0.3em] text-[#a31621] font-bold block mb-5 md:mb-6">Reflection</span>
          <p className="font-serif italic text-stone-600 dark:text-stone-300 text-2xl md:text-2xl leading-relaxed">"{noteContent}"</p>
        </div>
      )}

      <div className="space-y-10 md:space-y-14">
        {dayEvents.length > 0 ? dayEvents.map(e => (
          <div key={e.id} className="flex gap-6 md:gap-12 items-start group border-b border-stone-50 dark:border-stone-800 pb-10 md:pb-12 last:border-0">
            <div className="text-[12px] md:text-[15px] font-bold text-stone-400 tracking-widest pt-2 w-20 md:w-28 text-right shrink-0">{e.startTime || 'Day'}</div>
            <div className="flex-1">
              <div className="flex items-center gap-4 md:gap-5 mb-3 md:mb-4">
                <div className="w-4 h-4 md:w-5 md:h-5 rounded-full" style={{ backgroundColor: e.color || '#a31621' }} />
                <h4 className="text-2xl md:text-4xl font-bold text-stone-700 dark:text-stone-200">{e.title}</h4>
              </div>
              <p className="text-lg md:text-xl text-stone-400 mt-1 italic">{e.description || '...'}</p>
            </div>
          </div>
        )) : (
          <div className="py-20 md:py-32 text-center text-stone-300 dark:text-stone-700">
             <p className="italic text-3xl md:text-4xl mb-6 md:mb-8 opacity-30">A clean slate...</p>
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('daymark_auth') === 'true');
  const [viewMode, setViewMode] = useState<ViewMode>('yearly');
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewDay, setViewDay] = useState(new Date().getDate());
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isSyncingUI, setIsSyncingUI] = useState(false);
  const [now, setNow] = useState(new Date());
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
    const [storedEvents, storedNoteDates] = await Promise.all([
      getAllEvents(),
      getAllNoteDates()
    ]);
    setEvents(storedEvents || []);
    setNoteDates(storedNoteDates || []);
  }, [isAuthenticated]);

  // Enhanced Real-time background sync polling
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Poll every 10 seconds for cloud updates
    const syncInterval = setInterval(() => {
      checkAndPullCloudUpdates();
    }, 10000);

    const handleSyncStart = () => setIsSyncingUI(true);
    const handleSyncComplete = () => {
      setIsSyncingUI(false);
      refreshData();
    };
    const handleSyncError = () => setIsSyncingUI(false);

    window.addEventListener('daymark-sync-start', handleSyncStart);
    window.addEventListener('daymark-sync-complete', handleSyncComplete);
    window.addEventListener('daymark-sync-error', handleSyncError);
    window.addEventListener('daymark-local-update', handleSyncComplete);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('daymark-sync-start', handleSyncStart);
      window.removeEventListener('daymark-sync-complete', handleSyncComplete);
      window.removeEventListener('daymark-sync-error', handleSyncError);
      window.removeEventListener('daymark-local-update', handleSyncComplete);
    };
  }, [isAuthenticated, refreshData]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    refreshData().then(() => setIsLoading(false));
  }, [refreshData]);

  const navigate = useCallback((offset: number) => {
    if (viewMode === 'yearly') setViewYear(prev => prev + offset);
    else if (viewMode === 'monthly') {
      const d = new Date(viewYear, viewMonth + offset, 1);
      setViewYear(d.getFullYear()); setViewMonth(d.getMonth());
    } else if (viewMode === 'weekly') {
      const d = new Date(viewYear, viewMonth, viewDay + (offset * 7));
      setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); setViewDay(d.getDate());
    } else {
      const d = new Date(viewYear, viewMonth, viewDay + offset);
      setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); setViewDay(d.getDate());
    }
  }, [viewMode, viewYear, viewMonth, viewDay]);

  const activeDateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(viewDay).padStart(2, '0')}`;
  const upcomingEvents = useMemo(() => getNextEvents(events, 10), [events]);

  const handleDateClick = (day: number, month: number, eventToEdit?: CalendarEvent) => {
    setViewDay(day); setViewMonth(month);
    setSelectedDate(`${viewYear}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    setEditingEvent(eventToEdit || null);
    setIsModalOpen(true);
    setClickedDateId(`${month}-${day}`);
    setTimeout(() => setClickedDateId(null), 300);
  };

  const handleEditEventFromOverlay = (event: CalendarEvent) => {
    const d = new Date(event.date + 'T12:00:00');
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setViewDay(d.getDate());
    setSelectedDate(event.date);
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleSaveEvent = useCallback(async (event: CalendarEvent) => {
    await saveEventToDB(event);
    await refreshData();
    setJustSavedDateStr(event.date);
    setTimeout(() => setJustSavedDateStr(null), 2000);
  }, [refreshData]);

  const handleDeleteEvent = useCallback(async (id: string) => {
    await deleteEventFromDB(id);
    await refreshData();
  }, [refreshData]);

  const handleLogout = () => {
    localStorage.removeItem('daymark_auth');
    setIsAuthenticated(false);
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="w-12 h-12 border-t-2 border-[#a31621] rounded-full animate-spin"></div></div>;
  if (!isAuthenticated) return <Login onLogin={() => setIsAuthenticated(true)} />;

  const hourDeg = (now.getHours() % 12) * 30 + now.getMinutes() * 0.5;
  const minDeg = now.getMinutes() * 6;
  const secDeg = now.getSeconds() * 6;

  const markers = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-stone-800 dark:text-stone-200 px-6 md:px-20 py-8 md:py-16 selection:bg-[#a31621]/20 overflow-x-hidden transition-colors duration-1000">
      
      {/* HEADER */}
      <header className="mb-8 md:mb-16 text-center relative">
        <div className="flex flex-col items-center md:items-start justify-center md:absolute md:top-0 md:left-0 gap-4 md:gap-5 mb-8 md:mb-0">
           <div className="flex gap-4 md:gap-5 relative">
             <button onClick={() => setShowSyncOverlay(true)} className="px-6 py-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-[11px] uppercase tracking-[0.25em] font-bold hover:bg-stone-50 transition-all shadow-sm flex items-center gap-3">
               Sync
               {isSyncingUI && <div className="w-1.5 h-1.5 rounded-full bg-[#a31621] animate-ping" />}
             </button>
             <button onClick={() => setShowEventsOverlay(true)} className="px-6 py-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-[11px] uppercase tracking-[0.25em] font-bold hover:bg-stone-50 transition-all shadow-sm">Moments ({events.length})</button>
           </div>
           
           <div className="hidden md:block">
             <ImportantMoments events={events} onEditEvent={handleEditEventFromOverlay} />
           </div>
        </div>

        {/* Top Right Utility Buttons with Tooltips */}
        <div className="flex justify-center md:absolute md:top-0 md:right-0 gap-4 md:gap-5 mb-10 md:mb-0">
           {/* Theme Toggle Button with Tooltip */}
           <div className="relative group/toggle">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:text-[#a31621] transition-all shadow-sm">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              </button>
              <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/toggle:opacity-100 transition-all duration-300 text-[8px] uppercase tracking-[0.4em] text-stone-400 dark:text-stone-500 font-black pointer-events-none whitespace-nowrap bg-white/80 dark:bg-stone-900/80 px-3 py-1.5 rounded-lg border border-stone-100 dark:border-stone-800 shadow-sm">
                Theme
              </span>
           </div>

           {/* Enhanced Sign Out Button with Tooltip */}
           <div className="relative group/logout">
              <button onClick={handleLogout} className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-400 dark:text-stone-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-200 dark:hover:border-red-900/40 transition-all shadow-sm">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 group-hover/logout:stroke-[2.5px] transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4" /></svg>
              </button>
              <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/logout:opacity-100 transition-all duration-300 text-[8px] uppercase tracking-[0.4em] text-red-400/80 dark:text-red-900/80 font-black pointer-events-none whitespace-nowrap bg-white/80 dark:bg-stone-900/80 px-3 py-1.5 rounded-lg border border-red-50 dark:border-red-900/20 shadow-sm">
                Sign Out
              </span>
           </div>
        </div>

        {/* SWISS STUDIO CLOCK */}
        <div className="inline-flex flex-col items-center bg-white/40 dark:bg-stone-900/60 backdrop-blur-3xl rounded-[4rem] p-8 md:p-10 border border-stone-100 dark:border-stone-800 mb-10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] dark:shadow-[0_40px_80px_-20px_rgba(163,22,33,0.15)] transition-all duration-1000 hover:scale-[1.01] group/clock relative">
          
          <div className="relative">
            <svg className="h-24 w-24 md:h-36 md:w-36 text-stone-800 dark:text-stone-200 overflow-visible" viewBox="0 0 100 100">
              <defs>
                <radialGradient id="dialGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
                </radialGradient>
                <filter id="handShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0.5" dy="0.5" stdDeviation="0.5" floodOpacity="0.2" />
                </filter>
              </defs>

              <circle cx="50" cy="50" r="48" fill="url(#dialGradient)" stroke="currentColor" strokeWidth="0.1" opacity="0.4" />
              
              {markers.map(m => (
                <line 
                  key={`track-${m}`}
                  x1="50" y1="2" x2="50" y2={m % 5 === 0 ? "8" : "5"} 
                  stroke="currentColor" 
                  strokeWidth={m % 5 === 0 ? "0.8" : "0.2"} 
                  strokeLinecap="round"
                  opacity={m % 5 === 0 ? "0.8" : "0.3"}
                  style={{ transformOrigin: '50px 50px', transform: `rotate(${m * 6}deg)` }} 
                />
              ))}

              <text x="50" y="32" textAnchor="middle" fontSize="2.5" fontWeight="900" fill="currentColor" opacity="0.2" letterSpacing="4">CHRONO-MARK</text>
              <text x="50" y="68" textAnchor="middle" fontSize="1.8" fontWeight="bold" fill="currentColor" opacity="0.1" letterSpacing="2">EST. 2026</text>

              <g style={{ transformOrigin: '50px 50px', transform: `rotate(${hourDeg}deg)` }} className="transition-transform duration-1000" filter="url(#handShadow)">
                <path d="M50 50 L50 24" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
                <circle cx="50" cy="50" r="1.8" fill="currentColor" />
              </g>

              <g style={{ transformOrigin: '50px 50px', transform: `rotate(${minDeg}deg)` }} className="transition-transform duration-500" filter="url(#handShadow)">
                <path d="M50 50 L50 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </g>

              <g style={{ transformOrigin: '50px 50px', transform: `rotate(${secDeg}deg)` }} className="transition-transform duration-75">
                <line x1="50" y1="64" x2="50" y2="6" stroke="#a31621" strokeWidth="0.6" strokeLinecap="round" />
                <circle cx="50" cy="50" r="2.2" fill="#a31621" />
                <circle cx="50" cy="50" r="0.8" fill="white" />
                <path d="M50 64 L50 58" stroke="#a31621" strokeWidth="1.5" strokeLinecap="round" />
              </g>
            </svg>
          </div>
          
          <div className="mt-8 flex flex-col items-center gap-2">
            <span className="text-[11px] font-bold tabular-nums tracking-[0.6em] text-stone-400 dark:text-stone-600 uppercase border-y border-stone-100/40 dark:border-stone-800/40 py-2 px-5">
              {now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="text-[7px] tracking-[0.8em] text-stone-300 dark:text-stone-700 font-black uppercase mt-1">Swiss Design</span>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-semibold tracking-[0.25em] uppercase mb-4 text-stone-800 dark:text-stone-100">DayMark</h1>
        <div className="h-[4px] w-24 bg-[#a31621]/15 mx-auto mb-12 rounded-full"></div>
        <Countdown upcomingEvents={upcomingEvents} />
      </header>

      {/* MOBILE ONLY IMPORTANT MOMENTS */}
      <div className="md:hidden mb-12 flex justify-center px-6">
        <ImportantMoments events={events} onEditEvent={handleEditEventFromOverlay} />
      </div>

      {/* CONTROL BAR */}
      <div className="flex flex-col gap-5 md:gap-6 mb-16 w-full max-w-4xl mx-auto">
        <div className="flex justify-center gap-2 bg-stone-50 dark:bg-stone-900/40 p-1.5 rounded-full border border-stone-200 dark:border-stone-800 max-w-xs mx-auto w-full shadow-inner">
          {(['yearly', 'monthly', 'weekly', 'daily'] as ViewMode[]).map((mode) => (
            <button key={mode} onClick={() => setViewMode(mode)} className={`flex-1 px-3 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all ${viewMode === mode ? 'bg-[#a31621] text-white shadow-xl' : 'text-stone-400 hover:text-stone-600'}`}>{mode}</button>
          ))}
        </div>

        <div className="flex items-center justify-between w-full px-6">
          <button onClick={() => navigate(-1)} className="p-4 rounded-2xl hover:bg-stone-50 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg></button>
          <div className="text-center">
            <h2 className="text-3xl md:text-6xl font-bold tracking-tight text-stone-800 dark:text-stone-100">{viewMode === 'daily' ? new Date(activeDateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : (viewMode === 'monthly' ? `${formatMonthName(viewMonth)} ${viewYear}` : viewYear)}</h2>
            <button onClick={() => { const t = new Date(); setViewYear(t.getFullYear()); setViewMonth(t.getMonth()); setViewDay(t.getDate()); refreshData(); }} className="text-[12px] uppercase tracking-[0.4em] text-[#a31621] font-bold hover:text-[#7d1119] transition-colors mt-4">Today</button>
          </div>
          <button onClick={() => navigate(1)} className="p-4 rounded-2xl hover:bg-stone-50 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg></button>
        </div>
      </div>

      {/* FEATURE ROW */}
      <div className="flex flex-col md:flex-row items-stretch justify-center gap-8 md:gap-12 max-w-5xl mx-auto mb-12 px-4">
        <div className="flex-1 flex items-stretch"><PomodoroTimer /></div>
        <div className="flex-1 flex items-stretch"><DailyMarkNote date={activeDateStr} onNoteSaved={refreshData} /></div>
      </div>

      {/* CONTRIBUTION GRAPH */}
      <ContributionGraph noteDates={noteDates} />

      {/* CALENDAR AREA */}
      <main className="min-h-[30vh] max-w-[1500px] mx-auto">
        {viewMode === 'yearly' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
            {Array.from({length: 12}, (_, i) => i).map(m => (
              <MonthView key={m} year={viewYear} month={m} events={events} noteDates={noteDates} activeDateStr={activeDateStr} onDateClick={handleDateClick} clickedDateId={clickedDateId} justSavedDateStr={justSavedDateStr} />
            ))}
          </div>
        ) : (
          viewMode === 'monthly' ? <div className="max-w-4xl mx-auto px-4"><MonthView year={viewYear} month={viewMonth} events={events} noteDates={noteDates} activeDateStr={activeDateStr} onDateClick={handleDateClick} clickedDateId={clickedDateId} justSavedDateStr={justSavedDateStr} large /></div> :
          (viewMode === 'weekly' ? <div className="px-4"><WeeklyView year={viewYear} month={viewMonth} day={viewDay} events={events} noteDates={noteDates} onDateClick={handleDateClick} /></div> : <div className="px-4"><DailyView year={viewYear} month={viewMonth} day={viewDay} events={events} noteDates={noteDates} onDateClick={handleDateClick} /></div>)
        )}
      </main>

      {/* FOOTER */}
      <footer className="mt-32 md:mt-64 text-center text-stone-400 text-[11px] uppercase tracking-[0.5em] pb-24 border-t border-stone-50 dark:border-stone-900 pt-24">
        <div className="flex flex-col items-center gap-10">
          <p className="italic font-serif text-stone-500 text-3xl">DayMark</p>
          <div className="flex flex-col gap-5 items-center">
             <p className="font-bold text-stone-600 dark:text-stone-500 text-[15px] tracking-[0.4em]">Hari Charan Katta . 2026</p>
             <a href="https://github.com/haricharnbytes/DayMark" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 text-stone-400 hover:text-[#a31621] transition-all group py-3">
               <svg className="h-6 w-6 fill-current transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                 <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
               </svg>
               <span className="lowercase tracking-widest text-[12px] font-bold">github</span>
             </a>
          </div>
        </div>
      </footer>

      <EventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveEvent} onDelete={handleDeleteEvent} selectedDate={selectedDate} initialEvent={editingEvent} onNoteUpdated={refreshData} />
      <UpcomingEventsOverlay isOpen={showEventsOverlay} onClose={() => setShowEventsOverlay(false)} upcomingEvents={upcomingEvents} onEditEvent={handleEditEventFromOverlay} />
      <SyncOverlay isOpen={showSyncOverlay} onClose={() => setShowSyncOverlay(false)} onSyncComplete={refreshData} />
    </div>
  );
};

export default App;
