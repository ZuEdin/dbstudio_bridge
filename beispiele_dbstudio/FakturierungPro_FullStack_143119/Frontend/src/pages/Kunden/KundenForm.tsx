import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { get, post, put } from '../../services/api';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import { MarkdownEditor } from '../../components/common/MarkdownEditor';
import { evaluateFormFormula } from '../../utils/formulaEvaluator';

export const KundenForm = () => {
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
                [{"name":"Id","camel":"id"},{"name":"KundenNr","camel":"kundenNr"},{"name":"Firmenname","camel":"firmenname"},{"name":"Ansprechpartner","camel":"ansprechpartner"},{"name":"Email","camel":"email"},{"name":"Telefon","camel":"telefon"},{"name":"Strasse","camel":"strasse"},{"name":"plz","camel":"plz"},{"name":"Ort","camel":"ort"},{"name":"UStIdNr","camel":"uStIdNr"},{"name":"ZahlungszielTage","camel":"zahlungszielTage"},{"name":"Status","camel":"status"}].forEach(m => {
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
                const res = await get(`Kunden/${id}`);
                setData(res.data || res);
            } catch (e) { 
                console.error(e); 
            }
            setLoading(false);
        } else {
            setData({
      zahlungszielTage: 14,
      status: "Aktiv"
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
          await put(`Kunden/${id}`, payload); 
      } else {
          await post('Kunden', payload); 
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
                  {id === 'new' ? 'Kunden erstellen' : 'Kunden bearbeiten'}
              </h1>
          </div>
          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            <div className="space-y-4">
                              <div className="mb-4">
                  
          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">KundenNr</label>
          <input 
              type="text" 
              value={data.kundenNr ?? ''} 
              onChange={e => setData({ ...data, kundenNr: e.target.value })}
              className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
          />
              </div>
              <div className="mb-4">
                  
          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Firmenname</label>
          <input 
              type="text" 
              value={data.firmenname ?? ''} 
              onChange={e => setData({ ...data, firmenname: e.target.value })}
              className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
          />
              </div>
              <div className="mb-4">
                  
          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Ansprechpartner</label>
          <input 
              type="text" 
              value={data.ansprechpartner ?? ''} 
              onChange={e => setData({ ...data, ansprechpartner: e.target.value })}
              className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
          />
              </div>
              <div className="mb-4">
                  
          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Email</label>
          <input 
              type="text" 
              value={data.email ?? ''} 
              onChange={e => setData({ ...data, email: e.target.value })}
              className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
          />
              </div>
              <div className="mb-4">
                  
          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Telefon</label>
          <input 
              type="text" 
              value={data.telefon ?? ''} 
              onChange={e => setData({ ...data, telefon: e.target.value })}
              className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
          />
              </div>
              <div className="mb-4">
                  
          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Strasse</label>
          <input 
              type="text" 
              value={data.strasse ?? ''} 
              onChange={e => setData({ ...data, strasse: e.target.value })}
              className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
          />
              </div>
              <div className="mb-4">
                  
          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">plz</label>
          <input 
              type="text" 
              value={data.plz ?? ''} 
              onChange={e => setData({ ...data, plz: e.target.value })}
              className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
          />
              </div>
              <div className="mb-4">
                  
          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Ort</label>
          <input 
              type="text" 
              value={data.ort ?? ''} 
              onChange={e => setData({ ...data, ort: e.target.value })}
              className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
          />
              </div>
              <div className="mb-4">
                  
          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">UStIdNr</label>
          <input 
              type="text" 
              value={data.uStIdNr ?? ''} 
              onChange={e => setData({ ...data, uStIdNr: e.target.value })}
              className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
          />
              </div>
              <div className="mb-4">
                  
          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">ZahlungszielTage</label>
          <input 
              type="number" 
              value={data.zahlungszielTage ?? ''} 
              onChange={e => setData({ ...data, zahlungszielTage: e.target.value === '' ? null : Number(e.target.value) })}
              className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
              step="1"
          />
              </div>
              <div className="mb-4">
                  
          {/* ========================================================================= */}
          {/* ENUM DROPDOWN: Status (Kunden) */}
          {/* 1. FRONTEND: To add/modify options here, add new <option value="..."> tags */}
          {/* 2. DATABASE: To alter enum in DB, update DB Studio or run: */}
          {/*    MySQL:      ALTER TABLE `Kunden` MODIFY COLUMN `Status` ENUM('Aktiv', 'Interessent', 'Gesperrt'); */}
          {/*    PostgreSQL: ALTER TYPE enum_kunden_status ADD VALUE 'NEW_VALUE'; */}
          {/*    SQL Server: ALTER TABLE [Kunden] DROP CONSTRAINT CK_... ; ALTER TABLE [Kunden] ADD CHECK ([Status] IN ('Aktiv', 'Interessent', 'Gesperrt')); */}
          {/* ========================================================================= */}
          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Status <span className="text-xs text-indigo-500 font-normal">(Auswahl)</span>
          </label>
          <div className="relative">
              <select 
                  id="status"
                  value={data.status ?? ''} 
                  onChange={e => setData({ ...data, status: e.target.value })}
                  className="w-full border rounded-lg p-2.5 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none pr-8 cursor-pointer"
              >
                  <option value="">-- Bitte wählen (Status) --</option>
                  <option value="Aktiv">Aktiv</option>
                  <option value="Interessent">Interessent</option>
                  <option value="Gesperrt">Gesperrt</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
          </div>
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