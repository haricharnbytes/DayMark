
import React, { useState, useEffect, useRef } from 'react';
import { CalendarEvent } from '../types';
import { getDailyNote, saveDailyNote } from '../utils/db';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete?: (id: string) => void;
  selectedDate: string;
  initialEvent?: CalendarEvent | null;
  onNoteUpdated?: () => void;
}

const PRESET_COLORS = [
  { name: 'Sage', value: '#b9c9b7' },
  { name: 'Terracotta', value: '#d9a58e' },
  { name: 'Dusk', value: '#6594B1' },
  { name: 'Crimson', value: '#a31621' },
  { name: 'Lavender', value: '#c3b9d9' },
  { name: 'Sky', value: '#b7c9d9' },
  { name: 'Sand', value: '#e6d2b5' },
];

export const ICON_MAP: Record<string, React.ReactNode> = {
  'work': <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2 2v2" />,
  'social': <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />,
  'wellness': <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />,
  'travel': <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  'food': <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" />,
  'learn': <path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5a2.5 2.5 0 01-2.5-2.5V4.5z" />,
  'hobby': <path d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zm12-2a3 3 0 11-6 0 3 3 0 016 0z" />,
  'star': <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
};

const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const EventModal: React.FC<EventModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  selectedDate, 
  initialEvent,
  onNoteUpdated
}) => {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('13:00');
  const [description, setDescription] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [color, setColor] = useState(PRESET_COLORS[3].value);
  const [icon, setIcon] = useState<string | undefined>(undefined);
  
  const [dailyNote, setDailyNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  
  const colorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchNote = async () => {
        const note = await getDailyNote(selectedDate);
        setDailyNote(note);
      };
      fetchNote();

      if (initialEvent) {
        setTitle(initialEvent.title);
        setStartTime(initialEvent.startTime || '12:00');
        setEndTime(initialEvent.endTime || '13:00');
        setDescription(initialEvent.description || '');
        setIsImportant(initialEvent.isImportant);
        setColor(initialEvent.color || PRESET_COLORS[3].value);
        setIcon(initialEvent.icon);
      } else {
        setTitle('');
        setStartTime('12:00');
        setEndTime('13:00');
        setDescription('');
        setIsImportant(false);
        setColor(PRESET_COLORS[3].value);
        setIcon(undefined);
      }
    }
    setShowSavedFeedback(false);
  }, [initialEvent, isOpen, selectedDate]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: initialEvent?.id || generateId(),
      title,
      date: selectedDate,
      startTime,
      endTime,
      description,
      isImportant,
      color,
      icon,
      createdAt: initialEvent?.createdAt || Date.now()
    });
    onClose();
  };

  const handleNoteSave = async () => {
    if (isSavingNote) return;
    setIsSavingNote(true);
    await saveDailyNote(selectedDate, dailyNote);
    setIsSavingNote(false);
    setShowSavedFeedback(true);
    if (onNoteUpdated) onNoteUpdated();
    setTimeout(() => setShowSavedFeedback(false), 2000);
  };

  const isCustomColor = !PRESET_COLORS.some(c => c.value === color);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5 dark:bg-black/60 backdrop-blur-md transition-all">
      <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] p-8 w-full max-w-2xl shadow-2xl border border-stone-100 dark:border-stone-800 fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#a31621] font-bold block mb-1">Opened Date</span>
            <h2 className="text-2xl font-serif text-stone-700 dark:text-stone-100 italic">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h2>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-stone-300 dark:text-stone-600 hover:text-[#a31621] transition-all p-2 bg-stone-50 dark:bg-stone-800 rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            {/* Seamless Daily Mark Editor */}
            <div className="bg-transparent p-0 rounded-none border-none transition-all duration-500">
              <div className="flex justify-between items-center mb-4">
                <label className="text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 font-bold">Daily Mark</label>
                {(isSavingNote || showSavedFeedback) && (
                  <span className={`text-[8px] uppercase tracking-widest font-bold transition-all duration-300 ${showSavedFeedback ? 'text-green-500' : 'text-[#a31621] animate-pulse'}`}>
                    {showSavedFeedback ? 'Saved' : 'Syncing...'}
                  </span>
                )}
              </div>
              <textarea 
                value={dailyNote}
                onChange={(e) => {
                  setDailyNote(e.target.value);
                  setShowSavedFeedback(false);
                }}
                onBlur={handleNoteSave}
                placeholder="No reflections recorded yet..."
                className="w-full bg-transparent border-none focus:ring-0 focus:outline-none focus:border-none focus:shadow-none text-stone-600 dark:text-stone-300 font-serif text-sm leading-relaxed resize-none h-48 placeholder:text-stone-300 dark:placeholder:text-stone-700 caret-[#a31621] outline-none shadow-none appearance-none p-0"
              />
              <div className="mt-4 flex justify-end">
                <button 
                   onClick={handleNoteSave}
                   className={`flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] font-bold transition-all duration-500 py-2 px-4 rounded-full
                     ${showSavedFeedback 
                       ? 'bg-green-500/10 text-green-500' 
                       : 'text-[#a31621] hover:text-[#7d1119] hover:bg-[#a31621]/5'
                     }`}
                >
                  {showSavedFeedback && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {showSavedFeedback ? 'Saved' : 'Update Mark'}
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 mb-2 font-bold">Moment Title</label>
              <input 
                autoFocus
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-xl px-4 py-3.5 focus:ring-1 focus:ring-[#a31621]/30 transition-all outline-none text-stone-700 dark:text-stone-200"
                placeholder="What's happening?"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 mb-2 font-bold">Start</label>
                <input 
                  type="time" 
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-xl px-4 py-3.5 focus:ring-1 focus:ring-[#a31621]/30 outline-none text-stone-700 dark:text-stone-200"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 mb-2 font-bold">End</label>
                <input 
                  type="time" 
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-xl px-4 py-3.5 focus:ring-1 focus:ring-[#a31621]/30 outline-none text-stone-700 dark:text-stone-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 mb-3 font-bold">Icon</label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setIcon(undefined)}
                  className={`flex items-center justify-center h-10 rounded-xl transition-all border ${!icon ? 'border-[#a31621] bg-[#a31621]/10 shadow-lg scale-105' : 'border-stone-100 dark:border-stone-800 hover:border-stone-300 opacity-60'}`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-stone-400 dark:bg-stone-600" />
                </button>
                {Object.keys(ICON_MAP).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setIcon(key)}
                    className={`flex items-center justify-center h-10 rounded-xl transition-all border ${icon === key ? 'border-[#a31621] bg-[#a31621]/10 shadow-lg scale-105' : 'border-stone-100 dark:border-stone-800 hover:border-stone-300 opacity-60'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {ICON_MAP[key]}
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 font-bold">Color Palette</label>
                {isCustomColor && (
                   <span className="text-[8px] uppercase tracking-widest text-[#a31621] font-bold">Custom Active</span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`h-8 rounded-lg transition-all ${color === c.value ? 'ring-2 ring-stone-800 dark:ring-white scale-110 shadow-lg z-10' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => colorInputRef.current?.click()}
                  className={`h-8 rounded-lg transition-all border-2 border-dashed border-stone-200 dark:border-stone-700 flex items-center justify-center group overflow-hidden relative
                    ${isCustomColor ? 'ring-2 ring-stone-800 dark:ring-white scale-110 shadow-lg z-10' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                >
                  <div 
                    className="absolute inset-0 transition-opacity" 
                    style={{ backgroundColor: isCustomColor ? color : 'transparent', opacity: isCustomColor ? 1 : 0 }} 
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 relative z-10 ${isCustomColor ? 'text-white mix-blend-difference' : 'text-stone-300 dark:text-stone-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <input 
                    ref={colorInputRef}
                    type="color" 
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </button>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                type="submit"
                className="flex-1 bg-stone-800 dark:bg-[#a31621] text-white dark:text-stone-900 py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-stone-700 dark:hover:bg-[#7d1119] transition-all shadow-xl shadow-[#a31621]/10"
              >
                {initialEvent ? 'Save Changes' : 'Record Moment'}
              </button>
              {initialEvent && onDelete && (
                <button 
                  type="button"
                  onClick={() => { onDelete(initialEvent.id); onClose(); }}
                  className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 text-red-400 hover:bg-red-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
