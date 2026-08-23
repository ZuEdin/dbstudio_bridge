
import React, { useState, useEffect } from 'react';
import { Table, Field, FieldType, BackendConfig } from '../../types/index';
import { X, ArrowRight, Check, Share2, FileText, List, AlertTriangle, Save, Key, Globe, Shield } from 'lucide-react';
import { sharePointService, mapSpTypeToInternal } from '../../services/sharePointService';

interface SharePointImportWizardProps {
  onSave: (table: Table) => void;
  onClose: () => void;
  backendConfig?: BackendConfig;
  onUpdateConfig?: (config: BackendConfig) => void;
}

interface Mapping {
    spField: string;
    spTitle: string;
    spType: string;
    targetName: string;
    targetType: FieldType;
    selected: boolean;
}

export const SharePointImportWizard: React.FC<SharePointImportWizardProps> = ({ onSave, onClose, backendConfig, onUpdateConfig }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [siteUrl, setSiteUrl] = useState('https://ihr-tenant.sharepoint.com/sites/dev');
  
  // Auth State
  const [authMethod, setAuthMethod] = useState<'token' | 'integrated'>('token');
  const [accessToken, setAccessToken] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [lists, setLists] = useState<any[]>([]);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [tableName, setTableName] = useState('');
  
  // Load saved config
  useEffect(() => {
      if (backendConfig?.integrations?.sharePoint) {
          setSiteUrl(backendConfig.integrations.sharePoint.siteUrl || '');
          if (backendConfig.integrations.sharePoint.authMethod === 'app') {
              setAuthMethod('token');
          } else {
              setAuthMethod('integrated');
          }
      }
  }, [backendConfig]);

  const handleConnect = async () => {
      if(!siteUrl) {
          setError("Bitte Site URL angeben.");
          return;
      }
      if(authMethod === 'token' && !accessToken) {
          setError("Bitte Access Token angeben.");
          return;
      }

      setLoading(true);
      setError(null);
      
      const tokenToSend = authMethod === 'token' ? accessToken : '';

      try {
          const fetchedLists = await sharePointService.getLists(siteUrl, tokenToSend);
          setLists(fetchedLists);
          setStep(2);
          
          if (backendConfig && onUpdateConfig) {
              const newIntegrations = { 
                  ...backendConfig.integrations, 
                  sharePoint: { 
                      ...backendConfig.integrations?.sharePoint,
                      siteUrl: siteUrl, 
                      authMethod: authMethod === 'token' ? 'app' : 'user' as any
                  } 
              };
              if (!newIntegrations.storage) newIntegrations.storage = { provider: 'local' };
              if (!newIntegrations.sso) newIntegrations.sso = [];
              if (!newIntegrations.webhooks) newIntegrations.webhooks = [];

              onUpdateConfig({ ...backendConfig, integrations: newIntegrations });
          }

      } catch (e: any) {
          setError(e.message || "Verbindung fehlgeschlagen. Prüfen Sie URL und Zugriffsrechte.");
      }
      setLoading(false);
  };

  const handleSelectList = async (list: any) => {
      setSelectedList(list.id);
      setTableName(list.title.replace(/[^a-zA-Z0-9]/g, ''));
      setLoading(true);
      
      const tokenToSend = authMethod === 'token' ? accessToken : '';

      try {
          const fields = await sharePointService.getListFields(siteUrl, list.id, tokenToSend);
          const newMappings: Mapping[] = fields.map((f: any) => ({
              spField: f.InternalName,
              spTitle: f.Title,
              spType: f.TypeAsString,
              targetName: f.InternalName === 'FileLeafRef' ? 'Dateiname' : f.Title.replace(/[^a-zA-Z0-9]/g, ''),
              targetType: mapSpTypeToInternal(f.TypeAsString),
              selected: true
          }));
          setMappings(newMappings);
          setStep(3);
      } catch (e: any) {
          setError("Felder konnten nicht geladen werden: " + e.message);
      }
      setLoading(false);
  };

  const updateMapping = (idx: number, updates: Partial<Mapping>) => {
      const newM = [...mappings];
      newM[idx] = { ...newM[idx], ...updates };
      setMappings(newM);
  };

  const handleFinish = async () => {
      if (!selectedList) return;
      setLoading(true);
      
      const tokenToSend = authMethod === 'token' ? accessToken : '';

      try {
          const selectedMappings = mappings.filter(m => m.selected);
          const fields: Field[] = selectedMappings.map(m => ({
              id: crypto.randomUUID(),
              name: m.targetName,
              type: m.targetType,
              isPrimaryKey: false,
              allowNull: true
          }));

          if (!fields.some(f => f.name.toLowerCase() === 'id')) {
              fields.unshift({ id: crypto.randomUUID(), name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true });
          }

          const data = await sharePointService.getListData(siteUrl, selectedList, tokenToSend);
          
          const mappedData = data.map((row: any, idx: number) => {
              const newRow: any = { Id: idx + 1 };
              selectedMappings.forEach(m => {
                  let val = row[m.spField];
                  if (val && typeof val === 'object') {
                      if (val.Title) val = val.Title;
                      else if (val.__metadata) delete val.__metadata;
                  }
                  newRow[m.targetName] = val;
              });
              return newRow;
          });

          const newTable: Table = {
              id: crypto.randomUUID(),
              name: tableName,
              fields: fields,
              data: mappedData,
              apiConfig: {
                  url: `${siteUrl}/_api/web/lists(guid'${selectedList}')/items`,
                  method: 'GET',
                  headers: authMethod === 'token' ? JSON.stringify({ Authorization: `Bearer ${accessToken}`, Accept: 'application/json;odata=verbose' }) : JSON.stringify({ Accept: 'application/json;odata=verbose' }),
                  refreshOnLoad: false
              }
          };

          onSave(newTable);
          onClose();
      } catch (e: any) {
          setError("Import fehlgeschlagen: " + e.message);
      }
      setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center animate-in fade-in-25 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl border border-slate-300 flex flex-col h-[700px] overflow-hidden">
        
        <div className="flex justify-between items-center p-5 bg-teal-800 text-white shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
               <Share2 className="text-teal-200"/> SharePoint Import
            </h2>
            <p className="text-teal-100 text-sm mt-1">Echte Daten aus SharePoint Online Listen & Libraries.</p>
          </div>
          <button onClick={onClose} className="text-teal-200 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 bg-slate-50 p-8 overflow-y-auto">
            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-800 rounded text-sm flex items-center gap-2">
                    <AlertTriangle size={16} /> {error}
                </div>
            )}

            {step === 1 && (
                <div className="flex flex-col items-center justify-center h-full gap-6">
                    <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm text-center max-w-md w-full">
                        <div className="p-4 bg-teal-100 rounded-full text-teal-700 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <Share2 size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 mb-4">Verbindung herstellen</h3>
                        
                        <div className="text-left space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Site URL</label>
                                <div className="relative">
                                    <Globe size={14} className="absolute left-2 top-2.5 text-slate-400"/>
                                    <input 
                                        type="text" 
                                        className="w-full border p-2 pl-8 rounded text-sm" 
                                        value={siteUrl} 
                                        onChange={e => setSiteUrl(e.target.value)}
                                        placeholder="https://company.sharepoint.com/sites/team"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Authentifizierung</label>
                                <div className="flex gap-2 mb-3">
                                    <button 
                                        onClick={() => setAuthMethod('token')}
                                        className={`flex-1 py-2 px-3 text-xs rounded border transition-colors ${authMethod === 'token' ? 'bg-teal-50 border-teal-500 text-teal-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                                    >
                                        Bearer Token
                                    </button>
                                    <button 
                                        onClick={() => setAuthMethod('integrated')}
                                        className={`flex-1 py-2 px-3 text-xs rounded border transition-colors ${authMethod === 'integrated' ? 'bg-teal-50 border-teal-500 text-teal-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                                    >
                                        Integriert / Cookies
                                    </button>
                                </div>

                                {authMethod === 'token' ? (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <label className="block text-[10px] text-slate-400 uppercase mb-1 flex justify-between">
                                            <span>Access Token (OAuth)</span>
                                        </label>
                                        <div className="relative">
                                            <Key size={14} className="absolute left-2 top-2.5 text-slate-400"/>
                                            <input 
                                                type="password" 
                                                className="w-full border p-2 pl-8 rounded text-sm font-mono" 
                                                value={accessToken} 
                                                onChange={e => setAccessToken(e.target.value)}
                                                placeholder="eyJ0eXAiOiJKV1QiLC..."
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-blue-50 border border-blue-100 rounded text-xs text-blue-800 flex gap-2 animate-in fade-in slide-in-from-top-2">
                                        <Shield size={16} className="shrink-0"/>
                                        <span>
                                            Nutzt Ihre aktuelle Browser-Sitzung. Stellen Sie sicher, dass Sie im selben Browser bei SharePoint angemeldet sind. Funktioniert auch für On-Premise (NTLM/Kerberos).
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button 
                            onClick={handleConnect}
                            disabled={loading || !siteUrl || (authMethod === 'token' && !accessToken)}
                            className="bg-teal-700 hover:bg-teal-800 text-white w-full py-2 rounded mt-6 font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Verbinde...' : 'Verbinden & Listen laden'}
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-700">Wählen Sie eine Liste oder Bibliothek</h3>
                    {lists.length === 0 && <p className="text-slate-500 text-sm">Keine Listen gefunden.</p>}
                    <div className="grid grid-cols-2 gap-4">
                        {lists.map(l => (
                            <div 
                                key={l.id} 
                                onClick={() => handleSelectList(l)}
                                className="bg-white p-4 rounded border border-slate-200 hover:border-teal-500 hover:shadow-md cursor-pointer transition-all flex items-center gap-4 group"
                            >
                                <div className={`p-3 rounded-full ${l.type === 'DocumentLibrary' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {l.type === 'DocumentLibrary' ? <FileText size={24}/> : <List size={24}/>}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-700 group-hover:text-teal-700">{l.title}</div>
                                    <div className="text-xs text-slate-500">{l.itemCount} Einträge • {l.type === 'DocumentLibrary' ? 'Dokumente' : 'Liste'}</div>
                                </div>
                                <ArrowRight className="ml-auto text-slate-300 group-hover:text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" size={20}/>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-4 h-full flex flex-col">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-slate-700">Felder zuweisen</h3>
                        <input 
                            type="text" 
                            className="border rounded px-2 py-1 text-sm font-bold w-64"
                            value={tableName}
                            onChange={e => setTableName(e.target.value)}
                            placeholder="Tabellenname"
                        />
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-1 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100 text-slate-500 font-semibold border-b">
                                <tr>
                                    <th className="p-3 text-left w-10">
                                        <input type="checkbox" checked={mappings.every(m => m.selected)} onChange={e => setMappings(mappings.map(m => ({...m, selected: e.target.checked})))} />
                                    </th>
                                    <th className="p-3 text-left w-1/3">SharePoint Feld</th>
                                    <th className="p-3 text-left w-1/3">Ziel Name</th>
                                    <th className="p-3 text-left w-1/3">Ziel Typ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {mappings.map((m, idx) => (
                                    <tr key={idx} className={m.selected ? 'bg-white' : 'bg-slate-50 opacity-50'}>
                                        <td className="p-3">
                                            <input type="checkbox" checked={m.selected} onChange={e => updateMapping(idx, { selected: e.target.checked })} />
                                        </td>
                                        <td className="p-3 font-medium text-slate-700">
                                            {m.spTitle} <span className="text-[10px] text-slate-400 font-normal">({m.spType})</span>
                                        </td>
                                        <td className="p-3">
                                            <input 
                                                type="text" 
                                                className="w-full border rounded px-2 py-1"
                                                value={m.targetName}
                                                disabled={!m.selected}
                                                onChange={e => updateMapping(idx, { targetName: e.target.value })}
                                            />
                                        </td>
                                        <td className="p-3">
                                            <select 
                                                className="w-full border rounded px-2 py-1"
                                                value={m.targetType}
                                                disabled={!m.selected}
                                                onChange={e => updateMapping(idx, { targetType: e.target.value as FieldType })}
                                            >
                                                <option value="VARCHAR">Text</option>
                                                <option value="INTEGER">Zahl</option>
                                                <option value="DECIMAL">Dezimal</option>
                                                <option value="DATE">Datum</option>
                                                <option value="BOOLEAN">Ja/Nein</option>
                                                <option value="ENUM">Auswahl (Enum)</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>

        <div className="p-5 bg-white border-t border-slate-200 flex justify-between shrink-0">
            {step > 1 ? (
                <button onClick={() => setStep(prev => (prev - 1) as any)} className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-50">Zurück</button>
            ) : ( <div></div> )}

            {step === 3 && (
                <button onClick={handleFinish} disabled={loading} className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded font-bold shadow-md flex items-center gap-2">
                    {loading ? 'Importiere...' : <><Save size={18}/> Importieren & Speichern</>}
                </button>
            )}
        </div>

      </div>
    </div>
  );
};
