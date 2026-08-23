import React, { useState } from 'react';
import { Table, Field } from '../../types/index';
import { X, Database, FileText, Code2, Eye } from 'lucide-react';
import { MarkdownViewer, isLikelyMarkdown } from '../common/MarkdownViewer';

interface RecordDetailModalProps {
  table: Table;
  recordId: any;
  onClose: () => void;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({ table, recordId, onClose }) => {
  // Find record based on Primary Key (heuristically ID or first PK)
  const pkField = table.fields.find(f => f.isPrimaryKey) || table.fields[0];
  const record = table.data?.find(r => String(r[pkField.name]) === String(recordId));

  const [rawViewFields, setRawViewFields] = useState<Record<string, boolean>>({});

  const toggleRawView = (fieldId: string) => {
    setRawViewFields(prev => ({
      ...prev,
      [fieldId]: !prev[fieldId],
    }));
  };

  const hasMarkdownField = table.fields.some(
    f => f.rendererType === 'markdown' || isLikelyMarkdown(record ? record[f.name] : '')
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center animate-in fade-in-25 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl w-full ${
          hasMarkdownField ? 'max-w-3xl' : 'max-w-xl'
        } border border-slate-300 overflow-hidden flex flex-col max-h-[85vh] transition-all`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3.5 bg-slate-800 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-500/20 rounded-lg border border-blue-400/30">
              <Database size={16} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">
                {table.name}
              </h3>
              <p className="text-xs text-slate-400">
                Datensatz <span className="text-slate-200 font-mono">#{recordId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-0 overflow-y-auto flex-1">
          {record ? (
            <div className="divide-y divide-slate-100">
              {table.fields.map(field => {
                const val = record[field.name];
                const isExplicitMarkdown = field.rendererType === 'markdown';
                const hasMd = isExplicitMarkdown || isLikelyMarkdown(val);
                const showRaw = !!rawViewFields[field.id];

                return (
                  <div
                    key={field.id}
                    className={`p-4 transition-colors hover:bg-slate-50/60 ${
                      hasMd ? 'flex flex-col gap-2' : 'grid grid-cols-1 sm:grid-cols-3 gap-2 items-start'
                    }`}
                  >
                    {/* Field Header / Label */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-slate-600 uppercase tracking-wider">
                          {field.name}
                        </span>
                        {field.isPrimaryKey && (
                          <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded border border-blue-200">
                            PK
                          </span>
                        )}
                        {hasMd && (
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                            <FileText size={10} /> Markdown
                          </span>
                        )}
                      </div>

                      {hasMd && val && (
                        <button
                          type="button"
                          onClick={() => toggleRawView(field.id)}
                          className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-200/70 transition-colors"
                          title={showRaw ? "Formatierte Ansicht anzeigen" : "Quelltext anzeigen"}
                        >
                          {showRaw ? (
                            <>
                              <Eye size={12} /> Formatierte Ansicht
                            </>
                          ) : (
                            <>
                              <Code2 size={12} /> Quelltext
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Field Content */}
                    <div className={hasMd ? 'w-full mt-1' : 'sm:col-span-2 text-sm text-slate-800 break-words'}>
                      {val === undefined || val === null || val === '' ? (
                        <span className="text-slate-400 italic text-xs">-</span>
                      ) : hasMd && !showRaw ? (
                        <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 shadow-2xs">
                          <MarkdownViewer content={String(val)} />
                        </div>
                      ) : showRaw ? (
                        <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs font-mono whitespace-pre-wrap break-words border border-slate-800">
                          {String(val)}
                        </pre>
                      ) : (
                        <span className="text-sm font-medium text-slate-900">
                          {typeof val === 'boolean' ? (val ? 'Ja (true)' : 'Nein (false)') : String(val)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm">
              Datensatz nicht gefunden.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {table.fields.length} Felder
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
