import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Lock, Code2, RefreshCw, FileSpreadsheet, ShieldCheck, Sparkles } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  tag: string;
}

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      question: 'Gehört der generierte Quellcode wirklich zu 100% mir?',
      answer: 'Ja, uneingeschränkt! DB Studio Pro bindet Sie an keinen proprietären Cloud-Dienst oder Laufzeit-Abo. Wenn Sie den Code exportieren (React, Angular, .NET C#, PHP, Node.js), erhalten Sie sauberen, standardisierten Quellcode, den Sie frei hosten, anpassen, verkaufen oder in Ihre eigene CI/CD-Pipeline einbinden können.',
      tag: 'Lizenz & Eigentum'
    },
    {
      question: 'Wie funktioniert die Offline-First Synchronisation (Tauri + Remote Backend)?',
      answer: 'Die generierte Client-Anwendung (z. B. Desktop mit Tauri oder Web-App) speichert alle Daten lokal in SQLite oder IndexedDB. Bei aktiver Internetverbindung synchronisiert ein robuster Push/Pull-Mechanismus nur die geänderten Datensätze (Deltas anhand von _updated_at, _is_deleted und _client_id) gegen den generierten SyncController.cs (.NET) oder SyncController.php (PHP). So können Benutzer auch im Funkloch ohne Latenz weiterarbeiten.',
      tag: 'Architektur'
    },
    {
      question: 'Kann ich bestehende Excel-Tabellen und Datenbanken importieren?',
      answer: 'Ja! Der erweiterte Excel-Import analysiert Arbeitsmappen mit mehreren Blättern, erkennt automatisch ENUM-Auswahllisten bei wiederkehrenden Werten und schlägt intelligente SVERWEIS-Verknüpfungen (1:n Beziehungen) zu bestehenden Tabellen vor. Zudem können Sie bestehende SQL-Dumps (MySQL, PostgreSQL, SQLite) direkt einlesen.',
      tag: 'Import & Migration'
    },
    {
      question: 'Welche Frontend- und Backend-Frameworks werden unterstützt?',
      answer: 'Sie haben maximale Freiheit: Im Frontend wählen Sie zwischen React 18+ (mit Vite & Tailwind) oder modernem Angular 19+ (Standalone Components, Signals & Reactive Forms). Im Backend generiert das System wahlweise .NET 8/9 C# (Entity Framework Core Web API), PHP (natives PDO oder Laravel Eloquent), Node.js (Express & TypeScript) oder Python (FastAPI).',
      tag: 'Tech-Stack'
    },
    {
      question: 'Wo werden meine Entwürfe und Daten während der Arbeit gespeichert?',
      answer: 'DB Studio Pro arbeitet strikt nach dem Local-First-Prinzip. Alle Tabellenstrukturen, Beziehungen, Formulardesigns und Testdaten verbleiben verschlüsselt in der IndexedDB Ihres Browsers. Es findet kein unbefugter Datenabfluss auf externe Cloud-Server statt – DSGVO-Konformität by Design.',
      tag: 'Datenschutz'
    },
    {
      question: 'Wie unterscheidet sich DB Studio Pro von klassischen No-Code Tools wie Airtable oder Retool?',
      answer: 'Klassische No-Code-Plattformen verlangen hohe monatliche Lizenzgebühren pro Benutzer und behalten den Quellcode unter Verschluss. Sobald Sie die Plattform verlassen, ist Ihre App verloren. DB Studio Pro kombiniert die visuelle Entwicklungsgeschwindigkeit von No-Code mit der uneingeschränkten Freiheit von echter professioneller Softwareentwicklung.',
      tag: 'Vergleich'
    }
  ];

  return (
    <div className="bg-slate-50 py-20 px-6 border-b border-slate-200" id="faq-section">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full text-xs font-bold mb-3">
            <HelpCircle size={13} />
            <span>Häufige Fragen &amp; Antworten</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Wissenswertes zu DB Studio Pro
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            Transparente Antworten zu Architektur, Lizenzen, Code-Generierung und Datenschutz.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider">
                      {faq.tag}
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {faq.question}
                    </span>
                  </div>
                  <div className="text-slate-400">
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs md:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Security & Privacy Banner */}
        <div className="mt-12 bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 justify-between border border-slate-800 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl shrink-0 mt-1">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">
                100% Local-First &amp; DSGVO-konform
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                Alle Ihre Schemata, Formulardefinitionen und Datensätze verbleiben in der lokalen <strong>IndexedDB-Datenbank</strong> Ihres Browsers. Kein Zwang zu Drittanbieter-Clouds.
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              ✓ Lokale Daten-Hoheit
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
