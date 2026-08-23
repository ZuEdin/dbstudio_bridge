# Self-Hosting & Subfolder Deployment Guide (z.B. `https://www.firma.com/dbstudio/`)

Diese Anleitung erklärt Schritt für Schritt, wie DB Studio Pro für das Hosting unter einer eigenen Domain oder einem Unterordner (z.B. `https://www.firma.com/dbstudio/`) konfiguriert und gebaut wird.

---

## 1. Übersicht & Architektur

Wenn die Anwendung in einem Unterordner wie `/dbstudio/` gehostet wird, müssen zwei Hauptbereiche angepasst werden:
1. **Frontend Assets & Routing (`vite.config.ts`)**: Damit Scripts und Assets unter `/dbstudio/assets/...` geladen werden.
2. **API Endpoint Basis (`stores/useConfigStore.ts` & In-App Einstellungen)**: Damit API-Aufrufe an `https://www.firma.com/dbstudio/api/...` anstelle von `/api/...` geroutet werden.

---

## 2. Dateien & Konfigurationsschritte

### A. `vite.config.ts` (Vite Build-Konfiguration)

Legen Sie in `vite.config.ts` das Feld `base` fest, wenn Sie die Anwendung in einem Unterordner bereitstellen.

**Datei:** `vite.config.ts`
```typescript
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    // Falls im Unterordner /dbstudio/ gehostet:
    base: '/dbstudio/',
    
    build: {
      outDir: 'dist',
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
```

---

### B. `stores/useConfigStore.ts` (Standard-Konfiguration im Code)

Falls Sie die Standardeinstellung für Neuinstallationen vorab festlegen möchten:

**Datei:** `stores/useConfigStore.ts`

```typescript
// 1. Initialer Zustand für Self-Host Betrieb:
const initialConfig: AppConfig = {
  mode: 'SELF_HOST', // Auf 'SELF_HOST' setzen
  storage: 'local',
  apiUrl: 'https://www.firma.com/dbstudio', // Oder 'http://localhost:5000' für lokalen Test
  isConfigured: true
};

// 2. Hilfskonstrukt für die Generierung aller API-Pfade:
export function getApiUrl(path: string): string {
  const config = useConfigStore.getState().config;
  let baseUrl = (config.apiUrl || '').trim();

  const cleanPath = path.startsWith('/') ? path : '/' + path;
  const envBase = ((import.meta as any).env?.BASE_URL || '/').replace(/\/$/, '');
  const relativeFallback = envBase ? `${envBase}${cleanPath}` : cleanPath;

  // Wenn nicht explizit SELF_HOST oder Standard-URL, benutze den relativen Fallback
  if ((config.mode as string) !== 'SELF_HOST' || !baseUrl || baseUrl === 'http://localhost:5000' || baseUrl === 'http://localhost:5000/') {
    return relativeFallback;
  }

  // Bei relativer baseUrl (z.B. '/dbstudio' oder '/dbstudio/api')
  if (baseUrl.startsWith('/')) {
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    if (cleanBase.endsWith('/api') && cleanPath.startsWith('/api/')) {
      return `${cleanBase}${cleanPath.slice(4)}`;
    }
    return `${cleanBase}${cleanPath}`;
  }

  // Bei absoluter Domain-URL (z.B. 'https://www.firma.com/dbstudio')
  if (!/^https?:\/\//i.test(baseUrl)) {
    baseUrl = 'http://' + baseUrl;
  }

  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  if (cleanBase.endsWith('/api') && cleanPath.startsWith('/api/')) {
    return `${cleanBase}${cleanPath.slice(4)}`;
  }

  return `${cleanBase}${cleanPath}`;
}
```

---

### C. Backend / Reverse Proxy (Nginx / Apache Beispiel)

Damit Aufrufe an `https://www.firma.com/dbstudio/api/` an das Backend weitergeleitet werden:

#### Nginx Konfigurationsbeispiel (`/etc/nginx/sites-available/default`)
```nginx
server {
    listen 80;
    server_name www.firma.com;

    # Static Frontend Assets
    location /dbstudio/ {
        alias /var/www/dbstudio/;
        try_files $uri $uri/ /dbstudio/index.html;
    }

    # API Proxy an das Node.js / Express Backend
    location /dbstudio/api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 3. Einstellungen in der Benutzeroberfläche (Admin-UI)

Admins können die API-URL auch direkt in den Werkzeug-Einstellungen der Anwendung anpassen:

1. Öffnen Sie die **Einstellungen** (Zahnrad-Icon).
2. Wählen Sie als Modus **Self-Host / Custom API**.
3. Tragen Sie als API-URL eine der folgenden Optionen ein:
   - **Absolut:** `https://www.firma.com/dbstudio`
   - **Relativ:** `/dbstudio`
4. Speichern Sie die Einstellungen.

---

## 4. Build ausführen

Nachdem die Anpassungen vorgenommen wurden, führen Sie den Build-Befehl aus:

```bash
npm run build
```

Das Ergebnis wird im Verzeichnis `dist/` abgelegt und kann auf den Webserver übertragen werden.
