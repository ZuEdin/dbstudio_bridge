import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, RefreshCw, AlertCircle, FileText, CheckCircle2, ShieldCheck, HelpCircle } from 'lucide-react';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useUIStore } from '../../../stores/useUIStore';
import { Table, Field } from '../../../types/index';
import { inferFieldType } from '../../../utils/apiImportHelper';

interface CsvDatevImportSectionProps {
  showMessage: (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
}

interface DatevHeaderInfo {
  formatName: string; // e.g. DTVF / EXTF
  version: string;
  dataCategory: string; // e.g. 11 = Buchungsstapel
  beraterNummer: string;
  mandantenNummer: string;
  wirtschaftsjahrStart: string;
  sachkontenLaenge: string;
  datumVon: string;
  datumBis: string;
  erzeugungsdatum: string;
  waehrung: string;
}

export const CsvDatevImportSection: React.FC<CsvDatevImportSectionProps> = ({ showMessage }) => {
  const store = useProjectStore();
  const ui = useUIStore();

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState<string>('');
  const [delimiter, setDelimiter] = useState<';' | ',' | '\t' | '|'>(';');
  const [hasHeader, setHasHeader] = useState(true);
  const [csvProgress, setCsvProgress] = useState('');
  
  // DATEV specific states
  const [isDatev, setIsDatev] = useState(false);
  const [datevHeader, setDatevHeader] = useState<DatevHeaderInfo | null>(null);
  const [datevStats, setDatevStats] = useState<{
    totalBookings: number;
    sollSum: number;
    habenSum: number;
    isBalanced: boolean;
    invalidRows: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // A robust CSV parser supporting quotes and escaped delimiters
  const parseCSV = (text: string, delim: string): string[][] => {
    // Clean BOM if present
    const cleanText = text.replace(/^\uFEFF/, '');
    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentValue = '';

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const nextChar = cleanText[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Double quote inside quotes means a single quote
          currentValue += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === delim && !inQuotes) {
        row.push(currentValue.trim());
        currentValue = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip \n
        }
        row.push(currentValue.trim());
        lines.push(row);
        row = [];
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    // Handle last element if file doesn't end with a newline
    if (currentValue || row.length > 0) {
      row.push(currentValue.trim());
      lines.push(row);
    }

    // Filter out completely empty lines
    return lines.filter(line => line.length > 0 && line.some(val => val !== ''));
  };

  const processFileContent = (rawText: string, filename: string) => {
    setCsvText(rawText);
    
    // Auto-detect delimiter and check for DATEV header
    let detectedDelim: ';' | ',' | '\t' | '|' = ';';
    const firstLines = rawText.split(/\r?\n/).slice(0, 5);
    
    // Count occurrences of possible delimiters in the first line
    const firstLine = firstLines[0] || '';
    const semic = (firstLine.match(/;/g) || []).length;
    const comm = (firstLine.match(/,/g) || []).length;
    const tab = (firstLine.match(/\t/g) || []).length;
    const pipe = (firstLine.match(/\|/g) || []).length;

    if (comm > semic && comm > tab && comm > pipe) detectedDelim = ',';
    else if (tab > semic && tab > comm && tab > pipe) detectedDelim = '\t';
    else if (pipe > semic && pipe > comm && pipe > tab) detectedDelim = '|';
    
    setDelimiter(detectedDelim);

    // DATEV Detection: Look for DTVF or EXTF on line 1, separated by semicolon/comma
    const datevRegex = /^(DTVF|EXTF)/i;
    const isDatevFile = datevRegex.test(firstLine);
    setIsDatev(isDatevFile);

    if (isDatevFile) {
      // Parse DATEV Header Metadata
      const parts = firstLine.split(detectedDelim);
      if (parts.length >= 10) {
        const headerInfo: DatevHeaderInfo = {
          formatName: parts[0] || 'DTVF',
          version: parts[1] || 'Unknown',
          dataCategory: parts[2] === '11' ? '11 (Buchungsstapel)' : parts[2] || 'Unbekannt',
          beraterNummer: parts[7] || 'Keine',
          mandantenNummer: parts[8] || 'Keine',
          wirtschaftsjahrStart: parts[9] || 'Unbekannt',
          sachkontenLaenge: parts[10] || 'Unbekannt',
          datumVon: parts[11] || 'Unbekannt',
          datumBis: parts[12] || 'Unbekannt',
          erzeugungsdatum: parts[15] || 'Unbekannt',
          waehrung: parts[16] || 'EUR'
        };
        setDatevHeader(headerInfo);
        setHasHeader(true);
      }
    } else {
      setDatevHeader(null);
    }

    setCsvProgress('Datei analysiert. Bereit zum Import.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setCsvProgress('Datei wird geladen...');

    const reader = new FileReader();
    // DATEV and general German CSV files are often Windows-1252/ANSI-encoded
    // Let's read first and fallback to Windows-1252 if we see encoding issues, or default to UTF-8
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      processFileContent(text, file.name);
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleImport = () => {
    if (!csvText) {
      return showMessage("Fehler", "Bitte laden Sie zuerst eine CSV/DATEV Datei hoch.", "warning");
    }

    setCsvProgress('Tabellen-Struktur wird generiert...');
    try {
      const parsedLines = parseCSV(csvText, delimiter);
      if (parsedLines.length === 0) {
        throw new Error("Keine Daten in der Datei gefunden.");
      }

      let headerRowIndex = 0;
      let dataStartRowIndex = 1;
      let headers: string[] = [];

      if (isDatev) {
        // In DATEV files, line 1 is the DTVF metadata header.
        // Line 2 contains client-specific info or structure headers.
        // Usually, the actual column headers are located around line 2 or 3 (e.g. after DTVF row).
        // Let's find the header row. It typically contains fields like "Umsatz" or "Konto" or "Soll/Haben-Kennzeichen".
        let foundHeaders = false;
        for (let i = 1; i < Math.min(parsedLines.length, 6); i++) {
          const line = parsedLines[i];
          if (line.some(cell => /Umsatz|Konto|Soll/i.test(cell))) {
            headerRowIndex = i;
            dataStartRowIndex = i + 1;
            headers = line;
            foundHeaders = true;
            break;
          }
        }

        if (!foundHeaders) {
          // Fallback if no specific DATEV keywords are found
          headerRowIndex = 1;
          dataStartRowIndex = 2;
          headers = parsedLines[1] || [];
        }
      } else {
        if (hasHeader) {
          headers = parsedLines[0];
          dataStartRowIndex = 1;
        } else {
          // Generate column names
          headers = parsedLines[0].map((_, i) => `Spalte_${i + 1}`);
          dataStartRowIndex = 0;
        }
      }

      // Sanitize headers
      const cleanHeaders = headers.map((h, i) => {
        let name = String(h || `Spalte_${i + 1}`)
          .trim()
          .replace(/[^a-zA-Z0-9_]/g, '_');
        
        // Prevent duplicate headers
        return name;
      });

      const rawRows = parsedLines.slice(dataStartRowIndex);
      if (rawRows.length === 0) {
        throw new Error("Keine Datensätze nach dem Tabellenkopf gefunden.");
      }

      // Build data array
      const rowData: any[] = [];
      let sollSum = 0;
      let habenSum = 0;
      let invalidRows = 0;

      rawRows.forEach((row, rowIndex) => {
        const rowObj: any = {};
        let hasData = false;

        cleanHeaders.forEach((header, colIndex) => {
          let cellValue = row[colIndex] ?? '';
          rowObj[header] = cellValue;
          if (cellValue !== '') hasData = true;
        });

        if (hasData) {
          // Generate a sequential id if not present
          rowObj['id'] = rowIndex + 1;
          rowData.push(rowObj);

          // For DATEV calculations (German formats: "Umsatz", "Soll_Haben_Kennzeichen", etc.)
          if (isDatev) {
            // Find Umsatz and Soll/Haben column keys
            const umsatzKey = cleanHeaders.find(h => /Umsatz/i.test(h));
            const shKey = cleanHeaders.find(h => /Soll_Haben|S_H/i.test(h));

            if (umsatzKey) {
              const valStr = String(rowObj[umsatzKey]).replace(/[^\d,.-]/g, '').replace(',', '.');
              const amount = parseFloat(valStr);
              if (!isNaN(amount)) {
                const shFlag = shKey ? String(rowObj[shKey]).trim().toUpperCase() : 'S';
                if (shFlag === 'S' || shFlag === 'SOLL') {
                  sollSum += amount;
                } else if (shFlag === 'H' || shFlag === 'HABEN') {
                  habenSum += amount;
                } else {
                  // Fallback: assume positive is Soll, negative is Haben
                  if (amount >= 0) sollSum += amount;
                  else habenSum += Math.abs(amount);
                }
              } else if (rowObj[umsatzKey] !== '') {
                invalidRows++;
              }
            }
          }
        }
      });

      // Build fields
      const fields: Field[] = [
        {
          id: crypto.randomUUID(),
          name: 'id',
          type: 'INTEGER',
          isPrimaryKey: true,
          isAutoIncrement: true
        }
      ];

      cleanHeaders.forEach((header, idx) => {
        if (header.toLowerCase() === 'id') return; // already added custom id primary key

        // Sample a value to infer field type
        const sampleVal = rowData[0]?.[header];
        const fieldType = inferFieldType(sampleVal);

        fields.push({
          id: crypto.randomUUID(),
          name: header,
          type: fieldType,
          isPrimaryKey: false,
          allowNull: true
        });
      });

      const tableName = csvFile
        ? csvFile.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "_")
        : `Import_${Date.now() % 10000}`;

      const newTable: Table = {
        id: crypto.randomUUID(),
        name: isDatev ? `DATEV_${tableName}` : tableName,
        fields: fields,
        data: rowData
      };

      store.addTable(newTable);

      if (isDatev) {
        const stats = {
          totalBookings: rowData.length,
          sollSum: Math.round(sollSum * 100) / 100,
          habenSum: Math.round(habenSum * 100) / 100,
          isBalanced: Math.abs(sollSum - habenSum) < 0.05,
          invalidRows: invalidRows
        };
        setDatevStats(stats);

        ui.addToast(`DATEV-Export "${newTable.name}" erfolgreich importiert!`, 'success');
        if (stats.isBalanced) {
          showMessage("DATEV Import erfolgreich", `Der DATEV-Buchungsstapel wurde ausgeglichen importiert (${stats.totalBookings} Buchungssätze, Summe: ${stats.sollSum.toFixed(2)} €).`, "success");
        } else {
          showMessage("DATEV-Import Warnung", `Der Buchungsstapel ist nicht ausgeglichen! Soll: ${stats.sollSum.toFixed(2)} € vs Haben: ${stats.habenSum.toFixed(2)} €. Bitte Relationen prüfen.`, "warning");
        }
      } else {
        ui.addToast(`CSV-Tabelle "${newTable.name}" erfolgreich importiert!`, 'success');
        showMessage("CSV Import erfolgreich", `Die Tabelle "${newTable.name}" mit ${rowData.length} Zeilen wurde erfolgreich in IndexedDB angelegt.`, "success");
      }

      setCsvProgress('Erfolgreich importiert.');
    } catch (err: any) {
      ui.addToast(`Parser-Fehler: ${err.message}`, 'error');
      setCsvProgress('Fehler beim Import.');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col gap-6 max-w-4xl mx-auto w-full mt-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-indigo-100 text-indigo-700">
            <FileText size={28}/>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">CSV &amp; DATEV Importer</h3>
            <p className="text-slate-500 text-xs mt-1">Laden Sie Standard CSV-Dateien oder hochkomplexe deutsche DATEV-Buchungsstapel direkt hoch.</p>
          </div>
        </div>
        {isDatev && (
          <span className="bg-indigo-600 text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 animate-pulse">
            <ShieldCheck size={12}/> DATEV-Standard erkannt
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        
        {/* Left Side: Upload & Configuration */}
        <div className="col-span-2 flex flex-col gap-4">
          
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 bg-slate-50/50 flex flex-col items-center justify-center gap-4 hover:border-indigo-500 transition-colors cursor-pointer group relative min-h-[160px]">
            <input 
              type="file" 
              accept=".csv, .txt" 
              onChange={handleFileUpload}
              ref={fileInputRef}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            />
            <div className="flex flex-col items-center justify-center text-center">
              <Upload size={36} className="text-slate-400 group-hover:text-indigo-600 transition-colors mb-2" />
              <span className="text-xs font-bold text-slate-700">
                {csvFile ? csvFile.name : 'CSV oder DATEV-Textdatei auswählen'}
              </span>
              <span className="text-[10px] text-slate-400 mt-1">Erlaubt: .csv, .txt (Trennzeichen-basiert)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            
            {/* Trennzeichen */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-600">Trennzeichen / Delimiter</label>
              <select 
                value={delimiter}
                onChange={(e: any) => setDelimiter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value=";">Semicolon ( ; ) — Standard in DE / DATEV</option>
                <option value=",">Comma ( , ) — Standard US / UK</option>
                <option value="&#9;">Tabulator ( \t )</option>
                <option value="|">Vertical Bar ( | )</option>
              </select>
            </div>

            {/* Kopfzeile */}
            <div className="flex flex-col gap-1 justify-center pl-4">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={hasHeader} 
                  onChange={(e) => setHasHeader(e.target.checked)}
                  disabled={isDatev}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Erste Zeile enthält Spaltennamen
              </label>
              <span className="text-[10px] text-slate-400">Bei DATEV-Importen wird die Kopfzeile automatisch detektiert.</span>
            </div>

          </div>

          <button
            onClick={handleImport}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <CheckCircle2 size={16}/> Daten einlesen & Tabelle anlegen
          </button>

          {csvProgress && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center gap-2 text-xs text-slate-600 font-medium">
              <RefreshCw size={14} className={`text-indigo-600 ${csvProgress.includes('laden') || csvProgress.includes('Struktur') ? 'animate-spin' : ''}`}/>
              <span>Status: {csvProgress}</span>
            </div>
          )}

        </div>

        {/* Right Side: DATEV Metadata Inspector & Accounting balanced checks */}
        <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-4 flex flex-col gap-4">
          <span className="text-xs font-bold text-slate-700 border-b border-slate-200 pb-2 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-indigo-600" /> DATEV Meta-Inspektor
          </span>

          {isDatev && datevHeader ? (
            <div className="flex flex-col gap-2.5 text-[11px] text-slate-600">
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-400 font-medium">Beraternummer:</span>
                <span className="font-bold text-slate-800 font-mono">{datevHeader.beraterNummer}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-400 font-medium">Mandantennummer:</span>
                <span className="font-bold text-slate-800 font-mono">{datevHeader.mandantenNummer}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-400 font-medium">Wirtschaftsjahr:</span>
                <span className="font-bold text-slate-800 font-mono">{datevHeader.wirtschaftsjahrStart}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-400 font-medium">Sachkontenlänge:</span>
                <span className="font-bold text-slate-800 font-mono">{datevHeader.sachkontenLaenge}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-400 font-medium">Datum von / bis:</span>
                <span className="font-bold text-slate-800 font-mono">{datevHeader.datumVon} - {datevHeader.datumBis}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-400 font-medium">Währung:</span>
                <span className="font-bold text-indigo-700 font-mono">{datevHeader.waehrung}</span>
              </div>

              {datevStats && (
                <div className="mt-2 bg-white p-3 rounded-lg border border-slate-200 flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Buchungsprüfung (Soll/Haben)</span>
                  
                  <div className="flex justify-between">
                    <span>Soll-Summe:</span>
                    <span className="font-bold text-slate-800 font-mono">{datevStats.sollSum.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Haben-Summe:</span>
                    <span className="font-bold text-slate-800 font-mono">{datevStats.habenSum.toFixed(2)} €</span>
                  </div>
                  
                  <div className="border-t border-slate-100 pt-2 mt-1 flex items-center justify-between">
                    <span>Stapel-Ausgleich:</span>
                    {datevStats.isBalanced ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={10}/> Ausgeglichen
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertCircle size={10}/> Nicht Ausgeglichen
                      </span>
                    )}
                  </div>
                  {datevStats.invalidRows > 0 && (
                    <div className="text-[10px] text-amber-600 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle size={10}/> {datevStats.invalidRows} Buchungszeile(n) fehlerhaft
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 flex flex-col items-center justify-center gap-2">
              <HelpCircle size={24} className="opacity-40" />
              <p className="text-xs">Keine DATEV-Datei geladen.</p>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Deutsche Buchhaltungs-DATEV-CSV Dateien enthalten eine DTVF-Kopfzeile in Zeile 1. Das System extrahiert diese Meta-Daten und führt Soll/Haben Bilanz-Kontrollen durch.</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
