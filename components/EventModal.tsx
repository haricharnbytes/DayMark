
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
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl border border-stone-100 fade-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-stone-700">
            {initialEvent ? 'Edit Moment' : 'New Moment'}
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-widest text-stone-400 mb-1.5">Title</label>
            <input 
              autoFocus
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-stone-50 border-none rounded-lg px-4 py-3 focus:ring-1 focus:ring-stone-200 transition-all outline-none"
              placeholder="A quiet dinner..."
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs uppercase tracking-widest text-stone-400 mb-1.5">Date</label>
              <input 
                disabled
                type="text" 
                value={selectedDate}
                className="w-full bg-stone-100 border-none rounded-lg px-4 py-3 text-stone-500 cursor-not-allowed outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs uppercase tracking-widest text-stone-400 mb-1.5">Time</label>
              <input 
                type="time" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-stone-50 border-none rounded-lg px-4 py-3 focus:ring-1 focus:ring-stone-200 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-stone-400 mb-1.5">Color Palette</label>
            <div className="flex gap-3 mt-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-8 h-8 rounded-full transition-all transform hover:scale-110 flex items-center justify-center
                    ${color === c.value ? 'ring-2 ring-stone-200 ring-offset-2 scale-110' : ''}`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                >
                  {color === c.value && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full opacity-60" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-stone-400 mb-1.5">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-stone-50 border-none rounded-lg px-4 py-3 h-20 resize-none focus:ring-1 focus:ring-stone-200 outline-none"
              placeholder="Notes for your future self..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="important"
              checked={isImportant}
              onChange={(e) => setIsImportant(e.target.checked)}
              className="w-4 h-4 rounded border-stone-300 text-stone-600 focus:ring-stone-400 accent-stone-400"
            />
            <label htmlFor="important" className="text-sm text-stone-500 cursor-pointer select-none">Mark as important</label>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="submit"
              className="flex-1 bg-stone-800 text-stone-100 py-3 rounded-xl font-medium hover:bg-stone-700 transition-colors"
            >
              {initialEvent ? 'Update' : 'Create'}
            </button>
            {initialEvent && onDelete && (
              <button 
                type="button"
                onClick={() => { onDelete(initialEvent.id); onClose(); }}
                className="px-4 py-3 rounded-xl text-red-400 hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
