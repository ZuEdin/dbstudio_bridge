import { VirtualFile, BackendConfig } from '../../../../types/index';

export const generateLogin = (config: BackendConfig, root: string): VirtualFile => {
  const ssoProviders = config.integrations?.sso || [];
  const ssoButtons = ssoProviders.length > 0 ? `
    <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="text-center text-xs text-slate-500 mb-4 uppercase tracking-wide font-bold">Oder anmelden mit</div>
        <div className="space-y-2">
            ${ssoProviders.map(sso => `
            <button onClick={() => loginWith('${sso.provider}')} type="button" className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2">
                ${sso.provider === 'google' ? '<svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>' : ''}
                ${sso.provider === 'apple' ? '<svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M17.05 20.28c-.98.95-2.05 1.8-3.08 1.8-1.09 0-1.44-.65-2.7-.65-1.24 0-1.63.63-2.68.63-1.12 0-2.28-.95-3.13-1.93-2.7-3.1-3.6-7.88-1.28-10.4 1.13-1.22 2.76-1.88 4.22-1.88 1.13 0 2.21.57 2.83.57.65 0 2.03-.78 3.53-.78 1.5 0 2.9.48 3.65 1.13-2.3 1.18-2.68 3.65-1.3 5.08 1.12 1.18 2.5 1.48 2.75 1.5-.1.35-1.03 3.48-2.81 4.93zM14.62 4.41c.65-.89 1.15-2.18 1.05-3.41-1.08.06-2.5.7-3.23 1.63-.6.75-1.15 2.05-1 3.23 1.13.1 2.45-.63 3.18-1.45z"/></svg>' : ''}
                ${sso.provider === 'microsoft' ? '<svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#f35325" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"/></svg>' : ''}
                ${sso.provider === 'github' ? '<svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>' : ''}
                Mit ${sso.provider.charAt(0).toUpperCase() + sso.provider.slice(1)} anmelden
            </button>
            `).join('')}
        </div>
    </div>
  ` : '';

  const loginCode = `import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
export const Login = () => {
    const { login, loginWithSso } = useAuth();
    const navigate = useNavigate();
    const [u, setU] = useState('');
    const [p, setP] = useState('');
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        await login(u, p);
        navigate('/');
    };
    const loginWith = async (provider: string) => {
        await loginWithSso(provider);
        navigate('/');
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
                <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
                <form onSubmit={handleLogin} className="space-y-4">
                    <input type="text" placeholder="Benutzername/Email" value={u} onChange={e=>setU(e.target.value)} className="w-full p-2 border rounded" required />
                    <input type="password" placeholder="Passwort" value={p} onChange={e=>setP(e.target.value)} className="w-full p-2 border rounded" required />
                    <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700">Anmelden</button>
                </form>
                ${ssoButtons}
                <div className="mt-4 text-center text-sm">
                    <Link to="/register" className="text-blue-600 hover:underline">Registrieren</Link> | <Link to="/forgot-password" className="text-blue-600 hover:underline">Passwort vergessen?</Link>
                </div>
            </div>
        </div>
    );
};`;

  return { name: 'Login.tsx', path: `${root}/src/pages/auth/Login.tsx`, content: loginCode, language: 'typescript' };
};

export const generateRegister = (root: string): VirtualFile => {
  const registerCode = `import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { post } from '../../services/api';
export const Register = () => {
    const navigate = useNavigate();
    const [u, setU] = useState('');
    const [p, setP] = useState('');
    const handleReg = async (e: React.FormEvent) => {
        e.preventDefault();
        await post('auth/register', { username: u, password: p });
        navigate('/login');
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
                <h1 className="text-2xl font-bold mb-6 text-center">Konto erstellen</h1>
                <form onSubmit={handleReg} className="space-y-4">
                    <input type="email" placeholder="Email Adresse" value={u} onChange={e=>setU(e.target.value)} className="w-full p-2 border rounded" required />
                    <input type="password" placeholder="Passwort" value={p} onChange={e=>setP(e.target.value)} className="w-full p-2 border rounded" required />
                    <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700">Registrieren</button>
                </form>
                <div className="mt-4 text-center text-sm">
                    <Link to="/login" className="text-blue-600 hover:underline">Zurück zum Login</Link>
                </div>
            </div>
        </div>
    );
};`;
  return { name: 'Register.tsx', path: `${root}/src/pages/auth/Register.tsx`, content: registerCode, language: 'typescript' };
};

export const generateForgotPassword = (root: string): VirtualFile => {
  const forgotCode = `import React from 'react'; import { Link } from 'react-router-dom'; export const ForgotPassword = () => (<div className="p-8 text-center">Passwort vergessen? <Link to="/login">Zurück</Link></div>);`;
  return { name: 'ForgotPassword.tsx', path: `${root}/src/pages/auth/ForgotPassword.tsx`, content: forgotCode, language: 'typescript' };
};

export const generateProfile = (root: string): VirtualFile => {
  const profileCode = `import React from 'react'; import { useAuth } from '../../context/AuthContext'; export const Profile = () => { const { user } = useAuth(); return <div className="p-8"><h1 className="text-2xl">Profil</h1><pre>{JSON.stringify(user, null, 2)}</pre></div>; };`;
  return { name: 'Profile.tsx', path: `${root}/src/pages/auth/Profile.tsx`, content: profileCode, language: 'typescript' };
};
