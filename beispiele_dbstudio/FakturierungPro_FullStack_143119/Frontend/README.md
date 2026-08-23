# FakturierungPro (React Client)

Dieses Frontend wurde mit **React + Vite + TypeScript** generiert.

## 🚀 Schnellstart

### 1. Voraussetzungen
* **Node.js** (LTS Version, z.B. v18 oder v20).

### 2. Installation
Öffnen Sie ein Terminal im Ordner `Frontend`:

```bash
npm install
```

### 3. Starten (Development)
```bash
npm run dev
```

Die Anwendung läuft standardmäßig unter **http://localhost:3000**.
⚠️ Stellen Sie sicher, dass das Backend läuft (Standard: Port 5000).

### 4. Build (Production)
Um eine optimierte Version für den Webserver zu erstellen:

```bash
npm run build
```

Die Dateien befinden sich anschließend im Ordner `dist`. Diese können auf jeden statischen Webserver (Nginx, Apache, Azure Static Web Apps) hochgeladen werden.

## 🛠 Konfiguration
Die API-URL ist in `src/services/api.ts` definiert.
Aktuell: `http://localhost:5000/api`

Um dies für Produktion zu ändern, setzen Sie Umgebungsvariablen oder ändern Sie die Datei vor dem Build.
