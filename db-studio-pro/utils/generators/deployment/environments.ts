import { BackendConfig, VirtualFile } from '../../../types/index';

export const generateEnvironmentBuildScripts = (config: BackendConfig, target: string): VirtualFile[] => {
    const files: VirtualFile[] = [];
    if (config.environments && config.environments.length > 0) {
        let shScript = `#!/bin/bash
# =========================================================
# DB STUDIO PRO - AUTOMATED ENV-BASED MULTI-BUILD PIPELINE
# =========================================================
# System target: ${target}
# Language backend: ${config.language}
# Framework frontend: ${config.frontendFramework || 'React'}

set -e

echo "========================================================="
echo "🚀 Starten des automatisierten Multi-Environment Builds..."
echo "========================================================="

# Helper to build frontend
build_frontend() {
    local env_name=$1
    local mode=$2
    local out_dir=$3
    
    echo "📦 Kompiliere Frontend für '\${env_name}'..."
    if [ -d "Frontend" ]; then
        cd Frontend
        npm install
        # Run specific mode build or fallback
        if grep -q "build:\${mode}" package.json; then
            npm run "build:\${mode}"
        else
            npx vite build --outDir "../\${out_dir}" --mode \${mode}
        fi
        cd ..
        echo "✓ Frontend für '\${env_name}' wurde in '\${out_dir}' ausgegeben."
    else
        echo "ℹ Kein Frontend-Ordner gefunden, überspringe..."
    fi
}

# Helper to build backend
build_backend() {
    local env_name=$1
    local connection=$2
    local out_dir=$3

    echo "⚙️ Verpacke und kompiliere Backend für '\${env_name}'..."
    
    # Language specific build actions
`;

        if (config.language === 'dotnet') {
            shScript += `    dotnet publish "Backend/${config.projectName}/${config.projectName}.csproj" -c Release -o "\${out_dir}/backend" /p:EnvironmentName=\${env_name}
    echo "✓ .NET Core Backend für '\${env_name}' wurde in '\${out_dir}/backend' veröffentlicht."
`;
        } else if (config.language === 'nodejs') {
            shScript += `    mkdir -p "\${out_dir}/backend"
    cp -r "Backend/${config.projectName}"/* "\${out_dir}/backend/"
    # Copy env file
    if [ -f "Backend/${config.projectName}/.env.\${env_name,,}" ]; then
        cp "Backend/${config.projectName}/.env.\${env_name,,}" "\${out_dir}/backend/.env"
    fi
    echo "✓ Node.js Backend für '\${env_name}' wurde nach '\${out_dir}/backend' kopiert."
`;
        } else if (config.language === 'php') {
            shScript += `    mkdir -p "\${out_dir}/backend"
    cp -r "Backend/${config.projectName}"/* "\${out_dir}/backend/"
    if [ -f "Backend/${config.projectName}/.env.\${env_name,,}" ]; then
        cp "Backend/${config.projectName}/.env.\${env_name,,}" "\${out_dir}/backend/.env"
    fi
    echo "✓ PHP Backend für '\${env_name}' wurde nach '\${out_dir}/backend' kopiert."
`;
        } else if (config.language === 'python') {
            shScript += `    mkdir -p "\${out_dir}/backend"
    cp -r "Backend/${config.projectName}"/* "\${out_dir}/backend/"
    if [ -f "Backend/${config.projectName}/.env.\${env_name,,}" ]; then
        cp "Backend/${config.projectName}/.env.\${env_name,,}" "\${out_dir}/backend/.env"
    fi
    echo "✓ Python Backend für '\${env_name}' wurde nach '\${out_dir}/backend' kopiert."
`;
        }

        shScript += `}\n\n`;

        config.environments.forEach(env => {
            const suffix = env.name === 'Production' ? 'prod' : env.name === 'Staging' ? 'staging' : 'dev';
            const buildFolder = env.buildPath || `./dist/${suffix}`;
            shScript += `# --- Build für Umgebung: ${env.name} ---
echo "---------------------------------------------------------"
echo "▶ Starte Kompilierung für Umgebung: ${env.name}"
echo "---------------------------------------------------------"
build_frontend "${env.name}" "${suffix}" "${buildFolder}"
build_backend "${env.name}" "${env.dbConnection || config.dbConnection || ''}" "${buildFolder}"\n\n`;
        });

        shScript += `echo "========================================================="
echo "🎉 ALLE BUILDS ERFOLGREICH ABGESCHLOSSEN!"
echo "========================================================="
`;

        files.push({
            name: 'build_environments.sh',
            path: `build_environments.sh`, // Put at main export root
            content: shScript,
            language: 'text'
        });

        // 5.2 Batch Script for Windows (build_environments.bat)
        let batScript = `@echo off
:: =========================================================
:: DB STUDIO PRO - AUTOMATED WINDOWS BUILD PIPELINE
:: =========================================================
echo =========================================================
echo Starting Automated Multi-Environment Build Process...
echo =========================================================

`;
        config.environments.forEach(env => {
            const suffix = env.name === 'Production' ? 'prod' : env.name === 'Staging' ? 'staging' : 'dev';
            const buildFolder = (env.buildPath || `./dist/${suffix}`).replace(/\//g, '\\\\');
            batScript += `echo ---------------------------------------------------------
echo Building Environment: ${env.name}
echo ---------------------------------------------------------
if exist Frontend (
    echo Compiling Frontend for ${env.name}...
    cd Frontend
    call npm install
    call npm run build:${suffix}
    cd ..
)
`;
            if (config.language === 'dotnet') {
                batScript += `echo Compiling .NET Core Backend for ${env.name}...
dotnet publish "Backend\\\\${config.projectName}\\\\${config.projectName}.csproj" -c Release -o "${buildFolder}\\\\backend" /p:EnvironmentName=${env.name}
`;
            } else {
                batScript += `echo Copying Backend files for ${env.name}...
xcopy "Backend\\\\${config.projectName}" "${buildFolder}\\\\backend" /E /I /Y
`;
            }
            batScript += `\n`;
        });

        batScript += `echo =========================================================
echo SUCCESS: All environments compiled successfully!
echo =========================================================
pause
`;

        files.push({
            name: 'build_environments.bat',
            path: `build_environments.bat`,
            content: batScript,
            language: 'text'
        });
    }

    return files;
};
