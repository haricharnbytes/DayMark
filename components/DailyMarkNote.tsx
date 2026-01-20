
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getDailyNote, saveDailyNote } from '../utils/db';

interface DailyMarkNoteProps {
  date: string;
  onNoteSaved?: () => void;
}

const DailyMarkNote: React.FC<DailyMarkNoteProps> = ({ date, onNoteSaved }) => {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const saveTimeoutRef = useRef<number | null>(null);
  const latestContentRef = useRef(content);
  const lastSavedContentRef = useRef('');

  // Update ref whenever state changes
  useEffect(() => {
    latestContentRef.current = content;
  }, [content]);

  // Load note when date changes
  useEffect(() => {
    const loadNote = async () => {
      const savedNote = await getDailyNote(date);
      setContent(savedNote);
      latestContentRef.current = savedNote;
      lastSavedContentRef.current = savedNote;
      
      // If note exists, show finalized state. If empty, show editor.
      const hasContent = savedNote && savedNote.trim().length > 0;
      setIsFinalized(hasContent);
      setShowEditor(!hasContent);
    };
    loadNote();
  }, [date]);

  const performSave = useCallback(async () => {
    const contentToSave = latestContentRef.current;
    if (contentToSave === lastSavedContentRef.current) {
      setIsSaving(false);
      return;
    }

    try {
      await saveDailyNote(date, contentToSave);
      lastSavedContentRef.current = contentToSave;
      setIsSaving(false);
      if (onNoteSaved) onNoteSaved();
    } catch (error) {
      console.error('Failed to save note:', error);
      setIsSaving(false);
    }
  }, [date, onNoteSaved]);

  const handleMarkComplete = async () => {
    setIsSaving(true);
    setIsAnimating(true);
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    await performSave();
    
    // Smooth transition
    setTimeout(() => {
      setIsFinalized(true);
      setShowEditor(false);
      setIsAnimating(false);
    }, 400);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setIsSaving(true);

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(performSave, 1500);
  };

  useEffect(() => {
    const handleBeforeUnload = () => performSave();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
      performSave();
    };
  }, [performSave]);

  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });

  const isTodayDate = date === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

  // State: Day is marked and we are not explicitly editing
  if (isFinalized && !showEditor) {
    return (
      <div className="max-w-lg mx-auto mb-10 px-4 fade-in">
        <div className={`bg-white dark:bg-stone-900 rounded-[2rem] p-8 border border-stone-100 dark:border-stone-800 shadow-xl flex flex-col items-center text-center group transition-all duration-700 ${isAnimating ? 'scale-110 opacity-0' : 'scale-100 opacity-100 success-flourish'}`}>
          <div className="w-12 h-12 bg-[#F5AFAF] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-[#F5AFAF]/20 animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-[10px] uppercase tracking-[0.4em] text-[#F5AFAF] font-bold mb-2">Completion</span>
          <h2 className="text-xl font-serif text-stone-800 dark:text-stone-100 italic mb-2">Today's note is marked</h2>
          <p className="text-stone-400 text-[11px] uppercase tracking-widest font-medium mb-8">Reflections for {formattedDate} are safe.</p>
          
          <button 
            onClick={() => setShowEditor(true)}
            className="text-[9px] uppercase tracking-[0.2em] text-stone-500 hover:text-stone-800 dark:hover:text-white transition-colors py-2 px-6 border border-stone-200 dark:border-stone-700 rounded-full hover:bg-stone-50 dark:hover:bg-stone-800 active:scale-95"
          >
            Review Mark
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-lg mx-auto mb-10 fade-in px-4 transition-all duration-500 ${isAnimating ? 'opacity-50 scale-95 blur-sm' : 'opacity-100 scale-100'}`} style={{ animationDelay: '0.3s' }}>
      <div className="bg-white/40 dark:bg-stone-800/40 backdrop-blur-md rounded-[1.5rem] p-6 border border-stone-100 dark:border-stone-700 shadow-sm hover:shadow-md transition-all duration-500 group relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-[0.3em] text-[#F5AFAF] font-bold mb-0.5">
              {isTodayDate ? 'Daily Mark' : 'Date Mark'}
            </span>
            <h2 className="text-lg font-serif text-stone-700 dark:text-stone-200 italic">{formattedDate}</h2>
          </div>
          <div className={`transition-opacity duration-300 ${isSaving ? 'opacity-100' : 'opacity-0'}`}>
            <span className="text-[8px] uppercase tracking-widest text-stone-300 dark:text-stone-600 font-bold">Syncing...</span>
          </div>
        </div>
        
        <div className="relative">
          <textarea
            value={content}
            onChange={handleChange}
            placeholder="What happened today?"
            className="w-full bg-transparent border-none focus:ring-0 text-stone-600 dark:text-stone-300 font-serif text-sm leading-relaxed resize-none min-h-[120px] placeholder:text-stone-300 dark:placeholder:text-stone-600 placeholder:italic p-0"
          />
          <div className="absolute bottom-0 left-0 h-px w-0 bg-[#F5AFAF]/20 group-focus-within:w-full transition-all duration-1000"></div>
        </div>
        
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className={`w-1 h-1 rounded-full transition-all duration-500 ${content ? 'bg-[#F5AFAF] scale-125' : 'bg-stone-200 dark:bg-stone-700'}`}></div>
            <span className="text-[8px] text-stone-300 dark:text-stone-600 uppercase tracking-widest font-bold">
              {content ? 'Journaling...' : 'Empty Slate'}
            </span>
          </div>

          <div className="flex gap-2">
            {isFinalized && (
              <button
                onClick={() => setShowEditor(false)}
                className="px-4 py-2 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 hover:text-stone-600 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleMarkComplete}
              disabled={!content || isSaving}
              className={`flex items-center gap-2 px-6 py-2 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-500
                ${content 
                    ? 'bg-stone-800 dark:bg-stone-200 text-stone-200 dark:text-stone-900 hover:scale-105 hover:shadow-lg active:scale-95' 
                    : 'bg-stone-100 dark:bg-stone-900 text-stone-300 dark:text-stone-700 cursor-not-allowed opacity-50'
                }`}
            >
              Mark
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyMarkNote;
