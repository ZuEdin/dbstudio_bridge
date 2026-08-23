import { getNestedValueCaseInsensitive } from '../../../utils/pageViewUtils';
import { CalendarEvent } from './types';

// Helper: parse date and time safely
export const parseDateWithTime = (dateVal: any, timeVal: any): Date | null => {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return null;

  if (timeVal) {
    if (typeof timeVal === 'string') {
      const match = timeVal.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
      if (match) {
        const hrs = parseInt(match[1], 10);
        const mins = parseInt(match[2], 10);
        const secs = match[3] ? parseInt(match[3], 10) : 0;
        d.setHours(hrs, mins, secs, 0);
      }
    } else if (timeVal instanceof Date) {
      d.setHours(timeVal.getHours(), timeVal.getMinutes(), timeVal.getSeconds(), 0);
    }
  }
  return d;
};

export const formatMonthYear = (date: Date): string => {
  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

// Monday-start of week helper
export const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  return start;
};

// Check if dates match
export const isSameDay = (d1: Date, d2: Date): boolean => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

export interface MonthDay {
  date: Date;
  isCurrentMonth: boolean;
}

export const getMonthDays = (currentDate: Date): MonthDay[] => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  let startOffset = (firstDay.getDay() + 6) % 7;
  
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();
  
  const days: MonthDay[] = [];
  
  for (let i = startOffset - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthTotalDays - i),
      isCurrentMonth: false
    });
  }
  
  for (let i = 1; i <= totalDays; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true
    });
  }
  
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false
    });
  }
  
  return days;
};

export const getWeekDays = (currentDate: Date): Date[] => {
  const start = getStartOfWeek(currentDate);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
};

export const processEvents = (activeData: any[], conf: any): CalendarEvent[] => {
  return activeData.map((row, idx) => {
    const id = row.id || row.ID || `row-${idx}`;
    const title = getNestedValueCaseInsensitive(row, conf.titleField || 'name') || 
                  getNestedValueCaseInsensitive(row, 'title') || 
                  getNestedValueCaseInsensitive(row, 'name') || 
                  getNestedValueCaseInsensitive(row, 'betreff') || 
                  getNestedValueCaseInsensitive(row, 'subject') || 
                  getNestedValueCaseInsensitive(row, 'thema') || 
                  getNestedValueCaseInsensitive(row, 'titel') || 
                  `Eintrag #${idx + 1}`;
    
    const startVal = getNestedValueCaseInsensitive(row, conf.startDateField || 'date') || 
                     getNestedValueCaseInsensitive(row, 'datum') ||
                     getNestedValueCaseInsensitive(row, 'vondatum') ||
                     getNestedValueCaseInsensitive(row, 'von_datum') ||
                     getNestedValueCaseInsensitive(row, 'startdatum') ||
                     getNestedValueCaseInsensitive(row, 'start_datum') ||
                     getNestedValueCaseInsensitive(row, 'erstellt_am') ||
                     getNestedValueCaseInsensitive(row, 'created_at');
                      
    const endVal = (conf.endDateField ? getNestedValueCaseInsensitive(row, conf.endDateField) : null) || 
                   getNestedValueCaseInsensitive(row, 'bisdatum') ||
                   getNestedValueCaseInsensitive(row, 'bis_datum') ||
                   getNestedValueCaseInsensitive(row, 'enddatum') ||
                   getNestedValueCaseInsensitive(row, 'end_datum') ||
                   getNestedValueCaseInsensitive(row, 'endDate') ||
                   startVal;
    
    const startTimeVal = conf.startTimeField ? getNestedValueCaseInsensitive(row, conf.startTimeField) : 
                         (getNestedValueCaseInsensitive(row, 'uhrzeit') || 
                          getNestedValueCaseInsensitive(row, 'vonuhrzeit') ||
                          getNestedValueCaseInsensitive(row, 'von_uhrzeit') ||
                          getNestedValueCaseInsensitive(row, 'startuhrzeit') ||
                          getNestedValueCaseInsensitive(row, 'start_uhrzeit') ||
                          getNestedValueCaseInsensitive(row, 'zeit') || 
                          getNestedValueCaseInsensitive(row, 'startzeit') || 
                          getNestedValueCaseInsensitive(row, 'time') ||
                          getNestedValueCaseInsensitive(row, 'start_time'));
                          
    const endTimeVal = conf.endTimeField ? getNestedValueCaseInsensitive(row, conf.endTimeField) : 
                       (getNestedValueCaseInsensitive(row, 'endzeit') || 
                        getNestedValueCaseInsensitive(row, 'bisuhrzeit') ||
                        getNestedValueCaseInsensitive(row, 'bis_uhrzeit') ||
                        getNestedValueCaseInsensitive(row, 'enduhrzeit') ||
                        getNestedValueCaseInsensitive(row, 'end_uhrzeit') ||
                        getNestedValueCaseInsensitive(row, 'end_time'));

    const start = parseDateWithTime(startVal, startTimeVal);
    const end = parseDateWithTime(endVal || startVal, endTimeVal || startTimeVal);
    const color = getNestedValueCaseInsensitive(row, conf.colorField || 'color') || '#4f46e5';

    const hasSpecificTime = !!startTimeVal || (start !== null && (start.getHours() !== 0 || start.getMinutes() !== 0));

    return {
      id,
      title,
      start,
      end,
      color,
      hasSpecificTime,
      raw: row
    };
  }).filter(e => e.start !== null) as CalendarEvent[];
};
