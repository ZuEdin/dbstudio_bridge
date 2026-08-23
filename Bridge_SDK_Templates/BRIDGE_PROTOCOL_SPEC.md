# DB Studio Universal Bridge Protokoll & SDK Spezifikation

Dieses Dokument definiert den **offiziellen Standardvertrag (API-Vertrag)**, den jede benutzerdefinierte Bridge (in **.NET C#**, **Node.js**, **Go**, **Rust**, **Python** oder **PHP**) implementieren muss, um sich nahtlos mit dem DB Studio Online Code Generator zu verbinden.

---

## 1. Übersicht & Kernanforderungen

Eine DB Studio Bridge ist ein schlanker lokaler Dienst (Daemon oder CLI), der auf einem Port (Standard: `5050`) lauscht und 3 Kernaufgaben übernimmt:
1. **Health-Check (`GET /api/status`):** Bestätigt DB Studio, dass der lokale Entwicklungs-Agent aktiv ist und welche Runtimes (.NET, Node, Docker) installiert sind.
2. **Code-Empfang & Bereitstellung (`POST /api/deploy`):** Empfängt den generierten Projektcode als JSON-Array von Dateien und entpackt/speichert ihn im lokalen Projektordner.
3. **Live-Logging (`WS /logs`):** Streamt Konsolenausgaben des Compilers oder Webservers in Echtzeit per WebSocket an das DB Studio Terminal.

---

## 2. Erforderliche REST Endpunkte

### A. Health & Status
* **Route:** `GET /api/status`
* **Response (JSON):**
```json
{
  "status": "online",
  "version": "1.0.0",
  "bridgeType": "CSharp_DotNet10_Bridge",
  "osPlatform": "win32 (x64)",
  "runtimes": {
    "dotnetSdk": { "installed": true, "version": "10.0.301" },
    "nodejs": { "installed": true, "version": "v22.17.1" }
  },
  "bridgePort": 5050,
  "activeProcesses": []
}
```

### B. Deployment & Projekt-Start
* **Route:** `POST /api/deploy`
* **Headers:** `Content-Type: application/json`, `X-Bridge-Token: <Token>`
* **Request Body (JSON):**
```json
{
  "projectId": "FakturierungPro_113830",
  "projectName": "FakturierungPro FullStack",
  "startCommand": "dotnet run",
  "port": 5000,
  "files": [
    { "path": "Backend/Program.cs", "content": "..." },
    { "path": "Frontend/src/App.tsx", "content": "..." }
  ]
}
```
* **Response (JSON):**
```json
{
  "success": true,
  "projectId": "FakturierungPro_113830",
  "message": "Projekt erfolgreich empfangen und gestartet!"
}
```

### C. Live Terminal Stream (WebSocket)
* **Route:** `ws://<host>:<port>/logs` oder `wss://...`
* **Nachrichten-Format (JSON):**
```json
{
  "projectId": "FakturierungPro_113830",
  "timestamp": "2026-08-22T12:00:00.000Z",
  "stream": "stdout",
  "message": "[Vite] Server running at http://localhost:3000/"
}
```

---

## 3. Zwingend erforderliche CORS & PNA Header

Damit Chrome, Edge und andere Webbrowser von externen HTTPS-Websites (wie Cloud Run) Anfragen an die Bridge senden dürfen, **muss jede Bridge zwingend auf alle Anfragen (insbesondere `OPTIONS`) folgende Header setzen**:

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, HEAD
Access-Control-Allow-Headers: Content-Type, Authorization, X-Bridge-Token, Access-Control-Request-Private-Network, *
Access-Control-Allow-Private-Network: true
Access-Control-Allow-Credentials: true
```
*Bei `OPTIONS` (Preflight) muss die Bridge sofort mit `HTTP 200` oder `HTTP 204` antworten.*

---

## 4. Mitgelieferte Starter-Templates

In diesem Verzeichnis finden Sie fertige, sofort ausführbare Implementierungen:

| Template | Technologie | Beschreibung |
| :--- | :--- | :--- |
| **`php-relay/bridge_relay.php`** | PHP 7/8 | Ein-Datei-Relay für Ihren eigenen Webspace (100% feste HTTPS-Adresse) |
| **`csharp-dotnet-bridge/`** | C# .NET 10 | Ultra-schnelle Native .NET Minimal API mit WebSocket-Support |
| **`nodejs-bridge/`** | Node.js | Leichtgewichtiges Express & WS CLI Skript |
