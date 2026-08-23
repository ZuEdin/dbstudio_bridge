
import { VirtualFile, BackendConfig } from '../../../types/index';

export const generateAngularConfigs = (config: BackendConfig, root: string): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const useAuth = config.authConfig?.useUserLogin;
  
  // Defaults
  const devApiUrl = `http://localhost:${config.port}/api/`;
  let prodApiUrl = devApiUrl;
  let stagingApiUrl = devApiUrl;
  
  // Extract Environment Configs
  if (config.environments) {
      const prodEnv = config.environments.find(e => e.name === 'Production');
      const stagingEnv = config.environments.find(e => e.name === 'Staging');
      
      if (prodEnv && prodEnv.apiUrl) prodApiUrl = prodEnv.apiUrl;
      if (stagingEnv && stagingEnv.apiUrl) stagingApiUrl = stagingEnv.apiUrl;
  }

  const isBootstrap = config.stylingFramework?.toLowerCase() === 'bootstrap' || 
                      (config as any).frontendStyling?.toLowerCase() === 'bootstrap' || 
                      (config as any).styling?.toLowerCase() === 'bootstrap';
  const isTailwind = !isBootstrap;

  // Build package.json dependencies
  const dependencies: any = {
      "@angular/common":"^18.0.0",
      "@angular/core":"^18.0.0",
      "@angular/forms":"^18.0.0",
      "@angular/platform-browser":"^18.0.0", 
      "@angular/platform-browser-dynamic":"^18.0.0",
      "@angular/router":"^18.0.0",
      "rxjs":"~7.8.0",
      "@fullcalendar/core":"^6.1.11",
      "@fullcalendar/angular":"^6.1.10",
      "@fullcalendar/daygrid":"^6.1.11",
      "@fullcalendar/timegrid":"^6.1.11",
      "@fullcalendar/interaction":"^6.1.11",
      "@fullcalendar/list":"^6.1.11",
      "tslib":"^2.3.0",
      "zone.js":"~0.14.0",
      "xlsx":"^0.18.5",
      "jspdf":"^2.5.1",
      "jspdf-autotable":"^3.8.1"
  };

  const devDependencies: any = {
      "@angular-devkit/build-angular":"^18.0.0",
      "@angular/cli":"^18.0.0",
      "@angular/compiler-cli":"^18.0.0",
      "typescript":"~5.4.2"
  };

  if (isBootstrap) {
      dependencies["bootstrap"] = "^5.3.3";
  }

  // Always include Tailwind CSS dependencies for layout utility classes
  devDependencies["tailwindcss"] = "^3.4.4";
  devDependencies["postcss"] = "^8.4.38";
  devDependencies["autoprefixer"] = "^10.4.19";

  if (config.whitelabel?.customNpmPackages) {
      const pkgs = config.whitelabel.customNpmPackages.split(',').map(s => s.trim()).filter(s => s.length > 0);
      for (const pkg of pkgs) {
          dependencies[pkg] = 'latest';
      }
  }

  const packageJsonContent = {
    "name":"angular-client",
    "version":"0.0.0",
    "scripts":{
      "start":"ng serve",
      "build":"ng build",
      "build:staging":"ng build --configuration staging",
      "build:prod":"ng build --configuration production"
    },
    "dependencies": dependencies,
    "devDependencies": devDependencies
  };

  files.push({ name: 'package.json', path: `${root}/package.json`, content: JSON.stringify(packageJsonContent, null, 2), language: 'json' });
  
  const styles = ["src/styles.css"];
  const scripts: string[] = [];

  if (isBootstrap) {
    styles.unshift("node_modules/bootstrap/dist/css/bootstrap.min.css");
    scripts.push("node_modules/bootstrap/dist/js/bootstrap.bundle.min.js");
  }

  const angularJson = {
    "version": 1,
    "projects": {
      "angular-client": {
        "projectType": "application",
        "root": "",
        "sourceRoot": "src",
        "prefix": "app",
        "architect": {
          "build": {
            "builder": "@angular-devkit/build-angular:browser",
            "options": {
              "outputPath": "dist/angular-client",
              "baseHref": "./",
              "index": "src/index.html",
              "main": "src/main.ts",
              "polyfills": ["src/polyfills.ts"],
              "tsConfig": "tsconfig.app.json",
              "assets": ["src/favicon.ico", "src/assets"],
              "styles": styles,
              "scripts": scripts
            },
            "configurations": {
              "production": {
                "budgets": [{ "type": "initial", "maximumWarning": "25mb", "maximumError": "50mb" }, { "type": "anyComponentStyle", "maximumWarning": "10mb", "maximumError": "20mb" }],
                "outputHashing": "all",
                "fileReplacements": [
                  {
                    "replace": "src/environments/environment.ts",
                    "with": "src/environments/environment.prod.ts"
                  }
                ]
              },
              "staging": {
                "budgets": [{ "type": "initial", "maximumWarning": "25mb", "maximumError": "50mb" }, { "type": "anyComponentStyle", "maximumWarning": "10mb", "maximumError": "20mb" }],
                "outputHashing": "all",
                "fileReplacements": [
                  {
                    "replace": "src/environments/environment.ts",
                    "with": "src/environments/environment.staging.ts"
                  }
                ]
              },
              "development": {
                "buildOptimizer": false,
                "optimization": false,
                "vendorChunk": true,
                "extractLicenses": false,
                "sourceMap": true,
                "namedChunks": true
              }
            },
            "defaultConfiguration": "production"
          },
          "serve": {
            "builder": "@angular-devkit/build-angular:dev-server",
            "configurations": {
              "production": { "browserTarget": "angular-client:build:production" },
              "staging": { "browserTarget": "angular-client:build:staging" },
              "development": { "browserTarget": "angular-client:build:development" }
            },
            "defaultConfiguration": "development"
          }
        }
      }
    }
  };
  files.push({ name: 'angular.json', path: `${root}/angular.json`, content: JSON.stringify(angularJson, null, 2), language: 'json' });
  
  // Environments
  const getApiUrlExpr = (url: string) => {
      let norm = url || `http://localhost:${config.port || 3000}/api/`;
      if (!norm.endsWith('/')) norm += '/';
      const localhostTarget = norm.startsWith('http') ? norm : `http://localhost:${config.port || 3000}/api/`;
      return `typeof window !== 'undefined' ? (window.location.protocol === 'file:' || !window.location.origin.startsWith('http') ? '${localhostTarget}' : (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1') ? '${localhostTarget}' : window.location.origin + '/api/')) : '${localhostTarget}'`;
  };

  files.push({
      name: 'environment.ts',
      path: `${root}/src/environments/environment.ts`,
      content: `export const environment = {
  production: false,
  apiUrl: ${getApiUrlExpr(devApiUrl)}
};`,
      language: 'typescript'
  });
  files.push({
      name: 'environment.prod.ts',
      path: `${root}/src/environments/environment.prod.ts`,
      content: `export const environment = {
  production: true,
  apiUrl: ${getApiUrlExpr(prodApiUrl)}
};`,
      language: 'typescript'
  });
  files.push({
      name: 'environment.staging.ts',
      path: `${root}/src/environments/environment.staging.ts`,
      content: `export const environment = {
  production: false,
  apiUrl: ${getApiUrlExpr(stagingApiUrl)}
};`,
      language: 'typescript'
  });

  files.push({ name: 'tsconfig.json', path: `${root}/tsconfig.json`, content: JSON.stringify({ "compileOnSave": false, "compilerOptions": { "baseUrl": "./", "outDir": "./dist/out-tsc", "forceConsistentCasingInFileNames": true, "strict": true, "noImplicitOverride": true, "noPropertyAccessFromIndexSignature": true, "noImplicitReturns": true, "noFallthroughCasesInSwitch": true, "sourceMap": true, "declaration": false, "downlevelIteration": true, "experimentalDecorators": true, "moduleResolution": "node", "importHelpers": true, "target": "ES2022", "module": "ES2022", "useDefineForClassFields": false, "lib": ["ES2022", "dom"] }, "angularCompilerOptions": { "enableI18nLegacyMessageIdFormat": false, "strictInjectionParameters": true, "strictInputAccessModifiers": true, "strictTemplates": true } }, null, 2), language: 'json' });
  files.push({ name: 'tsconfig.app.json', path: `${root}/tsconfig.app.json`, content: JSON.stringify({ "extends": "./tsconfig.json", "compilerOptions": { "outDir": "./dist/out-tsc/app", "types": [] }, "files": ["src/main.ts", "src/polyfills.ts"], "include": ["src/**/*.d.ts"] }, null, 2), language: 'json' });
  
  // Always generate Tailwind config and postcss config to compile the layout classes
  files.push({ name: 'tailwind.config.js', path: `${root}/tailwind.config.js`, content: `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: { extend: {} },
  plugins: [],
}`, language: 'javascript' });
  files.push({ name: 'postcss.config.js', path: `${root}/postcss.config.js`, content: `module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }`, language: 'javascript' });

  if (isTailwind) {
      files.push({ name: 'styles.css', path: `${root}/src/styles.css`, content: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #f8fafc;
  color: #0f172a;
}`, language: 'css' });
  } else if (isBootstrap) {
      files.push({ name: 'styles.css', path: `${root}/src/styles.css`, content: `@import 'bootstrap/dist/css/bootstrap.min.css';
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #f8f9fa;
}`, language: 'css' });
  } else {
      files.push({ name: 'styles.css', path: `${root}/src/styles.css`, content: `/* Custom CSS here */
body {
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #f8fafc;
  color: #0f172a;
}`, language: 'css' });
  }

  files.push({ name: 'polyfills.ts', path: `${root}/src/polyfills.ts`, content: `import 'zone.js';`, language: 'typescript' });
  
  const mainTsContent = `import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient${useAuth ? ', withInterceptors' : ''} } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';
${useAuth ? "import { authInterceptor } from './app/interceptors/auth.interceptor';" : ""}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(${useAuth ? 'withInterceptors([authInterceptor])' : ''})
  ]
}).catch(err => console.error(err));
`;
  files.push({ name: 'main.ts', path: `${root}/src/main.ts`, content: mainTsContent, language: 'typescript' });
  
  const appComponentTs = `import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: '<router-outlet></router-outlet>'
})
export class AppComponent {
  title = '${config.projectName}';
}
`;
  files.push({ name: 'app.component.ts', path: `${root}/src/app/app.component.ts`, content: appComponentTs, language: 'typescript' });

  files.push({ name: 'index.html', path: `${root}/src/index.html`, content: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${config.projectName}</title><base href="./"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><app-root></app-root></body></html>`, language: 'html' });

  return files;
};
