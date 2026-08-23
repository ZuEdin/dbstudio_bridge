import React from 'react';
import { Globe } from 'lucide-react';
import { ApiQueryParam } from '../../../types/index';

interface ApiPresetButtonsProps {
  setUrl: (url: string) => void;
  setMethod: (method: string) => void;
  setQueryParams: (params: ApiQueryParam[]) => void;
}

export const ApiPresetButtons: React.FC<ApiPresetButtonsProps> = ({
  setUrl,
  setMethod,
  setQueryParams,
}) => {
  return (
    <div className="mb-4 bg-slate-50 border border-slate-200 rounded p-3">
      <span className="block text-xs font-bold text-slate-500 uppercase mb-2">Beispiel-APIs zum schnellen Testen:</span>
      <div className="flex flex-wrap gap-2">
        <button 
          type="button"
          onClick={() => {
            setUrl('https://jsonplaceholder.typicode.com/users');
            setMethod('GET');
            setQueryParams([]);
          }}
          className="bg-white border border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-xs font-medium text-slate-700 px-3 py-1.5 rounded transition-all flex items-center gap-1 shadow-sm"
        >
          <Globe size={12} className="text-blue-500" /> Benutzer-Daten (REST)
        </button>
        <button 
          type="button"
          onClick={() => {
            setUrl('https://jsonplaceholder.typicode.com/todos');
            setMethod('GET');
            setQueryParams([]);
          }}
          className="bg-white border border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-xs font-medium text-slate-700 px-3 py-1.5 rounded transition-all flex items-center gap-1 shadow-sm"
        >
          <Globe size={12} className="text-emerald-500" /> Todo-Liste (REST)
        </button>
        <button 
          type="button"
          onClick={() => {
            setUrl('https://dummyjson.com/products');
            setMethod('GET');
            setQueryParams([]);
          }}
          className="bg-white border border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-xs font-medium text-slate-700 px-3 py-1.5 rounded transition-all flex items-center gap-1 shadow-sm"
        >
          <Globe size={12} className="text-orange-500" /> Produkt-Katalog (DummyJSON)
        </button>
      </div>
    </div>
  );
};
