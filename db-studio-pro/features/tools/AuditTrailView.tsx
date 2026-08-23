import React, { useState, useEffect } from 'react';
import { AuditLogEntry, getAuditLogs, clearAuditLogs } from '../../utils/auditTrail';
import { Shield, Clock, Trash2, Download, Search, Filter, RefreshCw, User, Database, Layers } from 'lucide-react';
import { exportDataToFile } from '../../utils/exportHelper';

export const AuditTrailView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const reloadLogs = () => {
    setLogs(getAuditLogs());
  };

  useEffect(() => {
    reloadLogs();
  }, []);

  const handleClear = () => {
    if (window.confirm('Möchten Sie die gesamte Änderungshistorie wirklich löschen?')) {
      clearAuditLogs();
      reloadLogs();
    }
  };

  const handleExport = (format: 'CSV' | 'XLSX' | 'PDF') => {
    exportDataToFile({
      title: 'Audit_Trail_Aenderungshistorie',
      data: filteredLogs,
      format: format,
      filename: `Audit_Trail_${Date.now()}`
    });
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.tableName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.fieldName && log.fieldName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="font-bold text-base text-white flex items-center gap-2">
              Audit Trail &amp; Änderungshistorie
            </h2>
            <p className="text-xs text-slate-400">Lückenlose Protokollierung aller Datenänderungen, Logins und Abfragenausführungen.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={reloadLogs}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
            title="Aktualisieren"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => handleExport('CSV')}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Download size={14} /> CSV
          </button>
          <button
            onClick={() => handleExport('PDF')}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Download size={14} /> PDF
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Trash2 size={14} /> Historie leeren
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Suchen nach Tabelle, Benutzer, Feld..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          <span className="text-xs font-semibold text-slate-600">Aktion:</span>
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2 py-1 bg-white font-medium text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Alle Aktionen</option>
            <option value="INSERT">INSERT (Neu)</option>
            <option value="UPDATE">UPDATE (Geändert)</option>
            <option value="DELETE">DELETE (Gelöscht)</option>
            <option value="EXECUTE_QUERY">EXECUTE_QUERY</option>
            <option value="LOGIN">LOGIN</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="flex-1 overflow-auto bg-white p-4">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-center">
            <Shield size={48} className="stroke-1 text-slate-300 mb-2" />
            <p className="font-semibold text-sm text-slate-600">Keine Protokolleinträge vorhanden</p>
            <p className="text-xs text-slate-400">Änderungen an Tabellen und Formularen werden hier automatisch protokolliert.</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider">
                  <th className="p-2.5">Zeitstempel</th>
                  <th className="p-2.5">Aktion</th>
                  <th className="p-2.5">Tabelle</th>
                  <th className="p-2.5">Datensatz-ID</th>
                  <th className="p-2.5">Feld</th>
                  <th className="p-2.5">Alter Wert</th>
                  <th className="p-2.5">Neuer Wert</th>
                  <th className="p-2.5">Benutzer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-2.5 text-slate-500 whitespace-nowrap font-sans text-[11px]">
                      {new Date(log.timestamp).toLocaleString('de-DE')}
                    </td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action === 'INSERT' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        log.action === 'UPDATE' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                        log.action === 'DELETE' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                        'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-2.5 font-bold text-slate-800">{log.tableName}</td>
                    <td className="p-2.5 text-slate-600">{log.recordId || '-'}</td>
                    <td className="p-2.5 font-semibold text-slate-700">{log.fieldName || log.details || '-'}</td>
                    <td className="p-2.5 text-rose-600 max-w-[150px] truncate" title={String(log.oldValue ?? '')}>
                      {log.oldValue !== undefined ? String(log.oldValue) : '-'}
                    </td>
                    <td className="p-2.5 text-emerald-600 font-bold max-w-[150px] truncate" title={String(log.newValue ?? '')}>
                      {log.newValue !== undefined ? String(log.newValue) : '-'}
                    </td>
                    <td className="p-2.5 text-slate-600 font-sans font-medium">{log.user || 'admin'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
