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

export const RechnungserfassungForm = () => {
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
                [{"name":"Id","camel":"id"},{"name":"RechnungsNr","camel":"rechnungsNr"},{"name":"AuftragsId","camel":"auftragsId"},{"name":"KundenId","camel":"kundenId"},{"name":"RechnungsDatum","camel":"rechnungsDatum"},{"name":"FaelligDatum","camel":"faelligDatum"},{"name":"ZahlungsStatus","camel":"zahlungsStatus"},{"name":"NettoBetrag","camel":"nettoBetrag"},{"name":"MwStBetrag","camel":"mwStBetrag"},{"name":"BruttoBetrag","camel":"bruttoBetrag"},{"name":"OffenerBetrag","camel":"offenerBetrag"},{"name":"SkontoProzent","camel":"skontoProzent"}].forEach(m => {
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

  const [kundenList, setKundenList] = useState<any[]>([]);
  const [auftraegeList, setAuftraegeList] = useState<any[]>([]);
  const [artikelList, setArtikelList] = useState<any[]>([]);
  const [rechnungspositionenSubList_pos, setRechnungspositionenSubListPos] = useState<any[]>([]);
  const [rechnungspositionenSubList_pos_editingId, setRechnungspositionenSubListPos_editingId] = useState<any>(null);
  const [rechnungspositionenSubList_pos_subData, setRechnungspositionenSubListPos_subData] = useState<any>({});

  const editSubformItem_pos = (item: any) => {
      setRechnungspositionenSubListPos_editingId(item.id || item.Id || item.ID);
      const normalizedItem: any = { ...item };
      if (normalizedItem['id'] === undefined) normalizedItem['id'] = item['Id'] ?? item['Id'];
      if (normalizedItem['rechnungsId'] === undefined) normalizedItem['rechnungsId'] = item['RechnungsId'] ?? item['RechnungsId'];
      if (normalizedItem['artikelId'] === undefined) normalizedItem['artikelId'] = item['ArtikelId'] ?? item['ArtikelId'];
      if (normalizedItem['positionNr'] === undefined) normalizedItem['positionNr'] = item['PositionNr'] ?? item['PositionNr'];
      if (normalizedItem['menge'] === undefined) normalizedItem['menge'] = item['Menge'] ?? item['Menge'];
      if (normalizedItem['einzelpreis'] === undefined) normalizedItem['einzelpreis'] = item['Einzelpreis'] ?? item['Einzelpreis'];
      if (normalizedItem['steuerSatz'] === undefined) normalizedItem['steuerSatz'] = item['SteuerSatz'] ?? item['SteuerSatz'];
      if (normalizedItem['gesamtNetto'] === undefined) normalizedItem['gesamtNetto'] = item['GesamtNetto'] ?? item['GesamtNetto'];
      setRechnungspositionenSubListPos_subData(normalizedItem);
      toggleModal('sub_pos', true);
  };

  const deleteSubformItem_pos = async (item: any) => {
      if (!window.confirm('Möchten Sie diesen Eintrag wirklich löschen?')) return;
      const itemId = item.id || item.Id || item.ID;
      try {
          await del('rechnungspositionen', itemId);
          setRechnungspositionenSubListPos(prev => prev.filter(x => (x.id || x.Id || x.ID) !== itemId));
      } catch (err) {
          alert('Fehler beim Löschen');
      }
  };

  const toggleModal = (id: string, state: boolean) => setModals(prev => ({...prev, [id]: state}));

  useEffect(() => {
      const init = async () => {
        setLoading(true);
        try {
            {
                const kundenListRes = await get('Kunden', { pageSize: 10000 });
                let kundenListData = kundenListRes.data || kundenListRes;
                
                setKundenList(kundenListData);
            }
            {
                const auftraegeListRes = await get('Auftraege', { pageSize: 10000 });
                let auftraegeListData = auftraegeListRes.data || auftraegeListRes;
                
                setAuftraegeList(auftraegeListData);
            }
            {
                const artikelListRes = await get('Artikel', { pageSize: 10000 });
                let artikelListData = artikelListRes.data || artikelListRes;
                
                setArtikelList(artikelListData);
            }
            if (id && id !== 'new') {
                const res = await get(`Rechnungen/${id}`);
                const masterRecord = res.data || res;
                setData(masterRecord);
                if (id && id !== 'new') {
            const masterVal_pos = (masterRecord as any)?.['id'] ?? (masterRecord as any)?.['Id'] ?? (masterRecord as any)?.['Id'] ?? id;
            if (masterVal_pos !== undefined && masterVal_pos !== null && masterVal_pos !== '' && masterVal_pos !== 'new') {
                const subRes = await get('Rechnungspositionen', { pageSize: 10000 });
                const allSubItems = subRes.data || subRes || [];
                setRechnungspositionenSubListPos(allSubItems.filter((x: any) => {
                    const childVal = x?.['rechnungsId'] ?? x?.['RechnungsId'] ?? x?.['RechnungsId'] ?? x?.['rp2'];
                    return childVal !== undefined && childVal !== null && String(childVal) === String(masterVal_pos);
                }));
            }
        }
            } else {
                setData({
      zahlungsStatus: "Offen",
      skontoProzent: 2
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
          await put(`Rechnungen/${id}`, payload); 
      } else {
          await post('Rechnungen', payload); 
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
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Rechnungserfassung</h1></div>
          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            <div className="space-y-4 p-4 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 space-y-4">
<div className="text-xl font-bold text-slate-800 dark:text-slate-100 border-b pb-3 flex items-center gap-2">📄 Rechnungs-Erfassung & Druckvorbereitung</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">

        <div className={`${isFieldHidden('r2') ? 'hidden' : ''}`}>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Rechnungs-Nr {isFieldRequired('r2') && <span className="text-red-500">*</span>}</label>
            <input type="text" disabled={isFieldDisabled('r2')} required={isFieldRequired('r2')} className={`w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 ${isFieldDisabled('r2') ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''}`} value={data.rechnungsNr !== undefined && data.rechnungsNr !== null ? data.rechnungsNr : ''} onChange={e => setData({...data, rechnungsNr: e.target.value})} />
        </div>

                 <div className={`${isFieldHidden('r4') ? 'hidden' : ''}`}>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Empfänger / Kunde {isFieldRequired('r4') && <span className="text-red-500">*</span>}</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <select 
                                disabled={isFieldDisabled('r4')} required={isFieldRequired('r4')}
                                className={`w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 ${isFieldDisabled('r4') ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''} appearance-none`}
                                value={data.kundenId || ''}
                                onChange={e => setData({...data, kundenId: e.target.value})}
                            >
                                <option value="">Bitte wählen...</option>
                                {kundenList.map(i => <option key={i.id} value={i.id}>{(i.firmenname !== undefined && i.firmenname !== null ? i.firmenname : (i.firmennameValue !== undefined && i.firmennameValue !== null ? i.firmennameValue : "")) + " " + (i.kundenNr !== undefined && i.kundenNr !== null ? i.kundenNr : (i.kundenNrValue !== undefined && i.kundenNrValue !== null ? i.kundenNrValue : ""))}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                               <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                        
                        <button 
                            type="button"
                            onClick={() => toggleModal('lookup_f_r_kd', true)}
                            className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-300 rounded px-3 flex items-center justify-center transition-colors"
                            title="Neu erstellen"
                        >
                            <Plus size={18} strokeWidth={3} />
                        </button>
                    </div>
                 </div>

            <div className={`${isFieldHidden('r7') ? 'hidden' : ''}`}>
                {/* ENUM DROPDOWN: ZahlungsStatus (Rechnungen) */}
                {/* 1. FRONTEND: To add/modify options, add <option value="..."> tags below */}
                {/* 2. DATABASE: To alter enum in DB, update DB Studio or run: */}
                {/*    ALTER TABLE `Rechnungen` MODIFY COLUMN `ZahlungsStatus` ENUM('Offen', 'Bezahlt', 'Ueberfaellig', 'Gemahnt', 'Teilbezahlt'); */}
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Zahlungsstatus {isFieldRequired('r7') && <span className="text-red-500">*</span>}</label>
                <div className="relative">
                    <select 
                        disabled={isFieldDisabled('r7')} required={isFieldRequired('r7')}
                        className={`w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 ${isFieldDisabled('r7') ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''} appearance-none pr-8 cursor-pointer`}
                        value={data.zahlungsStatus ?? ''}
                        onChange={e => setData({...data, zahlungsStatus: e.target.value})}
                    >
                        <option value="">-- Bitte wählen (Zahlungsstatus) --</option>
                    <option key="Offen" value="Offen">Offen</option>
                    <option key="Bezahlt" value="Bezahlt">Bezahlt</option>
                    <option key="Ueberfaellig" value="Ueberfaellig">Ueberfaellig</option>
                    <option key="Gemahnt" value="Gemahnt">Gemahnt</option>
                    <option key="Teilbezahlt" value="Teilbezahlt">Teilbezahlt</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            </div>

        <div className={`${isFieldHidden('r5') ? 'hidden' : ''}`}>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Rechnungsdatum {isFieldRequired('r5') && <span className="text-red-500">*</span>}</label>
            <input type="date" disabled={isFieldDisabled('r5')} required={isFieldRequired('r5')} className={`w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 ${isFieldDisabled('r5') ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''}`} value={data.rechnungsDatum ? String(data.rechnungsDatum).split('T')[0].split(' ')[0] : ''} onChange={e => setData({...data, rechnungsDatum: e.target.value})} />
        </div>

        <div className={`${isFieldHidden('r6') ? 'hidden' : ''}`}>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Fälligkeitsdatum {isFieldRequired('r6') && <span className="text-red-500">*</span>}</label>
            <input type="date" disabled={isFieldDisabled('r6')} required={isFieldRequired('r6')} className={`w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 ${isFieldDisabled('r6') ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''}`} value={data.faelligDatum ? String(data.faelligDatum).split('T')[0].split(' ')[0] : ''} onChange={e => setData({...data, faelligDatum: e.target.value})} />
        </div>

                 <div className={`${isFieldHidden('r3') ? 'hidden' : ''}`}>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Zugrunde liegender Auftrag {isFieldRequired('r3') && <span className="text-red-500">*</span>}</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <select 
                                disabled={isFieldDisabled('r3')} required={isFieldRequired('r3')}
                                className={`w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 ${isFieldDisabled('r3') ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''} appearance-none`}
                                value={data.auftragsId || ''}
                                onChange={e => setData({...data, auftragsId: e.target.value})}
                            >
                                <option value="">Bitte wählen...</option>
                                {auftraegeList.map(i => <option key={i.id} value={i.id}>{(i.auftragsNr !== undefined && i.auftragsNr !== null ? i.auftragsNr : (i.auftragsNrValue !== undefined && i.auftragsNrValue !== null ? i.auftragsNrValue : ""))}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                               <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                        
                    </div>
                 </div>
</div>

            <div className="border border-slate-300 dark:border-slate-600 rounded-md overflow-hidden mt-6 shadow-sm ">
                <div className="bg-slate-100 dark:bg-slate-800 p-3 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <Layout size={16} className="text-indigo-500"/> Rechnungspositionen (Artikel & Leistungen)
                    </span>
                    
                    <button 
                        type="button"
                        onClick={() => toggleModal('sub_pos', true)} 
                        className="bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-slate-600 rounded px-3 py-1 text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
                    >
                        <Plus size={14} strokeWidth={3}/> Neu
                    </button>
                </div>
                <div className="p-0 bg-white dark:bg-slate-900">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                            <tr>
                                <th className="p-2 font-medium">Artikel / Dienstleistung</th><th className="p-2 font-medium">PositionNr</th><th className="p-2 font-medium">Menge</th><th className="p-2 font-medium">Einzelpreis (€)</th><th className="p-2 font-medium">SteuerSatz</th><th className="p-2 font-medium">Gesamt Netto (€)</th>
                                <th className="p-2 text-right">Aktionen</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rechnungspositionenSubList_pos && rechnungspositionenSubList_pos.length > 0 ? rechnungspositionenSubList_pos.map((item: any, idx: number) => (
                                <tr key={idx} className="border-b dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-2">{(() => {
                                                    const rawVal = item?.['artikelId'] ?? item?.['ArtikelId'] ?? item?.['ArtikelId'];
                                                    if (rawVal === undefined || rawVal === null || rawVal === '') return '';
                                                    const match = artikelList?.find((r: any) => String(r.id ?? r.Id ?? r['id'] ?? r['Id']) === String(rawVal));
                                                    if (!match) return String(rawVal);
                                                    return [match['bezeichnung'] ?? match['Bezeichnung'], match['artikelNr'] ?? match['ArtikelNr']].filter(Boolean).join(' ') || String(rawVal);
                                                })()}</td><td className="p-2">{String(item?.['positionNr'] ?? item?.['PositionNr'] ?? item?.['PositionNr'] ?? '')}</td><td className="p-2">{String(item?.['menge'] ?? item?.['Menge'] ?? item?.['Menge'] ?? '')}</td><td className="p-2">{String(item?.['einzelpreis'] ?? item?.['Einzelpreis'] ?? item?.['Einzelpreis'] ?? '')}</td><td className="p-2">{String(item?.['steuerSatz'] ?? item?.['SteuerSatz'] ?? item?.['SteuerSatz'] ?? '')}</td><td className="p-2">{String(item?.['gesamtNetto'] ?? item?.['GesamtNetto'] ?? item?.['GesamtNetto'] ?? '')}</td>
                                    <td className="p-2 text-right whitespace-nowrap space-x-2">
                                        <button type="button" onClick={() => editSubformItem_pos(item)} className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-semibold">Bearbeiten</button>
                                        <button type="button" onClick={() => deleteSubformItem_pos(item)} className="text-rose-600 dark:text-rose-400 hover:underline text-xs font-semibold">Löschen</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={7} className="p-4 text-center text-slate-400 italic">Keine Einträge vorhanden.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
<div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-100 dark:bg-slate-800 p-4 rounded-xl font-semibold">

        <div className={`${isFieldHidden('r8') ? 'hidden' : ''}`}>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Netto-Gesamt (€) {isFieldRequired('r8') && <span className="text-red-500">*</span>}</label>
            <input type="number" disabled={isFieldDisabled('r8')} required={isFieldRequired('r8')} className={`w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 ${isFieldDisabled('r8') ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''}`} value={data.nettoBetrag !== undefined && data.nettoBetrag !== null ? data.nettoBetrag : ''} onChange={e => setData({...data, nettoBetrag: e.target.value})} />
        </div>

        <div className={`${isFieldHidden('r9') ? 'hidden' : ''}`}>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">MwSt Betrag (€) {isFieldRequired('r9') && <span className="text-red-500">*</span>}</label>
            <input type="number" disabled={isFieldDisabled('r9')} required={isFieldRequired('r9')} className={`w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 ${isFieldDisabled('r9') ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''}`} value={data.mwStBetrag !== undefined && data.mwStBetrag !== null ? data.mwStBetrag : ''} onChange={e => setData({...data, mwStBetrag: e.target.value})} />
        </div>

        <div className={`${isFieldHidden('r10') ? 'hidden' : ''}`}>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Brutto-Endbetrag (€) {isFieldRequired('r10') && <span className="text-red-500">*</span>}</label>
            <input type="number" disabled={isFieldDisabled('r10')} required={isFieldRequired('r10')} className={`w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 ${isFieldDisabled('r10') ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''}`} value={data.bruttoBetrag !== undefined && data.bruttoBetrag !== null ? data.bruttoBetrag : ''} onChange={e => setData({...data, bruttoBetrag: e.target.value})} />
        </div>

        <div className={`${isFieldHidden('r11') ? 'hidden' : ''}`}>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Noch offener Betrag (€) {isFieldRequired('r11') && <span className="text-red-500">*</span>}</label>
            <input type="number" disabled={isFieldDisabled('r11')} required={isFieldRequired('r11')} className={`w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 ${isFieldDisabled('r11') ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''}`} value={data.offenerBetrag !== undefined && data.offenerBetrag !== null ? data.offenerBetrag : ''} onChange={e => setData({...data, offenerBetrag: e.target.value})} />
        </div>
</div>
</div>
            <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                <button type="button" onClick={() => navigate(-1)} className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors">Abbrechen</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5"><Save size={18}/> Speichern</button>
            </div>
          </form>
      </div>
      <Modal isOpen={modals['lookup_f_r_kd']} onClose={() => toggleModal('lookup_f_r_kd', false)} title="Neu: Kunden"><form onSubmit={async (e) => { e.preventDefault(); const formData = new FormData(e.currentTarget); const payload: any = {}; formData.forEach((value, key) => { if(value==='true') payload[key]=true; else if(value==='false') payload[key]=false; else payload[key]=value; }); try { await post('kunden', payload); const res = await get('kunden', { pageSize: 10000 }); setKundenList(res.data || res); toggleModal('lookup_f_r_kd', false); } catch (err) { alert('Fehler'); } }}><div className="space-y-2"><div className="mb-3"><label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">KundenNr</label><input name="kundenNr" className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" /></div><div className="mb-3"><label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Firmenname</label><input name="firmenname" className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" /></div><div className="mb-3"><label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Ansprechpartner</label><input name="ansprechpartner" className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" /></div><div className="mb-3"><label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Email</label><input name="email" className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" /></div><div className="mb-3"><label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Telefon</label><input name="telefon" className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" /></div><div className="mb-3"><label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Strasse</label><input name="strasse" className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" /></div><div className="mb-3"><label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">plz</label><input name="plz" className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" /></div><div className="mb-3"><label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Ort</label><input name="ort" className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" /></div><div className="mb-3"><label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">UStIdNr</label><input name="uStIdNr" className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" /></div><div className="mb-3"><label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">ZahlungszielTage</label><input type="number" name="zahlungszielTage" className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" step="1" /></div><div className="mb-3"><label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Status</label><select name="status" className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"><option value="">-- Bitte wählen --</option><option value="Aktiv">Aktiv</option><option value="Interessent">Interessent</option><option value="Gesperrt">Gesperrt</option></select></div></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => toggleModal('lookup_f_r_kd', false)} className="px-4 py-2 border rounded text-slate-600 dark:text-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">Abbrechen</button><button className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700">Speichern</button></div></form></Modal>
<Modal isOpen={modals['sub_pos']} onClose={() => { toggleModal('sub_pos', false); setRechnungspositionenSubListPos_editingId(null); setRechnungspositionenSubListPos_subData({}); }} title={rechnungspositionenSubList_pos_editingId ? "Eintrag bearbeiten" : "Eintrag hinzufügen"}><form onSubmit={async (e) => { e.preventDefault(); const masterVal = data?.['id'] ?? data?.['Id'] ?? data?.['Id'] ?? id; if (!masterVal || id === 'new') { alert('Bitte erst Hauptdatensatz speichern.'); return; } const payload = { ...rechnungspositionenSubList_pos_subData, rechnungsId: masterVal, ['RechnungsId']: masterVal }; try { if (rechnungspositionenSubList_pos_editingId) { await put('rechnungspositionen', rechnungspositionenSubList_pos_editingId, payload); } else { await post('rechnungspositionen', payload); } const subRes = await get('Rechnungspositionen', { search: '', pageSize: 10000 }); const allSubItems = subRes.data || subRes || []; setRechnungspositionenSubListPos(allSubItems.filter((x: any) => { const childVal = x?.['rechnungsId'] ?? x?.['RechnungsId'] ?? x?.['RechnungsId'] ?? x?.['rp2']; return childVal !== undefined && childVal !== null && String(childVal) === String(masterVal); })); toggleModal('sub_pos', false); setRechnungspositionenSubListPos_editingId(null); setRechnungspositionenSubListPos_subData({}); } catch (err) { alert('Fehler beim Speichern'); } }}><div className="space-y-2"><div className="mb-3"><label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">ArtikelId</label><input type="number" value={rechnungspositionenSubList_pos_subData['artikelId'] ?? ''} onChange={(e) => setRechnungspositionenSubListPos_subData((prev: any) => ({ ...prev, artikelId: e.target.value === '' ? '' : Number(e.target.value) }))} className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" step="1" /></div><div className="mb-3"><label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">PositionNr</label><input type="number" value={rechnungspositionenSubList_pos_subData['positionNr'] ?? ''} onChange={(e) => setRechnungspositionenSubListPos_subData((prev: any) => ({ ...prev, positionNr: e.target.value === '' ? '' : Number(e.target.value) }))} className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" step="1" /></div><div className="mb-3"><label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Menge</label><input type="number" value={rechnungspositionenSubList_pos_subData['menge'] ?? ''} onChange={(e) => setRechnungspositionenSubListPos_subData((prev: any) => ({ ...prev, menge: e.target.value === '' ? '' : Number(e.target.value) }))} className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" step="0.01" /></div><div className="mb-3"><label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Einzelpreis</label><input type="number" value={rechnungspositionenSubList_pos_subData['einzelpreis'] ?? ''} onChange={(e) => setRechnungspositionenSubListPos_subData((prev: any) => ({ ...prev, einzelpreis: e.target.value === '' ? '' : Number(e.target.value) }))} className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" step="0.01" /></div><div className="mb-3"><label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">SteuerSatz</label><input type="number" value={rechnungspositionenSubList_pos_subData['steuerSatz'] ?? ''} onChange={(e) => setRechnungspositionenSubListPos_subData((prev: any) => ({ ...prev, steuerSatz: e.target.value === '' ? '' : Number(e.target.value) }))} className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" step="1" /></div><div className="mb-3"><label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">GesamtNetto</label><input type="number" value={rechnungspositionenSubList_pos_subData['gesamtNetto'] ?? ''} onChange={(e) => setRechnungspositionenSubListPos_subData((prev: any) => ({ ...prev, gesamtNetto: e.target.value === '' ? '' : Number(e.target.value) }))} className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" step="0.01" /></div></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => { toggleModal('sub_pos', false); setRechnungspositionenSubListPos_editingId(null); setRechnungspositionenSubListPos_subData({}); }} className="px-4 py-2 border rounded text-slate-600 dark:text-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm">Abbrechen</button><button className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 text-sm">Speichern</button></div></form></Modal>
    </div>
  );
};