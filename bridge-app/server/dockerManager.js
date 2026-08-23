import fs from 'fs';
import path from 'path';
import { exec, spawn } from 'child_process';
import util from 'util';
import { processManager } from './processManager.js';

const execPromise = util.promisify(exec);

// Bekannte Installationspfade für Docker unter Windows
const KNOWN_DOCKER_PATHS = [
  'docker',
  'C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe',
  'C:\\Program Files\\Docker\\Docker\\resources\\docker.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Docker', 'resources', 'bin', 'docker.exe'),
  path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Docker', 'Docker', 'resources', 'bin', 'docker.exe')
];

let resolvedDockerCmd = 'docker';

/**
 * Findet den funktionierenden Docker-Befehl/Pfad auf dem System.
 */
export async function resolveDockerExecutable() {
  for (const candidate of KNOWN_DOCKER_PATHS) {
    try {
      const { stdout } = await execPromise(`"${candidate}" -v`);
      if (stdout && stdout.toLowerCase().includes('docker')) {
        resolvedDockerCmd = candidate;
        return candidate;
      }
    } catch {
      // Weiterer Pfad
    }
  }
  return 'docker';
}

/**
 * Prüft den Status von Docker (CLI installiert & Daemon aktiv).
 */
export async function checkDockerStatus() {
  const dockerCmd = await resolveDockerExecutable();

  try {
    const { stdout: versionOut } = await execPromise(`"${dockerCmd}" -v`);
    const version = versionOut.trim();

    // Prüfen, ob der Docker-Daemon (Engine) aktiv läuft
    try {
      const { stdout: infoOut } = await execPromise(`"${dockerCmd}" info --format "{{.ServerVersion}}"`, { timeout: 4000 });
      return {
        installed: true,
        running: true,
        version: version,
        serverVersion: infoOut.trim() || version,
        path: dockerCmd
      };
    } catch {
      // CLI ist da, aber Engine läuft nicht
      return {
        installed: true,
        running: false,
        version: version,
        serverVersion: null,
        path: dockerCmd,
        hint: 'Docker Desktop ist installiert, aber die Docker-Engine läuft momentan nicht. Bitte starten Sie Docker Desktop.'
      };
    }
  } catch {
    return {
      installed: false,
      running: false,
      version: null,
      serverVersion: null,
      path: null,
      hint: 'Docker ist nicht im System-Pfad gefunden worden.'
    };
  }
}

/**
 * Erzeugt bei Bedarf automatische Dockerfiles und docker-compose.yml Dateien für verschiedene Stacks.
 */
export async function ensureDockerCompose(projectDir, payload = {}) {
  const composePathYml = path.join(projectDir, 'docker-compose.yml');
  const composePathYaml = path.join(projectDir, 'docker-compose.yaml');

  if (fs.existsSync(composePathYml) || fs.existsSync(composePathYaml)) {
    return { created: false, path: fs.existsSync(composePathYml) ? composePathYml : composePathYaml };
  }

  const backendDir = path.join(projectDir, 'Backend');
  const frontendDir = path.join(projectDir, 'Frontend');
  const backendPort = payload.ports?.backendPort || 5000;
  const frontendPort = payload.ports?.frontendPort || 3000;
  const dbPort = payload.ports?.dbPort || 3306;
  const projectName = (payload.projectName || path.basename(projectDir)).toLowerCase().replace(/[^a-z0-9_-]/g, '_');

  const stack = payload.stack || {};
  const backendType = stack.backendType || '';
  const databaseType = stack.databaseType || '';

  // Erkennung anhand von Dateistrukturen
  const hasPhp = fs.existsSync(path.join(backendDir, 'index.php')) || fs.existsSync(path.join(projectDir, 'index.php'));
  const hasDotnet = fs.existsSync(backendDir) && fs.readdirSync(backendDir).some(f => f.endsWith('.csproj'));
  const hasNode = fs.existsSync(path.join(backendDir, 'package.json')) || fs.existsSync(path.join(projectDir, 'package.json'));
  const hasMySQL = databaseType.toLowerCase().includes('mysql') || databaseType.toLowerCase().includes('mariadb');

  let composeContent = '';
  let dockerfileContent = '';
  let dockerfilePath = '';

  if (hasPhp || backendType === 'php') {
    // PHP + Apache Stack
    dockerfilePath = path.join(backendDir, 'Dockerfile');
    if (!fs.existsSync(dockerfilePath)) {
      dockerfileContent = `FROM php:8.2-apache
RUN docker-php-ext-install pdo pdo_mysql mysqli
RUN a2enmod rewrite
COPY . /var/www/html/
EXPOSE 80
`;
      if (!fs.existsSync(backendDir)) fs.mkdirSync(backendDir, { recursive: true });
      fs.writeFileSync(dockerfilePath, dockerfileContent, 'utf-8');
    }

    composeContent = `version: '3.8'

services:
  backend:
    build:
      context: ./Backend
      dockerfile: Dockerfile
    container_name: ${projectName}_backend
    restart: unless-stopped
    ports:
      - "${backendPort}:80"
    volumes:
      - ./Backend:/var/www/html
    environment:
      - DB_HOST=db
      - DB_PORT=3306
      - DB_NAME=app_db
      - DB_USER=root
      - DB_PASSWORD=root
    ${hasMySQL ? 'depends_on:\n      - db' : ''}

${hasMySQL ? `  db:
    image: mysql:8.0
    container_name: ${projectName}_mysql
    restart: unless-stopped
    ports:
      - "${dbPort}:3306"
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: app_db
    volumes:
      - db_data:/var/lib/mysql

volumes:
  db_data:
` : ''}`;

  } else if (hasDotnet || backendType === 'dotnet') {
    // .NET WebAPI Stack
    dockerfilePath = path.join(backendDir, 'Dockerfile');
    if (!fs.existsSync(dockerfilePath)) {
      const csprojName = fs.existsSync(backendDir) ? (fs.readdirSync(backendDir).find(f => f.endsWith('.csproj')) || 'App.csproj') : 'App.csproj';
      dockerfileContent = `FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore "${csprojName}"
RUN dotnet publish "${csprojName}" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "${csprojName.replace('.csproj', '.dll')}"]
`;
      if (!fs.existsSync(backendDir)) fs.mkdirSync(backendDir, { recursive: true });
      fs.writeFileSync(dockerfilePath, dockerfileContent, 'utf-8');
    }

    composeContent = `version: '3.8'

services:
  backend:
    build:
      context: ./Backend
      dockerfile: Dockerfile
    container_name: ${projectName}_backend
    restart: unless-stopped
    ports:
      - "${backendPort}:8080"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Server=db;Port=3306;Database=app_db;User=root;Password=root;
    ${hasMySQL ? 'depends_on:\n      - db' : ''}

${hasMySQL ? `  db:
    image: mysql:8.0
    container_name: ${projectName}_mysql
    restart: unless-stopped
    ports:
      - "${dbPort}:3306"
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: app_db
    volumes:
      - db_data:/var/lib/mysql

volumes:
  db_data:
` : ''}`;

  } else {
    // Node.js Express / Generic Stack
    dockerfilePath = path.join(backendDir, 'Dockerfile');
    if (!fs.existsSync(dockerfilePath) && fs.existsSync(backendDir)) {
      dockerfileContent = `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
`;
      fs.writeFileSync(dockerfilePath, dockerfileContent, 'utf-8');
    }

    composeContent = `version: '3.8'

services:
  backend:
    build:
      context: ./Backend
      dockerfile: Dockerfile
    container_name: ${projectName}_backend
    restart: unless-stopped
    ports:
      - "${backendPort}:5000"
    volumes:
      - ./Backend:/app
      - /app/node_modules
    environment:
      - PORT=5000
      - DB_HOST=db
    ${hasMySQL ? 'depends_on:\n      - db' : ''}

${hasMySQL ? `  db:
    image: mysql:8.0
    container_name: ${projectName}_mysql
    restart: unless-stopped
    ports:
      - "${dbPort}:3306"
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: app_db
    volumes:
      - db_data:/var/lib/mysql

volumes:
  db_data:
` : ''}`;
  }

  fs.writeFileSync(composePathYml, composeContent.trim(), 'utf-8');
  return { created: true, path: composePathYml };
}

/**
 * Startet Docker-Container via docker compose up -d und verbindet das Log-Streaming.
 */
export async function startDockerContainers({ projectId, projectDir, ports = {}, name = '' }) {
  const dockerCmd = await resolveDockerExecutable();
  const status = await checkDockerStatus();

  if (!status.installed) {
    throw new Error('Docker ist nicht auf diesem System installiert oder nicht auffindbar.');
  }

  if (!status.running) {
    throw new Error('Docker Desktop / Docker Daemon läuft nicht. Bitte starten Sie die Docker Desktop Anwendung.');
  }

  const procId = `${projectId}_docker`;
  const procName = name || `${projectId} (Docker Stack)`;

  processManager.broadcastLog({
    stream: 'system',
    processId: procId,
    message: `[DockerManager] Starte Docker Compose Stack in ${projectDir}...`
  });

  processManager.setProcessStatus({
    id: procId,
    name: procName,
    type: 'container_docker',
    status: 'building',
    workingDirectory: projectDir,
    command: `${dockerCmd} compose up -d --build`,
    port: ports.backendPort
  });

  try {
    // 1. Container bauen und starten
    const { stdout, stderr } = await execPromise(`"${dockerCmd}" compose up -d --build`, {
      cwd: projectDir
    });

    if (stdout) {
      processManager.broadcastLog({
        stream: 'stdout',
        processId: procId,
        message: stdout
      });
    }
    if (stderr) {
      processManager.broadcastLog({
        stream: 'stdout',
        processId: procId,
        message: stderr
      });
    }

    processManager.setProcessStatus({
      id: procId,
      name: procName,
      type: 'container_docker',
      status: 'running',
      workingDirectory: projectDir,
      command: `${dockerCmd} compose up -d`,
      port: ports.backendPort
    });

    processManager.broadcastLog({
      stream: 'system',
      processId: procId,
      message: `[DockerManager] Container erfolgreich gestartet. Starte Live-Log-Streaming...`
    });

    // 2. Live Logs an den ProcessManager anbinden
    attachDockerLogs(procId, projectDir, dockerCmd);

    return {
      success: true,
      projectId,
      procId,
      type: 'container_docker',
      status: 'running'
    };
  } catch (err) {
    processManager.broadcastLog({
      stream: 'stderr',
      processId: procId,
      message: `[Docker Error] ${err.message}`
    });

    processManager.setProcessStatus({
      id: procId,
      name: procName,
      type: 'container_docker',
      status: 'failed',
      workingDirectory: projectDir
    });

    throw err;
  }
}

/**
 * Verbindet 'docker compose logs -f' mit dem WebSocket-Log-Stream.
 */
function attachDockerLogs(procId, projectDir, dockerCmd) {
  try {
    const logChild = spawn(dockerCmd, ['compose', 'logs', '-f', '--tail=50'], {
      cwd: projectDir,
      shell: true
    });

    logChild.stdout.on('data', (data) => {
      processManager.broadcastLog({
        stream: 'stdout',
        processId: procId,
        message: data.toString()
      });
    });

    logChild.stderr.on('data', (data) => {
      processManager.broadcastLog({
        stream: 'stderr',
        processId: procId,
        message: data.toString()
      });
    });

    logChild.on('close', () => {
      // Log-Stream beendet
    });
  } catch (e) {
    console.error('Fehler beim Starten des Docker Log Streamers:', e);
  }
}

/**
 * Stoppt Docker-Container via docker compose down.
 */
export async function stopDockerContainers({ projectId, projectDir }) {
  const dockerCmd = await resolveDockerExecutable();
  const procId = `${projectId}_docker`;

  processManager.broadcastLog({
    stream: 'system',
    processId: procId,
    message: `[DockerManager] Stoppe Docker Container via '${dockerCmd} compose down' in ${projectDir}...`
  });

  try {
    await execPromise(`"${dockerCmd}" compose down`, { cwd: projectDir });
    
    processManager.setProcessStatus({
      id: procId,
      status: 'stopped'
    });

    processManager.broadcastLog({
      stream: 'system',
      processId: procId,
      message: `[DockerManager] Docker Stack beendet.`
    });

    return { success: true };
  } catch (err) {
    processManager.broadcastLog({
      stream: 'stderr',
      processId: procId,
      message: `[Docker Stop Error] ${err.message}`
    });
    return { success: false, error: err.message };
  }
}

/**
 * Listet laufende Container für ein bestimmtes Projekt auf.
 */
export async function getProjectContainers(projectDir) {
  const dockerCmd = await resolveDockerExecutable();
  try {
    const { stdout } = await execPromise(`"${dockerCmd}" compose ps --format json`, { cwd: projectDir });
    try {
      return JSON.parse(stdout);
    } catch {
      return stdout;
    }
  } catch {
    return [];
  }
}
