
import React, { useState, useEffect } from 'react';
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
  { name: 'Stone', value: '#d6d3d1' },
  { name: 'Sage', value: '#b9c9b7' },
  { name: 'Terracotta', value: '#d9a58e' },
  { name: 'Dusk', value: '#6594B1' },
  { name: 'Blossom', value: '#DDAED3' },
  { name: 'Lavender', value: '#c3b9d9' },
  { name: 'Sky', value: '#b7c9d9' },
  { name: 'Sand', value: '#e6d2b5' },
];

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
  const [color, setColor] = useState(PRESET_COLORS[0].value);
  
  // Daily Note State
  const [dailyNote, setDailyNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

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
        setColor(initialEvent.color || PRESET_COLORS[0].value);
      } else {
        setTitle('');
        setStartTime('12:00');
        setEndTime('13:00');
        setDescription('');
        setIsImportant(false);
        setColor(PRESET_COLORS[0].value);
      }
    }
    // Reset feedback when modal opens for a new date
    setShowSavedFeedback(false);
  }, [initialEvent, isOpen, selectedDate]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: initialEvent?.id || crypto.randomUUID(),
      title,
      date: selectedDate,
      startTime,
      endTime,
      description,
      isImportant,
      color,
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
    
    // Hide feedback after delay
    setTimeout(() => setShowSavedFeedback(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5 dark:bg-black/60 backdrop-blur-md transition-all">
      <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] p-8 w-full max-w-2xl shadow-2xl border border-stone-100 dark:border-stone-800 fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#F5AFAF] font-bold block mb-1">Opened Date</span>
            <h2 className="text-2xl font-serif text-stone-700 dark:text-stone-100 italic">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h2>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-stone-300 dark:text-stone-600 hover:text-[#F5AFAF] transition-all p-2 bg-stone-50 dark:bg-stone-800 rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Daily Mark Section */}
          <div className="space-y-6">
            <div className="bg-stone-50 dark:bg-stone-800/50 p-6 rounded-3xl border border-stone-100 dark:border-stone-800 transition-all duration-500">
              <div className="flex justify-between items-center mb-4">
                <label className="text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 font-bold">Daily Mark</label>
                {(isSavingNote || showSavedFeedback) && (
                  <span className={`text-[8px] uppercase tracking-widest font-bold transition-all duration-300 ${showSavedFeedback ? 'text-green-500' : 'text-[#F5AFAF] animate-pulse'}`}>
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
                className="w-full bg-transparent border-none focus:ring-0 text-stone-600 dark:text-stone-300 font-serif text-sm leading-relaxed resize-none h-48 placeholder:text-stone-300 dark:placeholder:text-stone-700"
              />
              <div className="mt-4 flex justify-end">
                <button 
                   onClick={handleNoteSave}
                   className={`flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] font-bold transition-all duration-500 py-2 px-4 rounded-full
                     ${showSavedFeedback 
                       ? 'bg-green-500/10 text-green-500' 
                       : 'text-[#F5AFAF] hover:text-[#a53860] hover:bg-[#F5AFAF]/5'
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

          {/* Event Form Section */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 mb-2 font-bold">Moment Title</label>
              <input 
                autoFocus
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-xl px-4 py-3.5 focus:ring-1 focus:ring-[#F5AFAF]/30 transition-all outline-none text-stone-700 dark:text-stone-200"
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
                  className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-xl px-4 py-3.5 focus:ring-1 focus:ring-[#F5AFAF]/30 outline-none text-stone-700 dark:text-stone-200"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 mb-2 font-bold">End</label>
                <input 
                  type="time" 
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-xl px-4 py-3.5 focus:ring-1 focus:ring-[#F5AFAF]/30 outline-none text-stone-700 dark:text-stone-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 mb-3 font-bold">Appearance</label>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`h-8 rounded-lg transition-all ${color === c.value ? 'ring-2 ring-[#F5AFAF] scale-110 shadow-lg' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                type="submit"
                className="flex-1 bg-stone-800 dark:bg-[#F5AFAF] text-white dark:text-stone-900 py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-stone-700 dark:hover:bg-[#a53860] transition-all shadow-xl shadow-[#F5AFAF]/10"
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
