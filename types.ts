
export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO format YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  description?: string; // Mapped to 'notes' in prompt
  isImportant: boolean;
  color?: string; // Hex color code
  // Added icon property to support event categorization in UI
  icon?: string;
  createdAt: number;
}

export interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}
