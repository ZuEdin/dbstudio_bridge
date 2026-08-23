const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const distDir = path.join(__dirname, 'dist');
  const indexPath = path.join(distDir, 'index.html');
  
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  if (!fs.existsSync(indexPath)) {
    const defaultHtml = `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Desktop App - Dist bereitgestellt</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            background: #0f172a;
            color: #f1f5f9;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
        }
        .card {
            background: #1e293b;
            padding: 2.5rem;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 500px;
            border: 1px solid #334155;
        }
        h1 {
            color: #38bdf8;
            margin-top: 0;
        }
        p {
            line-height: 1.6;
            color: #cbd5e1;
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>Willkommen bei Ihrer Desktop-Anwendung</h1>
        <p>Der Ordner <strong>dist/</strong> wurde automatisch erstellt.</p>
        <p>Sobald Sie Ihr Frontend kompilieren (z.B. mit <code>npm run build</code>) und die Dateien in diesen <strong>dist/</strong> Ordner kopieren, wird Electron Ihr Frontend anzeigen.</p>
    </div>
</body>
</html>`;
    fs.writeFileSync(indexPath, defaultHtml, 'utf-8');
  }

  win.loadFile(indexPath);
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
