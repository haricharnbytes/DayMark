
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

  if (isFinalized && !showEditor) {
    return (
      <div className="w-full max-w-sm h-full fade-in">
        <div className={`bg-white dark:bg-stone-900 rounded-[2rem] p-6 border border-stone-100 dark:border-stone-800 shadow-xl flex flex-col items-center justify-center text-center gap-4 h-full transition-all duration-500 relative overflow-hidden ${isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0 success-flourish'}`}>
          <div className="w-16 h-16 bg-[#F5AFAF]/10 dark:bg-[#F5AFAF]/5 rounded-2xl flex items-center justify-center shadow-md shadow-[#F5AFAF]/5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#F5AFAF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <span className="text-[7px] uppercase tracking-[0.3em] text-[#F5AFAF] font-bold block mb-1">Mark Complete</span>
            <h2 className="text-lg font-serif text-stone-800 dark:text-stone-100 italic">Preserved</h2>
            <p className="mt-2 text-stone-400 dark:text-stone-500 text-[9px] leading-relaxed max-w-[180px] mx-auto italic truncate">
               {content}
            </p>
          </div>
          
          <button 
            onClick={() => setShowEditor(true)}
            className="mt-2 flex items-center gap-1.5 text-[8px] uppercase tracking-[0.1em] text-stone-400 hover:text-[#F5AFAF] transition-all py-2.5 px-6 border border-stone-100 dark:border-stone-800 rounded-full hover:bg-[#F5AFAF]/5 font-bold"
          >
            Review Entry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-sm h-full fade-in transition-all duration-500 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      <div className="bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-200 dark:border-stone-800 shadow-xl group relative overflow-hidden flex flex-col h-full transition-all duration-500">
        
        {/* Header - Matching PomodoroTimer */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-50 dark:border-stone-800 bg-stone-50/30 dark:bg-stone-900/50">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-serif text-stone-800 dark:text-stone-200 italic">
              Daily Mark
            </h2>
            <div className={`w-1 h-1 rounded-full ${isSaving ? 'bg-[#F5AFAF] animate-pulse' : 'bg-green-500'}`} />
          </div>
          
          <span className="text-[7px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-600 font-bold whitespace-nowrap">
            {formattedDate}
          </span>
        </div>

        {/* Content Area */}
        <div className="relative flex flex-1 overflow-hidden">
          <div className="w-6 border-r border-stone-50 dark:border-stone-800 flex flex-col items-center py-6 gap-3 opacity-20 select-none">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-0.5 h-0.5 rounded-full bg-stone-300 dark:bg-stone-700" />
            ))}
          </div>
          
          <div className="flex-1 relative p-6">
            <textarea
              value={content}
              onChange={handleChange}
              placeholder="Record a thought..."
              className="w-full h-full bg-transparent border-none focus:ring-0 text-stone-700 dark:text-stone-300 font-serif text-base leading-relaxed resize-none placeholder:text-stone-200 dark:placeholder:text-stone-800 placeholder:italic p-0"
            />
          </div>
        </div>

        {/* Footer Toolbar */}
        <div className="px-6 py-3 bg-stone-50/20 dark:bg-stone-900/20 border-t border-stone-50 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[7px] text-stone-400 dark:text-stone-600 font-bold tracking-widest uppercase">
              {wordCount} Words
            </span>
          </div>

          <div className="flex gap-1.5">
            {isFinalized && (
              <button
                onClick={() => setShowEditor(false)}
                className="px-2 py-1.5 rounded-lg text-[7px] uppercase tracking-[0.1em] font-bold text-stone-400 hover:text-stone-600 transition-all"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleMarkComplete}
              disabled={!content.trim() || isSaving}
              className={`group flex items-center gap-1.5 px-4 py-2 rounded-xl text-[8px] uppercase tracking-[0.1em] font-bold transition-all duration-300
                ${content.trim() 
                    ? 'bg-stone-800 dark:bg-[#F5AFAF] text-white dark:text-stone-900 shadow-md hover:scale-105' 
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-300 dark:text-stone-700 cursor-not-allowed opacity-50 shadow-none'
                }`}
            >
              <span>Seal</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
