
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getDailyNote, saveDailyNote } from '../utils/db';

interface DailyMarkNoteProps {
  date: string;
}

const DailyMarkNote: React.FC<DailyMarkNoteProps> = ({ date }) => {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
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
    };
    loadNote();
  }, [date]);

  const performSave = useCallback(async () => {
    const contentToSave = latestContentRef.current;
    if (contentToSave === lastSavedContentRef.current) return;

    try {
      await saveDailyNote(date, contentToSave);
      lastSavedContentRef.current = contentToSave;
    } catch (error) {
      console.error('Failed to auto-save note:', error);
    } finally {
      setIsSaving(false);
    }
  }, [date]);

  // Handle auto-save on change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setIsSaving(true);

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(performSave, 1000);
  };

  // Ensure data is saved on unmount or tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Direct call to DB might be risky on close, but IndexedDB is async.
      // We trigger the save and hope it finishes.
      performSave();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
      performSave(); // Save on unmount (e.g., date change or view switch)
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
      <div className="bg-white/40 dark:bg-stone-800/40 backdrop-blur-md rounded-[1.5rem] p-6 border border-stone-100 dark:border-stone-700 shadow-sm hover:shadow-md transition-all duration-500 group">
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
            className="w-full bg-transparent border-none focus:ring-0 text-stone-600 dark:text-stone-300 font-serif text-sm leading-relaxed resize-none min-h-[80px] placeholder:text-stone-300 dark:placeholder:text-stone-600 placeholder:italic p-0"
          />
          <div className="absolute bottom-0 left-0 h-px w-0 bg-[#F5AFAF]/20 group-focus-within:w-full transition-all duration-1000"></div>
        </div>
        
        <div className="mt-3 flex items-center gap-1.5">
          <div className={`w-1 h-1 rounded-full ${content ? 'bg-[#F5AFAF]' : 'bg-stone-200 dark:bg-stone-700'}`}></div>
          <span className="text-[8px] text-stone-300 dark:text-stone-600 uppercase tracking-widest">
            {content ? 'Journaled' : 'Empty Slate'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DailyMarkNote;
