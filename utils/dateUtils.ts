
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

export const getNextEvents = (events: any[], limit: number = 5) => {
  const now = new Date().getTime();
  const upcoming = events
    // Fix: Use startTime instead of time
    .map(e => ({ ...e, timestamp: new Date(`${e.date}T${e.startTime || '00:00'}`).getTime() }))
    .filter(e => e.timestamp > now)
    .sort((a, b) => a.timestamp - b.timestamp);
  
  return upcoming.slice(0, limit);
};
