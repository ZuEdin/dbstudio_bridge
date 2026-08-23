import { VirtualFile, BackendConfig } from '../../../../types/index';

export const generateGlobalStateContext = (config: BackendConfig, root: string, stateDefaults: any): VirtualFile => {
  return {
    name: 'GlobalStateContext.tsx',
    path: `${root}/src/context/GlobalStateContext.tsx`,
    language: 'typescript',
    content: `import React, { createContext, useContext, useState } from 'react';
import { executeGeneratedMacro } from '../services/macroService';

export const GlobalStateContext = createContext<any>(null);

export const GlobalStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [states, setStates] = useState<Record<string, any>>(${JSON.stringify(stateDefaults, null, 2)});
  
  const setGlobalState = (key: string, value: any) => {
      setStates(prev => ({ ...prev, [key]: value }));
  };

  // Phase 6 Toast
  const [toasts, setToasts] = useState<any[]>([]);
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const executeMacro = (macroId: string, contextData?: any) => {
      executeGeneratedMacro(macroId, contextData, addToast);
  };
  
  return (
      <GlobalStateContext.Provider value={{ states, setGlobalState, addToast, executeMacro }}>
          {children}
          {/* Toast Container */}
          <div className="fixed bottom-4 right-4 z-[9999] space-y-2">
            {toasts.map(t => (
                <div key={t.id} className={\`px-4 py-3 rounded-lg shadow-xl text-white \${t.type === 'error' ? 'bg-red-600' : t.type === 'success' ? 'bg-green-600' : 'bg-blue-600'} flex items-center gap-2 animate-in slide-in-from-right-4\`}>
                    {t.message}
                </div>
            ))}
          </div>
      </GlobalStateContext.Provider>
  );
};

export const useGlobalState = () => useContext(GlobalStateContext);
`
  };
};

export const generateThemeProvider = (root: string): VirtualFile => {
  const themeContext = `import React, { createContext, useContext, useEffect, useState } from "react";
type Theme = "dark" | "light" | "system";
type ThemeProviderProps = { children: React.ReactNode; defaultTheme?: Theme; storageKey?: string; };
type ThemeProviderState = { theme: Theme; setTheme: (theme: Theme) => void; };
const initialState: ThemeProviderState = { theme: "system", setTheme: () => null };
const ThemeProviderContext = createContext<ThemeProviderState>(initialState);
export function ThemeProvider({ children, defaultTheme = "system", storageKey = "vite-ui-theme" }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(storageKey) as Theme) || defaultTheme);
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
      return;
    }
    root.classList.add(theme);
  }, [theme]);
  const value = { theme, setTheme: (theme: Theme) => { localStorage.setItem(storageKey, theme); setTheme(theme); } };
  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>;
}
export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};`;

  return {
    name: 'theme-provider.tsx',
    path: `${root}/src/components/theme-provider.tsx`,
    content: themeContext,
    language: 'typescript'
  };
};

export const generateAuthContext = (config: BackendConfig, root: string): VirtualFile => {
  const authCtxCode = `import React, { createContext, useContext, useState, useEffect } from 'react';
import { post, get } from '../services/api';

interface AuthContextType {
    user: any;
    loading: boolean;
    login: (u: string, p: string) => Promise<void>;
    loginWithSso: (provider: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            const token = localStorage.getItem('auth_token');
            if (token) {
                try {
                    const res: any = await get('auth/me');
                    if (res && res.user) {
                        setUser(res.user);
                        localStorage.setItem('auth_user', JSON.stringify(res.user));
                    } else {
                        throw new Error('Invalid session');
                    }
                } catch (e) {
                    console.error('Session verification failed', e);
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('auth_user');
                    setUser(null);
                }
            }
            setLoading(false);
        };
        checkSession();
    }, []);

    const login = async (u: string, p: string) => {
        const res: any = await post('auth/login', { username: u, password: p });
        if (res.token) {
            localStorage.setItem('auth_token', res.token);
            if (res.user) {
                localStorage.setItem('auth_user', JSON.stringify(res.user));
                setUser(res.user);
            } else {
                const userObj = { username: u, role: 'Admin' };
                localStorage.setItem('auth_user', JSON.stringify(userObj));
                setUser(userObj);
            }
        }
    };
    
    const loginWithSso = async (provider: string) => {
        const res: any = await post('auth/login-sso', { provider });
        if (res.token) {
            localStorage.setItem('auth_token', res.token);
            if (res.user) {
                localStorage.setItem('auth_user', JSON.stringify(res.user));
                setUser(res.user);
            } else {
                const userObj = { username: provider + ' User', role: 'User' };
                localStorage.setItem('auth_user', JSON.stringify(userObj));
                setUser(userObj);
            }
        }
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setUser(null);
    };

    return <AuthContext.Provider value={{ user, loading, login, loginWithSso, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};`;

  return {
    name: 'AuthContext.tsx',
    path: `${root}/src/context/AuthContext.tsx`,
    content: authCtxCode,
    language: 'typescript'
  };
};
