import { BackendConfig, Table, VirtualFile } from '../../types/index';
import { generateDockerFiles } from './deployment/docker';
import { generateFtpFiles } from './deployment/ftp';
import { generateGithubWorkflow } from './deployment/github';
import { generateElectronFiles } from './deployment/electron';
import { generateTauriFiles } from './deployment/tauri';
import { generateInfrastructureFiles } from './deployment/infrastructure';
import { generateEnvironmentBuildScripts } from './deployment/environments';
import { generateOfflineSyncFiles } from './offlineSyncGenerator';

export const generateDeploymentScripts = (config: BackendConfig, root: string, tables: Table[] = []): VirtualFile[] => {
    const target = config.deploymentConfig?.target || 'docker';

    const files: VirtualFile[] = [
        ...generateDockerFiles(config, root, target),
        ...generateFtpFiles(config, root, target),
        ...generateGithubWorkflow(config, root, target),
        ...generateElectronFiles(config, root, target),
        ...generateTauriFiles(config, root, target),
        ...generateInfrastructureFiles(config, root, target),
        ...generateEnvironmentBuildScripts(config, target),
    ];

    if (target === 'offline_sync' || config.deploymentConfig?.offlineSync?.enabled || config.offlineSync?.enabled) {
        files.push(...generateOfflineSyncFiles(tables, config, config.offlineSync || config.deploymentConfig?.offlineSync));
    }

    return files;
};
