import React, { useState } from 'react';
import { Key, X, Plus } from 'lucide-react';

interface AuthMapping {
  groupName: string;
  roleName: string;
}

interface AuthConfig {
  useWindowsAuth: boolean;
  useAdGroups: boolean;
  adGroups?: string;
  adMapping?: AuthMapping[];
  useUserLogin: boolean;
  isMobileReady: boolean;
  devBypass: boolean;
  useActiveDirectoryMgmt?: boolean;
}

interface AuthTabProps {
  authConfig: any;
  setAuthConfig: React.Dispatch<React.SetStateAction<any>>;
  roles: any[];
}

export const AuthTab: React.FC<AuthTabProps> = ({
  authConfig,
  setAuthConfig,
  roles,
}) => {
  const [newMapGroup, setNewMapGroup] = useState('');
  const [newMapRole, setNewMapRole] = useState('');

  const addMapping = () => {
    if (newMapGroup && newMapRole) {
      const currentMap = authConfig.adMapping || [];
      setAuthConfig({
        ...authConfig,
        adMapping: [...currentMap, { groupName: newMapGroup, roleName: newMapRole }],
      });
      setNewMapGroup('');
    }
  };

  const removeMapping = (idx: number) => {
    const currentMap = authConfig.adMapping || [];
    setAuthConfig({
      ...authConfig,
      adMapping: currentMap.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 m-6 h-[90%] overflow-y-auto max-w-3xl mx-auto">
      <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
        <Key size={20} /> Authentifizierungs-Methoden
      </h3>

      <div className="space-y-6">
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
          <label className="flex items-center gap-2 cursor-pointer mb-2">
            <input
              type="checkbox"
              checked={!!authConfig.useWindowsAuth}
              onChange={(e) =>
                setAuthConfig({ ...authConfig, useWindowsAuth: e.target.checked })
              }
              className="rounded w-5 h-5 text-emerald-600"
            />
            <span className="font-bold text-slate-800">
              Windows Authentifizierung (Active Directory)
            </span>
          </label>
          <p className="text-sm text-slate-600 ml-7 mb-4">
            Nutzt die Windows-Identität des Benutzers (Intranet/Firmennetzwerk). Erfordert IIS oder entsprechenden Proxy.
          </p>

          {authConfig.useWindowsAuth && (
            <div className="ml-7 pl-4 border-l-2 border-slate-300 space-y-4 animate-in slide-in-from-top-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!authConfig.useAdGroups}
                  onChange={(e) =>
                    setAuthConfig({ ...authConfig, useAdGroups: e.target.checked })
                  }
                  className="rounded"
                />
                <span className="text-sm font-semibold">
                  Zugriff auf AD-Gruppen beschränken (Role Mapping)
                </span>
              </label>

              {authConfig.useAdGroups && (
                <div className="space-y-3">
                  <div className="bg-white border border-slate-200 rounded-lg p-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">
                      Gruppen-zu-Rollen Zuweisung
                    </h4>
                    <table className="w-full text-sm mb-3">
                      <thead>
                        <tr className="text-left text-slate-500 border-b">
                          <th className="pb-1 font-normal">AD Gruppe</th>
                          <th className="pb-1 font-normal">Interne Rolle</th>
                          <th className="pb-1 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {authConfig.adMapping?.map((map, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2 font-mono text-xs">{map.groupName}</td>
                            <td className="py-2">
                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                                {map.roleName}
                              </span>
                            </td>
                            <td className="py-2 text-right">
                              <button
                                onClick={() => removeMapping(i)}
                                className="text-slate-400 hover:text-red-500"
                              >
                                <X size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {(!authConfig.adMapping || authConfig.adMapping.length === 0) && (
                          <tr>
                            <td colSpan={3} className="py-4 text-center text-slate-400 italic text-xs">
                              Keine Zuweisungen.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    <div className="flex gap-2 items-center bg-slate-50 p-2 rounded">
                      <input
                        type="text"
                        className="flex-1 border rounded px-2 py-1 text-xs"
                        placeholder="DOMAIN\GroupName"
                        value={newMapGroup}
                        onChange={(e) => setNewMapGroup(e.target.value)}
                      />
                      <span className="text-slate-400 text-xs">→</span>
                      <select
                        className="border rounded px-2 py-1 text-xs w-32 bg-white"
                        value={newMapRole}
                        onChange={(e) => setNewMapRole(e.target.value)}
                      >
                        <option value="">(Rolle)</option>
                        {roles.map((r: any) => (
                          <option key={r.Name} value={r.Name}>
                            {r.Name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={addMapping}
                        disabled={!newMapGroup || !newMapRole}
                        className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer mt-4">
                <input
                  type="checkbox"
                  checked={!!authConfig.useActiveDirectoryMgmt}
                  onChange={(e) =>
                    setAuthConfig({
                      ...authConfig,
                      useActiveDirectoryMgmt: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <span className="text-sm font-semibold text-slate-800">
                  Domain Controller API verwenden
                </span>
              </label>
              {authConfig.useActiveDirectoryMgmt && (
                <p className="text-xs text-slate-500 mt-1 pl-6">
                  Aktiviert .NET System.DirectoryServices. Erlaubt dem Backend, Active-Directory User, SIDs und Berechtigungen programmgesteuert zu überwachen und zu steuern, anstatt sich nur auf Passiv-Authentication zu verlassen.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
          <label className="flex items-center gap-2 cursor-pointer mb-2">
            <input
              type="checkbox"
              checked={!!authConfig.useUserLogin}
              onChange={(e) =>
                setAuthConfig({ ...authConfig, useUserLogin: e.target.checked })
              }
              className="rounded w-5 h-5 text-emerald-600"
            />
            <span className="font-bold text-slate-800">Benutzer-Login (Formular)</span>
          </label>
          <p className="text-sm text-slate-600 ml-7 mb-2">
            Klassisches Login mit Username/Passwort (JWT Tokens). Speichert Benutzer in der Tabelle <code>sys_users</code>.
          </p>
          {authConfig.useUserLogin && (
            <div className="ml-7 mt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={!!authConfig.isMobileReady}
                  onChange={(e) =>
                    setAuthConfig({ ...authConfig, isMobileReady: e.target.checked })
                  }
                  className="rounded"
                />
                Mobile App kompatibel (Lange Token-Laufzeit)
              </label>
            </div>
          )}
        </div>

        <div className="border border-slate-200 rounded-lg p-4 bg-yellow-50">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!authConfig.devBypass}
              onChange={(e) =>
                setAuthConfig({ ...authConfig, devBypass: e.target.checked })
              }
              className="rounded"
            />
            <span className="font-bold text-slate-800">Developer Bypass (Dev Mode)</span>
          </label>
          <p className="text-sm text-slate-600 ml-6 mt-1">
            Wenn aktiv, wird im Entwicklungsmodus (Localhost) automatisch ein Admin-Benutzer simuliert.
          </p>
        </div>
      </div>
    </div>
  );
};
