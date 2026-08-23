import React, { useState } from 'react';
import { Key, Database, Users, AlertTriangle, Check, Eye } from 'lucide-react';
import { Table } from '../../../types/index';

interface ScriptGeneratorTabProps {
  businessTables: Table[];
  roles: any[];
  getPerm: (roleId: any, objectType: string, objectId: string) => any;
}

export const ScriptGeneratorTab: React.FC<ScriptGeneratorTabProps> = ({
  businessTables,
  roles,
  getPerm,
}) => {
  const [rlsFormat, setRlsFormat] = useState<'postgresql' | 'express'>('postgresql');
  const [copiedScript, setCopiedScript] = useState(false);

  const generateScript = () => {
    if (rlsFormat === 'postgresql') {
      let sql = `-- PostgreSQL Row-Level Security (RLS) Policy Script\n`;
      sql += `-- Generiert basierend auf der aktuellen Rechte-Matrix\n\n`;

      businessTables.forEach((t) => {
        sql += `-- -----------------------------------------------------\n`;
        sql += `-- Table: ${t.name}\n`;
        sql += `-- -----------------------------------------------------\n`;
        sql += `ALTER TABLE "${t.name}" ENABLE ROW LEVEL SECURITY;\n\n`;

        const readRoles = roles
          .filter((r: any) => getPerm(r.Id, 'Table', t.id).CanRead)
          .map((r: any) => `'${r.Name}'`);
        const writeRoles = roles
          .filter((r: any) => getPerm(r.Id, 'Table', t.id).CanWrite)
          .map((r: any) => `'${r.Name}'`);
        const deleteRoles = roles
          .filter((r: any) => getPerm(r.Id, 'Table', t.id).CanDelete)
          .map((r: any) => `'${r.Name}'`);

        if (readRoles.length > 0) {
          sql += `CREATE POLICY "${t.name}_select_policy" ON "${t.name}"\n`;
          sql += `    FOR SELECT USING (current_setting('app.current_user_role', true) IN (${readRoles.join(', ')}));\n\n`;
        }
        if (writeRoles.length > 0) {
          sql += `CREATE POLICY "${t.name}_insert_update_policy" ON "${t.name}"\n`;
          sql += `    FOR ALL USING (current_setting('app.current_user_role', true) IN (${writeRoles.join(', ')}));\n\n`;
        }
        if (deleteRoles.length > 0) {
          sql += `CREATE POLICY "${t.name}_delete_policy" ON "${t.name}"\n`;
          sql += `    FOR DELETE USING (current_setting('app.current_user_role', true) IN (${deleteRoles.join(', ')}));\n\n`;
        }
      });
      return sql;
    } else {
      const matrixBody = businessTables
        .map((t) => {
          const roleRules = roles
            .map((r: any) => {
              const perm = getPerm(r.Id, 'Table', t.id);
              return `        '${r.Name}': { read: ${!!perm.CanRead}, write: ${!!perm.CanWrite}, delete: ${!!perm.CanDelete} }`;
            })
            .join(',\n');
          return `    '${t.name}': {\n${roleRules}\n    }`;
        })
        .join(',\n');

      return `/**\n * Express.js RBAC Middleware & Guard\n * Generiert basierend auf der aktuellen Rechte-Matrix\n */\n\nimport { Request, Response, NextFunction } from 'express';\n\nexport interface AuthenticatedRequest extends Request {\n    user?: {\n        id: string;\n        role: string;\n    };\n}\n\nconst permissionsMatrix: Record<string, Record<string, { read: boolean; write: boolean; delete: boolean }>> = {\n${matrixBody}\n};\n\nexport function authorize(resource: string, action: 'read' | 'write' | 'delete') {\n    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {\n        const userRole = req.user?.role || 'Guest';\n        const resourceRules = permissionsMatrix[resource];\n        if (!resourceRules) return next();\n        \n        const roleRule = resourceRules[userRole];\n        if (!roleRule) {\n            return res.status(403).json({ error: 'Forbidden', message: 'Zugriff verweigert für Rolle: ' + userRole });\n        }\n        \n        const isAllowed = roleRule[action];\n        if (!isAllowed) {\n            return res.status(403).json({ error: 'Forbidden', message: \`Unzureichende Rechte für die Aktion: \${action} auf \${resource}\` });\n        }\n        next();\n    };\n}`;
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateScript());
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-slate-50 overflow-hidden">
      {/* Controls */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Key size={16} className="text-emerald-500" /> Skript-Typ auswählen
          </h3>
          <p className="text-xs text-slate-500">
            Generieren Sie SQL RLS Skripte für Ihre relationale Datenbank oder Code-Schnittstellen für Ihr Express/NestJS Backend.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div
              onClick={() => setRlsFormat('postgresql')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                rlsFormat === 'postgresql'
                  ? 'border-emerald-500 bg-emerald-50/20'
                  : 'border-slate-100 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Database size={16} className="text-emerald-600" />
                <span className="text-xs font-bold text-slate-800">
                  PostgreSQL RLS (Row-Level Security)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Erzeugt native DDL-Skripte für PostgreSQL. Aktiviert RLS auf den Tabellen und schützt Zeilen basierend auf den JWT-Rollen.
              </p>
            </div>

            <div
              onClick={() => setRlsFormat('express')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                rlsFormat === 'express'
                  ? 'border-emerald-500 bg-emerald-50/20'
                  : 'border-slate-100 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Users size={16} className="text-emerald-600" />
                <span className="text-xs font-bold text-slate-800">
                  Express/NestJS Middleware Guard
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Erzeugt Node.js Route-Middlewares, die eingehende HTTP-Requests anhand der aktuellen Rollen-Konfiguration filtern.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-amber-500" /> Best Practices für Produktiv-Systeme
          </h4>
          <ul className="text-[11px] text-slate-600 space-y-2 list-disc pl-4 leading-relaxed">
            <li>
              <strong>Prinzip des geringsten Privilegs:</strong> Geben Sie Rollen standardmäßig nur Lesezugriff und schalten Sie Schreibrechte explizit frei.
            </li>
            <li>
              <strong>Sichere Fallbacks:</strong> Wenn ein Benutzer keine zugewiesene Rolle besitzt, sollte der Zugriff verweigert werden (Fail Closed).
            </li>
            <li>
              <strong>Audit Logs:</strong> Protokollieren Sie sicherheitsrelevante Aktionen und unautorisierte Zugriffsversuche in einer separaten Tabelle.
            </li>
          </ul>
        </div>
      </div>

      {/* Script Output Panel */}
      <div className="w-full md:w-[500px] bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col overflow-hidden text-slate-300">
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center shrink-0">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 font-mono">
            <Check size={14} className="text-emerald-500" /> Generierter Code
          </span>
          <button
            onClick={copyToClipboard}
            className="text-xs flex items-center gap-1 hover:text-white text-slate-400 font-semibold"
          >
            {copiedScript ? <Check size={14} className="text-emerald-400" /> : <Eye size={14} />}{' '}
            <span>{copiedScript ? 'Kopiert!' : 'Kopieren'}</span>
          </button>
        </div>
        <div className="flex-grow p-4 overflow-y-auto font-mono text-[11px] leading-relaxed select-all bg-slate-950">
          <pre className="whitespace-pre">{generateScript()}</pre>
        </div>
      </div>
    </div>
  );
};
