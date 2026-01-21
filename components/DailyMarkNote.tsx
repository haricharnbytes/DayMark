
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

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  useEffect(() => {
    latestContentRef.current = content;
  }, [content]);

  useEffect(() => {
    const loadNote = async () => {
      const savedNote = await getDailyNote(date);
      setContent(savedNote);
      latestContentRef.current = savedNote;
      lastSavedContentRef.current = savedNote;
      
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
    if (!content.trim()) return;
    setIsSaving(true);
    setIsAnimating(true);
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    await performSave();
    
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

  const dateObj = new Date(date + 'T12:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });

  const isTodayDate = date === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

  if (isFinalized && !showEditor) {
    return (
      <div className="max-w-lg mx-auto mb-10 px-4 fade-in">
        <div className={`bg-white dark:bg-stone-900 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 border border-stone-100 dark:border-stone-800 shadow-xl flex items-center justify-between group transition-all duration-500 relative overflow-hidden ${isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0 success-flourish'}`}>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-[#F5AFAF] rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-[#F5AFAF]/20 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-left">
              <span className="text-[7px] md:text-[8px] uppercase tracking-[0.3em] md:tracking-[0.4em] text-[#F5AFAF] font-bold block">Marked & Synced</span>
              <h2 className="text-[11px] md:text-sm font-serif text-stone-800 dark:text-stone-100 italic">Preserved for {formattedDate}</h2>
            </div>
          </div>
          
          <button 
            onClick={() => setShowEditor(true)}
            className="flex items-center gap-1.5 md:gap-2 text-[8px] md:text-[9px] uppercase tracking-[0.1em] md:tracking-[0.2em] text-stone-400 hover:text-[#F5AFAF] transition-all py-1.5 md:py-2 px-3 md:px-4 border border-stone-100 dark:border-stone-800 rounded-full hover:bg-[#F5AFAF]/5"
          >
            <span>Review</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-xl mx-auto mb-10 fade-in px-4 transition-all duration-500 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      <div className="bg-white dark:bg-stone-900 rounded-[1.5rem] md:rounded-[2rem] border border-stone-200 dark:border-stone-800 shadow-2xl group relative overflow-hidden focus-within:shadow-[#F5AFAF]/10 transition-all duration-500">
        
        {/* Header Section - More Compact */}
        <div className="flex items-center justify-between px-6 md:px-8 py-4 md:py-5 border-b border-stone-50 dark:border-stone-800 bg-stone-50/30 dark:bg-stone-900/50">
          <div className="flex items-center gap-3 md:gap-4">
            <h2 className="text-sm md:text-md font-serif text-stone-800 dark:text-stone-200 italic">
              {formattedDate} Reflection
            </h2>
            <div className={`w-1.5 h-1.5 rounded-full ${isSaving ? 'bg-[#F5AFAF] animate-pulse' : 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.3)]'}`} />
          </div>
          
          <span className="text-[7px] md:text-[8px] uppercase tracking-[0.2em] md:tracking-[0.3em] text-stone-400 dark:text-stone-600 font-bold whitespace-nowrap">
            {isSaving ? 'Syncing' : 'Everywhere'}
          </span>
        </div>

        {/* Content Area - Adjusted heights/paddings */}
        <div className="relative flex">
          {/* Notebook Gutter Decor - Slimmer */}
          <div className="w-6 md:w-8 border-r border-stone-50 dark:border-stone-800 flex flex-col items-center py-6 gap-4 opacity-20 select-none">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-0.5 md:w-1 h-0.5 md:h-1 rounded-full bg-stone-300 dark:bg-stone-700" />
            ))}
          </div>
          
          <div className="flex-1 relative p-5 md:p-6">
            <textarea
              value={content}
              onChange={handleChange}
              placeholder="Record a thought..."
              className="w-full bg-transparent border-none focus:ring-0 text-stone-700 dark:text-stone-300 font-serif text-sm md:text-lg leading-relaxed resize-none min-h-[140px] md:min-h-[160px] placeholder:text-stone-200 dark:placeholder:text-stone-800 placeholder:italic p-0"
            />
          </div>
        </div>

        {/* Footer Toolbar - Unified Row */}
        <div className="px-6 md:px-8 py-3 md:py-4 bg-stone-50/20 dark:bg-stone-900/20 border-t border-stone-50 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[8px] md:text-[9px] text-stone-400 dark:text-stone-600 font-bold tracking-widest uppercase">
              {wordCount} {wordCount === 1 ? 'Word' : 'Words'}
            </span>
          </div>

          <div className="flex gap-2">
            {isFinalized && (
              <button
                onClick={() => setShowEditor(false)}
                className="px-3 md:px-4 py-2 rounded-xl text-[8px] md:text-[9px] uppercase tracking-[0.1em] md:tracking-[0.2em] font-bold text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-all"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleMarkComplete}
              disabled={!content.trim() || isSaving}
              className={`group flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-[8px] md:text-[9px] uppercase tracking-[0.1em] md:tracking-[0.2em] font-bold transition-all duration-300
                ${content.trim() 
                    ? 'bg-stone-800 dark:bg-[#F5AFAF] text-white dark:text-stone-900 shadow-lg shadow-[#F5AFAF]/5 hover:scale-105' 
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-300 dark:text-stone-700 cursor-not-allowed opacity-50 shadow-none'
                }`}
            >
              <span>Seal Mark</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyMarkNote;
