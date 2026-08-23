import { VirtualFile, BackendConfig } from '../../../../types/index';

export const generateAppTsx = (
  imports: string[],
  routes: string[],
  config: BackendConfig,
  root: string,
  useAuth: boolean,
  wl: any
): VirtualFile => {
  const appTsx = `import React from 'react';
import { HashRouter, Routes, Route, Outlet } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import { Layout } from './components/Layout';
${config.productTours && config.productTours.length > 0 ? "import Joyride, { Step } from 'react-joyride';" : ""}
${imports.join('\n')}

${config.productTours && config.productTours.length > 0 ? `
const toursData: Record<string, Step[]> = ${JSON.stringify(config.productTours.reduce((acc, tour) => {
    acc[tour.id] = tour.steps.map(s => ({ target: s.targetSelector, content: s.content, title: s.title }));
    return acc;
}, {} as any), null, 2)};
` : ""}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="app-theme">
        <GlobalStateProvider>
        ${useAuth ? "<AuthProvider>" : ""}
        ${config.productTours && config.productTours.length > 0 ? `
        {/* Render first tour for demonstration - in real app triggered dynamically */}
        <Joyride steps={toursData['${config.productTours[0].id}']} continuous showProgress showSkipButton />
        ` : ""}
        <HashRouter>
            <Routes>
                ${useAuth ? `
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/forbidden" element={<Forbidden />} />
                
                <Route element={<ProtectedRoute />}>
                    <Route path="/profile" element={<Profile />} />
                ` : `<Route element={<Layout><Outlet /></Layout>}>`}
                    <Route path="/" element={
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                            <h1 className="text-4xl font-bold text-slate-800 dark:text-white tracking-tight">Willkommen bei ${wl.appName}</h1>
                            <p className="text-slate-500 dark:text-slate-400 max-w-md">Wählen Sie einen Eintrag aus dem Menü, um zu starten.</p>
                        </div>
                    } />
                    {/* Generated Routes */}
                    ${routes.join('\n                    ')}
                ${useAuth ? `</Route>` : `</Route>`}
            </Routes>
        </HashRouter>
        ${useAuth ? "</AuthProvider>" : ""}
        </GlobalStateProvider>
    </ThemeProvider>
  );
}
export default App;`;

  return { name: 'App.tsx', path: `${root}/src/App.tsx`, content: appTsx, language: 'typescript' };
};

export const generateMainTsx = (root: string): VirtualFile => {
  return {
    name: 'main.tsx',
    path: `${root}/src/main.tsx`,
    content: `import React from 'react'; import ReactDOM from 'react-dom/client'; import App from './App'; import './index.css'; ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);`,
    language: 'typescript'
  };
};

export const generateIndexHtml = (root: string, wl: any): VirtualFile => {
  return {
    name: 'index.html',
    path: `${root}/index.html`,
    content: `<!doctype html><html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${wl.appName}</title>
    ${wl.faviconUrl ? `<link rel="icon" type="image/x-icon" href="${wl.faviconUrl}">` : ''}
    ${wl.pwaConfiguration?.enabled ? `<link rel="manifest" href="/manifest.json" />` : ''}
    ${wl.pwaConfiguration?.themeColor ? `<meta name="theme-color" content="${wl.pwaConfiguration.themeColor}" />` : ''}
</head>
<body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`,
    language: 'html'
  };
};

export const generatePwaManifest = (root: string, wl: any): VirtualFile => {
  const pwaManifest = {
    name: wl.appName,
    short_name: wl.appName,
    start_url: '/',
    display: 'standalone',
    background_color: wl.pwaConfiguration?.backgroundColor || '#ffffff',
    theme_color: wl.pwaConfiguration?.themeColor || wl.primaryColor || '#3b82f6',
    icons: [
        {
            src: wl.logoUrl || "logo192.png",
            sizes: "192x192",
            type: "image/png"
        },
        {
            src: wl.logoUrl || "logo512.png",
            sizes: "512x512",
            type: "image/png"
        }
    ]
  };
  
  return {
    name: 'manifest.json',
    path: `${root}/public/manifest.json`,
    content: JSON.stringify(pwaManifest, null, 2),
    language: 'json'
  };
};
