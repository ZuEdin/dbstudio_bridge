import { ExportFormat } from '../types/macro';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { sanitizeProjectName } from './nameUtils';

export interface ExportDataOptions {
  title?: string;
  data: Record<string, any>[];
  columns?: string[];
  filename?: string;
  format: ExportFormat;
}

export function exportDataToFile(options: ExportDataOptions) {
  const { title = 'Bericht_Export', data, filename = `export_${Date.now()}`, format } = options;

  if (!data || data.length === 0) {
    alert('Keine Daten für den Export vorhanden. Bitte prüfen Sie, ob die Quell-Abfrage, die Tabelle oder der Bericht Datensätze enthält.');
    return;
  }

  const columns = options.columns && options.columns.length > 0 
    ? options.columns 
    : Object.keys(data[0] || {});

  switch (format) {
    case 'CSV': {
      let csvContent = '\uFEFF'; // UTF-8 BOM for Excel compatibility
      csvContent += columns.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';') + '\n';
      data.forEach(row => {
        const line = columns.map(c => {
          const val = row[c] !== undefined && row[c] !== null ? String(row[c]) : '';
          return `"${val.replace(/"/g, '""')}"`;
        }).join(';');
        csvContent += line + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      downloadBlob(blob, `${filename}.csv`);
      break;
    }

    case 'JSON': {
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      downloadBlob(blob, `${filename}.json`);
      break;
    }

    case 'XML': {
      let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<export>\n';
      xmlContent += `  <metadata>\n    <title>${escapeXml(title)}</title>\n    <generatedAt>${new Date().toISOString()}</generatedAt>\n  </metadata>\n  <records>\n`;
      data.forEach((row, i) => {
        xmlContent += `    <record id="${i + 1}">\n`;
        columns.forEach(col => {
          const val = row[col] !== undefined && row[col] !== null ? String(row[col]) : '';
          xmlContent += `      <${cleanXmlTag(col)}>${escapeXml(val)}</${cleanXmlTag(col)}>\n`;
        });
        xmlContent += '    </record>\n';
      });
      xmlContent += '  </records>\n</export>';

      const blob = new Blob([xmlContent], { type: 'text/xml;charset=utf-8;' });
      downloadBlob(blob, `${filename}.xml`);
      break;
    }

    case 'XLSX': {
      try {
        const rowsToExport = data.map(row => {
          const formattedRow: Record<string, any> = {};
          columns.forEach(col => {
            formattedRow[col] = row[col] !== undefined && row[col] !== null ? row[col] : '';
          });
          return formattedRow;
        });

        const worksheet = XLSX.utils.json_to_sheet(rowsToExport);
        const workbook = XLSX.utils.book_new();
        const sheetName = (title || 'Daten').replace(/[\\/*?:[\]]/g, '').substring(0, 31) || 'Daten';
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        downloadBlob(blob, `${filename}.xlsx`);
      } catch (err) {
        console.error('XLSX-Erstellung fehlgeschlagen:', err);
        // Fallback to CSV with UTF-8 BOM
        let csvContent = '\uFEFF';
        csvContent += columns.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';') + '\n';
        data.forEach(row => {
          const line = columns.map(c => {
            const val = row[c] !== undefined && row[c] !== null ? String(row[c]) : '';
            return `"${val.replace(/"/g, '""')}"`;
          }).join(';');
          csvContent += line + '\n';
        });
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        downloadBlob(blob, `${filename}.csv`);
      }
      break;
    }

    case 'PDF': {
      try {
        const fnAutoTable = (autoTable as any).default || autoTable;
        const doc = new jsPDF({
          orientation: columns.length > 5 ? 'landscape' : 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        // Title
        doc.setFontSize(16);
        doc.setTextColor(30, 41, 59); // Slate 800
        doc.setFont('helvetica', 'bold');
        doc.text(title, 14, 15);

        // Metadata Subtitle
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139); // Slate 500
        doc.setFont('helvetica', 'normal');
        doc.text(`Erstellt am ${new Date().toLocaleString('de-DE')} • ${data.length} Datensätze`, 14, 21);

        const tableColumn = columns;
        const tableRows = data.map(row => columns.map(col => {
          const val = row[col];
          return val !== undefined && val !== null ? String(val) : '';
        }));

        fnAutoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 26,
          theme: 'grid',
          styles: {
            fontSize: 8,
            cellPadding: 3,
            font: 'helvetica',
            textColor: [30, 41, 59],
            overflow: 'linebreak'
          },
          headStyles: {
            fillColor: [79, 70, 229], // Indigo 600
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'left'
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          },
          margin: { top: 26, right: 14, bottom: 14, left: 14 }
        });

        const safeFilename = filename.replace(/[^a-zA-Z0-9_\-]/g, '_');
        const pdfBlob = doc.output('blob');
        downloadBlob(pdfBlob, `${safeFilename}.pdf`);
        break;
      } catch (err) {
        console.error('PDF-Erstellung mit jsPDF fehlgeschlagen, Fallback zu Druckansicht:', err);
        openPrintWindow(title, data, columns, filename);
        break;
      }
    }

    case 'HTML_PRINT': {
      openPrintWindow(title, data, columns, filename);
      break;
    }
  }
}

function openPrintWindow(title: string, data: Record<string, any>[], columns: string[], filename: string) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${escapeXml(title)}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; color: #1e293b; }
        h1 { color: #4338ca; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 4px; font-size: 20px; }
        .meta { font-size: 11px; color: #64748b; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
        th { background-color: #f1f5f9; color: #334155; font-weight: 700; text-align: left; padding: 10px 8px; border-bottom: 2px solid #cbd5e1; }
        td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .footer { margin-top: 30px; font-size: 10px; color: #94a3b8; text-align: right; border-top: 1px solid #e2e8f0; padding-top: 8px; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 15px; display: flex; justify-content: space-between;">
        <button onclick="window.print()" style="background-color: #4f46e5; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer;">
          🖨️ Als PDF Drucken / Speichern
        </button>
        <button onclick="window.close()" style="background-color: #64748b; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
          Schließen
        </button>
      </div>
      <h1>${escapeXml(title)}</h1>
      <div class="meta">Exportiert am ${new Date().toLocaleString('de-DE')} • ${data.length} Datensätze</div>
      <table>
        <thead>
          <tr>${columns.map(c => `<th>${escapeXml(c)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${data.map(row => `<tr>${columns.map(c => `<td>${escapeXml(String(row[c] ?? ''))}</td>`).join('')}</tr>`).join('\n')}
        </tbody>
      </table>
      <div class="footer">DB Studio Pro • Berichtsmakro Export</div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    // Popup was blocked -> download HTML print view file directly as fallback
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    downloadBlob(blob, `${filename}_druckansicht.html`);
    alert('Pop-up wurde vom Browser blockiert. Eine druckbare HTML-Druckansicht wurde direkt als Datei heruntergeladen.');
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const nameParts = filename.split('.');
  const ext = nameParts.length > 1 ? `.${nameParts.pop()}` : '';
  const baseName = nameParts.join('.');
  const cleanBase = sanitizeProjectName(baseName);
  a.download = `${cleanBase}${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cleanXmlTag(str: string): string {
  const cleaned = str.replace(/[^a-zA-Z0-9_]/g, '_');
  return /^[a-zA-Z_]/.test(cleaned) ? cleaned : `field_${cleaned}`;
}

