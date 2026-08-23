import React, { useState } from 'react';
import { Table } from '../../../types/index';
import { SecurityRlsConfig } from '../rlsTypes';
import { generatePostgreSqlRlsDdl, generateDotNetAuthorizationHandler } from '../rlsService';
import { Copy, Check, Download, FileCode, Shield } from 'lucide-react';

interface RlsPolicyCodeExportProps {
  config: SecurityRlsConfig;
  tables: Table[];
}

export const RlsPolicyCodeExport: React.FC<RlsPolicyCodeExportProps> = ({ config, tables }) => {
  const [activeTab, setActiveTab] = useState<'postgres' | 'dotnet' | 'express'>('postgres');
  const [copied, setCopied] = useState(false);

  const postgresDdl = generatePostgreSqlRlsDdl(config, tables);
  const dotNetCode = generateDotNetAuthorizationHandler(config);
  const expressCode = `// DB Studio Pro: Express.js / Node.js RBAC & RLS Middleware
import { Request, Response, NextFunction } from 'express';

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role || 'Gast';
    if (allowedRoles.includes(userRole) || userRole === 'Admin') {
      return next();
    }
    return res.status(403).json({ error: 'Forbidden', message: 'Unzureichende Berechtigungen.' });
  };
};

export const applyRowLevelSecurity = (tableName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (user?.role === 'Admin') return next(); // Admin Bypass

    // Inject tenant / owner filter to query
    req.query.owner_id = user?.id;
    next();
  };
};
`;

  const getActive = () => {
    switch (activeTab) {
      case 'postgres': return { code: postgresDdl, filename: 'rls_policies.sql', lang: 'sql' };
      case 'dotnet': return { code: dotNetCode, filename: 'RowLevelSecurityHandler.cs', lang: 'csharp' };
      case 'express': return { code: expressCode, filename: 'rlsMiddleware.ts', lang: 'typescript' };
    }
  };

  const active = getActive();

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
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('postgres')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'postgres' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            PostgreSQL RLS (SQL DDL)
          </button>
          <button
            onClick={() => setActiveTab('dotnet')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'dotnet' ? 'bg-purple-600 text-white shadow-2xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            ASP.NET Core (C#)
          </button>
          <button
            onClick={() => setActiveTab('express')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'express' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Express / Node.js (TypeScript)
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
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs transition-all"
          >
            <Download size={12} />
            <span>Download ({active.filename})</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[380px] shadow-inner">
        <pre>{active.code}</pre>
      </div>
    </div>
  );
};
