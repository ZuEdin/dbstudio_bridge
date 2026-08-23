
import { VirtualFile, BackendConfig } from '../../../types/index';

export const generateReactConfigs = (config: BackendConfig, root: string): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const fePort = config.frontendPort || 5173;
  
  // Build Scripts based on Environments
  const scripts: Record<string, string> = { 
      "dev": "vite", 
      "build": "tsc && vite build", 
      "preview": "vite preview" 
  };

  if (config.environments) {
      config.environments.forEach(env => {
          const suffix = env.name === 'Production' ? 'prod' : env.name === 'Staging' ? 'staging' : 'dev';
          const outDir = env.buildPath || `dist/${suffix}`;
          // Add specific build command for this environment
          scripts[`build:${suffix}`] = `tsc && vite build --outDir "${outDir}" --mode ${suffix}`;
      });
  }

  const isTailwind = config.stylingFramework === 'tailwind' || !config.stylingFramework;
  const isBootstrap = config.stylingFramework === 'bootstrap';

  const dependencies: any = { 
      "axios": "^1.7.9", 
      "react": "^18.3.1", 
      "react-dom": "^18.3.1", 
      "react-router-dom": "^6.28.0", 
      "lucide-react": "^0.460.0", 
      "clsx": "^2.1.1", 
      "tailwind-merge": "^2.3.0",
      "react-joyride": "^2.8.2",
      "react-big-calendar": "^1.13.0",
      "date-fns": "^3.6.0",
      "xlsx": "^0.18.5",
      "jspdf": "^2.5.1",
      "jspdf-autotable": "^3.8.1",
      "react-markdown": "^9.0.1",
      "remark-gfm": "^4.0.0"
  };

  const devDependencies: any = { 
      "@types/react": "^18.3.3", 
      "@types/react-dom": "^18.3.0", 
      "@vitejs/plugin-react": "^4.3.4",
       "@types/react-big-calendar": "^1.8.9", 
      "typescript": "^5.4.5", 
      "vite": "^5.4.14" 
  };

  if (isBootstrap) {
      dependencies["bootstrap"] = "^5.3.3";
      dependencies["react-bootstrap"] = "^2.10.2";
  }

  // Always include Tailwind CSS devDependencies for utility classes used in templates
  devDependencies["autoprefixer"] = "^10.4.19";
  devDependencies["postcss"] = "^8.4.38";
  devDependencies["tailwindcss"] = "^3.4.4";

  if (config.whitelabel?.customNpmPackages) {
      const pkgs = config.whitelabel.customNpmPackages.split(',').map(s => s.trim()).filter(s => s.length > 0);
      for (const pkg of pkgs) {
          dependencies[pkg] = 'latest';
      }
  }

  const packageJson = {
    "name": "react-client",
    "private": true,
    "version": "0.0.0",
    "type": "module",
    "scripts": scripts,
    "dependencies": dependencies,
    "devDependencies": devDependencies
  };
  files.push({ name: 'package.json', path: `${root}/package.json`, content: JSON.stringify(packageJson, null, 2), language: 'json' });

  const tsConfig = {
    "compilerOptions": { "target": "ES2020", "useDefineForClassFields": true, "lib": ["ES2020", "DOM", "DOM.Iterable"], "module": "ESNext", "skipLibCheck": true, "moduleResolution": "bundler", "allowImportingTsExtensions": true, "resolveJsonModule": true, "isolatedModules": true, "noEmit": true, "jsx": "react-jsx", "strict": false, "noUnusedLocals": false, "noUnusedParameters": false, "noImplicitAny": false, "noFallthroughCasesInSwitch": true },
    "include": ["src"], "references": [{ "path": "./tsconfig.node.json" }]
  };
  files.push({ name: 'tsconfig.json', path: `${root}/tsconfig.json`, content: JSON.stringify(tsConfig, null, 2), language: 'json' });
  files.push({ name: 'vite-env.d.ts', path: `${root}/src/vite-env.d.ts`, content: '/// <reference types="vite/client" />\n', language: 'typescript' });

  const tsConfigNode = {
    "compilerOptions": {
      "composite": true,
      "skipLibCheck": true,
      "module": "ESNext",
      "moduleResolution": "bundler",
      "allowSyntheticDefaultImports": true
    },
    "include": ["vite.config.ts"]
  };
  files.push({ name: 'tsconfig.node.json', path: `${root}/tsconfig.node.json`, content: JSON.stringify(tsConfigNode, null, 2), language: 'json' });

  if (isTailwind) {
      files.push({ name: 'index.css', path: `${root}/src/index.css`, content: `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  input:not([type="checkbox"]):not([type="radio"]), select, textarea {
    @apply bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700;
  }
}

body {
  @apply bg-gray-50 text-slate-900 dark:bg-gray-900 dark:text-slate-100;
}`, language: 'css' });
  } else if (isBootstrap) {
      files.push({ name: 'index.css', path: `${root}/src/index.css`, content: `@import 'bootstrap/dist/css/bootstrap.min.css';
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #f8f9fa;
}`, language: 'css' });
  } else {
      files.push({ name: 'index.css', path: `${root}/src/index.css`, content: `/* Custom CSS here */
body {
  font-family: system-ui, -apple-system, sans-serif;
}`, language: 'css' });
  }

  files.push({ name: 'vite.config.ts', path: `${root}/vite.config.ts`, content: `import { defineConfig } from 'vite'; import react from '@vitejs/plugin-react'; export default defineConfig({ plugins: [react()], base: './', server: { port: ${fePort} } });`, language: 'typescript' });
  
  const wl: any = config.whitelabel || { primaryColor: '#3b82f6', secondaryColor: '#1e293b' };
  
  if (isTailwind || isBootstrap) {
      files.push({ name: 'tailwind.config.js', path: `${root}/tailwind.config.js`, content: `export default { 
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"], 
  theme: { 
    extend: {
      fontFamily: {
        sans: ['${wl.fontFamily || 'Inter'}', 'sans-serif'],
      },
      colors: {
        primary: { 
          DEFAULT: '${wl.primaryColor || '#3b82f6'}',
          dark: '${wl.darkModeColors?.primary || wl.primaryColor || '#3b82f6'}'
        },
        secondary: '${wl.secondaryColor || '#1e293b'}',
        accent: '${wl.accentColor || '#8b5cf6'}',
        success: '${wl.successColor || '#10b981'}',
        warning: '${wl.warningColor || '#f59e0b'}',
        danger: '${wl.errorColor || '#ef4444'}',
        dark: { background: '${wl.darkModeColors?.background || '#0f172a'}' }
      },
      boxShadow: {
        'theme-sm': '${wl.elevation === 'none' ? 'none' : '0 1px 2px 0 rgb(0 0 0 / 0.05)'}',
        'theme-md': '${wl.elevation === 'none' ? 'none' : '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'}',
        'theme-lg': '${wl.elevation === 'none' ? 'none' : '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'}'
      },
      borderRadius: {
        'theme': '${wl.borderRadius === 'none' ? '0' : wl.borderRadius === 'sm' ? '0.25rem' : wl.borderRadius === 'lg' ? '0.75rem' : wl.borderRadius === 'full' ? '9999px' : '0.5rem'}'
      }
    } 
  }, 
  plugins: [] 
}`, language: 'javascript' });
      
      files.push({ name: 'postcss.config.js', path: `${root}/postcss.config.js`, content: `export default { plugins: { tailwindcss: {}, autoprefixer: {} } }`, language: 'javascript' });
  }

  // Generate .env files for Vite
  const normalizeApiUrl = (url: string) => {
      let u = (url || '').trim();
      if (!u) return 'http://localhost:3000/api/';
      if (!u.endsWith('/')) u += '/';
      if (!u.includes('/api/')) u = u.replace(/\/+$/, '') + '/api/';
      return u;
  };
  const rawDefaultApiUrl = config.apiBaseUrl || `http://localhost:${config.port || 3000}`;
  const defaultApiUrl = normalizeApiUrl(rawDefaultApiUrl);
  files.push({
      name: '.env',
      path: `${root}/.env`,
      content: `VITE_API_URL=${defaultApiUrl}
`,
      language: 'text'
  });

  if (config.environments) {
      config.environments.forEach(env => {
          const mode = env.name === 'Production' ? 'production' : env.name === 'Staging' ? 'staging' : 'development';
          const envApiUrl = env.apiUrl ? normalizeApiUrl(env.apiUrl) : defaultApiUrl;
          let envContent = `VITE_API_URL=${envApiUrl}
`;
          if (env.vars) {
              Object.entries(env.vars).forEach(([k, v]) => {
                  envContent += `${k}=${v}
`;
              });
          }
          files.push({
              name: `.env.${mode}`,
              path: `${root}/.env.${mode}`,
              content: envContent,
              language: 'text'
          });
      });
  }
  
  return files;
};
