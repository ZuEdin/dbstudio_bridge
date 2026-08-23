import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { get, post, put, del } from '../../services/api';
import { Save, ArrowLeft, Loader2, Plus, Layout, User, Search, ChevronDown } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { UserPickerModal } from '../../components/UserPickerModal';
import { MarkdownEditor } from '../../components/common/MarkdownEditor';
import { MarkdownViewer } from '../../components/common/MarkdownViewer';
import { useGlobalState } from '../../context/GlobalStateContext';
import { evaluateFormFormula } from '../../utils/formulaEvaluator';

const SubFormWrapper = ({ children, onSave }: any) => {
    const [subData, setData] = useState<any>({});
    const injectedChildren = React.Children.map(children, child => React.isValidElement(child) ? child : child);
    return (<div>{children}<div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => onSave(subData)} className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700">Speichern</button></div></div>);
}

export const AngebotspositionenSubformForm = () => {
  const { id } = useParams(); const navigate = useNavigate();
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
                [{"name":"Id","camel":"id"},{"name":"AngebotsId","camel":"angebotsId"},{"name":"ArtikelId","camel":"artikelId"},{"name":"Menge","camel":"menge"},{"name":"Einzelpreis","camel":"einzelpreis"},{"name":"RabattProzent","camel":"rabattProzent"},{"name":"GesamtNetto","camel":"gesamtNetto"}].forEach(m => {
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

  const [modals, setModals] = useState<Record<string, boolean>>({});
  const [activeTabs, setActiveTabs] = useState<Record<string, string>>({});
  const { states, setGlobalState, addToast, executeMacro = (macroId: string) => console.log('Macro executed:', macroId) } = useGlobalState() || { states: {}, setGlobalState: () => {}, addToast: () => {}, executeMacro: () => {} };
  
  const UXRules: any[] = [];

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

  // Phase 5: Cross-field rule evaluator
  const evaluateUXRule = (rule: any, currentData: any) => {
      const val = currentData[rule.triggerFieldId];
      if(rule.condition === 'equals') return String(val) === String(rule.triggerValue);
      if(rule.condition === 'not_equals') return String(val) !== String(rule.triggerValue);
      if(rule.condition === 'greater_than') return Number(val) > Number(rule.triggerValue);
      if(rule.condition === 'less_than') return Number(val) < Number(rule.triggerValue);
      if(rule.condition === 'not_empty') return val !== undefined && val !== null && val !== '';
      if(rule.condition === 'is_empty') return val === undefined || val === null || val === '';
      if(rule.condition === 'is_true') return !!val === true;
      if(rule.condition === 'is_false') return !!val === false;
      return false;
  };

  const isFieldRequired = (fieldId: string) => UXRules.some((r: any) => r.targetFieldId === fieldId && r.action === 'require' && evaluateUXRule(r, data));
  const isFieldHidden = (fieldId: string) => UXRules.some((r: any) => r.targetFieldId === fieldId && r.action === 'hide' && evaluateUXRule(r, data));
  const isFieldDisabled = (fieldId: string) => UXRules.some((r: any) => r.targetFieldId === fieldId && r.action === 'disable' && evaluateUXRule(r, data));

  const [artikelList, setArtikelList] = useState<any[]>([]);
  

  const toggleModal = (id: string, state: boolean) => setModals(prev => ({...prev, [id]: state}));

  useEffect(() => {
      const init = async () => {
        setLoading(true);
        try {
            {
                const artikelListRes = await get('Artikel', { pageSize: 10000 });
                let artikelListData = artikelListRes.data || artikelListRes;
                
                setArtikelList(artikelListData);
            }
            if (id && id !== 'new') {
                const res = await get(`Angebotspositionen/${id}`);
                const masterRecord = res.data || res;
                setData(masterRecord);
                
            } else {
                setData({
      menge: 1,
      rabattProzent: 0
    });
            }
        } catch (e) { console.error(e); }
        setLoading(false);
      };
      init();
  }, [id]);

  

  const handleSubmit = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    try { 
      const payload = { ...data };
      if (id && id !== 'new') {
          await put(`Angebotspositionen/${id}`, payload); 
      } else {
          await post('Angebotspositionen', payload); 
      }
      navigate(-1); 
    } catch (e) { 
      alert('Fehler'); 
    } 
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline-block mr-2 text-blue-500"/> Lade...</div>;
  const subData: any = {}; const setSubData = (d: any) => {};

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8">
      <button onClick={() => navigate(-1)} className="mb-4 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center gap-2 transition-colors font-medium text-sm"><ArrowLeft size={16}/> Zurück</button>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Angebotspositionen Subform</h1></div>
          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            <div className="grid grid-cols-4 gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">

                 <div className={`${isFieldHidden('ap3') ? 'hidden' : ''}`}>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Artikel {isFieldRequired('ap3') && <span className="text-red-500">*</span>}</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <select 
                                disabled={isFieldDisabled('ap3')} required={isFieldRequired('ap3')}
                                className={`w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 ${isFieldDisabled('ap3') ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''} appearance-none`}
                                value={data.artikelId || ''}
                                onChange={e => setData({...data, artikelId: e.target.value})}
                            >
                                <option value="">Bitte wählen...</option>
                                {artikelList.map(i => <option key={i.id} value={i.id}>{(i.bezeichnung !== undefined && i.bezeichnung !== null ? i.bezeichnung : (i.bezeichnungValue !== undefined && i.bezeichnungValue !== null ? i.bezeichnungValue : ""))}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                               <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                        
                    </div>
                 </div>

        <div className={`${isFieldHidden('ap4') ? 'hidden' : ''}`}>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Menge {isFieldRequired('ap4') && <span className="text-red-500">*</span>}</label>
            <input type="number" disabled={isFieldDisabled('ap4')} required={isFieldRequired('ap4')} className={`w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 ${isFieldDisabled('ap4') ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''}`} value={data.menge !== undefined && data.menge !== null ? data.menge : ''} onChange={e => setData({...data, menge: e.target.value})} />
        </div>

        <div className={`${isFieldHidden('ap5') ? 'hidden' : ''}`}>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Einzelpreis (€) {isFieldRequired('ap5') && <span className="text-red-500">*</span>}</label>
            <input type="number" disabled={isFieldDisabled('ap5')} required={isFieldRequired('ap5')} className={`w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 ${isFieldDisabled('ap5') ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''}`} value={data.einzelpreis !== undefined && data.einzelpreis !== null ? data.einzelpreis : ''} onChange={e => setData({...data, einzelpreis: e.target.value})} />
        </div>

        <div className={`${isFieldHidden('ap7') ? 'hidden' : ''}`}>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Gesamt Netto (€) {isFieldRequired('ap7') && <span className="text-red-500">*</span>}</label>
            <input type="number" disabled={isFieldDisabled('ap7')} required={isFieldRequired('ap7')} className={`w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 ${isFieldDisabled('ap7') ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''}`} value={data.gesamtNetto !== undefined && data.gesamtNetto !== null ? data.gesamtNetto : ''} onChange={e => setData({...data, gesamtNetto: e.target.value})} />
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