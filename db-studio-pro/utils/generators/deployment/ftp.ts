import { BackendConfig, VirtualFile } from '../../../types/index';

export const generateFtpFiles = (config: BackendConfig, root: string, target: string): VirtualFile[] => {
    const files: VirtualFile[] = [];
    if (target === 'ftp') {
        const ftpConfig = config.deploymentConfig;
        const ftpScript = `
const ftp = require('basic-ftp');
const path = require('path');

async function deploy() {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
        await client.access({
            host: "${ftpConfig?.ftpHost || 'your-ftp-host.com'}",
            user: "${ftpConfig?.ftpUser || 'user'}",
            password: "PASSWORD_HERE", // Set securely via env var
            secure: true
        });
        
        console.log("Connected to FTP. Uploading...");
        
        // Upload Frontend Build
        await client.ensureDir("${ftpConfig?.ftpPath || '/public_html'}");
        await client.uploadFromDir("Frontend/dist");
        
        // Upload Backend (PHP/Node) if needed
        // await client.uploadFromDir("Backend/${config.projectName}");
        
        console.log("Deployment successful!");
    } catch(err) {
        console.log(err);
    }
    client.close();
}

deploy();
`;
        files.push({
            name: 'deploy-ftp.js',
            path: `${root}/deploy-ftp.js`,
            content: ftpScript,
            language: 'javascript'
        });

        files.push({
            name: 'README_DEPLOY.md',
            path: `${root}/README_DEPLOY.md`,
            content: `# FTP Deployment
1. Install dependencies: \`npm install basic-ftp\`
2. Edit \`deploy-ftp.js\` and enter your FTP Password.
3. Run \`node deploy-ftp.js\`.
            `,
            language: 'markdown'
        });
    }
    return files;
};
