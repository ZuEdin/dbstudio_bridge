import React, { useState } from 'react';
import { GeneratedMigrations } from '../schemaDiffTypes';
import { Copy, Check, Download, FileCode, Layers, Database, ShieldCheck } from 'lucide-react';

interface MigrationCodeViewerProps {
  migrations: GeneratedMigrations;
  dbType: string;
}

type TabType = 
  | 'sql_up' 
  | 'sql_down' 
  | 'flyway' 
  | 'liquibase_xml' 
  | 'liquibase_yaml' 
  | 'liquibase_sql'
  | 'prisma'
  | 'ef_core'
  | 'drizzle'
  | 'knex';

export const MigrationCodeViewer: React.FC<MigrationCodeViewerProps> = ({ migrations, dbType }) => {
  const [subTab, setSubTab] = useState<TabType>('sql_up');
  const [copied, setCopied] = useState(false);

  const getActiveCode = () => {
    switch (subTab) {
      case 'sql_up': return { code: migrations.sqlUp, lang: 'sql', filename: `migration_up_${dbType.toLowerCase()}.sql` };
      case 'sql_down': return { code: migrations.sqlDown, lang: 'sql', filename: `migration_down_${dbType.toLowerCase()}.sql` };
      case 'flyway': return { code: migrations.flywayUpScript, lang: 'sql', filename: migrations.flywayUpFilename };
      case 'liquibase_xml': return { code: migrations.liquibaseXml, lang: 'xml', filename: 'changelog.xml' };
      case 'liquibase_yaml': return { code: migrations.liquibaseYaml, lang: 'yaml', filename: 'changelog.yaml' };
      case 'liquibase_sql': return { code: migrations.liquibaseSql, lang: 'sql', filename: 'changelog.sql' };
      case 'prisma': return { code: migrations.prismaMigrationSql, lang: 'sql', filename: 'migration.sql' };
      case 'ef_core': return { code: migrations.efCoreUpCSharp, lang: 'csharp', filename: '20260821_SchemaMigration.cs' };
      case 'drizzle': return { code: migrations.drizzleTsUp, lang: 'typescript', filename: '0001_schema_migration.ts' };
      case 'knex': return { code: migrations.knexJsUp, lang: 'javascript', filename: '20260821_schema_migration.js' };
    }
  };

  const active = getActiveCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(active.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([active.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = active.filename;
    link.click();
  };

  return (
    <div className="space-y-3">
      {/* SQLite Alert if 3-Step Rebuild is active */}
      {migrations.sqliteRebuildApplied && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2">
          <Database size={15} className="shrink-0 text-amber-400" />
          <span>
            <strong>SQLite Rebuild-Engine aktiv:</strong> Die Änderungen enthalten Spaltenlöschungen oder Typ-Modifikationen. Es wurde ein atomarer 3-Schritt Rebuild-Code (`_temp` Tabelle ➔ Daten kopieren ➔ Drop &amp; Rename) generiert.
          </span>
        </div>
      )}

      {/* Sub tabs Categories */}
      <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Category: Native & Enterprise Migrations */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">SQL / Tools:</span>
            <button
              onClick={() => setSubTab('sql_up')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                subTab === 'sql_up' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              SQL Up (DDL)
            </button>
            <button
              onClick={() => setSubTab('sql_down')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                subTab === 'sql_down' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              SQL Down (Rollback)
            </button>
            <button
              onClick={() => setSubTab('flyway')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                subTab === 'flyway' ? 'bg-orange-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Flyway (V002)
            </button>
            <button
              onClick={() => setSubTab('liquibase_xml')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                subTab === 'liquibase_xml' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Liquibase XML
            </button>
            <button
              onClick={() => setSubTab('liquibase_yaml')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                subTab === 'liquibase_yaml' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Liquibase YAML
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs transition-all"
            >
              {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              <span>{copied ? 'Kopiert!' : 'Kopieren'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs transition-all"
            >
              <Download size={12} />
              <span>{active.filename}</span>
            </button>
          </div>
        </div>

        {/* Category: ORM Specific Migrations */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto text-xs pt-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">ORM / Code:</span>
          <button
            onClick={() => setSubTab('ef_core')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              subTab === 'ef_core' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            EF Core (.NET 10 C#)
          </button>
          <button
            onClick={() => setSubTab('prisma')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              subTab === 'prisma' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Prisma Migrate
          </button>
          <button
            onClick={() => setSubTab('drizzle')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              subTab === 'drizzle' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Drizzle (TypeScript)
          </button>
          <button
            onClick={() => setSubTab('knex')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              subTab === 'knex' ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Knex.js (Node.js)
          </button>
        </div>
      </div>

      {/* Code Display */}
      <div className="relative">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[340px] shadow-inner">
          <pre>{active.code}</pre>
        </div>
        <div className="absolute right-3 top-3 bg-slate-900/80 px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 border border-slate-700/60">
          {active.filename}
        </div>
      </div>
    </div>
  );
};
