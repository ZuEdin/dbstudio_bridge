import React, { useState } from 'react';
import { Node } from '@xyflow/react';
import { Table, Report } from '../../../types/index';
import { 
  Settings, 
  Database, 
  Mail, 
  FileSpreadsheet, 
  Bell, 
  HelpCircle, 
  RotateCcw, 
  Globe, 
  Clock, 
  Code2, 
  Plus, 
  Trash2, 
  Info,
  Sparkles,
  Zap,
  Variable
} from 'lucide-react';
import { 
  WorkflowFieldMapping, 
  WorkflowNodeData,
  WorkflowTriggerConfig,
  WorkflowDatabaseActionConfig,
  WorkflowEmailActionConfig,
  WorkflowExportActionConfig,
  WorkflowNotificationActionConfig,
  WorkflowConditionConfig,
  WorkflowLoopConfig,
  WorkflowApiConfig,
  WorkflowDelayConfig,
  WorkflowJsScriptConfig
} from '../../../types/workflow';

interface WorkflowPropertiesProps {
  node: Node | undefined;
  tables: Table[];
  reports?: Report[];
  onUpdate: (data: any) => void;
}

export const WorkflowProperties: React.FC<WorkflowPropertiesProps> = ({ 
  node, 
  tables, 
  reports = [], 
  onUpdate 
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'variables'>('config');

  if (!node) {
    return (
      <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 items-center justify-center p-8 text-center text-slate-400" id="workflow-properties-empty">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 border border-slate-100 text-slate-300">
          <Settings size={24} />
        </div>
        <h4 className="font-bold text-slate-700 text-sm">Kein Knoten ausgewählt</h4>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Klicken Sie auf einen Knoten auf der Arbeitsfläche, um dessen Trigger, Logik oder Aktionen zu konfigurieren.
        </p>
      </div>
    );
  }

  const nodeData = (node.data || {}) as WorkflowNodeData;
  const currentTable = tables.find(t => 
    t.id === nodeData.triggerConfig?.tableId || 
    t.id === nodeData.databaseActionConfig?.targetTableId ||
    t.id === nodeData.loopConfig?.tableId
  );

  const insertVariable = (varName: string) => {
    navigator.clipboard?.writeText(`{{${varName}}}`);
  };

  // ----------------------------------------------------
  // 1. TRIGGER PROPERTIES
  // ----------------------------------------------------
  const renderTriggerProperties = () => {
    const config: WorkflowTriggerConfig = nodeData.triggerConfig || { event: 'onCreate' };
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Trigger-Ereignis (Event)
          </label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            value={config.event || 'onCreate'}
            onChange={(e) => onUpdate({ triggerConfig: { ...config, event: e.target.value as any } })}
          >
            <option value="onCreate">Beim Erstellen eines Datensatzes (onCreate)</option>
            <option value="onUpdate">Beim Ändern eines Datensatzes (onUpdate)</option>
            <option value="onDelete">Beim Löschen eines Datensatzes (onDelete)</option>
            <option value="onFieldChange">Bei Änderung eines bestimmten Feldes</option>
            <option value="onSchedule">Zeitgesteuert (Cron / Intervall)</option>
            <option value="onManual">Manueller Start (Button / Klick / Testlauf)</option>
            <option value="onFormSubmit">Beim Absenden eines Formulars</option>
          </select>
        </div>

        {config.event !== 'onSchedule' && config.event !== 'onManual' && (
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Betroffene Tabelle
            </label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              value={config.tableId || ''}
              onChange={(e) => onUpdate({ triggerConfig: { ...config, tableId: e.target.value } })}
            >
              <option value="">Alle / Beliebige Tabelle</option>
              {tables.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.fields.length} Felder)</option>
              ))}
            </select>
          </div>
        )}

        {config.event === 'onFieldChange' && currentTable && (
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Zu überwachendes Feld
            </label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              value={config.fieldId || ''}
              onChange={(e) => onUpdate({ triggerConfig: { ...config, fieldId: e.target.value } })}
            >
              <option value="">Feld auswählen...</option>
              {currentTable.fields.map(f => (
                <option key={f.id} value={f.id}>{f.name} ({f.type})</option>
              ))}
            </select>
          </div>
        )}

        {config.event === 'onSchedule' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Cron-Ausdruck / Zeitplan
              </label>
              <input 
                type="text"
                placeholder="0 8 * * * (Jeden Tag um 08:00)"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                value={config.cronExpression || ''}
                onChange={(e) => onUpdate({ triggerConfig: { ...config, cronExpression: e.target.value } })}
              />
            </div>
            <div className="flex flex-wrap gap-1.5 text-[10px]">
              <button 
                type="button" 
                onClick={() => onUpdate({ triggerConfig: { ...config, cronExpression: '0 * * * *' } })}
                className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 rounded transition-colors"
              >
                Stündlich
              </button>
              <button 
                type="button" 
                onClick={() => onUpdate({ triggerConfig: { ...config, cronExpression: '0 8 * * *' } })}
                className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 rounded transition-colors"
              >
                Täglich 08:00
              </button>
              <button 
                type="button" 
                onClick={() => onUpdate({ triggerConfig: { ...config, cronExpression: '0 0 * * 1' } })}
                className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 rounded transition-colors"
              >
                Montags 00:00
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ----------------------------------------------------
  // 2. DATABASE ACTION PROPERTIES
  // ----------------------------------------------------
  const renderDatabaseProperties = () => {
    const config: WorkflowDatabaseActionConfig = nodeData.databaseActionConfig || (nodeData.actionConfig as any) || { actionType: 'createRecord' };
    const targetTable = tables.find(t => t.id === config.targetTableId);
    const mappings: WorkflowFieldMapping[] = config.fieldMappings || [];

    const handleAddMapping = (fieldId: string) => {
      const updated = [...mappings, {
        fieldId,
        valueMode: 'variable' as const,
        variableName: `trigger.${fieldId}`
      }];
      onUpdate({ databaseActionConfig: { ...config, fieldMappings: updated } });
    };

    const handleRemoveMapping = (index: number) => {
      const updated = mappings.filter((_, i) => i !== index);
      onUpdate({ databaseActionConfig: { ...config, fieldMappings: updated } });
    };

    const handleUpdateMapping = (index: number, partial: Partial<WorkflowFieldMapping>) => {
      const updated = mappings.map((m, i) => i === index ? { ...m, ...partial } : m);
      onUpdate({ databaseActionConfig: { ...config, fieldMappings: updated } });
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Aktions-Typ
          </label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            value={config.actionType || 'createRecord'}
            onChange={(e) => onUpdate({ databaseActionConfig: { ...config, actionType: e.target.value as any } })}
          >
            <option value="createRecord">Neuen Datensatz anlegen (Insert)</option>
            <option value="updateRecord">Datensatz aktualisieren (Update)</option>
            <option value="deleteRecord">Datensatz löschen (Delete)</option>
            <option value="calculateField">Formel auf Spalte anwenden (Calculate)</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Zieltabelle
          </label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            value={config.targetTableId || ''}
            onChange={(e) => onUpdate({ databaseActionConfig: { ...config, targetTableId: e.target.value } })}
          >
            <option value="">Tabelle auswählen...</option>
            {tables.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.fields.length} Felder)</option>
            ))}
          </select>
        </div>

        {/* Create / Update Field Mappings */}
        {(config.actionType === 'createRecord' || config.actionType === 'updateRecord') && targetTable && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Feldzuweisungen ({mappings.length})
              </label>
              <select
                className="text-[10px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 rounded px-1.5 py-1 outline-none cursor-pointer"
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddMapping(e.target.value);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
              >
                <option value="" disabled>+ Feld zuweisen...</option>
                {targetTable.fields.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            {mappings.length === 0 ? (
              <div className="p-3 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-400">
                Keine Felder explizit zugewiesen (Werte mit gleichem Namen werden automatisch übernommen).
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {mappings.map((m, idx) => {
                  const targetField = targetTable.fields.find(f => f.id === m.fieldId);
                  return (
                    <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-700">
                        <span>{targetField ? targetField.name : m.fieldId}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMapping(idx)}
                          className="text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        <select
                          className="bg-white border border-slate-200 rounded p-1 text-[11px] outline-none"
                          value={m.valueMode}
                          onChange={(e) => handleUpdateMapping(idx, { valueMode: e.target.value as any })}
                        >
                          <option value="variable">Variable</option>
                          <option value="formula">Formel</option>
                          <option value="static">Statisch</option>
                        </select>

                        <div className="col-span-2">
                          {m.valueMode === 'variable' && (
                            <input
                              type="text"
                              placeholder="trigger.kunde_name"
                              className="w-full bg-white border border-slate-200 rounded p-1 text-[11px] font-mono outline-none"
                              value={m.variableName || ''}
                              onChange={(e) => handleUpdateMapping(idx, { variableName: e.target.value })}
                            />
                          )}
                          {m.valueMode === 'formula' && (
                            <input
                              type="text"
                              placeholder="[Menge] * [Einzelpreis]"
                              className="w-full bg-white border border-slate-200 rounded p-1 text-[11px] font-mono outline-none"
                              value={m.formulaExpression || ''}
                              onChange={(e) => handleUpdateMapping(idx, { formulaExpression: e.target.value })}
                            />
                          )}
                          {m.valueMode === 'static' && (
                            <input
                              type="text"
                              placeholder="Fester Wert"
                              className="w-full bg-white border border-slate-200 rounded p-1 text-[11px] outline-none"
                              value={m.staticValue || ''}
                              onChange={(e) => handleUpdateMapping(idx, { staticValue: e.target.value })}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Calculate Formula Field */}
        {config.actionType === 'calculateField' && targetTable && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Ziel-Spalte (Ergebnis speichern)
              </label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                value={config.targetFieldId || ''}
                onChange={(e) => onUpdate({ databaseActionConfig: { ...config, targetFieldId: e.target.value } })}
              >
                <option value="">Spalte wählen...</option>
                {targetTable.fields.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.type})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Berechnungsformel
              </label>
              <textarea 
                rows={2}
                placeholder="[Menge] * [Einzelpreis] * (1 - [Rabatt]/100)"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                value={config.formula || ''}
                onChange={(e) => onUpdate({ databaseActionConfig: { ...config, formula: e.target.value } })}
              />
            </div>
            
            <div className="flex flex-wrap gap-1 text-[10px]">
              <button
                type="button"
                onClick={() => onUpdate({ databaseActionConfig: { ...config, formula: (config.formula || '') + 'ROUND([Betrag], 2)' } })}
                className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded font-mono"
              >
                ROUND()
              </button>
              <button
                type="button"
                onClick={() => onUpdate({ databaseActionConfig: { ...config, formula: (config.formula || '') + 'CONCAT([Vorname], " ", [Nachname])' } })}
                className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded font-mono"
              >
                CONCAT()
              </button>
              <button
                type="button"
                onClick={() => onUpdate({ databaseActionConfig: { ...config, formula: (config.formula || '') + 'IF([Status] == "Bezahlt", 100, 0)' } })}
                className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded font-mono"
              >
                IF()
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ----------------------------------------------------
  // 3. EMAIL ACTION PROPERTIES
  // ----------------------------------------------------
  const renderEmailProperties = () => {
    const config = (nodeData.emailActionConfig || (nodeData.actionConfig as any) || {}) as WorkflowEmailActionConfig & { emailTo?: string; emailSubject?: string };

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Empfänger (To)
          </label>
          <input 
            type="text"
            placeholder="{{trigger.email}} oder admin@domain.com"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
            value={config.to || config.emailTo || ''}
            onChange={(e) => onUpdate({ emailActionConfig: { ...config, to: e.target.value } })}
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            E-Mail Betreff (Subject)
          </label>
          <input 
            type="text"
            placeholder="Neue Bestellung #{{trigger.id}} für {{trigger.kunde}}"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            value={config.subject || config.emailSubject || ''}
            onChange={(e) => onUpdate({ emailActionConfig: { ...config, subject: e.target.value } })}
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Nachrichtentext (Body)
          </label>
          <textarea 
            rows={4}
            placeholder="Hallo {{trigger.kunde}},&#10;&#10;Ihre Bestellung #{{trigger.id}} vom {{date}} wurde erfolgreich erfasst.&#10;&#10;Viele Grüße,&#10;Ihr Team"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
            value={config.body || ''}
            onChange={(e) => onUpdate({ emailActionConfig: { ...config, body: e.target.value } })}
          />
        </div>

        <div className="pt-2 border-t border-slate-100">
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input 
              type="checkbox"
              checked={Boolean(config.includeAttachment)}
              onChange={(e) => onUpdate({ emailActionConfig: { ...config, includeAttachment: e.target.checked } })}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium">Automatischen PDF-Bericht als Anhang generieren</span>
          </label>
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // 4. EXPORT ACTION PROPERTIES
  // ----------------------------------------------------
  const renderExportProperties = () => {
    const config: WorkflowExportActionConfig = nodeData.exportActionConfig || { exportType: 'excel', sourceType: 'table', sourceId: '' };

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Export-Format
          </label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none"
            value={config.exportType || 'excel'}
            onChange={(e) => onUpdate({ exportActionConfig: { ...config, exportType: e.target.value as any } })}
          >
            <option value="excel">Excel Arbeitsmappe (.XLSX)</option>
            <option value="pdf">PDF Dokument (.PDF)</option>
            <option value="csv">CSV Datei (.CSV)</option>
            <option value="json">JSON Datenstruktur (.JSON)</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Datenquelle
          </label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              type="button"
              onClick={() => onUpdate({ exportActionConfig: { ...config, sourceType: 'table' } })}
              className={`p-1.5 text-xs rounded border font-medium ${config.sourceType === 'table' ? 'bg-purple-50 border-purple-300 text-purple-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
            >
              Tabelle
            </button>
            <button
              type="button"
              onClick={() => onUpdate({ exportActionConfig: { ...config, sourceType: 'report' } })}
              className={`p-1.5 text-xs rounded border font-medium ${config.sourceType === 'report' ? 'bg-purple-50 border-purple-300 text-purple-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
            >
              Bericht
            </button>
          </div>

          <select 
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none"
            value={config.sourceId || ''}
            onChange={(e) => onUpdate({ exportActionConfig: { ...config, sourceId: e.target.value } })}
          >
            <option value="">Quelle auswählen...</option>
            {config.sourceType === 'table' ? (
              tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
            ) : (
              reports.map(r => <option key={r.id} value={r.id}>{r.name}</option>)
            )}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Dateiname (Vorlage)
          </label>
          <input 
            type="text"
            placeholder="Export_{{date}}_{{trigger.id}}"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono focus:ring-2 focus:ring-purple-500 outline-none"
            value={config.fileName || ''}
            onChange={(e) => onUpdate({ exportActionConfig: { ...config, fileName: e.target.value } })}
          />
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // 5. NOTIFICATION ACTION PROPERTIES
  // ----------------------------------------------------
  const renderNotificationProperties = () => {
    const config: WorkflowNotificationActionConfig = nodeData.notificationActionConfig || { type: 'toast', toastType: 'success', message: '' };

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Benachrichtigungs-Art
          </label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
            value={config.type || 'toast'}
            onChange={(e) => onUpdate({ notificationActionConfig: { ...config, type: e.target.value as any } })}
          >
            <option value="toast">Toast-Meldung (unten rechts)</option>
            <option value="messageBox">Dialog-Fenster (Modal / Alert)</option>
          </select>
        </div>

        {config.type === 'toast' && (
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Toast-Typ
            </label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
              value={config.toastType || 'success'}
              onChange={(e) => onUpdate({ notificationActionConfig: { ...config, toastType: e.target.value as any } })}
            >
              <option value="success">Erfolg (Grün)</option>
              <option value="info">Information (Blau)</option>
              <option value="warning">Warnung (Gelb)</option>
              <option value="error">Fehler (Rot)</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Nachricht (mit Platzhaltern)
          </label>
          <input 
            type="text"
            placeholder="Datensatz #{{trigger.id}} erfolgreich verarbeitet!"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
            value={config.message || ''}
            onChange={(e) => onUpdate({ notificationActionConfig: { ...config, message: e.target.value } })}
          />
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // 6. CONDITION PROPERTIES (IF / ELSE)
  // ----------------------------------------------------
  const renderConditionProperties = () => {
    const config: WorkflowConditionConfig = nodeData.conditionConfig || { operator: 'eq' };
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Zu prüfendes Feld
          </label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
            value={config.fieldId || ''}
            onChange={(e) => onUpdate({ conditionConfig: { ...config, fieldId: e.target.value } })}
          >
            <option value="">Feld auswählen...</option>
            {tables.flatMap(t => t.fields.map(f => (
              <option key={`${t.id}-${f.id}`} value={f.id}>{t.name}.{f.name} ({f.type})</option>
            )))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Operator
            </label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
              value={config.operator || 'eq'}
              onChange={(e) => onUpdate({ conditionConfig: { ...config, operator: e.target.value as any } })}
            >
              <option value="eq">Gleich (==)</option>
              <option value="neq">Ungleich (!=)</option>
              <option value="gt">Größer als (&gt;)</option>
              <option value="gte">Größer gleich (&gt;=)</option>
              <option value="lt">Kleiner als (&lt;)</option>
              <option value="lte">Kleiner gleich (&lt;=)</option>
              <option value="contains">Enthält Text</option>
              <option value="notContains">Enthält nicht</option>
              <option value="startsWith">Beginnt mit</option>
              <option value="endsWith">Endet mit</option>
              <option value="isEmpty">Ist leer / NULL</option>
              <option value="isNotEmpty">Ist nicht leer</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Vergleichswert
            </label>
            <input 
              type="text"
              placeholder="z. B. Bezahlt oder 100"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500 outline-none font-mono"
              value={config.value || ''}
              onChange={(e) => onUpdate({ conditionConfig: { ...config, value: e.target.value } })}
            />
          </div>
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // 7. LOOP PROPERTIES
  // ----------------------------------------------------
  const renderLoopProperties = () => {
    const config: WorkflowLoopConfig = nodeData.loopConfig || {};
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Quelltabelle (Iterieren)
          </label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-orange-500 outline-none"
            value={config.tableId || ''}
            onChange={(e) => onUpdate({ loopConfig: { ...config, tableId: e.target.value } })}
          >
            <option value="">Tabelle auswählen...</option>
            {tables.map(t => <option key={t.id} value={t.id}>{t.name} ({t.data?.length || 0} Zeilen)</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Variablenname in Schleife
          </label>
          <input 
            type="text"
            placeholder="item"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono focus:ring-2 focus:ring-orange-500 outline-none"
            value={config.variableName || 'item'}
            onChange={(e) => onUpdate({ loopConfig: { ...config, variableName: e.target.value } })}
          />
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // 8. API PROPERTIES
  // ----------------------------------------------------
  const renderApiProperties = () => {
    const config: WorkflowApiConfig = nodeData.apiConfig || { method: 'POST', url: '' };
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            HTTP Methode
          </label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500 outline-none"
            value={config.method || 'POST'}
            onChange={(e) => onUpdate({ apiConfig: { ...config, method: e.target.value as any } })}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Endpoint URL
          </label>
          <input 
            type="text"
            placeholder="https://api.domain.com/v1/webhook"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono focus:ring-2 focus:ring-sky-500 outline-none"
            value={config.url || ''}
            onChange={(e) => onUpdate({ apiConfig: { ...config, url: e.target.value } })}
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            JSON Payload Body
          </label>
          <textarea 
            rows={3}
            placeholder='{ "id": "{{trigger.id}}", "event": "order_paid" }'
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono focus:ring-2 focus:ring-sky-500 outline-none"
            value={config.body || ''}
            onChange={(e) => onUpdate({ apiConfig: { ...config, body: e.target.value } })}
          />
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // 9. DELAY PROPERTIES
  // ----------------------------------------------------
  const renderDelayProperties = () => {
    const config: WorkflowDelayConfig = nodeData.delayConfig || { seconds: 5 };
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Wartezeit in Sekunden
          </label>
          <input 
            type="number"
            min={1}
            max={3600}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold focus:ring-2 focus:ring-slate-400 outline-none"
            value={config.seconds || 5}
            onChange={(e) => onUpdate({ delayConfig: { ...config, seconds: Number(e.target.value) } })}
          />
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // 10. SCRIPT PROPERTIES
  // ----------------------------------------------------
  const renderScriptProperties = () => {
    const config: WorkflowJsScriptConfig = nodeData.jsScriptConfig || { code: '// JavaScript Sandbox Code\nconsole.log("Record:", context.trigger);' };
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            JavaScript / TypeScript Code
          </label>
          <textarea 
            rows={6}
            className="w-full bg-slate-900 text-emerald-400 border border-slate-800 rounded-lg p-2 text-xs font-mono focus:ring-2 focus:ring-pink-500 outline-none"
            value={config.code || ''}
            onChange={(e) => onUpdate({ jsScriptConfig: { ...config, code: e.target.value } })}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-y-auto" id="workflow-properties-panel">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <div className="flex items-center gap-2">
          <Settings size={16} className="text-indigo-600" />
          <h3 className="font-bold text-slate-800 text-sm">Knoten-Eigenschaften</h3>
        </div>
        <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold">
          {node.type}
        </span>
      </div>

      {/* Tabs: Config vs Variables Helper */}
      <div className="flex border-b border-slate-100 text-xs font-bold px-4 pt-2">
        <button
          onClick={() => setActiveTab('config')}
          className={`pb-2 px-2 border-b-2 transition-colors ${activeTab === 'config' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Konfiguration
        </button>
        <button
          onClick={() => setActiveTab('variables')}
          className={`pb-2 px-2 border-b-2 transition-colors flex items-center gap-1 ${activeTab === 'variables' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <Variable size={13} />
          <span>Variablen</span>
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-5 flex-1">
        {activeTab === 'config' ? (
          <>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Knoten-Bezeichnung
              </label>
              <input 
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={nodeData.label || ''}
                onChange={(e) => onUpdate({ label: e.target.value })}
              />
            </div>

            <div className="pt-2">
              {node.type === 'triggerNode' && renderTriggerProperties()}
              {(node.type === 'databaseActionNode' || node.type === 'actionNode') && renderDatabaseProperties()}
              {node.type === 'emailActionNode' && renderEmailProperties()}
              {(node.type === 'exportActionNode' || node.type === 'uploadNode') && renderExportProperties()}
              {node.type === 'notificationActionNode' && renderNotificationProperties()}
              {node.type === 'conditionNode' && renderConditionProperties()}
              {node.type === 'loopNode' && renderLoopProperties()}
              {node.type === 'apiNode' && renderApiProperties()}
              {node.type === 'delayNode' && renderDelayProperties()}
              {node.type === 'scriptNode' && renderScriptProperties()}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-lg text-xs text-indigo-900 leading-relaxed">
              <span className="font-bold block mb-1">💡 Variablen-Hilfe:</span>
              Klicken Sie auf eine Variable, um sie in die Zwischenablage zu kopieren und in Texten oder Formeln einzufügen.
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">System &amp; Zeit</div>
              <div className="flex flex-wrap gap-1">
                {['date', 'time', 'now', 'uuid'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertVariable(v)}
                    className="px-2 py-1 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 font-mono text-[11px] rounded transition-colors"
                  >
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
            </div>

            {currentTable && (
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Felder aus '{currentTable.name}'
                </div>
                <div className="flex flex-wrap gap-1">
                  {currentTable.fields.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => insertVariable(`trigger.${f.id}`)}
                      className="px-2 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-mono text-[11px] rounded transition-colors"
                      title={f.name}
                    >
                      {`{{trigger.${f.id}}}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
        <span>Knoten-ID: {node.id.slice(0, 8)}...</span>
        <span>Pos: {Math.round(node.position.x)}, {Math.round(node.position.y)}</span>
      </div>
    </div>
  );
};
