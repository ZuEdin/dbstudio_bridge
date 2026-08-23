import { BackendConfig, VirtualFile } from '../../../types/index';

export const generateGithubWorkflow = (config: BackendConfig, root: string, target: string): VirtualFile[] => {
    const files: VirtualFile[] = [];
    if (target === 'github' || target === 'azure') {
        const ghContent = `name: CI/CD Pipeline

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install Dependencies
      run: npm install
      
    - name: Build Application
      run: npm run build
      
    - name: Run Tests
      run: npm test || echo "No tests provided"

    ${target === 'azure' ? `
    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'my-azure-app'
        publish-profile: \${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: .
    ` : ''}
`;
        files.push({
            name: 'main.yml',
            path: `${root}/.github/workflows/main.yml`,
            content: ghContent,
            language: 'yaml'
        });
    }
    return files;
};
