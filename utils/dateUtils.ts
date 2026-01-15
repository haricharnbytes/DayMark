
export const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

export const formatMonthName = (month: number) => {
  return new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(2000, month));
};

export const isToday = (year: number, month: number, day: number) => {
  const today = new Date();
  return today.getFullYear() === year && 
         today.getMonth() === month && 
         today.getDate() === day;
};

export const getNextEvent = (events: any[]) => {
  const now = new Date().getTime();
  const upcoming = events
    .map(e => ({ ...e, timestamp: new Date(`${e.date}T${e.time || '00:00'}`).getTime() }))
    .filter(e => e.timestamp > now)
    .sort((a, b) => a.timestamp - b.timestamp);
  
  return upcoming[0] || null;
};
