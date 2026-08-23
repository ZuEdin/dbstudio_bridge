import { VirtualFile, BackendConfig } from '../../../types/index';

export const generateAngularModernConfigs = (config: BackendConfig, root: string): VirtualFile[] => {
  const files: VirtualFile[] = [];

  const devApiUrl = `http://localhost:${config.port}/api/`;
  let prodApiUrl = devApiUrl;
  let stagingApiUrl = devApiUrl;

  if (config.environments) {
    const prodEnv = config.environments.find(e => e.name === 'Production');
    const stagingEnv = config.environments.find(e => e.name === 'Staging');
    if (prodEnv && prodEnv.apiUrl) prodApiUrl = prodEnv.apiUrl;
    if (stagingEnv && stagingEnv.apiUrl) stagingApiUrl = stagingEnv.apiUrl;
  }

  const isBootstrap = config.stylingFramework?.toLowerCase() === 'bootstrap' || 
                      (config as any).frontendStyling?.toLowerCase() === 'bootstrap';

  const dependencies: Record<string, string> = {
    "@angular/animations": "^19.0.0",
    "@angular/common": "^19.0.0",
    "@angular/compiler": "^19.0.0",
    "@angular/core": "^19.0.0",
    "@angular/forms": "^19.0.0",
    "@angular/platform-browser": "^19.0.0",
    "@angular/platform-browser-dynamic": "^19.0.0",
    "@angular/router": "^19.0.0",
    "rxjs": "~7.8.1",
    "tslib": "^2.6.3",
    "zone.js": "~0.15.0",
    "xlsx": "^0.18.5",
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.2",
    "lucide-angular": "^0.460.0"
  };

  const devDependencies: Record<string, string> = {
    "@angular-devkit/build-angular": "^19.0.0",
    "@angular/cli": "^19.0.0",
    "@angular/compiler-cli": "^19.0.0",
    "typescript": "~5.6.2",
    "tailwindcss": "^3.4.15",
    "postcss": "^8.4.49",
    "autoprefixer": "^10.4.20"
  };

  if (isBootstrap) {
    dependencies["bootstrap"] = "^5.3.3";
  }

  const packageJsonContent = {
    name: `${(config.projectName || 'app').toLowerCase()}-angular-modern`,
    version: "1.0.0",
    private: true,
    scripts: {
      "ng": "ng",
      "start": "ng serve",
      "build": "ng build",
      "watch": "ng build --watch --configuration development"
    },
    dependencies,
    devDependencies
  };

  files.push({
    name: 'package.json',
    path: `${root}/package.json`,
    content: JSON.stringify(packageJsonContent, null, 2),
    language: 'json'
  });

  const angularJson = {
    "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
    "version": 1,
    "newProjectRoot": "projects",
    "projects": {
      "angular-client": {
        "projectType": "application",
        "schematics": {
          "@schematics/angular:component": {
            "style": "css",
            "standalone": true,
            "changeDetection": "OnPush"
          },
          "@schematics/angular:directive": {
            "standalone": true
          },
          "@schematics/angular:pipe": {
            "standalone": true
          }
        },
        "root": "",
        "sourceRoot": "src",
        "prefix": "app",
        "architect": {
          "build": {
            "builder": "@angular-devkit/build-angular:application",
            "options": {
              "outputPath": "dist/angular-client",
              "index": "src/index.html",
              "browser": "src/main.ts",
              "polyfills": ["zone.js"],
              "tsConfig": "tsconfig.app.json",
              "assets": [
                { "glob": "**/*", "input": "public" }
              ],
              "styles": [
                "src/styles.css"
              ],
              "scripts": []
            },
            "configurations": {
              "production": {
                "budgets": [
                  { "type": "initial", "maximumWarning": "1MB", "maximumError": "2MB" },
                  { "type": "anyComponentStyle", "maximumWarning": "4kB", "maximumError": "8kB" }
                ],
                "outputHashing": "all"
              },
              "development": {
                "optimization": false,
                "extractLicenses": false,
                "sourceMap": true
              }
            },
            "defaultConfiguration": "production"
          },
          "serve": {
            "builder": "@angular-devkit/build-angular:dev-server",
            "configurations": {
              "production": {
                "buildTarget": "angular-client:build:production"
              },
              "development": {
                "buildTarget": "angular-client:build:development"
              }
            },
            "defaultConfiguration": "development",
            "options": {
              "port": config.frontendPort || 4200
            }
          }
        }
      }
    }
  };

  files.push({
    name: 'angular.json',
    path: `${root}/angular.json`,
    content: JSON.stringify(angularJson, null, 2),
    language: 'json'
  });

  const tsconfig = {
    "compileOnSave": false,
    "compilerOptions": {
      "outDir": "./dist/out-tsc",
      "strict": true,
      "noImplicitOverride": true,
      "noPropertyAccessFromIndexSignature": true,
      "noImplicitReturns": true,
      "noFallthroughCasesInSwitch": true,
      "skipLibCheck": true,
      "isolatedModules": true,
      "esModuleInterop": true,
      "experimentalDecorators": true,
      "moduleResolution": "bundler",
      "importHelpers": true,
      "target": "ES2022",
      "module": "ES2022",
      "useDefineForClassFields": false,
      "lib": ["ES2022", "dom"]
    },
    "angularCompilerOptions": {
      "enableI18nLegacyMessageIdFormat": false,
      "strictInjectionParameters": true,
      "strictInputAccessModifiers": true,
      "strictTemplates": true
    }
  };

  files.push({
    name: 'tsconfig.json',
    path: `${root}/tsconfig.json`,
    content: JSON.stringify(tsconfig, null, 2),
    language: 'json'
  });

  const tsconfigApp = {
    "extends": "./tsconfig.json",
    "compilerOptions": {
      "outDir": "./dist/out-tsc/app",
      "types": []
    },
    "files": [
      "src/main.ts"
    ],
    "include": [
      "src/**/*.d.ts",
      "src/**/*.ts"
    ]
  };

  files.push({
    name: 'tsconfig.app.json',
    path: `${root}/tsconfig.app.json`,
    content: JSON.stringify(tsconfigApp, null, 2),
    language: 'json'
  });

  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        }
      }
    },
  },
  plugins: [],
}
`;

  files.push({
    name: 'tailwind.config.js',
    path: `${root}/tailwind.config.js`,
    content: tailwindConfig,
    language: 'javascript'
  });

  const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;

  files.push({
    name: 'postcss.config.js',
    path: `${root}/postcss.config.js`,
    content: postcssConfig,
    language: 'javascript'
  });

  const stylesCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-slate-50 text-slate-900 antialiased font-sans;
  }
}

/* Custom Scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #f1f5f9;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
`;

  files.push({
    name: 'styles.css',
    path: `${root}/src/styles.css`,
    content: stylesCss,
    language: 'css'
  });

  const indexHtml = `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>${config.projectName || 'Enterprise Portal'}</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body class="bg-slate-50 overflow-hidden font-sans">
  <app-root></app-root>
</body>
</html>
`;

  files.push({
    name: 'index.html',
    path: `${root}/src/index.html`,
    content: indexHtml,
    language: 'html'
  });

  // Environment files
  const envDev = `export const environment = {
  production: false,
  apiUrl: '${devApiUrl}',
  appName: '${config.projectName || 'DB Studio App'}'
};
`;

  const envProd = `export const environment = {
  production: true,
  apiUrl: '${prodApiUrl}',
  appName: '${config.projectName || 'DB Studio App'}'
};
`;

  files.push({
    name: 'environment.ts',
    path: `${root}/src/environments/environment.ts`,
    content: envDev,
    language: 'typescript'
  });

  files.push({
    name: 'environment.prod.ts',
    path: `${root}/src/environments/environment.prod.ts`,
    content: envProd,
    language: 'typescript'
  });

  return files;
};
