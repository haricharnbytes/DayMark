
export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO format YYYY-MM-DD
  time?: string; // HH:mm
  description?: string;
  isImportant: boolean;
  color?: string; // Hex color code
}

export interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}
