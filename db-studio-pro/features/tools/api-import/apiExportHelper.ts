import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToExcel = (
  data: any[],
  showMessage: (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => void
) => {
  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "API Daten");
    XLSX.writeFile(wb, "api_export.xlsx");
    showMessage("Excel Export", "Die Daten wurden erfolgreich als Excel-Datei exportiert.", "success");
  } catch (err: any) {
    showMessage("Fehler beim Export", err.message || "Unbekannter Fehler beim Excel-Export.", "error");
  }
};

export const exportToJson = (
  data: any[],
  showMessage: (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => void
) => {
  try {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", "api_export.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showMessage("JSON Export", "Die Daten wurden erfolgreich als JSON-Datei exportiert.", "success");
  } catch (err: any) {
    showMessage("Fehler beim Export", err.message || "Unbekannter Fehler beim JSON-Export.", "error");
  }
};

export const exportToPdf = (
  data: any[],
  columns: string[],
  showMessage: (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => void
) => {
  try {
    const doc = new jsPDF();
    doc.text("API Daten Export", 14, 15);
    
    const rows = data.map(item => columns.map(header => {
      const val = item[header];
      return Array.isArray(val) ? `[Array(${val.length})]` : String(val ?? '');
    }));

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 20,
      theme: 'striped',
      styles: { fontSize: 8, overflow: 'ellipsize' }
    });

    doc.save("api_export.pdf");
    showMessage("PDF Export", "Die Daten wurden erfolgreich als PDF-Datei exportiert.", "success");
  } catch (err: any) {
    showMessage("Fehler beim Export", err.message || "Unbekannter Fehler beim PDF-Export.", "error");
  }
};
