import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import * as ftp from 'basic-ftp';

const execPromise = util.promisify(exec);

/**
 * Testet die Verbindung zu GitHub oder GitLab (auch Custom GitLab Server).
 */
export async function testGitProviderConnection({ provider = 'github', token, serverUrl }) {
  if (!token) {
    return { success: false, error: 'Kein Access Token angegeben.' };
  }

  const p = provider.toLowerCase();

  if (p === 'github') {
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'DBStudio-Bridge'
        }
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: `GitHub API Fehler (${res.status}): ${err.message || res.statusText}` };
      }

      const data = await res.json();
      return {
        success: true,
        provider: 'github',
        username: data.login,
        name: data.name || data.login,
        avatarUrl: data.avatar_url,
        message: `Erfolgreich mit GitHub als '${data.login}' verbunden.`
      };
    } catch (err) {
      return { success: false, error: `Verbindung zu GitHub fehlgeschlagen: ${err.message}` };
    }
  } else if (p === 'gitlab') {
    const base = (serverUrl || 'https://gitlab.com').replace(/\/+$/, '');
    const apiUrl = `${base}/api/v4/user`;

    try {
      const res = await fetch(apiUrl, {
        headers: {
          'PRIVATE-TOKEN': token,
          'User-Agent': 'DBStudio-Bridge'
        }
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: `GitLab API Fehler (${res.status}) auf ${base}: ${err.message || err.error || res.statusText}` };
      }

      const data = await res.json();
      return {
        success: true,
        provider: 'gitlab',
        serverUrl: base,
        username: data.username,
        name: data.name || data.username,
        avatarUrl: data.avatar_url,
        message: `Erfolgreich mit GitLab (${base}) als '${data.username}' verbunden.`
      };
    } catch (err) {
      return { success: false, error: `Verbindung zu GitLab (${base}) fehlgeschlagen: ${err.message}` };
    }
  }

  return { success: false, error: `Unbekannter Provider '${provider}'. Unterstützt werden 'github' und 'gitlab'.` };
}

/**
 * Erstellt ein Remote-Repository auf GitHub oder GitLab.
 */
export async function createRemoteRepo({
  provider = 'github',
  token,
  serverUrl,
  name,
  description = '',
  isPrivate = true,
  orgName,
  namespaceId
}) {
  if (!token) throw new Error('Kein Access Token für Git-Provider vorhanden.');
  if (!name) throw new Error('Repository-Name ist erforderlich.');

  const p = provider.toLowerCase();

  if (p === 'github') {
    const url = orgName 
      ? `https://api.github.com/orgs/${orgName}/repos` 
      : 'https://api.github.com/user/repos';

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'DBStudio-Bridge'
      },
      body: JSON.stringify({
        name,
        description: description || `DB Studio Projekt: ${name}`,
        private: isPrivate,
        auto_init: false
      })
    });

    const data = await res.json();
    if (!res.ok) {
      // Falls Repo bereits existiert
      if (data.errors && data.errors.some(e => e.message && e.message.includes('already exists'))) {
        const userRes = await fetch('https://api.github.com/user', {
          headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'DBStudio-Bridge' }
        });
        const userData = await userRes.json();
        const owner = orgName || userData.login;
        return {
          success: true,
          alreadyExisted: true,
          repoUrl: `https://github.com/${owner}/${name}.git`,
          htmlUrl: `https://github.com/${owner}/${name}`
        };
      }
      throw new Error(`GitHub Fehler: ${data.message || JSON.stringify(data)}`);
    }

    return {
      success: true,
      repoUrl: data.clone_url,
      htmlUrl: data.html_url,
      sshUrl: data.ssh_url,
      fullName: data.full_name
    };
  } else if (p === 'gitlab') {
    const base = (serverUrl || 'https://gitlab.com').replace(/\/+$/, '');
    const apiUrl = `${base}/api/v4/projects`;

    const bodyPayload = {
      name,
      path: name.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
      description: description || `DB Studio Projekt: ${name}`,
      visibility: isPrivate ? 'private' : 'public',
      initialize_with_readme: false
    };

    if (namespaceId) {
      bodyPayload.namespace_id = namespaceId;
    }

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'PRIVATE-TOKEN': token,
        'Content-Type': 'application/json',
        'User-Agent': 'DBStudio-Bridge'
      },
      body: JSON.stringify(bodyPayload)
    });

    const data = await res.json();
    if (!res.ok) {
      // Wenn bereits existiert
      if (data.message && JSON.stringify(data.message).includes('has already been taken')) {
        return {
          success: true,
          alreadyExisted: true,
          repoUrl: `${base}/${name}.git`,
          htmlUrl: `${base}/${name}`
        };
      }
      throw new Error(`GitLab Fehler auf ${base}: ${JSON.stringify(data.message || data)}`);
    }

    return {
      success: true,
      repoUrl: data.http_url_to_repo,
      htmlUrl: data.web_url,
      sshUrl: data.ssh_url_to_repo,
      fullName: data.path_with_namespace
    };
  }

  throw new Error(`Provider '${provider}' wird nicht unterstützt.`);
}

/**
 * Pusht das lokale Projektverzeichnis auf das Remote-Repository.
 */
export async function pushToRemoteRepo({
  projectDir,
  provider = 'github',
  token,
  repoUrl,
  branch = 'main',
  commitMessage = 'Update from DB Studio'
}) {
  if (!fs.existsSync(projectDir)) {
    throw new Error(`Projektverzeichnis existiert nicht: ${projectDir}`);
  }

  // 1. Authentifizierte URL zusammenbauen
  let authUrl = repoUrl;
  if (token && repoUrl) {
    try {
      const urlObj = new URL(repoUrl);
      if (provider.toLowerCase() === 'github') {
        urlObj.username = 'x-access-token';
        urlObj.password = token;
      } else {
        urlObj.username = 'oauth2';
        urlObj.password = token;
      }
      authUrl = urlObj.toString();
    } catch {
      // Fallback
    }
  }

  // 2. Git Aktionen ausführen
  const results = [];
  
  // Git init falls nötig
  if (!fs.existsSync(path.join(projectDir, '.git'))) {
    await execPromise('git init', { cwd: projectDir });
    results.push('git init');
  }

  // .gitignore sicherstellen
  const gitignorePath = path.join(projectDir, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    const defaultGitignore = [
      'node_modules/',
      'dist/',
      'bin/',
      'obj/',
      '.vs/',
      'target/',
      '*.user',
      '*.db',
      '.env.local'
    ].join('\n');
    fs.writeFileSync(gitignorePath, defaultGitignore, 'utf-8');
  }

  // Add & Commit
  await execPromise('git add .', { cwd: projectDir });
  try {
    await execPromise(`git commit -m "${commitMessage}"`, { cwd: projectDir });
    results.push('git commit');
  } catch {
    // Nichts neues zu committen
  }

  // Branch auf main umbenennen
  try {
    await execPromise(`git branch -M ${branch}`, { cwd: projectDir });
  } catch {}

  // Remote setzen
  try {
    await execPromise(`git remote remove origin`, { cwd: projectDir });
  } catch {}
  await execPromise(`git remote add origin ${authUrl}`, { cwd: projectDir });
  results.push('git remote set');

  // Push
  const { stdout, stderr } = await execPromise(`git push -u origin ${branch} --force`, { cwd: projectDir });
  results.push('git push erfolgreich');

  return {
    success: true,
    results,
    stdout,
    stderr
  };
}

/**
 * Führt Git-Initialisierung, Auto-Commit und optionalen Remote-Sync durch.
 */
export async function handleGitIntegration(projectDir, projectId, gitSettings, payloadGit = {}) {
  const isEnabled = gitSettings?.enabled !== false || payloadGit?.enabled === true;
  if (!isEnabled) {
    return { enabled: false, message: 'Git Integration deaktiviert' };
  }

  const results = [];
  try {
    const isGitRepo = fs.existsSync(path.join(projectDir, '.git'));
    
    if (!isGitRepo && (gitSettings?.autoInit !== false || payloadGit?.autoInit !== false)) {
      await execPromise('git init', { cwd: projectDir });
      results.push('git init erfolgreich');

      // Erstelle .gitignore falls nicht vorhanden
      const gitignorePath = path.join(projectDir, '.gitignore');
      if (!fs.existsSync(gitignorePath)) {
        const defaultGitignore = [
          'node_modules/',
          'dist/',
          'bin/',
          'obj/',
          '.vs/',
          'target/',
          '*.user',
          '*.db',
          '.env.local'
        ].join('\n');
        fs.writeFileSync(gitignorePath, defaultGitignore, 'utf-8');
      }
    }

    if (gitSettings?.autoCommit !== false || payloadGit?.autoCommit !== false) {
      await execPromise('git add .', { cwd: projectDir });
      const msg = (payloadGit?.commitMessage || gitSettings?.commitMessageTemplate || 'Auto-deploy from DB Studio: {projectId} at {timestamp}')
        .replace('{projectId}', projectId)
        .replace('{timestamp}', new Date().toISOString());
      
      try {
        await execPromise(`git commit -m "${msg}"`, { cwd: projectDir });
        results.push(`Auto-Commit erstellt: "${msg}"`);
      } catch (commitErr) {
        results.push('Keine neuen Dateiänderungen für Commit.');
      }
    }

    // Remote Push Handling (GitHub / GitLab)
    const provider = payloadGit?.provider || (gitSettings?.github?.token ? 'github' : (gitSettings?.gitlab?.token ? 'gitlab' : null));
    let token = payloadGit?.token;
    let serverUrl = payloadGit?.serverUrl;

    if (!token && provider === 'github') token = gitSettings?.github?.token || gitSettings?.personalAccessToken;
    if (!token && provider === 'gitlab') {
      token = gitSettings?.gitlab?.token || gitSettings?.personalAccessToken;
      serverUrl = serverUrl || gitSettings?.gitlab?.serverUrl || 'https://gitlab.com';
    }

    const shouldPush = payloadGit?.autoPush === true || (gitSettings?.defaultRemote && token);

    if (shouldPush && provider && token) {
      const repoName = payloadGit?.repoName || projectId;
      let targetRepoUrl = payloadGit?.repoUrl || gitSettings?.defaultRemote;

      if (!targetRepoUrl && (payloadGit?.createRemoteIfNotExists !== false)) {
        const createRes = await createRemoteRepo({
          provider,
          token,
          serverUrl,
          name: repoName,
          description: `DB Studio Projekt ${projectId}`,
          isPrivate: payloadGit?.isPrivate !== false,
          orgName: payloadGit?.orgName || gitSettings?.github?.defaultOrg,
          namespaceId: payloadGit?.namespaceId || gitSettings?.gitlab?.defaultNamespace
        });
        targetRepoUrl = createRes.repoUrl;
        results.push(`Remote Repository auf ${provider} erstellt: ${createRes.htmlUrl || targetRepoUrl}`);
      }

      if (targetRepoUrl) {
        await pushToRemoteRepo({
          projectDir,
          provider,
          token,
          repoUrl: targetRepoUrl,
          branch: payloadGit?.branch || 'main',
          commitMessage: `Deploy ${projectId} at ${new Date().toISOString()}`
        });
        results.push(`Erfolgreich zu ${provider} gepusht.`);
      }
    }

    return { success: true, results };
  } catch (err) {
    return { success: false, error: err.message, results };
  }
}

/**
 * Ermittelt intelligent die richtigen Build- & Web-Dateien eines Projekts für den FTP-Upload.
 */
export async function detectProjectUploadFiles(projectDir, scope = 'auto') {
  if (!fs.existsSync(projectDir)) {
    return { error: `Projektverzeichnis existiert nicht: ${projectDir}` };
  }

  const candidates = [];

  // 1. Frontend dist / build
  const possibleDistDirs = [
    path.join(projectDir, 'dist'),
    path.join(projectDir, 'Frontend', 'dist'),
    path.join(projectDir, 'build'),
    path.join(projectDir, 'Frontend', 'build'),
    path.join(projectDir, 'out')
  ];

  for (const d of possibleDistDirs) {
    if (fs.existsSync(d) && fs.statSync(d).isDirectory()) {
      const files = countFilesInDir(d);
      candidates.push({
        type: 'web_dist',
        label: `Kompiliertes Web-Frontend (${path.relative(projectDir, d) || 'dist'})`,
        path: d,
        fileCount: files.count,
        totalBytes: files.totalBytes,
        isRecommended: true
      });
    }
  }

  // 2. .NET Backend publish
  const possiblePublishDirs = [
    path.join(projectDir, 'Backend', 'publish'),
    path.join(projectDir, 'publish'),
    path.join(projectDir, 'Backend', 'bin', 'Release', 'net10.0', 'publish'),
    path.join(projectDir, 'Backend', 'bin', 'Release', 'net9.0', 'publish'),
    path.join(projectDir, 'Backend', 'bin', 'Release', 'net8.0', 'publish')
  ];

  for (const d of possiblePublishDirs) {
    if (fs.existsSync(d) && fs.statSync(d).isDirectory()) {
      const files = countFilesInDir(d);
      candidates.push({
        type: 'dotnet_publish',
        label: `.NET Server-Publish (${path.relative(projectDir, d)})`,
        path: d,
        fileCount: files.count,
        totalBytes: files.totalBytes,
        isRecommended: candidates.length === 0
      });
    }
  }

  // 3. Clean source (excluding node_modules, bin, obj, .git)
  const cleanFiles = countFilesInDir(projectDir, ['node_modules', 'bin', 'obj', '.git', '.vs', '.vscode', 'src-tauri/target']);
  candidates.push({
    type: 'clean_source',
    label: 'Bereinigtes Gesamtprojekt (ohne node_modules & Binaries)',
    path: projectDir,
    fileCount: cleanFiles.count,
    totalBytes: cleanFiles.totalBytes,
    isRecommended: candidates.length === 0
  });

  return {
    success: true,
    projectDir,
    candidates,
    selectedTarget: scope === 'auto' ? candidates[0] : candidates.find(c => c.type === scope) || candidates[0]
  };
}

function countFilesInDir(dir, ignoreDirs = []) {
  let count = 0;
  let totalBytes = 0;

  function walk(current) {
    try {
      const entries = fs.readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        if (ignoreDirs.includes(entry.name)) continue;
        const fullPath = path.join(current, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.isFile()) {
          count++;
          totalBytes += fs.statSync(fullPath).size;
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  walk(dir);
  return { count, totalBytes };
}

/**
 * Testet die Verbindung zu einem FTP / FTPS Server mit detaillierter Server-Diagnose.
 */
export async function testFtpConnection(ftpConfig) {
  if (!ftpConfig || !ftpConfig.host) {
    return { success: false, error: 'Kein FTP-Server Hostname angegeben.' };
  }

  const startTime = Date.now();
  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    const isFtps = ftpConfig.protocol === 'ftps';
    const port = parseInt(ftpConfig.port || (isFtps ? '21' : '21'), 10);

    await client.access({
      host: ftpConfig.host.trim(),
      port: port,
      user: ftpConfig.username ? ftpConfig.username.trim() : 'anonymous',
      password: ftpConfig.password || '',
      secure: isFtps ? true : false,
      secureOptions: {
        rejectUnauthorized: false // Erlaubt selbstsignierte Zertifikate
      }
    });

    const latencyMs = Date.now() - startTime;
    
    // Remote Verzeichnis prüfen / auflisten
    const targetDir = (ftpConfig.remotePath || '/').trim();
    let currentDir = '/';
    let fileList = [];
    
    try {
      if (targetDir && targetDir !== '/') {
        await client.ensureDir(targetDir);
      }
      currentDir = await client.pwd();
      const rawList = await client.list();
      fileList = rawList.slice(0, 12).map(f => ({
        name: f.name,
        type: f.isDirectory ? 'folder' : 'file',
        sizeBytes: f.size,
        modifiedAt: f.rawModifiedAt
      }));
    } catch (e) {
      // Ignore list error if path is restricted
    }

    client.close();

    return {
      success: true,
      latencyMs,
      host: ftpConfig.host,
      port,
      protocol: ftpConfig.protocol || 'ftp',
      currentDir,
      filesFound: fileList.length,
      remoteFiles: fileList,
      message: `Verbindung zu ${ftpConfig.host}:${port} erfolgreich! (${latencyMs}ms Latenz, ${fileList.length} Remote-Objekte)`
    };
  } catch (err) {
    client.close();
    let friendlyError = err.message;
    if (err.message.includes('ECONNREFUSED')) {
      friendlyError = `Verbindung zu ${ftpConfig.host}:${ftpConfig.port} abgelehnt (Port geschlossen oder Server offline).`;
    } else if (err.message.includes('530') || err.message.toLowerCase().includes('login') || err.message.toLowerCase().includes('auth')) {
      friendlyError = `Authentifizierung fehlgeschlagen: Bitte Benutzername und Passwort für '${ftpConfig.username}' prüfen.`;
    } else if (err.message.includes('ENOTFOUND')) {
      friendlyError = `Hostname '${ftpConfig.host}' konnte nicht aufgelöst werden (DNS-Fehler).`;
    } else if (err.message.includes('ETIMEDOUT')) {
      friendlyError = `Zeitüberschreitung beim Verbindungsaufbau zu ${ftpConfig.host}:${ftpConfig.port} (Firewall / Timeout).`;
    }
    return { success: false, error: friendlyError, rawError: err.message };
  }
}

/**
 * Lädt ein Verzeichnis oder Projekt intelligent per FTP auf den Remote-Server hoch.
 */
export async function uploadToFtp(localDirOrConfig, ftpConfig) {
  let localDir = typeof localDirOrConfig === 'string' ? localDirOrConfig : localDirOrConfig.localDir;
  const config = typeof localDirOrConfig === 'object' && !ftpConfig ? localDirOrConfig : ftpConfig;

  if (!localDir || !fs.existsSync(localDir)) {
    throw new Error(`Lokales Upload-Verzeichnis '${localDir}' existiert nicht.`);
  }

  const startTime = Date.now();
  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    const isFtps = config.protocol === 'ftps';
    const port = parseInt(config.port || '21', 10);

    await client.access({
      host: config.host.trim(),
      port: port,
      user: config.username ? config.username.trim() : 'anonymous',
      password: config.password || '',
      secure: isFtps ? true : false,
      secureOptions: {
        rejectUnauthorized: false
      }
    });

    const targetRemotePath = (config.remotePath || '/').trim();
    await client.ensureDir(targetRemotePath);

    if (config.cleanRemoteBeforeUpload) {
      await client.clearWorkingDir();
    }

    // Rekursiver Upload aller Dateien
    await client.uploadFromDir(localDir);

    const stats = countFilesInDir(localDir);
    const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
    client.close();

    return {
      success: true,
      filesUploaded: stats.count,
      totalBytes: stats.totalBytes,
      durationSec: `${durationSec}s`,
      remotePath: targetRemotePath,
      message: `Upload von ${stats.count} Dateien (${(stats.totalBytes / (1024 * 1024)).toFixed(2)} MB) nach '${targetRemotePath}' erfolgreich abgeschlossen in ${durationSec}s.`
    };
  } catch (err) {
    client.close();
    throw err;
  }
}
