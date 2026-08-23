import React from 'react';
import { User, Lock, Mail, LogIn, ArrowRight } from 'lucide-react';

interface TeamCloudAuthProps {
  isAdConfigured: boolean;
  onCheckAdSession: () => void;
  isRegistering: boolean;
  setIsRegistering: (val: boolean) => void;
  loginEmail: string;
  setLoginEmail: (val: string) => void;
  loginPassword: string;
  setLoginPassword: (val: string) => void;
  loginName: string;
  setLoginName: (val: string) => void;
  loginError: string;
  loginSubmitting: boolean;
  onLoginSubmit: () => void;
}

export const TeamCloudAuth: React.FC<TeamCloudAuthProps> = ({
  isAdConfigured,
  onCheckAdSession,
  isRegistering,
  setIsRegistering,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  loginName,
  setLoginName,
  loginError,
  loginSubmitting,
  onLoginSubmit
}) => {
  return (
    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4 animate-in fade-in">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 text-slate-800">
          <LogIn className="text-blue-600" size={18} />
          <h3 className="font-bold text-sm">
            {isRegistering ? 'Neues Konto erstellen' : 'Anmelden'}
          </h3>
        </div>
      </div>

      <div className="space-y-3">
        {isRegistering && (
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Name</label>
            <div className="relative">
              <User size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input 
                type="text"
                className="w-full border border-slate-300 rounded pl-8 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none font-medium text-slate-800 bg-white"
                placeholder="Ihr Name"
                value={loginName}
                onChange={e => setLoginName(e.target.value)}
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">E-Mail / Benutzername</label>
          <div className="relative">
            <Mail size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input 
              type="text"
              className="w-full border border-slate-300 rounded pl-8 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none font-medium text-slate-800 bg-white"
              placeholder="benutzer@firma.de"
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Passwort</label>
          <div className="relative">
            <Lock size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input 
              type="password"
              className="w-full border border-slate-300 rounded pl-8 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none font-medium text-slate-800 bg-white"
              placeholder="••••••••"
              value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onLoginSubmit()}
            />
          </div>
        </div>

        {loginError && (
          <p className="text-[11px] text-red-500 font-semibold bg-red-50 p-2 rounded border border-red-200">{loginError}</p>
        )}

        <button 
          onClick={onLoginSubmit}
          disabled={loginSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {loginSubmitting ? 'Verarbeitung...' : (isRegistering ? 'Konto erstellen' : 'Anmelden')}
          {!loginSubmitting && <ArrowRight size={14} />}
        </button>

        <div className="pt-1 flex items-center justify-between text-[11px]">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-blue-600 hover:underline font-medium cursor-pointer"
          >
            {isRegistering ? 'Bereits ein Konto? Anmelden' : 'Kein Konto? Registrieren'}
          </button>

          {isAdConfigured && (
            <button
              onClick={onCheckAdSession}
              className="text-slate-500 hover:text-slate-700 underline text-[10px]"
            >
              AD-Session prüfen
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
