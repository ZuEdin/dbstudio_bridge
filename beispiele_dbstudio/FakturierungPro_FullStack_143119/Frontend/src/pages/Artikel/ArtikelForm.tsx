import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { get, post, put } from '../../services/api';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import { MarkdownEditor } from '../../components/common/MarkdownEditor';
import { evaluateFormFormula } from '../../utils/formulaEvaluator';

export const ArtikelForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setRawData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const recalculateCalculatedFields = (record: Record<string, any>): Record<string, any> => {
    const updatedRecord = { ...record };
    const calcFields = [];
    let changed = true;
    let passes = 0;
    while (changed && passes < 5) {
        changed = false;
        passes++;
        for (const cf of calcFields) {
            if (cf.formula) {
                const fieldMap: Record<string, string> = {};
                [{"name":"Id","camel":"id"},{"name":"ArtikelNr","camel":"artikelNr"},{"name":"Bezeichnung","camel":"bezeichnung"},{"name":"Kategorie","camel":"kategorie"},{"name":"Einzelpreis","camel":"einzelpreis"},{"name":"SteuerSatz","camel":"steuerSatz"},{"name":"Einheit","camel":"einheit"},{"name":"Lagerbestand","camel":"lagerbestand"}].forEach(m => {
                    fieldMap[m.name] = m.camel;
                });
                const calculatedVal = evaluateFormFormula(cf.formula, updatedRecord, fieldMap);
                if (updatedRecord[cf.fieldName] !== calculatedVal) {
                    updatedRecord[cf.fieldName] = calculatedVal;
                    changed = true;
                }
            }
        }
    }
    return updatedRecord;
  };

  const setData = (newDataOrFn: any) => {
    setRawData(prev => {
        const next = typeof newDataOrFn === 'function' ? newDataOrFn(prev) : newDataOrFn;
        return recalculateCalculatedFields(next);
    });
  };


  const getLoggedInUser = () => {
      try {
          const savedUser = localStorage.getItem('auth_user');
          if (savedUser) {
              const parsed = JSON.parse(savedUser);
              return parsed.username || 'Admin';
          }
      } catch (e) {}
      return 'Admin';
  };

  useEffect(() => {
      const init = async () => {
        if (id && id !== 'new') {
            setLoading(true);
            try {
                const res = await get(`Artikel/${id}`);
                setData(res.data || res);
            } catch (e) { 
                console.error(e); 
            }
            setLoading(false);
        } else {
            setData({
      kategorie: "Dienstleistung",
      steuerSatz: 19,
      einheit: "Std",
      lagerbestand: 100
    });
        }
      };
      init();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    try { 
      const payload = { ...data };
      if (id && id !== 'new') {
          await put(`Artikel/${id}`, payload); 
      } else {
          await post('Artikel', payload); 
      }
      navigate(-1); 
    } catch (e) { 
      alert('Fehler beim Speichern'); 
    } 
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline-block mr-2 text-blue-500"/> Lade...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8">
      <button onClick={() => navigate(-1)} className="mb-4 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center gap-2 transition-colors font-medium text-sm"><ArrowLeft size={16}/> Zurück</button>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                  {id === 'new' ? 'Artikel erstellen' : 'Artikel bearbeiten'}
              </h1>
          </div>
          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            <div className="space-y-4">
                              <div className="mb-4">
                  
          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">ArtikelNr</label>
          <input 
              type="text" 
              value={data.artikelNr ?? ''} 
              onChange={e => setData({ ...data, artikelNr: e.target.value })}
              className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
          />
              </div>
              <div className="mb-4">
                  
          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Bezeichnung</label>
          <input 
              type="text" 
              value={data.bezeichnung ?? ''} 
              onChange={e => setData({ ...data, bezeichnung: e.target.value })}
              className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
          />
              </div>
              <div className="mb-4">
                  
          {/* ========================================================================= */}
          {/* ENUM DROPDOWN: Kategorie (Artikel) */}
          {/* 1. FRONTEND: To add/modify options here, add new <option value="..."> tags */}
          {/* 2. DATABASE: To alter enum in DB, update DB Studio or run: */}
          {/*    MySQL:      ALTER TABLE `Artikel` MODIFY COLUMN `Kategorie` ENUM('Dienstleistung', 'Software', 'Hardware', 'Wartung'); */}
          {/*    PostgreSQL: ALTER TYPE enum_artikel_kategorie ADD VALUE 'NEW_VALUE'; */}
          {/*    SQL Server: ALTER TABLE [Artikel] DROP CONSTRAINT CK_... ; ALTER TABLE [Artikel] ADD CHECK ([Kategorie] IN ('Dienstleistung', 'Software', 'Hardware', 'Wartung')); */}
          {/* ========================================================================= */}
          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Kategorie <span className="text-xs text-indigo-500 font-normal">(Auswahl)</span>
          </label>
          <div className="relative">
              <select 
                  id="kategorie"
                  value={data.kategorie ?? ''} 
                  onChange={e => setData({ ...data, kategorie: e.target.value })}
                  className="w-full border rounded-lg p-2.5 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none pr-8 cursor-pointer"
              >
                  <option value="">-- Bitte wählen (Kategorie) --</option>
                  <option value="Dienstleistung">Dienstleistung</option>
                  <option value="Software">Software</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Wartung">Wartung</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
          </div>
              </div>
              <div className="mb-4">
                  
          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Einzelpreis</label>
          <input 
              type="number" 
              value={data.einzelpreis ?? ''} 
              onChange={e => setData({ ...data, einzelpreis: e.target.value === '' ? null : Number(e.target.value) })}
              className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
              step="any"
          />
              </div>
              <div className="mb-4">
                  
          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">SteuerSatz</label>
          <input 
              type="number" 
              value={data.steuerSatz ?? ''} 
              onChange={e => setData({ ...data, steuerSatz: e.target.value === '' ? null : Number(e.target.value) })}
              className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
              step="1"
          />
              </div>
              <div className="mb-4">
                  
          {/* ========================================================================= */}
          {/* ENUM DROPDOWN: Einheit (Artikel) */}
          {/* 1. FRONTEND: To add/modify options here, add new <option value="..."> tags */}
          {/* 2. DATABASE: To alter enum in DB, update DB Studio or run: */}
          {/*    MySQL:      ALTER TABLE `Artikel` MODIFY COLUMN `Einheit` ENUM('Stk', 'Std', 'Pauschal', 'Tag'); */}
          {/*    PostgreSQL: ALTER TYPE enum_artikel_einheit ADD VALUE 'NEW_VALUE'; */}
          {/*    SQL Server: ALTER TABLE [Artikel] DROP CONSTRAINT CK_... ; ALTER TABLE [Artikel] ADD CHECK ([Einheit] IN ('Stk', 'Std', 'Pauschal', 'Tag')); */}
          {/* ========================================================================= */}
          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Einheit <span className="text-xs text-indigo-500 font-normal">(Auswahl)</span>
          </label>
          <div className="relative">
              <select 
                  id="einheit"
                  value={data.einheit ?? ''} 
                  onChange={e => setData({ ...data, einheit: e.target.value })}
                  className="w-full border rounded-lg p-2.5 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none pr-8 cursor-pointer"
              >
                  <option value="">-- Bitte wählen (Einheit) --</option>
                  <option value="Stk">Stk</option>
                  <option value="Std">Std</option>
                  <option value="Pauschal">Pauschal</option>
                  <option value="Tag">Tag</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
          </div>
              </div>
              <div className="mb-4">
                  
          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Lagerbestand</label>
          <input 
              type="number" 
              value={data.lagerbestand ?? ''} 
              onChange={e => setData({ ...data, lagerbestand: e.target.value === '' ? null : Number(e.target.value) })}
              className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
              step="1"
          />
              </div>
            </div>
            <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                <button type="button" onClick={() => navigate(-1)} className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors">Abbrechen</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5"><Save size={18}/> Speichern</button>
            </div>
          </form>
      </div>
    </div>
  );
};