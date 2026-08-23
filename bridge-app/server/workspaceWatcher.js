import fs from 'fs';
import path from 'path';

/**
 * Überwacht das konfigurierte Workspace-Verzeichnis auf Dateiänderungen,
 * neue Projekte und gelöschte Dateien und meldet diese via WebSocket an das Frontend.
 */
class WorkspaceWatcher {
  constructor() {
    this.watchedDir = null;
    this.fsWatcher = null;
    this.broadcastCallback = null;
    this.debounceTimer = null;
    this.pendingEvents = [];
  }

  init(dirPath, broadcastFn) {
    this.broadcastCallback = broadcastFn;
    this.start(dirPath);
  }

  start(dirPath) {
    if (!dirPath || !fs.existsSync(dirPath)) {
      return;
    }

    if (this.watchedDir === dirPath && this.fsWatcher) {
      return;
    }

    this.stop();
    this.watchedDir = dirPath;

    try {
      this.fsWatcher = fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
        if (!filename) return;

        // Ignoriere typische Build- & Systemdateien
        const ignoredPatterns = [
          'node_modules',
          '.git',
          'bin',
          'obj',
          '.vs',
          '.vscode',
          'dist',
          'build',
          'src-tauri/target',
          '.tmp'
        ];

        const isIgnored = ignoredPatterns.some(pat => 
          filename.startsWith(pat) || 
          filename.includes('/' + pat) || 
          filename.includes('\\' + pat)
        );

        if (isIgnored) return;

        this.queueEvent({
          type: eventType === 'rename' ? 'file_structure_change' : 'file_modified',
          filename,
          timestamp: new Date().toISOString()
        });
      });

      if (this.broadcastCallback) {
        this.broadcastCallback('system', `[Workspace Watcher] Echtzeit-Überwachung aktiv für '${dirPath}'`);
      }
    } catch (err) {
      if (this.broadcastCallback) {
        this.broadcastCallback('stderr', `[Workspace Watcher] Fehler beim Starten des Watchers: ${err.message}`);
      }
    }
  }

  stop() {
    if (this.fsWatcher) {
      try {
        this.fsWatcher.close();
      } catch (e) {
        // Ignore
      }
      this.fsWatcher = null;
    }
  }

  queueEvent(event) {
    this.pendingEvents.push(event);

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Debounce auf 400ms, um File-Lock und Batch-Updates zusammenzufassen
    this.debounceTimer = setTimeout(() => {
      this.flushEvents();
    }, 400);
  }

  flushEvents() {
    if (this.pendingEvents.length === 0) return;

    const events = [...this.pendingEvents];
    this.pendingEvents = [];

    if (this.broadcastCallback) {
      const summaryMsg = events.length === 1 
        ? `Datei geändert: ${events[0].filename}` 
        : `${events.length} Dateien im Workspace geändert`;

      this.broadcastCallback('workspace_change', {
        summary: summaryMsg,
        eventsCount: events.length,
        events: events.slice(-5)
      });
    }
  }
}

export const workspaceWatcher = new WorkspaceWatcher();
