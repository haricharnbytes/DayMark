
import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '../types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete?: (id: string) => void;
  selectedDate: string;
  initialEvent?: CalendarEvent | null;
}

const PRESET_COLORS = [
  { name: 'Stone', value: '#d6d3d1' },
  { name: 'Sage', value: '#b9c9b7' },
  { name: 'Terracotta', value: '#d9a58e' },
  { name: 'Dusk', value: '#6594B1' }, // New requested color
  { name: 'Blossom', value: '#DDAED3' }, // New requested color
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
  initialEvent 
}) => {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('12:00');
  const [description, setDescription] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [color, setColor] = useState(PRESET_COLORS[0].value);

  useEffect(() => {
    if (initialEvent) {
      setTitle(initialEvent.title);
      setTime(initialEvent.time || '12:00');
      setDescription(initialEvent.description || '');
      setIsImportant(initialEvent.isImportant);
      setColor(initialEvent.color || PRESET_COLORS[0].value);
    } else {
      setTitle('');
      setTime('12:00');
      setDescription('');
      setIsImportant(false);
      setColor(PRESET_COLORS[0].value);
    }
  }, [initialEvent, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: initialEvent?.id || crypto.randomUUID(),
      title,
      date: selectedDate,
      time,
      description,
      isImportant,
      color
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl border border-stone-100 fade-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-light tracking-tight text-stone-700">
            {initialEvent ? 'Edit Moment' : 'New Moment'}
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="text-stone-300 hover:text-stone-600 transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-2 font-medium">Title</label>
            <input 
              autoFocus
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-stone-50 border-none rounded-xl px-4 py-3.5 focus:ring-1 focus:ring-stone-200 transition-all outline-none text-stone-700"
              placeholder="A quiet dinner..."
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-2 font-medium">Date</label>
              <input 
                disabled
                type="text" 
                value={selectedDate}
                className="w-full bg-stone-100/50 border-none rounded-xl px-4 py-3.5 text-stone-400 cursor-not-allowed outline-none text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-2 font-medium">Time</label>
              <input 
                type="time" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-stone-50 border-none rounded-xl px-4 py-3.5 focus:ring-1 focus:ring-stone-200 outline-none text-stone-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-3 font-medium">Color Palette</label>
            <div className="grid grid-cols-4 gap-3">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`group relative h-10 rounded-xl transition-all duration-300 flex items-center justify-center overflow-hidden
                    ${color === c.value ? 'ring-2 ring-stone-200 ring-offset-2 scale-105' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                >
                  {color === c.value && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-2 font-medium">Notes</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-stone-50 border-none rounded-xl px-4 py-3.5 h-24 resize-none focus:ring-1 focus:ring-stone-200 outline-none text-stone-700 text-sm leading-relaxed"
              placeholder="Reflections or details..."
            />
          </div>

          <div className="flex items-center gap-3 bg-stone-50/50 p-3 rounded-xl">
            <input 
              type="checkbox" 
              id="important"
              checked={isImportant}
              onChange={(e) => setIsImportant(e.target.checked)}
              className="w-4 h-4 rounded border-stone-200 text-stone-800 focus:ring-stone-400 accent-stone-800"
            />
            <label htmlFor="important" className="text-xs text-stone-500 cursor-pointer select-none font-medium tracking-wide">
              Prioritize this moment
            </label>
          </div>

          <div className="pt-2 flex gap-3">
            <button 
              type="submit"
              className="flex-1 bg-stone-800 text-stone-50 py-4 rounded-2xl text-xs uppercase tracking-[0.2em] font-semibold hover:bg-stone-700 transition-all shadow-lg shadow-stone-200"
            >
              {initialEvent ? 'Save Changes' : 'Add to Daymark'}
            </button>
            {initialEvent && onDelete && (
              <button 
                type="button"
                onClick={() => { onDelete(initialEvent.id); onClose(); }}
                className="px-5 py-4 rounded-2xl text-red-400 hover:bg-red-50 transition-colors"
                title="Remove moment"
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
  );
};

export default EventModal;
