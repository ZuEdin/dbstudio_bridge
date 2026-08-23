import React from 'react';
import { Sliders, SlidersHorizontal, LayoutTemplate, Plus, ArrowUpDown, Trash2 } from 'lucide-react';
import { CardElementBuilder } from './CardElementBuilder';

interface TableViewDesignerProps {
  configObj: any;
  updateVisualConfig: (newProps: any) => void;
  tables: any[];
  fields: any[];
  queries?: any[];
}

export const TableViewDesigner: React.FC<TableViewDesignerProps> = ({
  configObj,
  updateVisualConfig,
  tables,
  fields,
  queries,
}) => {
  return (
    <div className="space-y-6">
      {/* General Config */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
          <Sliders size={13} /> Datenquelle &amp; Stil
        </h4>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-slate-500 font-semibold mb-1">Tabelle verknüpfen</label>
            <select
              value={configObj.dataSourceId || ''}
              onChange={(e) => updateVisualConfig({ dataSourceId: e.target.value, dataSourceType: 'table' })}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium"
            >
              <option value="">-- Keine Tabelle --</option>
              {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 font-semibold mb-1">Layout-Modus</label>
            <select
              value={configObj.layoutMode || 'table'}
              onChange={(e) => updateVisualConfig({ layoutMode: e.target.value })}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium font-bold"
            >
              <option value="table">Tabelle (Standard &lt;tr&gt;)</option>
              <option value="grid">Karten-Raster (Cards Grid)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-slate-500 font-semibold mb-1">Titelüberschrift</label>
            <input 
              type="text"
              value={configObj.title || ''}
              onChange={(e) => updateVisualConfig({ title: e.target.value })}
              placeholder="z.B. Kundenübersicht"
              className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded dark:text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 font-semibold mb-1">Zeilen pro Seite</label>
            <input 
              type="number"
              value={configObj.pageSize || 5}
              onChange={(e) => updateVisualConfig({ pageSize: Math.max(1, parseInt(e.target.value) || 5) })}
              className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded dark:text-white"
            />
          </div>
        </div>

        {configObj.layoutMode === 'table' ? (
          <div>
            <label className="block text-[10px] text-slate-500 font-semibold mb-1">Tabellen-Theme</label>
            <div className="grid grid-cols-4 gap-1.5">
              {['striped', 'compact', 'bordered', 'flat'].map((style) => (
                <button
                  key={style}
                  onClick={() => updateVisualConfig({ tableStyle: style })}
                  className={`px-1.5 py-1 border rounded text-[10px] capitalize font-medium ${configObj.tableStyle === style ? 'bg-indigo-50 border-indigo-300 text-indigo-600 font-bold dark:bg-indigo-950/30 dark:border-indigo-700 dark:text-indigo-400' : 'bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-500 font-semibold mb-1">Karten pro Zeile</label>
              <select
                value={configObj.cardGridCols || 3}
                onChange={(e) => updateVisualConfig({ cardGridCols: parseInt(e.target.value) || 3 })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs dark:text-white"
              >
                <option value={1}>1 Spalte</option>
                <option value={2}>2 Spalten</option>
                <option value={3}>3 Spalten</option>
                <option value={4}>4 Spalten</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 font-semibold mb-1">Karten Schatten</label>
              <select
                value={configObj.cardShadow || 'sm'}
                onChange={(e) => updateVisualConfig({ cardShadow: e.target.value })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs dark:text-white"
              >
                <option value="none">Kein Schatten</option>
                <option value="sm">Subtil (sm)</option>
                <option value="md">Mittel (md)</option>
                <option value="lg">Stark (lg)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Search, Filters and Sorting */}
      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
          <SlidersHorizontal size={13} /> Suche, Filter &amp; Sortierung
        </h4>
        
        {/* SECTION 1: SEARCH */}
        <div className="bg-slate-50/50 dark:bg-slate-900/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">🔍 Globale Suche</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox"
                checked={!!configObj.enableSearch}
                onChange={(e) => updateVisualConfig({ enableSearch: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-7 h-4 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {configObj.enableSearch && (
            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-[10px] text-slate-500 font-semibold mb-1">Suchfeld Platzhalter</label>
              <input 
                type="text"
                value={configObj.searchPlaceholder || ''}
                onChange={(e) => updateVisualConfig({ searchPlaceholder: e.target.value })}
                placeholder="z.B. Suchen nach Name, ID..."
                className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white"
              />
            </div>
          )}
        </div>

        {/* SECTION 2: FILTERS */}
        <div className="bg-slate-50/50 dark:bg-slate-900/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">🎯 Filterleiste &amp; Schnellfilter</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox"
                checked={!!configObj.enableFilters}
                onChange={(e) => updateVisualConfig({ enableFilters: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-7 h-4 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {configObj.enableFilters && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <label className="block text-[10px] text-slate-500 font-semibold">Aktive Filterspalten auswählen:</label>
              <div className="grid grid-cols-2 gap-1.5 p-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded max-h-36 overflow-y-auto">
                {(fields.length > 0 ? fields.map(f => f.name) : ['id', 'Name', 'Status', 'Umsatz', 'Datum']).map((fName) => {
                  const filterFields = configObj.filterFields || [];
                  const isChecked = filterFields.includes(fName);
                  return (
                    <label key={fName} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const nextFilters = e.target.checked 
                            ? [...filterFields, fName]
                            : filterFields.filter((f: string) => f !== fName);
                          updateVisualConfig({ filterFields: nextFilters });
                        }}
                        className="rounded text-indigo-600 border-slate-300 dark:border-slate-700 focus:ring-indigo-500 h-3 w-3"
                      />
                      <span className="truncate font-mono">{fName}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-[9px] text-slate-400">
                Diese Spalten werden in der Live-Tabelle als Filter-Optionen (z.B. Dropdowns) gerendert.
              </p>
            </div>
          )}
        </div>

        {/* SECTION 3: SORTING */}
        <div className="bg-slate-50/50 dark:bg-slate-900/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">↕ Spalten-Sortierung</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox"
                checked={!!configObj.enableSorting}
                onChange={(e) => updateVisualConfig({ enableSorting: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-7 h-4 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {configObj.enableSorting && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold mb-1">Standard Sortierung</label>
                <select
                  value={configObj.defaultSortField || ''}
                  onChange={(e) => updateVisualConfig({ defaultSortField: e.target.value })}
                  className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded focus:outline-none dark:text-white font-mono"
                >
                  <option value="">-- Keine --</option>
                  {(fields.length > 0 ? fields.map(f => f.name) : ['id', 'Name', 'Status', 'Umsatz', 'Datum']).map(fName => (
                    <option key={fName} value={fName}>{fName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold mb-1">Reihenfolge</label>
                <select
                  value={configObj.defaultSortOrder || 'asc'}
                  onChange={(e) => updateVisualConfig({ defaultSortOrder: e.target.value })}
                  className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded focus:outline-none dark:text-white"
                >
                  <option value="asc">Aufsteigend (ASC)</option>
                  <option value="desc">Absteigend (DESC)</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* VISUAL COLUMNS EDITOR (FOR LAYOUT TABLE) */}
      {configObj.layoutMode === 'table' && (
        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
              <LayoutTemplate size={13} /> Spalten-Konfigurator
            </h4>
            <button
              onClick={() => {
                const newCols = [...(configObj.columns || [])];
                newCols.push({
                  field: fields[0]?.name || 'name',
                  title: 'Neue Spalte',
                  width: 'auto',
                  align: 'left',
                  type: 'text',
                  footerType: 'none'
                });
                updateVisualConfig({ columns: newCols });
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-1 rounded hover:bg-indigo-100 transition"
            >
              <Plus size={12} />
              <span>Spalte</span>
            </button>
          </div>

          {(!configObj.columns || configObj.columns.length === 0) ? (
            <div className="text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded text-xs text-slate-400">
              Keine Spalten definiert. Klicken Sie auf + Spalte.
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {configObj.columns.map((col: any, index: number) => (
                <div key={index} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2 relative group">
                  <div className="absolute top-2.5 right-2 flex gap-1 opacity-60 group-hover:opacity-100 transition">
                    <button
                      onClick={() => {
                        if (index === 0) return;
                        const nextCols = [...configObj.columns];
                        const temp = nextCols[index];
                        nextCols[index] = nextCols[index - 1];
                        nextCols[index - 1] = temp;
                        updateVisualConfig({ columns: nextCols });
                      }}
                      disabled={index === 0}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 disabled:opacity-25"
                      title="Nach oben"
                    >
                      <ArrowUpDown size={11} />
                    </button>
                    <button
                      onClick={() => {
                        const nextCols = [...configObj.columns];
                        const temp = nextCols[index];
                        nextCols[index] = nextCols[index + 1];
                        nextCols[index + 1] = temp;
                        updateVisualConfig({ columns: nextCols });
                      }}
                      disabled={index === configObj.columns.length - 1}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 disabled:opacity-25"
                      title="Nach unten"
                    >
                      <ArrowUpDown size={11} className="rotate-180" />
                    </button>
                    <button
                      onClick={() => {
                        const nextCols = configObj.columns.filter((_: any, idx: number) => idx !== index);
                        updateVisualConfig({ columns: nextCols });
                      }}
                      className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded"
                      title="Löschen"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>

                  {/* Title and Width */}
                  <div className="grid grid-cols-2 gap-2 pr-12">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase">Spaltentitel</label>
                      <input 
                        type="text"
                        value={col.title}
                        onChange={(e) => {
                          const nextCols = [...configObj.columns];
                          nextCols[index] = { ...nextCols[index], title: e.target.value };
                          updateVisualConfig({ columns: nextCols });
                        }}
                        className="w-full px-2 py-0.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase">Spaltenbreite</label>
                      <input 
                        type="text"
                        value={col.width || 'auto'}
                        onChange={(e) => {
                          const nextCols = [...configObj.columns];
                          nextCols[index] = { ...nextCols[index], width: e.target.value };
                          updateVisualConfig({ columns: nextCols });
                        }}
                        className="w-full px-2 py-0.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Mapping and Alignments */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase">DB Feld</label>
                      <select
                        value={col.field}
                        onChange={(e) => {
                          const nextCols = [...configObj.columns];
                          let newTitle = nextCols[index].title;
                          if (col.title === 'Neue Spalte') {
                            newTitle = e.target.value;
                          }
                          nextCols[index] = { ...nextCols[index], field: e.target.value, title: newTitle };
                          updateVisualConfig({ columns: nextCols });
                        }}
                        className="w-full border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-[11px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        {fields.length === 0 ? (
                          <>
                            <option value="id">id</option>
                            <option value="Name">Name</option>
                            <option value="Status">Status</option>
                            <option value="Umsatz">Umsatz</option>
                            <option value="Datum">Datum</option>
                          </>
                        ) : (
                          fields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase font-bold">Zell-Typ</label>
                      <select
                        value={col.type || 'text'}
                        onChange={(e) => {
                          const nextCols = [...configObj.columns];
                          nextCols[index] = { ...nextCols[index], type: e.target.value };
                          updateVisualConfig({ columns: nextCols });
                        }}
                        className="w-full border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-[11px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        <option value="text">Klassischer Text</option>
                        <option value="badge">Status-Badge</option>
                        <option value="currency">Währung (€)</option>
                        <option value="date">Datum (de)</option>
                        <option value="number">Zahl / Integer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase">Ausrichtung</label>
                      <div className="flex bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-0.5">
                        {['left', 'center', 'right'].map((align) => (
                          <button
                            key={align}
                            type="button"
                            onClick={() => {
                              const nextCols = [...configObj.columns];
                              nextCols[index] = { ...nextCols[index], align };
                              updateVisualConfig({ columns: nextCols });
                            }}
                            className={`flex-1 text-[10px] py-0.5 capitalize rounded ${col.align === align ? 'bg-slate-200 dark:bg-slate-700 font-bold dark:text-white' : 'text-slate-400'}`}
                          >
                            {align.substring(0, 1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer Calculation (Header / Footer Matching) */}
                  <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase">Tabellen-Footer (Aggregate)</label>
                      <select
                        value={col.footerType || 'none'}
                        onChange={(e) => {
                          const nextCols = [...configObj.columns];
                          nextCols[index] = { ...nextCols[index], footerType: e.target.value };
                          updateVisualConfig({ columns: nextCols });
                        }}
                        className="w-full border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-[10px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        <option value="none">Kein Footer-Zellwert</option>
                        <option value="sum">Summe (Zahlen)</option>
                        <option value="avg">Durchschnitt (Ø)</option>
                        <option value="count">Zeilenanzahl (Count)</option>
                        <option value="custom">Eigener Text</option>
                      </select>
                    </div>
                    {col.footerType === 'custom' && (
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase">Eigener Footer-Text</label>
                        <input 
                          type="text"
                          value={col.footerCustomText || ''}
                          onChange={(e) => {
                            const nextCols = [...configObj.columns];
                            nextCols[index] = { ...nextCols[index], footerCustomText: e.target.value };
                            updateVisualConfig({ columns: nextCols });
                          }}
                          placeholder="z.B. Gesamt-Umsatz:"
                          className="w-full px-2 py-0.5 text-[10px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded dark:text-white"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VISUAL CARDS GRID DESIGNER */}
      {configObj.layoutMode === 'grid' && (
        <CardElementBuilder 
          configObj={configObj}
          updateVisualConfig={updateVisualConfig}
          fields={fields}
        />
      )}
    </div>
  );
};
