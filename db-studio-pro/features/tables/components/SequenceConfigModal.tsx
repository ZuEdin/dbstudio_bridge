import React, { useState, useEffect } from 'react';
import { SequenceConfig, Field } from '../../../types/index';
import { SEQUENCE_PRESETS, formatSequenceValue } from '../../../utils/sequenceHelper';
import { Hash, Sparkles, Check, X, RefreshCw, Layers, HelpCircle, ArrowRight } from 'lucide-react';

interface SequenceConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  field: Field;
  onSave: (config: SequenceConfig | undefined) => void;
}

export const SequenceConfigModal: React.FC<SequenceConfigModalProps> = ({
  isOpen,
  onClose,
  field,
  onSave,
}) => {
  const [config, setConfig] = useState<SequenceConfig>({
    enabled: true,
    prefix: 'LIF-',
    suffix: '',
    padding: 5,
    startValue: 10,
    step: 1,
    includeYear: false,
    yearFormat: 'YYYY',
    pattern: '',
  });

  useEffect(() => {
    if (field.sequenceConfig) {
      setConfig({ ...field.sequenceConfig });
    } else {
      const name = field.name.toLowerCase();
      let matchedPreset = SEQUENCE_PRESETS.find((p) => {
        if (name.includes('lief')) return p.id === 'supplier';
        if (name.includes('kund') || name.includes('cust')) return p.id === 'customer';
        if (name.includes('art') || name.includes('prod') || name.includes('item')) return p.id === 'article';
        if (name.includes('rechn') || name.includes('inv')) return p.id === 'invoice_year';
        if (name.includes('tick') || name.includes('vorg') || name.includes('prob')) return p.id === 'ticket';
        return false;
      });

      if (matchedPreset) {
        setConfig({ ...matchedPreset.config });
      } else {
        setConfig({
          enabled: true,
          prefix: `${field.name.substring(0, 3).toUpperCase()}-`,
          suffix: '',
          padding: 5,
          startValue: 1,
          step: 1,
        });
      }
    }
  }, [field, isOpen]);

  if (!isOpen) return null;

  const handleApplyPreset = (presetId: string) => {
    const preset = SEQUENCE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setConfig({ ...preset.config });
    }
  };

  const handleSave = () => {
    if (!config.enabled) {
      onSave(undefined);
    } else {
      onSave(config);
    }
    onClose();
  };

  const handleDisable = () => {
    onSave(undefined);
    onClose();
  };

  // Generate 5 live sample previews
  const previewItems: string[] = [];
  const start = Number(config.startValue) || 1;
  const step = Number(config.step) || 1;
  for (let i = 0; i < 5; i++) {
    const val = start + i * step;
    previewItems.push(formatSequenceValue(config, val));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center text-white border border-white/20">
              <Hash size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                Fortlaufende Nummerierung konfigurieren
              </h2>
              <p className="text-xs text-blue-100">
                Feld: <span className="font-mono font-bold bg-white/20 px-1.5 py-0.5 rounded">{field.name}</span> ({field.type})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-sm">
          {/* Presets Bar */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles size={14} className="text-blue-600" />
              Schnell-Vorlagen für Nummernkreise:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset('supplier')}
                className="text-left px-3 py-2 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-xs"
              >
                <div className="font-bold text-slate-800">🚚 Lieferant</div>
                <div className="text-[11px] text-slate-500 font-mono">LIF-00001, LIF-00010</div>
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('customer')}
                className="text-left px-3 py-2 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-xs"
              >
                <div className="font-bold text-slate-800">👤 Kunde</div>
                <div className="text-[11px] text-slate-500 font-mono">KD-10001, KD-10002</div>
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('invoice_year')}
                className="text-left px-3 py-2 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-xs"
              >
                <div className="font-bold text-slate-800">📄 Rechnung (mit Jahr)</div>
                <div className="text-[11px] text-slate-500 font-mono">RE-2026-00001</div>
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('article')}
                className="text-left px-3 py-2 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-xs"
              >
                <div className="font-bold text-slate-800">📦 Artikel</div>
                <div className="text-[11px] text-slate-500 font-mono">ART-0001, ART-0002</div>
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('ticket')}
                className="text-left px-3 py-2 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-xs"
              >
                <div className="font-bold text-slate-800">🎫 Ticket / Vorgang</div>
                <div className="text-[11px] text-slate-500 font-mono">TICK-00001</div>
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('custom_digits')}
                className="text-left px-3 py-2 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-xs"
              >
                <div className="font-bold text-slate-800">🔢 Reiner Zähler</div>
                <div className="text-[11px] text-slate-500 font-mono">00001, 00002, 00003</div>
              </button>
            </div>
          </div>

          {/* Form Settings */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                Fortlaufende Nummerierung für dieses Feld aktivieren
              </label>
              {config.enabled && (
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Aktiviert
                </span>
              )}
            </div>

            {config.enabled && (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Präfix (Text vor der Zahl):
                    </label>
                    <input
                      type="text"
                      value={config.prefix || ''}
                      onChange={(e) => setConfig({ ...config, prefix: e.target.value })}
                      placeholder="z. B. LIF- oder KD-"
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white font-mono"
                    />
                    <span className="text-[11px] text-slate-500">Z. B. "LIF-", "KD-", "ART-"</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Führende Nullen (Stellenzahl):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={config.padding}
                        onChange={(e) => setConfig({ ...config, padding: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="w-24 border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white font-mono text-center"
                      />
                      <span className="text-xs text-slate-500">
                        {config.padding === 5 ? '5 Stellen (z. B. 00010)' : `${config.padding} Stellen`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Startwert:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={config.startValue ?? 1}
                      onChange={(e) => setConfig({ ...config, startValue: parseInt(e.target.value) || 0 })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Schrittweite (+ pro neuer Eintrag):
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={config.step ?? 1}
                      onChange={(e) => setConfig({ ...config, step: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Suffix (Text nach der Zahl):
                    </label>
                    <input
                      type="text"
                      value={config.suffix || ''}
                      onChange={(e) => setConfig({ ...config, suffix: e.target.value })}
                      placeholder="z. B. -DE"
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Jahr einbinden:
                    </label>
                    <select
                      value={config.includeYear ? (config.yearFormat || 'YYYY') : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          setConfig({ ...config, includeYear: false, yearFormat: undefined });
                        } else {
                          setConfig({ ...config, includeYear: true, yearFormat: val as 'YYYY' | 'YY' });
                        }
                      }}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                    >
                      <option value="">(Kein Jahr)</option>
                      <option value="YYYY">Vollständiges Jahr (YYYY, z. B. 2026)</option>
                      <option value="YY">Kurzes Jahr (YY, z. B. 26)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Benutzerdefiniertes Muster (Optional):
                    </label>
                    <input
                      type="text"
                      value={config.pattern || ''}
                      onChange={(e) => setConfig({ ...config, pattern: e.target.value })}
                      placeholder="z. B. {YYYY}-{00000} oder {MM}-{000}"
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live Preview Box */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4">
            <div className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <RefreshCw size={14} className="text-blue-700" />
                Live-Vorschau der nächsten Datensätze:
              </span>
              <span className="text-[11px] text-blue-700 font-normal">Wird beim Anlegen automatisch hochgezählt</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {previewItems.map((val, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className={`px-3 py-1.5 rounded-md font-mono text-xs font-bold shadow-xs border ${
                    idx === 0 ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300' : 'bg-white text-slate-800 border-slate-200'
                  }`}>
                    {val}
                  </span>
                  {idx < previewItems.length - 1 && (
                    <ArrowRight size={14} className="text-blue-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <div>
            {field.sequenceConfig?.enabled && (
              <button
                type="button"
                onClick={handleDisable}
                className="text-xs text-red-600 hover:text-red-800 font-medium hover:underline"
              >
                Nummernkreis entfernen
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Check size={16} />
              Konfiguration speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
