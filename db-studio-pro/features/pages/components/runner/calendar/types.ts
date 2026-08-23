export interface CalendarEvent {
  id: string;
  title: string;
  start: Date | null;
  end: Date | null;
  color: string;
  hasSpecificTime: boolean;
  raw: Record<string, any>;
}

export type CalendarViewType = 'month' | 'week' | 'day' | 'agenda';

export interface CalendarRunnerProps {
  comp: any;
  node?: any;
  fetchedData: any[];
  loading: boolean;
  setParam?: (k: string, v: any) => void;
}
