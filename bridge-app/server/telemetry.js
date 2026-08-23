import { exec } from 'child_process';
import util from 'util';
import os from 'os';
import { loadSettings } from './config.js';
import { processManager } from './processManager.js';

const execPromise = util.promisify(exec);

import { checkDockerStatus } from './dockerManager.js';

let cachedRuntimes = null;
let lastCheckTime = 0;

export async function collectSystemTelemetry() {
  const settings = loadSettings();
  const now = Date.now();

  // Cache SDK checks for 10 seconds to avoid spawning cmd every 2s
  if (!cachedRuntimes || now - lastCheckTime > 10000) {
    const getToolVersion = async (cmd) => {
      try {
        const { stdout } = await execPromise(cmd);
        return { installed: true, version: stdout.trim() };
      } catch {
        return { installed: false };
      }
    };

    const [dotnet, node, npm, rust, dockerStatus] = await Promise.all([
      getToolVersion('dotnet --version'),
      getToolVersion('node -v'),
      getToolVersion('npm -v'),
      getToolVersion('cargo --version'),
      checkDockerStatus()
    ]);

    cachedRuntimes = {
      dotnetSdk: dotnet,
      nodejs: node,
      npm: npm,
      rust: rust,
      docker: dockerStatus
    };
    lastCheckTime = now;
  }

  return {
    status: 'online',
    version: '1.0.0',
    bridgeType: 'DBStudio_Universal_Bridge',
    hostname: os.hostname(),
    osPlatform: `${process.platform} (${process.arch}) - ${os.type()} ${os.release()}`,
    freeMemoryMb: Math.round(os.freemem() / (1024 * 1024)),
    totalMemoryMb: Math.round(os.totalmem() / (1024 * 1024)),
    runtimes: cachedRuntimes,
    bridgePort: settings.bridgeServerPort || 5050,
    activeProcesses: processManager.getAllProcesses(),
    config: {
      projectsDir: settings.projectsDir,
      sharedDependenciesDir: settings.sharedDependenciesDir
    },
    timestamp: new Date().toISOString()
  };
}
