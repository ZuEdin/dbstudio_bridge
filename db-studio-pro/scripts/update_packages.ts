import { BackendConfig } from '../types/index';

function injectCustomNpmPackages(config: any, dependencies: any) {
    if (config.whitelabel?.customNpmPackages) {
        const pkgs = config.whitelabel.customNpmPackages.split(',').map(s => s.trim()).filter(s => s.length > 0);
        for (const pkg of pkgs) {
            dependencies[pkg] = 'latest';
        }
    }
}
