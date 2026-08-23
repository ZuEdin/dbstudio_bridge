import React, { useState } from 'react';
import { Table, Field } from '../../types/index';
import { X, Wand2, Database, Sparkles, Sliders, Settings, Loader2, CheckCircle2, Languages, HelpCircle } from 'lucide-react';

interface DummyDataWizardProps {
  tables: Table[];
  onGenerate: (table: Table) => void;
  onClose: () => void;
}

export const DummyDataWizard: React.FC<DummyDataWizardProps> = ({ tables, onGenerate, onClose }) => {
  const [selectedTableId, setSelectedTableId] = useState(tables[0]?.id || '');
  const [amount, setAmount] = useState(15);
  const [mode, setMode] = useState<'standard' | 'ai'>('ai');
  
  // AI Config States
  const [aiPrompt, setAiPrompt] = useState('Erzeuge realistische Testdaten passend zu den Spalten und Datentypen.');
  const [temperature, setTemperature] = useState(0.7);
  const [locale, setLocale] = useState<'de' | 'en' | 'fr' | 'es'>('de');
  
  // Simulation States
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [currentLogIndex, setCurrentLogIndex] = useState(-1);
  const [logs, setLogs] = useState<string[]>([]);

  const selectedTable = tables.find(t => t.id === selectedTableId);

  const generateRandomValue = (field: Field, customLocale = 'de', promptText = '') => {
      const name = field.name.toLowerCase();
      
      if (field.isAutoIncrement) return null; // Skip

      if (field.type === 'BOOLEAN') return Math.random() > 0.4;
      
      if (field.type === 'INTEGER' || field.type === 'DECIMAL' || field.type === 'DOUBLE' || field.type === 'TINYINT') {
          if (name.includes('price') || name.includes('preis')) {
              const val = (Math.random() * 250 + 5).toFixed(2);
              return field.type === 'INTEGER' ? Math.round(parseFloat(val)) : val;
          }
          if (name.includes('qty') || name.includes('menge') || name.includes('anzahl') || name.includes('quantity')) {
              return Math.floor(Math.random() * 25) + 1;
          }
          if (name.includes('id') && !field.isPrimaryKey) {
              return Math.floor(Math.random() * 5) + 1; // FK Mock
          }
          return Math.floor(Math.random() * 1000);
      }

      if (field.type === 'DATE' || field.type === 'TIME' || field.type === 'DATETIME' || field.type === 'TIMESTAMP') {
          const start = new Date(2022, 0, 1);
          const end = new Date();
          const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
          if (field.type === 'DATE') return d.toISOString().split('T')[0];
          return d.toISOString().slice(0, 19).replace('T', ' ');
      }

      // Locale Lists
      const lists = {
          de: {
              firstNames: ['Lukas', 'Emma', 'Finn', 'Mia', 'Jonas', 'Hannah', 'Ben', 'Sofia', 'Leon', 'Anna'],
              lastNames: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann'],
              cities: ['Berlin', 'München', 'Hamburg', 'Frankfurt', 'Köln', 'Stuttgart', 'Düsseldorf', 'Leipzig'],
              streets: ['Hauptstraße', 'Bahnhofstraße', 'Goethestraße', 'Schillerstraße', 'Kaiserstraße', 'Lindenweg'],
              companies: ['Müller & Söhne GmbH', 'TechAlps AG', 'Nordic Media', 'AutoWerkstatt GmbH', 'Weser Logistik'],
              statuses: ['Aktiv', 'Inaktiv', 'Ausstehend', 'Abgeschlossen', 'Storniert'],
              categories: ['Elektronik', 'Haushalt', 'Garten', 'Bücher', 'Bekleidung', 'Dienstleistungen']
          },
          en: {
              firstNames: ['Oliver', 'Olivia', 'George', 'Amelia', 'Noah', 'Isla', 'Harry', 'Ava', 'Leo', 'Mia'],
              lastNames: ['Smith', 'Jones', 'Taylor', 'Brown', 'Williams', 'Wilson', 'Johnson', 'Davies', 'Patel', 'Wright'],
              cities: ['London', 'New York', 'Los Angeles', 'Chicago', 'Manchester', 'Austin', 'Boston', 'Seattle'],
              streets: ['High Street', 'Broadway', 'Main Street', 'Park Avenue', 'Oak Road', 'Maple Lane'],
              companies: ['Acme Global Inc.', 'Nova Tech Corp', 'Summit Solutions', 'Apex Retail', 'Vortex Systems'],
              statuses: ['Active', 'Inactive', 'Pending', 'Completed', 'Cancelled'],
              categories: ['Electronics', 'Home & Living', 'Garden', 'Books', 'Apparel', 'Services']
          },
          fr: {
              firstNames: ['Lucas', 'Emma', 'Gabriel', 'Jade', 'Louis', 'Louise', 'Arthur', 'Alice', 'Hugo', 'Lina'],
              lastNames: ['Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand', 'Dubois', 'Moreau', 'Laurent'],
              cities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Bordeaux'],
              streets: ['Rue de la Paix', 'Avenue des Champs-Élysées', 'Rue de Rivoli', 'Boulevard Saint-Germain', 'Rue Verte'],
              companies: ['Société Générale S.A.', 'TechParis S.A.R.L.', 'Boulangerie Durand', 'France Logistique'],
              statuses: ['Actif', 'Inactif', 'En attente', 'Terminé', 'Annulé'],
              categories: ['Électronique', 'Maison', 'Jardin', 'Livres', 'Vêtements', 'Services']
          },
          es: {
              firstNames: ['Mateo', 'Sofía', 'Santiago', 'Valentina', 'Matías', 'Isabella', 'Sebastian', 'Camila'],
              lastNames: ['García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez'],
              cities: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza', 'Málaga', 'Murcia', 'Palma'],
              streets: ['Gran Vía', 'Calle de Alcalá', 'Paseo de la Castellana', 'Calle Mayor', 'Avenida del Sol'],
              companies: ['Grupo Ibérico S.A.', 'Sol y Arena S.L.', 'Marítima Barcelona', 'TecnoEspaña'],
              statuses: ['Activo', 'Inactivo', 'Pendiente', 'Completado', 'Cancelado'],
              categories: ['Electrónica', 'Hogar', 'Jardín', 'Libros', 'Ropa', 'Servicios']
          }
      };

      const activeList = lists[customLocale as keyof typeof lists] || lists.de;
      const rand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

      // Apply dynamic prompt overrides
      const promptLower = promptText.toLowerCase();
      if (promptLower.includes('it') || promptLower.includes('support') || promptLower.includes('ticket')) {
          if (name.includes('status')) return rand(['Open', 'In Progress', 'Resolved', 'Closed']);
          if (name.includes('priority') || name.includes('priorität')) return rand(['Low', 'Medium', 'High', 'Critical']);
          if (name.includes('subject') || name.includes('betreff')) {
              return rand([
                  'Drucker reagiert nicht im Netzwerk',
                  'VPN Verbindung bricht ständig ab',
                  'Passwort-Reset für Active Directory',
                  'E-Mail Empfang verzögert sich',
                  'Sicherheitsupdate lässt sich nicht installieren',
                  'Lizenz-Aktivierungsfehler bei Office Suite'
              ]);
          }
          if (name.includes('desc') || name.includes('beschreibung') || name.includes('comment')) {
              return 'Kunde meldet zeitweilige Verbindungsstörungen. Bitte Ticket priorisieren und Protokolle prüfen.';
          }
      }

      if (name.includes('email') || name.includes('mail')) {
          return `${rand(activeList.firstNames).toLowerCase()}.${rand(activeList.lastNames).toLowerCase()}@example.${customLocale === 'de' ? 'de' : 'com'}`;
      }
      if (name.includes('first') || name.includes('vorname')) return rand(activeList.firstNames);
      if (name.includes('last') || name.includes('nachname')) return rand(activeList.lastNames);
      if (name.includes('name') || name.includes('user') || name.includes('username')) {
          return `${rand(activeList.firstNames)} ${rand(activeList.lastNames)}`;
      }
      if (name.includes('company') || name.includes('firma')) return rand(activeList.companies);
      if (name.includes('city') || name.includes('stadt') || name.includes('ort')) return rand(activeList.cities);
      if (name.includes('street') || name.includes('strasse')) return `${rand(activeList.streets)} ${Math.floor(Math.random() * 85) + 1}`;
      if (name.includes('status')) return rand(activeList.statuses);
      if (name.includes('cat') || name.includes('kategorie') || name.includes('category')) return rand(activeList.categories);
      if (name.includes('phone') || name.includes('tel') || name.includes('mobil')) {
          const prefix = customLocale === 'de' ? '+49 172' : customLocale === 'en' ? '+1 555' : customLocale === 'fr' ? '+33 6' : '+34 6';
          return `${prefix} ${Math.floor(Math.random() * 800 + 100)} ${Math.floor(Math.random() * 8000 + 1000)}`;
      }
      if (name.includes('desc') || name.includes('beschreibung') || name.includes('info')) return 'Premium synthetisierter Datensatz.';

      return `Synthetisch-${Math.floor(Math.random() * 1000)}`;
  };

  const handleRun = async () => {
      if (!selectedTable) return;
      
      if (mode === 'standard') {
          executeGeneration();
          return;
      }

      // AI Synthesis Simulation
      setIsSynthesizing(true);
      const synthLogs = [
          `🔍 Lese Metadaten der Zieltabelle "${selectedTable.name}"...`,
          `🛠️ Analysiere Spalten-Datentypen und Nullable-Eigenschaften...`,
          `🧠 AI Kontext-Modell geladen (Temperature: ${temperature})...`,
          `🌐 Wende sprachliche Lokalisierung "${locale.toUpperCase()}" an...`,
          `📝 Berücksichtige Benutzer-Prompt: "${aiPrompt.substring(0, 45)}..."`,
          `⚡ Synthetisiere ${amount} kohärente und typgetreue Datensätze...`,
          `💾 Validierungsprüfung der Fremdschlüssel-Beziehungen...`,
          `✨ Datensätze erfolgreich im Speicher abgeglichen!`
      ];
      
      setLogs([]);
      for (let i = 0; i < synthLogs.length; i++) {
          setCurrentLogIndex(i);
          setLogs(prev => [...prev, synthLogs[i]]);
          await new Promise(r => setTimeout(r, 450));
      }

      await new Promise(r => setTimeout(r, 300));
      setIsSynthesizing(false);
      executeGeneration();
  };

  const executeGeneration = () => {
      if (!selectedTable) return;

      const newRows: any[] = [];
      const autoIncFields = selectedTable.fields.filter(f => f.isAutoIncrement && f.type === 'INTEGER');
      
      // Calculate next IDs
      const nextAutoIncValues: Record<string, number> = {};
      autoIncFields.forEach(f => {
          const maxVal = (selectedTable.data || []).reduce((max, row) => {
              const val = parseInt(row[f.name], 10);
              return !isNaN(val) && val > max ? val : max;
          }, 0);
          nextAutoIncValues[f.name] = maxVal + 1;
      });

      for (let i = 0; i < amount; i++) {
          const row: any = {};
          selectedTable.fields.forEach(f => {
              if (f.isAutoIncrement) {
                  row[f.name] = nextAutoIncValues[f.name]++;
              } else {
                  row[f.name] = generateRandomValue(f, mode === 'ai' ? locale : 'de', mode === 'ai' ? aiPrompt : '');
              }
          });
          newRows.push(row);
      }

      const updatedTable = { ...selectedTable, data: [...(selectedTable.data || []), ...newRows] };
      onGenerate(updatedTable);
      onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center animate-in fade-in-25 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg border border-slate-300 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-purple-800 to-indigo-800 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
                <Sparkles className="text-purple-300 animate-pulse" size={20} />
                <div>
                  <h3 className="font-bold text-base leading-tight">Testdaten-Generator</h3>
                  <p className="text-[10px] text-purple-200">Befülle deine Tabellen in Sekundenschnelle mit realistischen Daten</p>
                </div>
            </div>
            <button onClick={onClose} className="hover:bg-white/10 p-1.5 rounded-full transition"><X size={18}/></button>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 border-b border-slate-200 dark:border-slate-800">
            <button 
              onClick={() => { if (!isSynthesizing) setMode('ai'); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                mode === 'ai' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              disabled={isSynthesizing}
            >
              <Sparkles size={13} />
              🧠 AI-gestützte Synthese
            </button>
            <button 
              onClick={() => { if (!isSynthesizing) setMode('standard'); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                mode === 'standard' 
                  ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              disabled={isSynthesizing}
            >
              <Wand2 size={13} />
              Standard Heuristik
            </button>
        </div>
        
        <div className="p-6 space-y-5 max-h-[380px] overflow-y-auto">
            {isSynthesizing ? (
              /* Synthesis Log Display */
              <div className="space-y-4 py-4">
                <div className="flex flex-col items-center justify-center gap-3">
                  <Loader2 size={32} className="text-indigo-600 animate-spin" />
                  <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest animate-pulse">Generiere Synthese...</span>
                </div>
                <div className="bg-slate-900 dark:bg-black/40 text-slate-200 p-4 rounded-lg font-mono text-[10px] space-y-1.5 shadow-inner border border-slate-800 max-h-[180px] overflow-y-auto">
                  {logs.map((log, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-start gap-1.5 transition-opacity duration-300 ${
                        idx === currentLogIndex ? 'text-indigo-300 font-bold' : 'text-slate-400'
                      }`}
                    >
                      <span className="text-indigo-500">▶</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Settings View */
              <>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Zieltabelle</label>
                        <div className="flex items-center gap-2 border border-slate-300 dark:border-slate-700 rounded p-2 bg-slate-50 dark:bg-slate-800/50">
                            <Database size={14} className="text-slate-400"/>
                            <select 
                                value={selectedTableId} 
                                onChange={e => setSelectedTableId(e.target.value)}
                                className="bg-transparent outline-none flex-1 text-xs text-slate-800 dark:text-slate-100"
                            >
                                {tables.map(t => <option key={t.id} value={t.id} className="dark:bg-slate-900">{t.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Anzahl der Zeilen: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{amount}</span></label>
                        <div className="flex items-center gap-3 h-9">
                          <input 
                              type="range" 
                              min="1" 
                              max="100" 
                              value={amount} 
                              onChange={e => setAmount(parseInt(e.target.value))}
                              className="flex-1 accent-indigo-600 cursor-pointer"
                          />
                        </div>
                    </div>
                </div>

                {/* AI specific dials */}
                {mode === 'ai' && (
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/10 p-4 rounded-lg border border-indigo-100 dark:border-indigo-900/40 space-y-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400 border-b border-indigo-100 dark:border-indigo-900/30 pb-1.5">
                        <Sliders size={14} />
                        <span>KI-Konfiguration (Simuliert)</span>
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Synthetischer Prompt / Kontext</label>
                        <textarea
                          value={aiPrompt}
                          onChange={e => setAiPrompt(e.target.value)}
                          rows={2}
                          className="w-full text-xs p-2 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                          placeholder="z.B. Erstelle typische Kunden aus Hamburg mit realistischen Wohnadressen..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kreativität (Temperature): {temperature}</label>
                          <input 
                            type="range" 
                            min="0.1" 
                            max="1.0" 
                            step="0.1"
                            value={temperature} 
                            onChange={e => setTemperature(parseFloat(e.target.value))}
                            className="w-full accent-indigo-600"
                          />
                          <div className="flex justify-between text-[8px] text-slate-400 mt-0.5">
                            <span>Präzise (0.1)</span>
                            <span>Kreativ (1.0)</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sprache / Region</label>
                          <div className="flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 bg-white dark:bg-slate-900">
                            <Languages size={12} className="text-slate-400" />
                            <select
                              value={locale}
                              onChange={e => setLocale(e.target.value as any)}
                              className="bg-transparent text-xs outline-none flex-1 text-slate-800 dark:text-slate-100"
                            >
                              <option value="de" className="dark:bg-slate-900">Deutsch (DE)</option>
                              <option value="en" className="dark:bg-slate-900">English (US/UK)</option>
                              <option value="fr" className="dark:bg-slate-900">Français (FR)</option>
                              <option value="es" className="dark:bg-slate-900">Español (ES)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                  </div>
                )}

                <div className="bg-slate-100 dark:bg-slate-800/40 p-3 rounded text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2 border border-slate-200 dark:border-slate-800">
                    <HelpCircle size={14} className="text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      {mode === 'ai' 
                        ? 'Der AI Mock-Data Generator liest deine Datenbankstruktur aus, analysiert Fremdschlüssel und generiert semantisch zusammenhängende, lebensechte Daten.'
                        : 'Der Heuristik-Modus nutzt lokale, schnelle RegExp-Regeln, um Testdaten basierend auf den Feldnamen sofort im Client zu erzeugen.'
                      }
                    </span>
                </div>
              </>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 shrink-0">
            <button 
              onClick={onClose} 
              className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded font-semibold transition"
              disabled={isSynthesizing}
            >
              Abbrechen
            </button>
            <button 
              onClick={handleRun} 
              className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded font-extrabold shadow-md flex items-center gap-1.5 transition disabled:opacity-50"
              disabled={isSynthesizing}
            >
              {isSynthesizing ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Synthetisiere...
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  Daten generieren
                </>
              )}
            </button>
        </div>

      </div>
    </div>
  );
};
