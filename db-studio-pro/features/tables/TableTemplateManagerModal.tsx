import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Plus, Trash2, Edit2, Download, Upload, Search, Check, 
  Sparkles, Bookmark, Copy, Database, Users, CheckSquare, 
  AlertCircle, Package, Building, Truck, FileText, Globe, Tag, Hash
} from 'lucide-react';
import { TableTemplate, TemplateCategory } from '../../types/tableTemplates';
import { Field, FieldType, Table } from '../../types/database';
import { 
  getAllTemplates, getCustomTemplates, saveCustomTemplate, 
  deleteCustomTemplate, exportCustomTemplatesJson, importCustomTemplatesJson,
  createTableFromTemplate
} from '../../services/tableTemplateService';

interface TableTemplateManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: TableTemplate, withSampleData: boolean) => void;
  existingTables: Table[];
  initialTableToSave?: Table | null;
}

const FIELD_TYPES: FieldType[] = [
  'INTEGER', 'VARCHAR', 'TEXT', 'DATE', 'TIME', 'DATETIME', 
  'BOOLEAN', 'DECIMAL', 'DOUBLE', 'ENUM', 'UUID', 'EMAIL', 'PHONE', 'URL'
];

export const TableTemplateManagerModal: React.FC<TableTemplateManagerModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  existingTables,
  initialTableToSave
}) => {
  const [templates, setTemplates] = useState<TableTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<TableTemplate | null>(null);
  const [withSampleData, setWithSampleData] = useState<boolean>(true);
  
  // Editor state for creating/editing custom template
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editTemplate, setEditTemplate] = useState<Partial<TableTemplate>>({
    name: '',
    description: '',
    category: 'custom',
    categoryLabel: 'Eigene Vorlagen',
    icon: 'Bookmark',
    fields: [
      { id: 'f_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
      { id: 'f_name', name: 'Bezeichnung', type: 'VARCHAR', length: 100 }
    ],
    sampleData: []
  });

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadTemplates = () => {
    const list = getAllTemplates();
    setTemplates(list);
    if (list.length > 0 && !selectedTemplate) {
      setSelectedTemplate(list[0]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      if (initialTableToSave) {
        // Pre-fill editor from the table to save
        setEditTemplate({
          name: `${initialTableToSave.name}_Vorlage`,
          description: initialTableToSave.description || `Vorlage basierend auf ${initialTableToSave.name}`,
          category: 'custom',
          categoryLabel: 'Eigene Vorlagen',
          icon: 'Bookmark',
          fields: JSON.parse(JSON.stringify(initialTableToSave.fields || [])),
          sampleData: Array.isArray(initialTableToSave.data) ? JSON.parse(JSON.stringify(initialTableToSave.data.slice(0, 10))) : []
        });
        setIsEditing(true);
        setSelectedCategory('custom');
      } else {
        setIsEditing(false);
      }
    }
  }, [isOpen, initialTableToSave]);

  if (!isOpen) return null;

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const filteredTemplates = templates.filter(tpl => {
    const matchesCategory = selectedCategory === 'all' 
      ? true 
      : selectedCategory === 'custom' 
        ? tpl.isCustom 
        : tpl.category === selectedCategory;
    const matchesSearch = tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (tpl.description && tpl.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tpl.fields.some(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleSaveEditTemplate = () => {
    if (!editTemplate.name || !editTemplate.name.trim()) {
      showToast('Bitte geben Sie einen Namen für die Vorlage an.', 'error');
      return;
    }
    if (!editTemplate.fields || editTemplate.fields.length === 0) {
      showToast('Die Vorlage muss mindestens ein Feld enthalten.', 'error');
      return;
    }

    const saved = saveCustomTemplate(editTemplate as TableTemplate);
    loadTemplates();
    setSelectedTemplate(saved);
    setIsEditing(false);
    showToast(`Vorlage "${saved.name}" erfolgreich gespeichert!`);
  };

  const handleDeleteTemplate = (id: string, name: string) => {
    if (confirm(`Möchten Sie die Vorlage "${name}" wirklich löschen?`)) {
      deleteCustomTemplate(id);
      loadTemplates();
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null);
      }
      showToast(`Vorlage "${name}" gelöscht.`);
    }
  };

  const handleExportJson = () => {
    const jsonStr = exportCustomTemplatesJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dbstudio_tabellen_vorlagen_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Vorlagen erfolgreich als JSON exportiert.');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = importCustomTemplatesJson(content);
        if (result.success) {
          loadTemplates();
          showToast(`${result.count} Vorlage(n) erfolgreich importiert!`);
        } else {
          showToast(`Fehler beim Import: ${result.error}`, 'error');
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddField = () => {
    const newField: Field = {
      id: crypto.randomUUID(),
      name: `Feld_${(editTemplate.fields?.length || 0) + 1}`,
      type: 'VARCHAR',
      length: 100
    };
    setEditTemplate(prev => ({
      ...prev,
      fields: [...(prev.fields || []), newField]
    }));
  };

  const handleRemoveField = (index: number) => {
    setEditTemplate(prev => ({
      ...prev,
      fields: prev.fields?.filter((_, i) => i !== index) || []
    }));
  };

  const handleUpdateField = (index: number, updates: Partial<Field>) => {
    setEditTemplate(prev => {
      const fields = [...(prev.fields || [])];
      fields[index] = { ...fields[index], ...updates };
      return { ...prev, fields };
    });
  };

  const renderIcon = (iconName: string, className = 'w-5 h-5') => {
    switch (iconName) {
      case 'Users': return <Users className={className} />;
      case 'Building': return <Building className={className} />;
      case 'Truck': return <Truck className={className} />;
      case 'CheckSquare': return <CheckSquare className={className} />;
      case 'AlertCircle': return <AlertCircle className={className} />;
      case 'Package': return <Package className={className} />;
      case 'Globe': return <Globe className={className} />;
      case 'Tag': return <Tag className={className} />;
      case 'Hash': return <Hash className={className} />;
      case 'FileText': return <FileText className={className} />;
      default: return <Bookmark className={className} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Tabellen-Vorlagen & Katalog</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Wählen Sie aus praxiserprobten Standardtabellen oder verwalten Sie Ihre eigenen wiederverwendbaren Vorlagen.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
              title="Eigene Vorlagen als JSON exportieren"
            >
              <Download size={14} /> Export
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
              title="Vorlagen aus JSON importieren"
            >
              <Upload size={14} /> Import
            </button>
            <input 
              ref={fileInputRef} 
              type="file" 
              accept=".json" 
              className="hidden" 
              onChange={handleImportJson} 
            />

            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors ml-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className={`px-6 py-2 text-xs font-semibold flex items-center justify-between ${notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)}><X size={14} /></button>
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Column: Category & List */}
          <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-950/40">
            
            {/* Search & Actions */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 text-slate-400 w-4 h-4" />
                <input 
                  type="text"
                  placeholder="Vorlagen durchsuchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button 
                onClick={() => {
                  setEditTemplate({
                    name: 'Meine_Neue_Vorlage',
                    description: 'Benutzerdefinierte Tabellenstruktur',
                    category: 'custom',
                    categoryLabel: 'Eigene Vorlagen',
                    icon: 'Bookmark',
                    fields: [
                      { id: crypto.randomUUID(), name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                      { id: crypto.randomUUID(), name: 'Code', type: 'VARCHAR', length: 50 },
                      { id: crypto.randomUUID(), name: 'Bezeichnung', type: 'VARCHAR', length: 150 }
                    ],
                    sampleData: []
                  });
                  setIsEditing(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors"
              >
                <Plus size={15} /> Eigene Vorlage erstellen
              </button>
            </div>

            {/* Categories */}
            <div className="flex gap-1 p-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-[11px] font-medium">
              {[
                { id: 'all', label: 'Alle' },
                { id: 'custom', label: 'Eigene' },
                { id: 'lookup', label: 'Stammdaten' },
                { id: 'crm', label: 'CRM' },
                { id: 'pm', label: 'Aufgaben' },
                { id: 'finance', label: 'Finanzen' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.id); setIsEditing(false); }}
                  className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id 
                      ? 'bg-blue-600 text-white font-bold' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Template List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredTemplates.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Keine Vorlagen gefunden.
                </div>
              ) : (
                filteredTemplates.map(tpl => {
                  const isSelected = selectedTemplate?.id === tpl.id && !isEditing;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => { setSelectedTemplate(tpl); setIsEditing(false); }}
                      className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-blue-600 text-white shadow-sm font-semibold' 
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                          {renderIcon(tpl.icon, 'w-4 h-4')}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs truncate font-medium flex items-center gap-1.5">
                            <span>{tpl.name}</span>
                            {tpl.isCustom && (
                              <span className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase tracking-wider ${isSelected ? 'bg-white/30 text-white' : 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300'}`}>
                                Eigen
                              </span>
                            )}
                          </div>
                          <div className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                            {tpl.fields.length} Felder {tpl.sampleData?.length ? `• ${tpl.sampleData.length} Daten` : ''}
                          </div>
                        </div>
                      </div>

                      {tpl.isCustom && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditTemplate(JSON.parse(JSON.stringify(tpl)));
                              setIsEditing(true);
                            }}
                            className={`p-1 rounded hover:bg-black/10 transition-colors ${isSelected ? 'text-white' : 'text-slate-500'}`}
                            title="Vorlage bearbeiten"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTemplate(tpl.id, tpl.name);
                            }}
                            className={`p-1 rounded hover:bg-red-500 hover:text-white transition-colors ${isSelected ? 'text-white' : 'text-red-500'}`}
                            title="Vorlage löschen"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Preview or Editor */}
          <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
            {isEditing ? (
              /* TEMPLATE EDITOR VIEW */
              <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
                  <div>
                    <h3 className="text-base font-bold flex items-center gap-2">
                      <Edit2 size={18} className="text-blue-600" />
                      {editTemplate.id ? 'Vorlage bearbeiten' : 'Neue Vorlage erstellen'}
                    </h3>
                    <p className="text-xs text-slate-500">Definieren Sie Tabellenname, Felder und optionale Beispieldaten.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleSaveEditTemplate}
                      className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Check size={14} /> Vorlage speichern
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tabellenname *</label>
                    <input 
                      type="text"
                      value={editTemplate.name || ''}
                      onChange={(e) => setEditTemplate(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="z. B. Zahlungsarten, Anreden, Notizen..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Beschreibung</label>
                    <input 
                      type="text"
                      value={editTemplate.description || ''}
                      onChange={(e) => setEditTemplate(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Zweck dieser Tabelle..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Fields Editor Table */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Felder ({editTemplate.fields?.length || 0})</h4>
                    <button
                      onClick={handleAddField}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-md transition-colors"
                    >
                      <Plus size={13} /> Feld hinzufügen
                    </button>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-2.5">Feldname</th>
                          <th className="p-2.5">Datentyp</th>
                          <th className="p-2.5">Länge</th>
                          <th className="p-2.5 text-center">PK</th>
                          <th className="p-2.5 text-center">Auto</th>
                          <th className="p-2.5 text-center">Null</th>
                          <th className="p-2.5 text-right">Aktion</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {editTemplate.fields?.map((field, idx) => (
                          <tr key={field.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-2">
                              <input 
                                type="text"
                                value={field.name}
                                onChange={(e) => handleUpdateField(idx, { name: e.target.value })}
                                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={field.type}
                                onChange={(e) => handleUpdateField(idx, { type: e.target.value as FieldType })}
                                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                              >
                                {FIELD_TYPES.map(ft => (
                                  <option key={ft} value={ft}>{ft}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <input 
                                type="number"
                                value={field.length || ''}
                                onChange={(e) => handleUpdateField(idx, { length: parseInt(e.target.value) || undefined })}
                                placeholder="z. B. 100"
                                className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none text-center"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input 
                                type="checkbox"
                                checked={!!field.isPrimaryKey}
                                onChange={(e) => handleUpdateField(idx, { isPrimaryKey: e.target.checked })}
                                className="rounded text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input 
                                type="checkbox"
                                checked={!!field.isAutoIncrement}
                                onChange={(e) => handleUpdateField(idx, { isAutoIncrement: e.target.checked })}
                                className="rounded text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input 
                                type="checkbox"
                                checked={!!field.allowNull}
                                onChange={(e) => handleUpdateField(idx, { allowNull: e.target.checked })}
                                className="rounded text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-2 text-right">
                              <button 
                                onClick={() => handleRemoveField(idx)}
                                className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : selectedTemplate ? (
              /* TEMPLATE PREVIEW VIEW */
              <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                {/* Header info */}
                <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
                      {renderIcon(selectedTemplate.icon, 'w-7 h-7')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedTemplate.name}</h3>
                        <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-full">
                          {selectedTemplate.categoryLabel}
                        </span>
                        {selectedTemplate.isCustom && (
                          <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 font-bold rounded-full">
                            Eigene Vorlage
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{selectedTemplate.description}</p>
                    </div>
                  </div>

                  {selectedTemplate.isCustom && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditTemplate(JSON.parse(JSON.stringify(selectedTemplate)));
                          setIsEditing(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Edit2 size={13} /> Bearbeiten
                      </button>
                    </div>
                  )}
                </div>

                {/* Fields summary */}
                <div className="mt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Struktur & Felder ({selectedTemplate.fields.length})
                  </h4>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mb-6">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold">
                        <tr>
                          <th className="p-2.5">Feldname</th>
                          <th className="p-2.5">Datentyp</th>
                          <th className="p-2.5">Eigenschaften</th>
                          <th className="p-2.5">Standardwert</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {selectedTemplate.fields.map(field => (
                          <tr key={field.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              {field.isPrimaryKey && <span className="text-amber-500 font-bold text-[10px] bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">PK</span>}
                              {field.name}
                            </td>
                            <td className="p-2.5 font-mono text-blue-600 dark:text-blue-400">
                              {field.type} {field.length ? `(${field.length})` : ''}
                            </td>
                            <td className="p-2.5 text-slate-500 dark:text-slate-400">
                              {[
                                field.isAutoIncrement ? 'Auto-Increment' : null,
                                field.isUnique ? 'Unique' : null,
                                field.isIndexed ? 'Index' : null,
                                field.enumValues ? `Optionen: ${field.enumValues.join(', ')}` : null
                              ].filter(Boolean).join(' • ') || '—'}
                            </td>
                            <td className="p-2.5 text-slate-500 dark:text-slate-400">
                              {field.defaultValue || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sample Data Preview */}
                {selectedTemplate.sampleData && selectedTemplate.sampleData.length > 0 && (
                  <div className="flex-1 flex flex-col min-h-[140px]">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                      Vordefinierte Datensätze ({selectedTemplate.sampleData.length})
                    </h4>
                    <div className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold">
                          <tr>
                            {Object.keys(selectedTemplate.sampleData[0] || {}).map(key => (
                              <th key={key} className="p-2 whitespace-nowrap">{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {selectedTemplate.sampleData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                              {Object.values(row).map((val: any, vidx) => (
                                <td key={vidx} className="p-2 whitespace-nowrap font-mono text-slate-700 dark:text-slate-300">
                                  {typeof val === 'boolean' ? (val ? 'Ja' : 'Nein') : String(val ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Bottom action bar */}
                <div className="flex items-center justify-between pt-4 mt-auto border-t border-slate-200 dark:border-slate-800">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={withSampleData}
                      onChange={(e) => setWithSampleData(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Mit Beispieldaten / Standardwerten befüllen ({selectedTemplate.sampleData?.length || 0} Datensätze)</span>
                  </label>

                  <button
                    onClick={() => {
                      onSelectTemplate(selectedTemplate, withSampleData);
                      onClose();
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg transition-transform active:scale-95"
                  >
                    <Plus size={16} /> Tabelle "{selectedTemplate.name}" erstellen
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                Wählen Sie eine Vorlage aus der linken Liste aus.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
