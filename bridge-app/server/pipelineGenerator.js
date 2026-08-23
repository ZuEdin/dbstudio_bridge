import fs from 'fs';
import path from 'path';

/**
 * Generiert vollständige CI/CD Pipeline-Dateien für GitHub Actions und GitLab CI.
 */
export function generatePipelineFiles(projectDir, config = {}) {
  const {
    provider = 'github', // 'github' | 'gitlab' | 'both'
    enableDotnetBuild = true,
    enableFrontendBuild = true,
    enableFtpDeploy = false,
    ftpHost = '',
    ftpUser = '',
    ftpPath = '/public_html'
  } = config;

  if (!fs.existsSync(projectDir)) {
    throw new Error(`Projektverzeichnis '${projectDir}' existiert nicht.`);
  }

  const generatedFiles = [];

  // 1. GitHub Actions Workflow
  if (provider === 'github' || provider === 'both') {
    const githubDir = path.join(projectDir, '.github', 'workflows');
    fs.mkdirSync(githubDir, { recursive: true });

    const workflowContent = `name: Build & Test Pipeline

on:
  push:
    branches: [ "main", "master", "develop" ]
  pull_request:
    branches: [ "main", "master" ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout Repository
      uses: actions/checkout@v4

${enableDotnetBuild ? `    - name: Setup .NET SDK
      uses: actions/setup-dotnet@v4
      with:
        dotnet-version: '10.0.x'

    - name: Restore & Build .NET Backend
      run: |
        dotnet restore
        dotnet build --configuration Release --no-restore
` : ''}
${enableFrontendBuild ? `    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: 22
        cache: 'npm'

    - name: Install & Build Frontend
      run: |
        npm ci || npm install
        npm run build
` : ''}
${enableFtpDeploy ? `    - name: 🚀 FTP Deploy
      uses: SamKirkland/FTP-Deploy-Action@v4.3.5
      with:
        server: \${{ secrets.FTP_SERVER || '${ftpHost}' }}
        username: \${{ secrets.FTP_USERNAME || '${ftpUser}' }}
        password: \${{ secrets.FTP_PASSWORD }}
        server-dir: '${ftpPath}'
        local-dir: './dist/'
` : ''}
`;

    const workflowPath = path.join(githubDir, 'build-and-deploy.yml');
    fs.writeFileSync(workflowPath, workflowContent, 'utf-8');
    generatedFiles.push({ provider: 'github', path: workflowPath, filename: '.github/workflows/build-and-deploy.yml' });
  }

  // 2. GitLab CI Configuration
  if (provider === 'gitlab' || provider === 'both') {
    const gitlabCiContent = `stages:
  - test
  - build
  - deploy

variables:
  DOTNET_VERSION: "10.0"
  NODE_VERSION: "22"

${enableDotnetBuild ? `dotnet_build:
  stage: build
  image: mcr.microsoft.com/dotnet/sdk:10.0
  script:
    - dotnet restore
    - dotnet build -c Release
  artifacts:
    paths:
      - bin/Release/
` : ''}
${enableFrontendBuild ? `frontend_build:
  stage: build
  image: node:22-alpine
  script:
    - npm ci || npm install
    - npm run build
  artifacts:
    paths:
      - dist/
` : ''}
${enableFtpDeploy ? `ftp_deploy:
  stage: deploy
  image: alpine:latest
  only:
    - main
  script:
    - apk add --no-cache lftp
    - lftp -c "open -u $FTP_USER,$FTP_PASS ${ftpHost}; mirror -R dist/ ${ftpPath}"
` : ''}
`;

    const gitlabPath = path.join(projectDir, '.gitlab-ci.yml');
    fs.writeFileSync(gitlabPath, gitlabCiContent, 'utf-8');
    generatedFiles.push({ provider: 'gitlab', path: gitlabPath, filename: '.gitlab-ci.yml' });
  }

  return {
    success: true,
    generatedFiles,
    message: `${generatedFiles.length} CI/CD Pipeline-Dateien erfolgreich erzeugt.`
  };
}
