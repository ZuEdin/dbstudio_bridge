import { Field, SequenceConfig } from '../types/database';

export interface SequencePreset {
  id: string;
  name: string;
  description: string;
  samplePreview: string;
  config: SequenceConfig;
}

export const SEQUENCE_PRESETS: SequencePreset[] = [
  {
    id: 'supplier',
    name: 'Lieferantennummer (LIF-00001)',
    description: 'Klassisches Nummernformat für Lieferanten & Zulieferer',
    samplePreview: 'LIF-00001, LIF-00002, ..., LIF-00010',
    config: {
      enabled: true,
      prefix: 'LIF-',
      padding: 5,
      startValue: 1,
      step: 1
    }
  },
  {
    id: 'customer',
    name: 'Kundennummer (KD-10001)',
    description: 'Nummernkreis für Kunden & Mandanten ab 10000',
    samplePreview: 'KD-10001, KD-10002, ..., KD-10050',
    config: {
      enabled: true,
      prefix: 'KD-',
      padding: 5,
      startValue: 10001,
      step: 1
    }
  },
  {
    id: 'invoice_year',
    name: 'Rechnung mit Jahreszahl (RE-2026-00001)',
    description: 'Steuerkonforme fortlaufende Rechnungsnummer mit aktuellem Jahr',
    samplePreview: `RE-${new Date().getFullYear()}-00001, RE-${new Date().getFullYear()}-00002`,
    config: {
      enabled: true,
      prefix: 'RE-',
      includeYear: true,
      yearFormat: 'YYYY',
      padding: 5,
      startValue: 1,
      step: 1
    }
  },
  {
    id: 'article',
    name: 'Artikelnummer (ART-0001)',
    description: 'Produkt- und Materialcodes für Lager & Warenwirtschaft',
    samplePreview: 'ART-0001, ART-0002, ..., ART-0999',
    config: {
      enabled: true,
      prefix: 'ART-',
      padding: 4,
      startValue: 1,
      step: 1
    }
  },
  {
    id: 'ticket',
    name: 'Ticket- / Vorgangsnummer (TICK-00010)',
    description: 'Aufgaben- & Support-Tracking',
    samplePreview: 'TICK-00001, TICK-00002, ..., TICK-00010',
    config: {
      enabled: true,
      prefix: 'TICK-',
      padding: 5,
      startValue: 1,
      step: 1
    }
  },
  {
    id: 'order',
    name: 'Bestellnummer / PO (PO-000001)',
    description: 'Einkaufs- und Bestellvorgänge (Purchase Orders)',
    samplePreview: 'PO-000001, PO-000002',
    config: {
      enabled: true,
      prefix: 'PO-',
      padding: 6,
      startValue: 1,
      step: 1
    }
  },
  {
    id: 'custom_digits',
    name: 'Reine Zahl mit Nullen (00001)',
    description: 'Fortlaufende Nummer ohne Buchstabenpräfix',
    samplePreview: '00001, 00002, 00003',
    config: {
      enabled: true,
      prefix: '',
      padding: 5,
      startValue: 1,
      step: 1
    }
  }
];

/**
 * Formats a sequence number into its string representation according to the configuration
 */
export function formatSequenceValue(config: SequenceConfig, num: number, date: Date = new Date()): string {
  if (!config || !config.enabled) {
    return String(num);
  }

  const padding = Math.max(1, config.padding || 1);
  const paddedNum = String(Math.max(0, num)).padStart(padding, '0');
  const fullYear = String(date.getFullYear());
  const shortYear = fullYear.slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  // Custom Pattern provided
  if (config.pattern && config.pattern.trim().length > 0) {
    let result = config.pattern;
    result = result.replace(/{YYYY}/g, fullYear);
    result = result.replace(/{YY}/g, shortYear);
    result = result.replace(/{MM}/g, month);
    result = result.replace(/{DD}/g, day);

    // Replace zero-padding placeholders like {00000} or {000}
    result = result.replace(/{0+}/g, (match) => {
      const zerosCount = match.length - 2;
      return String(num).padStart(zerosCount, '0');
    });

    result = result.replace(/{NUM}/g, String(num));
    result = result.replace(/{N}/g, String(num));
    return result;
  }

  // Standard prefix + year + paddedNum + suffix formatting
  let yearPart = '';
  if (config.includeYear) {
    yearPart = (config.yearFormat === 'YY' ? shortYear : fullYear) + '-';
  }

  const prefix = config.prefix || '';
  const suffix = config.suffix || '';

  return `${prefix}${yearPart}${paddedNum}${suffix}`;
}

/**
 * Extracts the numerical sequence value from an existing formatted string
 */
export function extractSequenceNumber(value: any, config?: SequenceConfig): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }

  const str = String(value).trim();
  if (!str) return null;

  // If prefix/suffix configured, try stripping them first
  let cleanStr = str;
  if (config?.prefix && cleanStr.startsWith(config.prefix)) {
    cleanStr = cleanStr.substring(config.prefix.length);
  }
  if (config?.suffix && cleanStr.endsWith(config.suffix)) {
    cleanStr = cleanStr.substring(0, cleanStr.length - config.suffix.length);
  }

  // If year is included, strip year prefix (e.g. "2026-" or "26-")
  if (config?.includeYear) {
    cleanStr = cleanStr.replace(/^\d{2,4}[-_/]/, '');
  }

  // Extract the last block of digits in the string
  const matches = cleanStr.match(/\d+/g);
  if (matches && matches.length > 0) {
    const lastDigits = matches[matches.length - 1];
    const parsed = parseInt(lastDigits, 10);
    return isNaN(parsed) ? null : parsed;
  }

  return null;
}

/**
 * Calculates the next formatted sequence value for a given field and dataset
 */
export function generateNextSequenceValue(field: Field, existingRows: any[] = [], date: Date = new Date()): string {
  const config = field.sequenceConfig;
  if (!config || !config.enabled) {
    // Fallback for simple integer auto increment
    if (field.isAutoIncrement) {
      const max = existingRows.reduce((currMax, row) => {
        const val = parseInt(row[field.name], 10);
        return !isNaN(val) && val > currMax ? val : currMax;
      }, 0);
      return String(max + 1);
    }
    return '';
  }

  const startValue = config.startValue !== undefined ? config.startValue : 1;
  const step = config.step !== undefined && config.step > 0 ? config.step : 1;

  let maxNumber: number | null = null;

  for (const row of existingRows) {
    if (!row) continue;
    const rowVal = row[field.name];
    const num = extractSequenceNumber(rowVal, config);
    if (num !== null) {
      if (maxNumber === null || num > maxNumber) {
        maxNumber = num;
      }
    }
  }

  const nextNumber = maxNumber !== null ? maxNumber + step : startValue;
  return formatSequenceValue(config, nextNumber, date);
}

/**
 * Returns a preview list of the first 3 generated numbers for UI preview
 */
export function getSequencePreviewSamples(config: SequenceConfig, count: number = 3): string[] {
  if (!config || !config.enabled) return [];
  const start = config.startValue !== undefined ? config.startValue : 1;
  const step = config.step || 1;
  const samples: string[] = [];
  for (let i = 0; i < count; i++) {
    samples.push(formatSequenceValue(config, start + i * step));
  }
  return samples;
}
