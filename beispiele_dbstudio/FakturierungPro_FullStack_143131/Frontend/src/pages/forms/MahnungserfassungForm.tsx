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

export const MahnungserfassungForm = () => {
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
                [{"name":"Id","camel":"id"},{"name":"MahnungsNr","camel":"mahnungsNr"},{"name":"RechnungsId","camel":"rechnungsId"},{"name":"KundenId","camel":"kundenId"},{"name":"MahnDatum","camel":"mahnDatum"},{"name":"Mahnstufe","camel":"mahnstufe"},{"name":"Mahngebuehr","camel":"mahngebuehr"},{"name":"Verzugszinsen","camel":"verzugszinsen"},{"name":"FaelligBis","camel":"faelligBis"},{"name":"Status","camel":"status"}].forEach(m => {
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

  const [rechnungenList, setRechnungenList] = useState<any[]>([]);
  const [kundenList, setKundenList] = useState<any[]>([]);
  

  const toggleModal = (id: string, state: boolean) => setModals(prev => ({...prev, [id]: state}));

  useEffect(() => {
      const init = async () => {
        setLoading(true);
        try {
            {
                const rechnungenListRes = await get('Rechnungen', { pageSize: 10000 });
                let rechnungenListData = rechnungenListRes.data || rechnungenListRes;
                
                setRechnungenList(rechnungenListData);
            }
            {
                const kundenListRes = await get('Kunden', { pageSize: 10000 });
                let kundenListData = kundenListRes.data || kundenListRes;
                
                setKundenList(kundenListData);
            }
            if (id && id !== 'new') {
                const res = await get(`Mahnungen/${id}`);
                const masterRecord = res.data || res;
                setData(masterRecord);
                
            } else {
                setData({
      mahnstufe: "Mahnstufe 1 (Zahlungserinnerung)",
      mahngebuehr: 5.00,
      verzugszinsen: 0.00,
      status: "Offen"
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
          await put(`Mahnungen/${id}`, payload); 
      } else {
          await post('Mahnungen', payload); 
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
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Mahnungserfassung</h1></div>
          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            <div className="space-y-4 p-4 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 space-y-4">
<div className="text-xl font-bold text-amber-600 dark:text-amber-400 border-b pb-3">⚠️ Mahnwesen & Zahlungserinnerung</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">

        <div className={`${isFieldHidden('m2') ? 'hidden' : ''}`}>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Mahnungs-Nr {isFieldRequired('m2') && <span className="text-red-500">*</span>}</label>
            <input type="text" disabled={isFieldDisabled('m2')} required={isFieldRequired('m2')} className={`w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 ${isFieldDisabled('m2') ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''}`} value={data.mahnungsNr !== undefined && data.mahnungsNr !== null ? data.mahnungsNr : ''} onChange={e => setData({...data, mahnungsNr: e.target.value})} />
        </div>

                 <div className={`${isFieldHidden('m3') ? 'hidden' : ''}`}>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Referenz-Rechnung {isFieldRequired('m3') && <span className="text-red-500">*</span>}</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <select 
                                disabled={isFieldDisabled('m3')} required={isFieldRequired('m3')}
                                className={`w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 ${isFieldDisabled('m3') ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''} appearance-none`}
                                value={data.rechnungsId || ''}
                                onChange={e => setData({...data, rechnungsId: e.target.value})}
                            >
                                <option value="">Bitte wählen...</option>
                                {rechnungenList.map(i => <option key={i.id} value={i.id}>{(i.rechnungsNr !== undefined && i.rechnungsNr !== null ? i.rechnungsNr : (i.rechnungsNrValue !== undefined && i.rechnungsNrValue !== null ? i.rechnungsNrValue : "")) + " " + (i.bruttoBetrag !== undefined && i.bruttoBetrag !== null ? i.bruttoBetrag : (i.bruttoBetragValue !== undefined && i.bruttoBetragValue !== null ? i.bruttoBetragValue : ""))}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                               <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                        
                    </div>
                 </div>

                 <div className={`${isFieldHidden('m4') ? 'hidden' : ''}`}>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Kunde {isFieldRequired('m4') && <span className="text-red-500">*</span>}</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <select 
                                disabled={isFieldDisabled('m4')} required={isFieldRequired('m4')}
                                className={`w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 ${isFieldDisabled('m4') ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''} appearance-none`}
                                value={data.kundenId || ''}
                                onChange={e => setData({...data, kundenId: e.target.value})}
                            >
                                <option value="">Bitte wählen...</option>
                                {kundenList.map(i => <option key={i.id} value={i.id}>{(i.firmenname !== undefined && i.firmenname !== null ? i.firmenname : (i.firmennameValue !== undefined && i.firmennameValue !== null ? i.firmennameValue : ""))}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                               <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                        
                    </div>
                 </div>

            <div className={`${isFieldHidden('m6') ? 'hidden' : ''}`}>
                {/* ENUM DROPDOWN: Mahnstufe (Mahnungen) */}
                {/* 1. FRONTEND: To add/modify options, add <option value="..."> tags below */}
                {/* 2. DATABASE: To alter enum in DB, update DB Studio or run: */}
                {/*    ALTER TABLE `Mahnungen` MODIFY COLUMN `Mahnstufe` ENUM('Mahnstufe 1 (Zahlungserinnerung)', 'Mahnstufe 2 (Aufforderung)', 'Mahnstufe 3 (Letzte Mahnung)', 'Inkasso'); */}
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Mahnstufe {isFieldRequired('m6') && <span className="text-red-500">*</span>}</label>
                <div className="relative">
                    <select 
                        disabled={isFieldDisabled('m6')} required={isFieldRequired('m6')}
                        className={`w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 ${isFieldDisabled('m6') ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''} appearance-none pr-8 cursor-pointer`}
                        value={data.mahnstufe ?? ''}
                        onChange={e => setData({...data, mahnstufe: e.target.value})}
                    >
                        <option value="">-- Bitte wählen (Mahnstufe) --</option>
                    <option key="Mahnstufe 1 (Zahlungserinnerung)" value="Mahnstufe 1 (Zahlungserinnerung)">Mahnstufe 1 (Zahlungserinnerung)</option>
                    <option key="Mahnstufe 2 (Aufforderung)" value="Mahnstufe 2 (Aufforderung)">Mahnstufe 2 (Aufforderung)</option>
                    <option key="Mahnstufe 3 (Letzte Mahnung)" value="Mahnstufe 3 (Letzte Mahnung)">Mahnstufe 3 (Letzte Mahnung)</option>
                    <option key="Inkasso" value="Inkasso">Inkasso</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            </div>

        <div className={`${isFieldHidden('m5') ? 'hidden' : ''}`}>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Mahndatum {isFieldRequired('m5') && <span className="text-red-500">*</span>}</label>
            <input type="date" disabled={isFieldDisabled('m5')} required={isFieldRequired('m5')} className={`w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 ${isFieldDisabled('m5') ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''}`} value={data.mahnDatum ? String(data.mahnDatum).split('T')[0].split(' ')[0] : ''} onChange={e => setData({...data, mahnDatum: e.target.value})} />
        </div>

        <div className={`${isFieldHidden('m9') ? 'hidden' : ''}`}>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Zahlungsfrist bis {isFieldRequired('m9') && <span className="text-red-500">*</span>}</label>
            <input type="date" disabled={isFieldDisabled('m9')} required={isFieldRequired('m9')} className={`w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 ${isFieldDisabled('m9') ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''}`} value={data.faelligBis ? String(data.faelligBis).split('T')[0].split(' ')[0] : ''} onChange={e => setData({...data, faelligBis: e.target.value})} />
        </div>

        <div className={`${isFieldHidden('m7') ? 'hidden' : ''}`}>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Mahngebühr (€) {isFieldRequired('m7') && <span className="text-red-500">*</span>}</label>
            <input type="number" disabled={isFieldDisabled('m7')} required={isFieldRequired('m7')} className={`w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 ${isFieldDisabled('m7') ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''}`} value={data.mahngebuehr !== undefined && data.mahngebuehr !== null ? data.mahngebuehr : ''} onChange={e => setData({...data, mahngebuehr: e.target.value})} />
        </div>

        <div className={`${isFieldHidden('m8') ? 'hidden' : ''}`}>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Verzugszinsen (€) {isFieldRequired('m8') && <span className="text-red-500">*</span>}</label>
            <input type="number" disabled={isFieldDisabled('m8')} required={isFieldRequired('m8')} className={`w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 ${isFieldDisabled('m8') ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''}`} value={data.verzugszinsen !== undefined && data.verzugszinsen !== null ? data.verzugszinsen : ''} onChange={e => setData({...data, verzugszinsen: e.target.value})} />
        </div>

            <div className={`${isFieldHidden('m10') ? 'hidden' : ''}`}>
                {/* ENUM DROPDOWN: Status (Mahnungen) */}
                {/* 1. FRONTEND: To add/modify options, add <option value="..."> tags below */}
                {/* 2. DATABASE: To alter enum in DB, update DB Studio or run: */}
                {/*    ALTER TABLE `Mahnungen` MODIFY COLUMN `Status` ENUM('Offen', 'Bezahlt', 'Storniert'); */}
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Mahnstatus {isFieldRequired('m10') && <span className="text-red-500">*</span>}</label>
                <div className="relative">
                    <select 
                        disabled={isFieldDisabled('m10')} required={isFieldRequired('m10')}
                        className={`w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 ${isFieldDisabled('m10') ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''} appearance-none pr-8 cursor-pointer`}
                        value={data.status ?? ''}
                        onChange={e => setData({...data, status: e.target.value})}
                    >
                        <option value="">-- Bitte wählen (Mahnstatus) --</option>
                    <option key="Offen" value="Offen">Offen</option>
                    <option key="Bezahlt" value="Bezahlt">Bezahlt</option>
                    <option key="Storniert" value="Storniert">Storniert</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
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