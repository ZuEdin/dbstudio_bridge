import React from 'react';
import { Sliders, Trash2, Plus, Type, List } from 'lucide-react';
import { ApiQueryParam } from '../../../types/index';
import { CommaSeparatedInput } from '../CommaSeparatedInput';

interface ApiParamBuilderProps {
  queryParams: ApiQueryParam[];
  setQueryParams: (params: ApiQueryParam[]) => void;
  showParamBuilder: boolean;
  setShowParamBuilder: (show: boolean) => void;
  constructPreviewUrl: () => string;
}

export const ApiParamBuilder: React.FC<ApiParamBuilderProps> = ({
  queryParams,
  setQueryParams,
  showParamBuilder,
  setShowParamBuilder,
  constructPreviewUrl,
}) => {
  const addParam = () => {
    setQueryParams([...queryParams, {
      id: crypto.randomUUID(),
      key: '',
      value: '',
      type: 'text',
      isActive: true
    }]);
  };

  const updateParam = (id: string, updates: Partial<ApiQueryParam>) => {
    setQueryParams(queryParams.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const removeParam = (id: string) => {
    setQueryParams(queryParams.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm">
        <button 
          onClick={() => setShowParamBuilder(!showParamBuilder)} 
          className="flex items-center gap-1 text-slate-600 hover:text-blue-600 font-semibold"
        >
          <Sliders size={14} /> {showParamBuilder ? 'Parameter verbergen' : 'Parameter & Optionen'}
        </button>
        <div className="text-slate-400 text-xs truncate max-w-xl font-mono bg-slate-100 px-2 py-0.5 rounded">
          {constructPreviewUrl()}
        </div>
      </div>

      {showParamBuilder && (
        <div className="bg-slate-50 border border-slate-200 rounded p-3 animate-in slide-in-from-top-2">
          <div className="space-y-2">
            {queryParams.map((param) => (
              <div key={param.id} className="flex gap-2 items-center">
                <input 
                  type="checkbox" 
                  checked={param.isActive} 
                  onChange={e => updateParam(param.id, { isActive: e.target.checked })}
                  className="rounded"
                />
                <input 
                  type="text" 
                  placeholder="Name (z.B. status)"
                  value={param.key}
                  onChange={e => updateParam(param.id, { key: e.target.value })}
                  className="w-40 border border-slate-300 rounded px-2 py-1 text-sm bg-white"
                />
                
                <div className="flex border border-slate-300 rounded bg-white overflow-hidden">
                  <button 
                    type="button"
                    onClick={() => updateParam(param.id, { type: 'text' })}
                    className={`px-2 py-1 ${param.type === 'text' ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:bg-slate-50'}`}
                    title="Freitext"
                  >
                    <Type size={14} />
                  </button>
                  <button 
                    type="button"
                    onClick={() => updateParam(param.id, { type: 'select' })}
                    className={`px-2 py-1 ${param.type === 'select' ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:bg-slate-50'}`}
                    title="Dropdown Liste"
                  >
                    <List size={14} />
                  </button>
                </div>

                {param.type === 'select' ? (
                  <div className="flex gap-2 flex-1">
                    <CommaSeparatedInput 
                      placeholder="Optionen kommasepariert (z.B. available, pending, sold)"
                      value={param.options || []}
                      onChange={options => updateParam(param.id, { options: options })}
                      className="flex-1 border border-orange-200 rounded px-2 py-1 text-sm bg-orange-50 focus:bg-white transition-colors"
                    />
                    <select 
                      value={param.value}
                      onChange={e => updateParam(param.id, { value: e.target.value })}
                      className="w-40 border border-slate-300 rounded px-2 py-1 text-sm bg-white"
                    >
                      <option value="">(Auswählen)</option>
                      {param.options?.map(opt => <option key={opt} value={opt.trim()}>{opt.trim()}</option>)}
                    </select>
                  </div>
                ) : (
                  <input 
                    type="text" 
                    placeholder="Wert"
                    value={param.value}
                    onChange={e => updateParam(param.id, { value: e.target.value })}
                    className="flex-1 border border-slate-300 rounded px-2 py-1 text-sm bg-white"
                  />
                )}

                <button 
                  type="button"
                  onClick={() => removeParam(param.id)} 
                  className="text-slate-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button 
              type="button"
              onClick={addParam} 
              className="text-xs flex items-center gap-1 text-blue-600 hover:underline mt-2"
            >
              <Plus size={12} /> Parameter hinzufügen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
