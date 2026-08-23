import React from 'react';

interface ApiAuthSectionProps {
  authType: 'none' | 'apiKey' | 'bearer' | 'basic';
  setAuthType: (type: 'none' | 'apiKey' | 'bearer' | 'basic') => void;
  authBearerToken: string;
  setAuthBearerToken: (token: string) => void;
  authApiKeyName: string;
  setAuthApiKeyName: (name: string) => void;
  authApiKeyLocation: 'header' | 'query';
  setAuthApiKeyLocation: (loc: 'header' | 'query') => void;
  authApiKeyValue: string;
  setAuthApiKeyValue: (value: string) => void;
  authApiKeyPrefix: string;
  setAuthApiKeyPrefix: (prefix: string) => void;
  authUsername: string;
  setAuthUsername: (username: string) => void;
  authPassword: string;
  setAuthPassword: (password: string) => void;
  headers: string;
  setHeaders: (headers: string) => void;
}

export const ApiAuthSection: React.FC<ApiAuthSectionProps> = ({
  authType,
  setAuthType,
  authBearerToken,
  setAuthBearerToken,
  authApiKeyName,
  setAuthApiKeyName,
  authApiKeyLocation,
  setAuthApiKeyLocation,
  authApiKeyValue,
  setAuthApiKeyValue,
  authApiKeyPrefix,
  setAuthApiKeyPrefix,
  authUsername,
  setAuthUsername,
  authPassword,
  setAuthPassword,
  headers,
  setHeaders,
}) => {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded p-4 mb-2 mt-2">
      <span className="block text-xs font-bold text-slate-500 uppercase mb-2">📡 API-Authentifizierung (API Auth)</span>
      
      {/* Auth Type Buttons */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {(['none', 'bearer', 'apiKey', 'basic'] as const).map((t) => (
          <button 
            key={t}
            type="button"
            onClick={() => setAuthType(t)}
            className={`py-1.5 text-xs font-bold rounded border transition-all ${
              authType === t 
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t === 'none' && 'Keine Auth'}
            {t === 'bearer' && 'Bearer Token'}
            {t === 'apiKey' && 'API-Key'}
            {t === 'basic' && 'Basic Auth'}
          </button>
        ))}
      </div>

      {/* Conditional Inputs */}
      {authType === 'bearer' && (
        <div className="space-y-2 animate-in fade-in duration-150">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Bearer Token</label>
            <input 
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsIn..."
              value={authBearerToken}
              onChange={e => setAuthBearerToken(e.target.value)}
              className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs font-mono bg-white"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Fügt automatisch den Header <code>Authorization: Bearer &lt;Token&gt;</code> hinzu.</span>
          </div>
        </div>
      )}

      {authType === 'apiKey' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Parameter / Header Name</label>
              <input 
                type="text"
                placeholder="X-API-Key oder api_key"
                value={authApiKeyName}
                onChange={e => setAuthApiKeyName(e.target.value)}
                className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs font-mono bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Übertragungsweg</label>
              <select 
                value={authApiKeyLocation}
                onChange={e => setAuthApiKeyLocation(e.target.value as 'header' | 'query')}
                className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs bg-white"
              >
                <option value="header">Header (Empfohlen)</option>
                <option value="query">Query-Parameter (URL)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">API Key Wert</label>
            <input 
              type="password"
              placeholder="Geheimer Schlüssel"
              value={authApiKeyValue}
              onChange={e => setAuthApiKeyValue(e.target.value)}
              className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs font-mono bg-white"
            />
          </div>
          {authApiKeyLocation === 'header' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Prefix (Optional)</label>
              <input 
                type="text"
                placeholder="z.B. Bearer oder Token (leerlassen für kein Prefix)"
                value={authApiKeyPrefix}
                onChange={e => setAuthApiKeyPrefix(e.target.value)}
                className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs font-mono bg-white"
              />
            </div>
          )}
        </div>
      )}

      {authType === 'basic' && (
        <div className="space-y-2 animate-in fade-in duration-150">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Benutzername</label>
              <input 
                type="text"
                placeholder="Username / Client ID"
                value={authUsername}
                onChange={e => setAuthUsername(e.target.value)}
                className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs font-mono bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Passwort</label>
              <input 
                type="password"
                placeholder="Password / Secret"
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs font-mono bg-white"
              />
            </div>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Fügt automatisch den Base64-codierten <code>Authorization: Basic ...</code> Header hinzu.</span>
        </div>
      )}

      <div className="mt-3">
        <details className="text-xs">
          <summary className="cursor-pointer text-slate-500 hover:text-slate-700 font-semibold mb-1">Header Optionen (Authorization)</summary>
          <textarea 
            value={headers}
            onChange={e => setHeaders(e.target.value)}
            placeholder='{"Authorization": "Bearer token", "X-Custom": "value"}'
            className="w-full border border-slate-300 rounded p-2 font-mono h-20 bg-white"
          />
        </details>
      </div>
    </div>
  );
};
