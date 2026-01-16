
import React, { useState, useEffect, useRef } from 'react';
import { getDailyNote, saveDailyNote } from '../utils/db';

interface DailyMarkNoteProps {
  date: string;
}

const DailyMarkNote: React.FC<DailyMarkNoteProps> = ({ date }) => {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const loadNote = async () => {
      const savedNote = await getDailyNote(date);
      setContent(savedNote);
    };
    loadNote();
  }, [date]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setIsSaving(true);

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(async () => {
      await saveDailyNote(date, newContent);
      setIsSaving(false);
    }, 1000);
  };

  const formattedDate = new Date(date).toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });

  return (
    <div className="max-w-lg mx-auto mb-10 fade-in px-4" style={{ animationDelay: '0.3s' }}>
      <div className="bg-white/40 backdrop-blur-md rounded-[1.5rem] p-6 border border-stone-100 shadow-sm hover:shadow-md transition-all duration-500 group">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-[0.3em] text-[#F5AFAF] font-bold mb-0.5">Daily Mark</span>
            <h2 className="text-lg font-serif text-stone-700 italic">{formattedDate}</h2>
          </div>
          <div className={`transition-opacity duration-300 ${isSaving ? 'opacity-100' : 'opacity-0'}`}>
            <span className="text-[8px] uppercase tracking-widest text-stone-300 font-bold">Syncing...</span>
          </div>
        </div>
        
        <div className="relative">
          <textarea
            value={content}
            onChange={handleChange}
            placeholder="What happened today?"
            className="w-full bg-transparent border-none focus:ring-0 text-stone-600 font-serif text-sm leading-relaxed resize-none min-h-[80px] placeholder:text-stone-300 placeholder:italic p-0"
          />
          <div className="absolute bottom-0 left-0 h-px w-0 bg-[#F5AFAF]/20 group-focus-within:w-full transition-all duration-1000"></div>
        </div>
        
        <div className="mt-3 flex items-center gap-1.5">
          <div className="w-1 h-1 rounded-full bg-stone-200"></div>
          <span className="text-[8px] text-stone-300 uppercase tracking-widest">Journaled</span>
        </div>
      </div>
    </div>
  );
};

export default DailyMarkNote;
