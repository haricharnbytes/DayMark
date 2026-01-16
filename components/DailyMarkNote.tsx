
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getDailyNote, saveDailyNote } from '../utils/db';

interface DailyMarkNoteProps {
  date: string;
}

const DailyMarkNote: React.FC<DailyMarkNoteProps> = ({ date }) => {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
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
      setShowSavedFeedback(false);
    };
    loadNote();
  }, [date]);

  const performSave = useCallback(async () => {
    const contentToSave = latestContentRef.current;
    if (contentToSave === lastSavedContentRef.current && !showSavedFeedback) {
      setIsSaving(false);
      return;
    }

    try {
      await saveDailyNote(date, contentToSave);
      lastSavedContentRef.current = contentToSave;
      setIsSaving(false);
    } catch (error) {
      console.error('Failed to save note:', error);
      setIsSaving(false);
    }
  }, [date, showSavedFeedback]);

  const handleManualMark = async () => {
    setIsSaving(true);
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    await performSave();
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 2000);
  };

  // Handle auto-save on change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setIsSaving(true);
    setShowSavedFeedback(false);

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(performSave, 1500);
  };

  // Ensure data is saved on unmount or tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      performSave();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
      performSave(); // Save on unmount
    };
  }, [performSave]);

  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });

  const isTodayDate = date === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

  return (
    <div className="max-w-lg mx-auto mb-10 fade-in px-4" style={{ animationDelay: '0.3s' }}>
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
            className="w-full bg-transparent border-none focus:ring-0 text-stone-600 dark:text-stone-300 font-serif text-sm leading-relaxed resize-none min-h-[100px] placeholder:text-stone-300 dark:placeholder:text-stone-600 placeholder:italic p-0"
          />
          <div className="absolute bottom-0 left-0 h-px w-0 bg-[#F5AFAF]/20 group-focus-within:w-full transition-all duration-1000"></div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className={`w-1 h-1 rounded-full transition-all duration-500 ${content ? 'bg-[#F5AFAF] scale-125' : 'bg-stone-200 dark:bg-stone-700'}`}></div>
            <span className="text-[8px] text-stone-300 dark:text-stone-600 uppercase tracking-widest font-bold">
              {showSavedFeedback ? 'Marked' : content ? 'Journaled' : 'Empty Slate'}
            </span>
          </div>

          <button
            onClick={handleManualMark}
            disabled={!content || isSaving}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-500
              ${showSavedFeedback 
                ? 'bg-[#a53860] text-white' 
                : content 
                  ? 'bg-stone-800 dark:bg-stone-200 text-stone-200 dark:text-stone-900 hover:scale-105 hover:shadow-lg active:scale-95' 
                  : 'bg-stone-100 dark:bg-stone-900 text-stone-300 dark:text-stone-700 cursor-not-allowed opacity-50'
              }`}
          >
            {showSavedFeedback ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Marked
              </>
            ) : (
              'Mark'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyMarkNote;
