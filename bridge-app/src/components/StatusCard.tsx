import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, LucideIcon, Copy, Check } from 'lucide-react';

interface StatusCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  isReady: boolean;
  version?: string;
  path?: string;
  badge?: string;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  isReady,
  version,
  path,
  badge
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyPath = () => {
    if (path) {
      navigator.clipboard.writeText(path);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`rounded-2xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden transition-all duration-300 border ${
      isReady 
        ? 'bg-[#10192A]/80 backdrop-blur-md border-slate-800/80 hover:border-emerald-500/40 hover:shadow-emerald-950/20' 
        : 'bg-[#151722]/80 backdrop-blur-md border-slate-800/80 hover:border-amber-500/40'
    }`}>
      {/* Top Header */}
      <div className="flex items-start justify-between mb-3.5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${
            isReady 
              ? 'bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-teal-500/5 border-emerald-500/30 text-emerald-400 glow-emerald' 
              : 'bg-gradient-to-br from-amber-500/20 to-amber-600/5 border-amber-500/30 text-amber-400 glow-amber'
          }`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              {title}
              {badge && (
                <span className="text-[10px] font-mono bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                  {badge}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
        </div>

        {isReady ? (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Bereit
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            Offen
          </span>
        )}
      </div>

      {/* Details Box */}
      <div className="bg-[#0A0F1A]/90 rounded-xl p-3 border border-slate-800/80 font-mono text-xs text-slate-300 space-y-2 shadow-inner">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-500">Version:</span>
          <span className="text-emerald-400 font-bold tracking-tight bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {version || 'N/A'}
          </span>
        </div>
        {path && (
          <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-slate-800/60">
            <span className="text-slate-500 shrink-0 mr-2">Pfad:</span>
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-slate-400 truncate text-[10px]" title={path}>{path}</span>
              <button 
                onClick={handleCopyPath}
                className="text-slate-500 hover:text-slate-200 transition-colors shrink-0 p-0.5 rounded"
                title="Pfad kopieren"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
