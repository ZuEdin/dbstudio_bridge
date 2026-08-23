import React from 'react';
import { Sparkles, Zap, Play, Check, ArrowRight } from 'lucide-react';

export const AiAndAutomationSection: React.FC = () => {
  return (
    <div className="bg-white py-16 px-6 border-b border-slate-200" id="ai-automation-section">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* AI Schema Copilot */}
          <div className="space-y-6" id="ai-copilot-block">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-amber-50 text-amber-800 rounded text-xs font-bold uppercase tracking-wider">
              <Sparkles size={12} className="text-amber-500" />
              <span>KI-Schema-Assistent</span>
            </div>
            
            <h3 className="text-2xl font-bold text-slate-900 leading-tight">
              Entwerfen Sie Datenbanken durch einfache Konversation
            </h3>
            
            <p className="text-slate-600 text-sm leading-relaxed">
              Sie müssen kein erfahrener Datenbank-Administrator sein, um saubere relationale Modelle zu entwerfen. Unser integrierter KI-Schema-Assistent übernimmt die schwere Arbeit für Sie:
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-amber-100 text-amber-700 p-1 rounded-full">
                  <Check size={12} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Prompt-to-Database</h4>
                  <p className="text-xs text-slate-500">Geben Sie Wünsche wie „Ich brauche Tabellen für ein Ticketsystem inklusive Prioritäten und Benutzern“ ein, und die KI generiert die fertigen Relationen.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-amber-100 text-amber-700 p-1 rounded-full">
                  <Check size={12} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Intelligentes Feld-Mapping</h4>
                  <p className="text-xs text-slate-500">Die KI wählt automatisch die passenden Datentypen (INT, VARCHAR, TIMESTAMP) und setzt Primär- sowie Fremdschlüssel.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 bg-amber-100 text-amber-700 p-1 rounded-full">
                  <Check size={12} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Automatischer Daten-Seed</h4>
                  <p className="text-xs text-slate-500">Generieren Sie auf Wunsch sofort realistische Testdatensätze, um Ihre Formulare und Berichte direkt auszuprobieren.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Macro Engine */}
          <div className="space-y-6" id="macro-engine-block">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-blue-50 text-blue-800 rounded text-xs font-bold uppercase tracking-wider">
              <Zap size={12} className="text-blue-500" />
              <span>Visueller Makro-Editor</span>
            </div>
            
            <h3 className="text-2xl font-bold text-slate-900 leading-tight">
              Automatisieren Sie Workflows ohne Programmiercode
            </h3>
            
            <p className="text-slate-600 text-sm leading-relaxed">
              Die Macro Engine ist das Gehirn Ihrer Anwendung. Modellieren Sie logische Abläufe und Event-Trigger in einer grafischen Oberfläche:
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-blue-100 text-blue-700 p-1 rounded-full">
                  <Check size={12} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Schritt-für-Schritt Automatisierung</h4>
                  <p className="text-xs text-slate-500">Erstellen Sie Makros mit Aktionen wie „Daten filtern“, „PDF generieren“, „E-Mail senden“ oder „Als Excel-Datei exportieren“.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 bg-blue-100 text-blue-700 p-1 rounded-full">
                  <Check size={12} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Formel- & Berechnungs-Engine</h4>
                  <p className="text-xs text-slate-500">Nutzen Sie mächtige Excel-ähnliche Formeln zur Datenmanipulation und automatischen Feldaktualisierung.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 bg-blue-100 text-blue-700 p-1 rounded-full">
                  <Check size={12} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Event-Trigger</h4>
                  <p className="text-xs text-slate-500">Führen Sie Makros bei Klick aus oder binden Sie sie an Datenbank-Events wie das Erstellen oder Ändern von Datensätzen.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
