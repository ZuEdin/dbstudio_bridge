import React, { useState } from 'react';
import { Table } from '../../../../types/index';
import { FileText, Copy, Check } from 'lucide-react';
import { generateMigrationScripts } from '../utils/codeGenerators';

interface SchemaMigrationsTabProps {
  tables: Table[];
  selectedTables: Record<string, boolean>;
  relationships?: any[];
  queries?: any[];
  selectedQueries?: Record<string, boolean>;
  migrationDialect: 'sql' | 'drizzle' | 'knex' | 'prisma';
  setMigrationDialect: (val: 'sql' | 'drizzle' | 'knex' | 'prisma') => void;
  showMessage: (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
}

export const SchemaMigrationsTab: React.FC<SchemaMigrationsTabProps> = ({
  tables,
  selectedTables,
  migrationDialect,
  setMigrationDialect,
  showMessage,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const code = generateMigrationScripts(migrationDialect, tables, selectedTables);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    showMessage("Kopiert", "Migrations-Code wurde in die Zwischenablage kopiert.", "success");
  };

  return (
    <div id="schema_migrations_tab_container" className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/80 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700/60 pb-5">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="text-indigo-400" size={20} />
              <span>Punkt 2: Automatische DB Schema Migrationen & DDL Export</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Generieren Sie sofort ausführbare SQL DDL Migrationsdateien und ORM-Schemas für Ihre Produktiv-Datenbanken.</p>
          </div>

          {/* Dialect Selector */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-700 shrink-0 font-mono text-xs">
            {(['sql', 'drizzle', 'knex', 'prisma'] as const).map(d => (
              <button
                key={d}
                onClick={() => setMigrationDialect(d)}
                className={`px-3 py-1.5 rounded-lg transition-all uppercase ${migrationDialect === d ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {d === 'sql' ? 'Raw SQL' : d}
              </button>
            ))}
          </div>
        </div>

        {/* Code Box */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs relative overflow-hidden">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800 text-slate-400">
            <span className="text-indigo-400 font-bold">
              📄 {migrationDialect === 'sql' ? '001_initial_schema.sql' : migrationDialect === 'drizzle' ? 'schema.ts' : migrationDialect === 'knex' ? 'migration.js' : 'schema.prisma'}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition-colors cursor-pointer"
            >
              {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copiedCode ? 'Kopiert!' : 'Code Kopieren'}</span>
            </button>
          </div>

          <pre className="text-slate-300 overflow-x-auto p-2 leading-relaxed max-h-96">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
