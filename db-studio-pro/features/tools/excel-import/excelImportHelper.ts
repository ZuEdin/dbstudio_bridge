// Convert Excel serial number, JS Date, or parseable string to target date format
export const convertValueToDateFormat = (val: any, targetType: 'DATE' | 'DATETIME' | 'TIMESTAMP'): string => {
  if (val === undefined || val === null || val === '') return '';
  
  let d: Date | null = null;
  
  if (val instanceof Date) {
    d = val;
  } else {
    const num = Number(val);
    // Excel serial date: usually between 1 and 100000
    if (!isNaN(num) && num > 1 && num < 100000) {
      // 25569 is 1970-01-01
      const utc_days = Math.floor(num - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
  
      const fractional_day = num - Math.floor(num) + 0.0000001;
      const total_seconds = Math.floor(86400 * fractional_day);
  
      const seconds = total_seconds % 60;
      const minutes = Math.floor(total_seconds / 60) % 60;
      const hours = Math.floor(total_seconds / 3600);
  
      d = new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
    } else {
      const strVal = String(val).trim();
      // Keep already formatted to avoid conversion shifts
      if (strVal.match(/^\d{4}-\d{2}-\d{2}$/) && targetType === 'DATE') {
        return strVal;
      }
      if (strVal.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/) && (targetType === 'DATETIME' || targetType === 'TIMESTAMP')) {
        return strVal;
      }
  
      const parsed = Date.parse(strVal);
      if (!isNaN(parsed)) {
        d = new Date(parsed);
      }
    }
  }
  
  if (!d || isNaN(d.getTime())) {
    return String(val); // Fallback to raw
  }
  
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  
  if (targetType === 'DATE') {
    return `${year}-${month}-${day}`;
  } else {
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
};
