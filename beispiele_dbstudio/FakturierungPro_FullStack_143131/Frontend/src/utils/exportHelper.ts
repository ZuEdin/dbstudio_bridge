import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type ExportFormat = 'PDF' | 'XLSX' | 'XML' | 'JSON' | 'CSV' | 'HTML_PRINT';

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
    alert('Keine Daten für den Export vorhanden.');
    return;
  }

  const columns = options.columns && options.columns.length > 0 ? options.columns : Object.keys(data[0] || {});

  switch (format) {
    case 'CSV': {
      let csvContent = '\uFEFF';
      csvContent += columns.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';') + '\n';
      data.forEach(row => {
        const line = columns.map(c => `"${String(row[c] ?? '').replace(/"/g, '""')}"`).join(';');
        csvContent += line + '\n';
      });
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      downloadBlob(blob, `${filename}.csv`);
      break;
    }
    case 'JSON': {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
      downloadBlob(blob, `${filename}.json`);
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
        const sheetName = (title || 'Daten').replace(/[\/*?:[]]/g, '').substring(0, 31) || 'Daten';
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        downloadBlob(blob, `${filename}.xlsx`);
      } catch (err) {
        let csvContent = '\uFEFF';
        csvContent += columns.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';') + '\n';
        data.forEach(row => {
          const line = columns.map(c => `"${String(row[c] ?? '').replace(/"/g, '""')}"`).join(';');
          csvContent += line + '\n';
        });
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        downloadBlob(blob, `${filename}.csv`);
      }
      break;
    }
    case 'PDF': {
      try {
        const doc = new jsPDF({
          orientation: columns.length > 5 ? 'landscape' : 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        doc.setFontSize(16);
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.text(title || 'Bericht', 14, 15);

        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.text(`Erstellt am ${new Date().toLocaleString('de-DE')} • ${data.length} Datensätze`, 14, 21);

        const tableColumn = columns;
        const tableRows = data.map(row => columns.map(col => {
          const val = row[col];
          return val !== undefined && val !== null ? String(val) : '';
        }));

        if (typeof (doc as any).autoTable === 'function') {
          (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 26,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 3, font: 'helvetica', textColor: [30, 41, 59], overflow: 'linebreak' },
            headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'left' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { top: 26, right: 14, bottom: 14, left: 14 }
          });
        } else {
          const fnAutoTable = (autoTable as any).default || autoTable;
          fnAutoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 26,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 3, font: 'helvetica', textColor: [30, 41, 59], overflow: 'linebreak' },
            headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'left' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { top: 26, right: 14, bottom: 14, left: 14 }
          });
        }

        const safeFilename = (filename || 'export').replace(/[^a-zA-Z0-9_\-]/g, '_');
        const pdfBlob = doc.output('blob');
        downloadBlob(pdfBlob, `${safeFilename}.pdf`);
      } catch (err) {
        console.error('PDF Export failed, falling back to print:', err);
        openPrintIframeOrWindow(title, data, columns);
      }
      break;
    }
    case 'HTML_PRINT': {
      openPrintIframeOrWindow(title, data, columns);
      break;
    }
  }
}

function openPrintIframeOrWindow(title: string, data: any[], columns: string[]) {
  let printWindow = window.open('', '_blank');
  if (!printWindow) {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.write(`<html><head><title>${title}</title><style>body{font-family:sans-serif;padding:20px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ccc;padding:8px;text-align:left;}</style></head><body><h1>${title}</h1><table><thead><tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${data.map(r => `<tr>${columns.map(c => `<td>${r[c] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }, 250);
    }
    return;
  }
  printWindow.document.write(`<html><head><title>${title}</title><style>body{font-family:sans-serif;padding:20px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ccc;padding:8px;text-align:left;}</style></head><body><h1>${title}</h1><button onclick="window.print()">Drucken / Als PDF Speichern</button><table><thead><tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${data.map(r => `<tr>${columns.map(c => `<td>${r[c] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`);
  printWindow.document.close();
  setTimeout(() => {
    try { printWindow.print(); } catch(e) {}
  }, 500);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
