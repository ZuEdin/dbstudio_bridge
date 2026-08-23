import React from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Type, LayoutGrid, CheckSquare, EyeOff, Eye } from 'lucide-react';

export const CardTemplateDesigner: React.FC<{
  configObj: any;
  updateVisualConfig: (newProps: any) => void;
  tables: any[];
  fields: any[];
}> = ({ configObj, updateVisualConfig, tables, fields }) => {
  const fieldsConfig = configObj.fields || [];
  const cardStyle = configObj.cardStyle || {
    padding: 'p-3',
    rounded: 'rounded-xl',
    bg: 'bg-white dark:bg-slate-950',
    border: 'border border-slate-200 dark:border-slate-800',
    shadow: 'shadow-xs'
  };

  const handleDataSourceChange = (tableId: string) => {
    updateVisualConfig({ 
      dataSourceId: tableId,
      fields: [] // Reset fields configuration since they belong to a different table
    });
  };

  const addField = () => {
    updateVisualConfig({
      fields: [
        ...fieldsConfig,
        {
          field: fields[0]?.name || '',
          label: fields[0]?.name || 'Neues Feld',
          showLabel: true,
          fontSize: 'text-xs',
          fontWeight: 'font-normal',
          textColor: 'text-slate-800 dark:text-slate-100',
          isBadge: false,
          badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
          align: 'text-left'
        }
      ]
    });
  };

  const updateField = (index: number, newProps: any) => {
    const newFields = [...fieldsConfig];
    newFields[index] = { ...newFields[index], ...newProps };
    updateVisualConfig({ fields: newFields });
  };

  const removeField = (index: number) => {
    updateVisualConfig({ fields: fieldsConfig.filter((_: any, i: number) => i !== index) });
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === fieldsConfig.length - 1) return;

    const newFields = [...fieldsConfig];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newFields[index];
    newFields[index] = newFields[targetIndex];
    newFields[targetIndex] = temp;

    updateVisualConfig({ fields: newFields });
  };

  const updateCardStyle = (newStyleProps: any) => {
    updateVisualConfig({
      cardStyle: {
        ...cardStyle,
        ...newStyleProps
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          🔌 Datenbindung (Tabelle)
        </h4>
        <p className="text-[10px] text-slate-500 leading-normal">
          Wählen Sie die Tabelle aus, deren Datensätze als Karten visualisiert werden sollen.
        </p>
        <div>
          <label className="block text-[9px] text-slate-400 font-bold uppercase mb-1">Verbunden mit Tabelle</label>
          <select
            value={configObj.dataSourceId || ''}
            onChange={(e) => handleDataSourceChange(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-xs font-semibold dark:text-white shadow-xs focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            <option value="">-- Keine Tabelle ausgewählt --</option>
            {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <LayoutGrid size={14} /> Globales Karten-Styling
        </h4>
        <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-150 dark:border-slate-800">
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Innenabstand (Padding)</label>
            <select
              value={cardStyle.padding}
              onChange={(e) => updateCardStyle({ padding: e.target.value })}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1 text-xs dark:text-white"
            >
              <option value="p-2">Kompakt (p-2)</option>
              <option value="p-3">Standard (p-3)</option>
              <option value="p-4">Großzügig (p-4)</option>
              <option value="p-5">Sehr Groß (p-5)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Eckenrundung</label>
            <select
              value={cardStyle.rounded}
              onChange={(e) => updateCardStyle({ rounded: e.target.value })}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1 text-xs dark:text-white"
            >
              <option value="rounded-none">Eckig</option>
              <option value="rounded">Leicht (sm)</option>
              <option value="rounded-lg">Mittel (lg)</option>
              <option value="rounded-xl">Abgerundet (xl)</option>
              <option value="rounded-2xl">Sehr rund (2xl)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Schatten</label>
            <select
              value={cardStyle.shadow}
              onChange={(e) => updateCardStyle({ shadow: e.target.value })}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1 text-xs dark:text-white"
            >
              <option value="shadow-none">Kein Schatten</option>
              <option value="shadow-xs">Sehr dezent</option>
              <option value="shadow-sm">Dezent</option>
              <option value="shadow-md">Normal</option>
              <option value="shadow-lg">Stark</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Rahmen (Border)</label>
            <select
              value={cardStyle.border}
              onChange={(e) => updateCardStyle({ border: e.target.value })}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1 text-xs dark:text-white"
            >
              <option value="border-none">Kein Rahmen</option>
              <option value="border border-slate-100 dark:border-slate-900">Sehr fein</option>
              <option value="border border-slate-200 dark:border-slate-800">Standard</option>
              <option value="border-2 border-slate-300 dark:border-slate-700">Dicker Rahmen</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
            <Type size={14} /> Karten-Felder & Layout
          </h4>
          <button
            onClick={addField}
            className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-2.5 py-1 rounded-md flex items-center gap-1 font-bold transition"
          >
            <Plus size={12} /> Feld hinzufügen
          </button>
        </div>

        {fieldsConfig.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-slate-400 text-xs italic">
            Noch keine Felder hinzugefügt. Klicken Sie auf "Feld hinzufügen" oben, um zu starten.
          </div>
        ) : (
          <div className="space-y-3">
            {fieldsConfig.map((f: any, i: number) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                {/* Header-Row: Feld-Typ, Reordering, Löschen */}
                <div className="flex gap-2 items-center justify-between pb-2 mb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-mono font-bold">
                      Feld {i + 1}
                    </span>
                    <select
                      value={f.field}
                      onChange={(e) => updateField(i, { field: e.target.value })}
                      className="text-xs font-semibold bg-transparent border-none p-0 focus:ring-0 cursor-pointer text-indigo-600 dark:text-indigo-400 outline-none"
                    >
                      {fields.map((field) => (
                        <option key={field.name} value={field.name}>
                          {field.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => moveField(i, 'up')}
                      disabled={i === 0}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30"
                      title="Nach oben verschieben"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      onClick={() => moveField(i, 'down')}
                      disabled={i === fieldsConfig.length - 1}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30"
                      title="Nach unten verschieben"
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      onClick={() => removeField(i)}
                      className="p-1 rounded text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      title="Feld löschen"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Body: Einstellungen für dieses Feld */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Anzeigename / Label</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={f.label || ''}
                        onChange={(e) => updateField(i, { label: e.target.value })}
                        placeholder="Z.B. Status"
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded p-1 text-xs dark:text-white pr-7"
                      />
                      <button
                        type="button"
                        onClick={() => updateField(i, { showLabel: f.showLabel === false ? true : false })}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                        title={f.showLabel !== false ? 'Label anzeigen' : 'Label ausblenden'}
                      >
                        {f.showLabel !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Text-Ausrichtung</label>
                    <select
                      value={f.align || 'text-left'}
                      onChange={(e) => updateField(i, { align: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded p-1 text-xs dark:text-white"
                    >
                      <option value="text-left">Linksbündig</option>
                      <option value="text-center">Zentriert</option>
                      <option value="text-right">Rechtsbündig</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Textgröße & Gewicht</label>
                    <div className="grid grid-cols-2 gap-1">
                      <select
                        value={f.fontSize || 'text-xs'}
                        onChange={(e) => updateField(i, { fontSize: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded p-1 text-[10px] dark:text-white"
                      >
                        <option value="text-[10px]">Sehr klein</option>
                        <option value="text-xs">Klein (xs)</option>
                        <option value="text-sm">Mittel (sm)</option>
                        <option value="text-base">Normal (base)</option>
                      </select>
                      <select
                        value={f.fontWeight || 'font-normal'}
                        onChange={(e) => updateField(i, { fontWeight: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded p-1 text-[10px] dark:text-white"
                      >
                        <option value="font-normal">Normal</option>
                        <option value="font-medium">Medium</option>
                        <option value="font-semibold">Semi-Bold</option>
                        <option value="font-bold">Fett</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Stil-Typ (Darstellung)</label>
                    <select
                      value={f.isBadge ? 'badge' : 'text'}
                      onChange={(e) => updateField(i, { isBadge: e.target.value === 'badge' })}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded p-1 text-xs dark:text-white"
                    >
                      <option value="text">Einfacher Text</option>
                      <option value="badge">🏷️ Badge / Kapsel</option>
                    </select>
                  </div>

                  {f.isBadge ? (
                    <div className="col-span-2">
                      <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Badge-Farbe</label>
                      <select
                        value={f.badgeColor || 'bg-slate-100 text-slate-600'}
                        onChange={(e) => updateField(i, { badgeColor: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded p-1 text-xs dark:text-white"
                      >
                        <option value="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">Grau (Standard)</option>
                        <option value="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">Indigo (Akzent)</option>
                        <option value="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">Grün (Erfolg)</option>
                        <option value="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">Gelb (Warnung)</option>
                        <option value="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">Rot (Wichtig)</option>
                      </select>
                    </div>
                  ) : (
                    <div className="col-span-2">
                      <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Text-Farbe</label>
                      <select
                        value={f.textColor || 'text-slate-800 dark:text-slate-100'}
                        onChange={(e) => updateField(i, { textColor: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded p-1 text-xs dark:text-white"
                      >
                        <option value="text-slate-800 dark:text-slate-100">Standard Dunkel/Hell</option>
                        <option value="text-slate-500 dark:text-slate-400">Dezent Grau</option>
                        <option value="text-indigo-600 dark:text-indigo-400 font-semibold">Indigo (Blau-Violett)</option>
                        <option value="text-emerald-600 dark:text-emerald-400 font-semibold">Emerald (Grün)</option>
                        <option value="text-rose-600 dark:text-rose-400 font-semibold">Rose (Rot)</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
