# Electron Setup
To build the application as a desktop app:

1. Install dependencies: `npm install --save-dev electron electron-builder`
2. Add these to your `package.json`:
   ```json
   "main": "main.js",
   "scripts": {
     "start": "electron .",
     "electron:dev": "npm run build && electron .",
     "electron:build": "npm run build && electron-builder"
   },
   "build": {
     "appId": "com.fakturierungpro.app",
     "directories": {
        "output": "release"
     },
     "files": [
        "dist/**/*",
        "Frontend/**/*",
        "Backend/**/*",
        "main.js",
        "preload.js",
        "package.json"
     ]
   }
   ```
3. Run `npm run electron:start` or `npm start` to launch Electron locally.
4. Run `npm run electron:build` to build the standalone executable.
