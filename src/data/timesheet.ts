export interface TimeEvent {
  time: string;
  ip: string;
  location: string;
}

export interface DailyLog {
  date: Date;
  day: string;
  status: 'Present' | 'Absent' | 'On Leave' | 'Offset' | 'Weekend' | 'Holiday' | 'Pending';
  timeIn: TimeEvent | null;
  lunchStart: TimeEvent | null;
  lunchEnd: TimeEvent | null;
  timeOut: TimeEvent | null;
  totalHours: string | null;
  notes: string | null;
  remarks: string | null;
}

// Mock data is now generated dynamically in the TimesheetPage component.
