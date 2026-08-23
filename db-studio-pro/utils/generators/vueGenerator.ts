
import { Table, VirtualFile, BackendConfig, Query, SelectQuery, Relationship, Form } from '../../types/index';
import { toCamelCase, toPascalCase, isNullable, resolveType, toKebabCase } from './common';

const generateVueTemplateForLayout = (element: any, tables: Table[]): string => {
    if (!element) return '';
    if (element.type === 'container') {
        const children = element.children?.map((c: any) => generateVueTemplateForLayout(c, tables)).join('\n') || '';
        return `<div class="${element.className || 'space-y-4'}">\n${children}\n</div>`;
    }
    if (element.type === 'label') {
        return `<div class="${element.className || 'font-bold text-lg mb-2'}">${element.label}</div>`;
    }
    if (element.type === 'field' && element.fieldId) {
        let fieldName = '';
        let inputType = 'text';
        let foundField: any = null;
        for (const t of tables) {
            const f = t.fields.find(field => field.id === element.fieldId);
            if (f) {
                foundField = f;
                fieldName = f.name;
                if (f.type === 'INTEGER' || f.type === 'DECIMAL') inputType = 'number';
                if (f.type === 'DATE') inputType = 'date';
                else if (f.type === 'TIME') inputType = 'time';
                else if (f.type === 'DATETIME' || f.type === 'TIMESTAMP') inputType = 'datetime-local';
                break;
            }
        }
        if (!fieldName) return `<!-- Field not found -->`;
        const bindProp = toCamelCase(fieldName);
        
        if (foundField?.type === 'ENUM' || (foundField?.enumValues && foundField.enumValues.length > 0)) {
            const enumOptions = (foundField?.enumValues && foundField.enumValues.length > 0) ? foundField.enumValues : ['Option 1', 'Option 2'];
            const optHtml = enumOptions.map((o: string) => `<option value="${o.replace(/"/g, '&quot;')}">${o}</option>`).join('\n                ');
            return `
        <!-- ENUM DROPDOWN: ${fieldName} -->
        <!-- 1. Frontend: Add <option> here to add more choices -->
        <!-- 2. Database: Run ALTER TABLE or modify enum in DB Studio -->
        <div class="${element.className || 'mb-4'}">
            <label class="block text-sm font-bold mb-1">${element.label} <span class="text-xs text-indigo-500 font-normal">(Auswahl)</span></label>
            <select v-model="data.${bindProp}" class="w-full border rounded p-2 bg-white">
                <option value="">-- Bitte wählen (${element.label}) --</option>
                ${optHtml}
            </select>
        </div>`;
        }

        return `<div class="${element.className || 'mb-4'}">
            <label class="block text-sm font-bold mb-1">${element.label}</label>
            <input v-model="data.${bindProp}" type="${inputType}" class="w-full border rounded p-2" />
        </div>`;
    }
    return '';
};

export const generateVue = (
  tables: Table[], 
  relationships: Relationship[], 
  queries: Query[], 
  config: BackendConfig, 
  forms: Form[] = [],
  reports: any[] = [],
  pages: any[] = [],
  customComponents: any[] = []
): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const root = `Frontend`;
  const useAuth = config.authConfig?.useUserLogin;
  
  const wl = config.whitelabel || { appName: config.projectName || 'App', companyName: 'My Company', primaryColor: '#3b82f6', secondaryColor: '#1e293b', removeBranding: false };

  const isTailwind = config.stylingFramework === 'tailwind' || !config.stylingFramework;
  const isBootstrap = config.stylingFramework === 'bootstrap';

  const dependencies: any = { "vue": "^3.3.4", "vue-router": "^4.2.4", "axios": "^1.6.0", "lucide-vue-next": "^0.294.0" };
  const devDependencies: any = { "@vitejs/plugin-vue": "^4.2.3", "typescript": "^5.0.2", "vite": "^4.4.5", "vue-tsc": "^1.8.5" };

  if (isBootstrap) {
      dependencies["bootstrap"] = "^5.3.3";
  }

  // Always include Tailwind CSS dependencies for layout classes
  devDependencies["tailwindcss"] = "^3.3.0";
  devDependencies["postcss"] = "^8.4.0";
  devDependencies["autoprefixer"] = "^10.4.0";

  if (config.whitelabel?.customNpmPackages) {
      const pkgs = config.whitelabel.customNpmPackages.split(',').map(s => s.trim()).filter(s => s.length > 0);
      for (const pkg of pkgs) {
          dependencies[pkg] = 'latest';
      }
  }

  // 1. Configs & Base (package.json, index.html, main.ts, router)
  files.push({
      name: 'package.json', path: `${root}/package.json`,
      content: JSON.stringify({
          "name": (config.projectName || 'app').toLowerCase() + "-vue",
          "version": "1.0.0",
          "type": "module",
          "scripts": { "dev": "vite", "build": "vue-tsc && vite build", "preview": "vite preview" },
          "dependencies": dependencies,
          "devDependencies": devDependencies
      }, null, 2),
      language: 'json'
  });

  files.push({ name: 'vite.config.ts', path: `${root}/vite.config.ts`, content: `import { defineConfig } from 'vite';\nimport vue from '@vitejs/plugin-vue';\nimport path from 'path';\n\nexport default defineConfig({\n  plugins: [vue()],\n  base: './',\n  resolve: { alias: { '@': path.resolve(__dirname, './src') } },\n  server: { port: 3000 }\n});`, language: 'typescript' });
  
  // Always generate Tailwind config and PostCSS config to compile layout classes
  files.push({ name: 'tailwind.config.js', path: `${root}/tailwind.config.js`, content: `/** @type {import('tailwindcss').Config} */\nexport default {\n  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],\n  theme: { extend: {} },\n  plugins: [],\n}`, language: 'javascript' });
  files.push({ name: 'postcss.config.js', path: `${root}/postcss.config.js`, content: `export default { plugins: { tailwindcss: {}, autoprefixer: {} } }`, language: 'javascript' });

  if (isTailwind) {
      files.push({ name: 'style.css', path: `${root}/src/style.css`, content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;`, language: 'css' });
  } else if (isBootstrap) {
      files.push({ name: 'style.css', path: `${root}/src/style.css`, content: `@import 'bootstrap/dist/css/bootstrap.min.css';\n@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nbody {\n  background-color: #f8f9fa;\n}`, language: 'css' });
  } else {
      files.push({ name: 'style.css', path: `${root}/src/style.css`, content: `/* Custom CSS here */\nbody {\n  font-family: system-ui, -apple-system, sans-serif;\n}`, language: 'css' });
  }

  // Clean Index HTML (No CDN)
  files.push({ name: 'index.html', path: `${root}/index.html`, content: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${wl.appName}</title></head><body><div id="app"></div><script type="module" src="/src/main.ts"></script></body></html>`, language: 'html' });
  
  // Router Setup
  let routeEntries = [
      ...tables.map(t => {
          const p = toPascalCase(t.name);
          const c = toCamelCase(t.name);
          return `{ path: '/${c}', component: () => import('@/views/${p}List.vue') },\n    { path: '/${c}/:id', component: () => import('@/views/${p}Form.vue') }`;
      }),
      ...forms.map(f => {
          const p = toPascalCase(f.name);
          return `{ path: '/forms/${p.toLowerCase()}/:id', component: () => import('@/views/forms/${p}.vue') },\n    { path: '/forms/${p.toLowerCase()}', component: () => import('@/views/forms/${p}.vue') },\n    { path: '/form/${f.id}', component: () => import('@/views/forms/${p}.vue') },\n    { path: '/form/${f.id}/:id', component: () => import('@/views/forms/${p}.vue') },\n    { path: '/forms/${f.id}', component: () => import('@/views/forms/${p}.vue') }`;
      }),
      ...pages.map(p => {
          const kebab = toKebabCase(p.name);
          const pascal = toPascalCase(p.name);
          return `{ path: '/custom/${kebab}', component: () => import('@/views/custom/${pascal}.vue') },\n    { path: '/custom/${p.id}', component: () => import('@/views/custom/${pascal}.vue') },\n    { path: '/page/${p.id}', component: () => import('@/views/custom/${pascal}.vue') }`;
      })
  ];

  if (useAuth) {
      routeEntries = [`{ path: '/login', component: () => import('@/views/auth/Login.vue') }`, ...routeEntries];
  }

  const routerContent = `import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    ${routeEntries.join(',\n    ')}
  ]
});

export default router;`;
  files.push({ name: 'router.ts', path: `${root}/src/router/index.ts`, content: routerContent, language: 'typescript' });

  // 2. Views - Custom Designed Forms
  forms.forEach(form => {
      const p = toPascalCase(form.name);
      const sourceTable = tables.find(t => t.id === form.sourceId);
      if (!sourceTable) return;
      
      const camelTable = toCamelCase(sourceTable.name);
      const layoutHtml = form.layout ? generateVueTemplateForLayout(form.layout, tables) : '<p>Kein Layout.</p>';
      
      const content = `<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { get, post, put } from '@/services/api';

const route = useRoute();
const router = useRouter();
const data = ref<any>({});
const isNew = route.params.id === 'new';

onMounted(async () => {
    if (!isNew) {
        const res = await get('${camelTable}/' + route.params.id);
        data.value = res.data || res;
    }
});

const save = async () => {
    if (isNew) await post('${camelTable}', data.value);
    else await put('${camelTable}/' + route.params.id, data.value);
    router.push('/${camelTable}');
};
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <div class="bg-white p-8 rounded shadow">
        <h1 class="text-2xl font-bold mb-6">${form.name}</h1>
        <form @submit.prevent="save">
            ${layoutHtml}
            <div class="mt-8 flex justify-end gap-3">
                <button type="button" @click="router.back()" class="px-4 py-2 border rounded">Abbrechen</button>
                <button class="px-6 py-2 bg-primary text-white rounded font-bold">Speichern</button>
            </div>
        </form>
    </div>
  </div>
</template>`;
      files.push({ name: `${p}.vue`, path: `${root}/src/views/forms/${p}.vue`, content, language: 'html' });
  });

  // Basic List & Form Views for Tables
  tables.forEach(table => {
      const p = toPascalCase(table.name);
      const c = toCamelCase(table.name);
      const pk = toCamelCase(table.fields.find(f => f.isPrimaryKey)?.name || 'id');

       // List View
       files.push({
           name: `${p}List.vue`, path: `${root}/src/views/${p}List.vue`,
           content: `<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { get, remove } from '@/services/api';
import { Plus, Edit, Trash2, Eye } from 'lucide-vue-next';

const items = ref<any[]>([]);
const selectedItem = ref<any>(null);

const load = async () => { const res = await get('${c}'); items.value = res.data || res; };
onMounted(load);
const del = async (id: any) => { if(confirm('Löschen?')) { await remove('${c}/' + id); load(); } };

const viewDetails = (item: any) => { selectedItem.value = item; };
const closeDetails = () => { selectedItem.value = null; };
</script>
<template>
  <div>
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">${table.name}</h1>
        <router-link to="/${c}/new" class="bg-primary text-white px-4 py-2 rounded flex items-center gap-2"><Plus size={16}/> Neu</router-link>
    </div>
    <div class="bg-white rounded shadow overflow-hidden">
        <table class="w-full text-left">
            <thead class="bg-gray-50 border-b">
                <tr>${table.fields.map(f => `<th class="p-4 font-bold text-sm text-gray-600">${f.name}</th>`).join('')}<th class="p-4">Aktionen</th></tr>
            </thead>
            <tbody>
                <tr v-for="i in items" :key="i.${pk}" class="border-b hover:bg-gray-50">
                    ${table.fields.map(f => `<td class="p-4 text-sm">{{i.${toCamelCase(f.name)}}}</td>`).join('')}
                    <td class="p-4 text-right flex justify-end gap-3">
                        <button @click="viewDetails(i)" class="text-indigo-600 hover:text-indigo-800" title="Details"><Eye size={16}/></button>
                        <router-link :to="'/${c}/' + i.${pk}" class="text-blue-600 hover:text-blue-800" title="Bearbeiten"><Edit size={16}/></router-link>
                        <button @click="del(i.${pk})" class="text-red-600 hover:text-red-800" title="Löschen"><Trash2 size={16}/></button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Details Modal -->
    <div v-if="selectedItem" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click="closeDetails">
        <div class="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200" @click.stop>
            <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 class="text-lg font-bold text-slate-800">${table.name} Details</h3>
                <button @click="closeDetails" class="text-slate-400 hover:text-slate-600 transition">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <div class="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                ${table.fields.map(f => `
                <div class="grid grid-cols-3 gap-2 py-2 border-b border-slate-100 last:border-0 text-left">
                    <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">${f.name}</span>
                    <span class="col-span-2 text-sm text-slate-800 font-medium whitespace-pre-wrap">{{ selectedItem.${toCamelCase(f.name)} !== null && selectedItem.${toCamelCase(f.name)} !== undefined && selectedItem.${toCamelCase(f.name)} !== '' ? selectedItem.${toCamelCase(f.name)} : '-' }}</span>
                </div>`).join('')}
            </div>
            <div class="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                <router-link :to="'/${c}/' + selectedItem.${pk}" @click="closeDetails" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold shadow-sm transition">Bearbeiten</router-link>
                <button @click="closeDetails" class="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded text-sm font-semibold transition">Schließen</button>
            </div>
        </div>
    </div>
  </div>
</template>`, language: 'html'
       });

      // Default Form View (if no custom form exists)
      if (!forms.some(f => f.sourceId === table.id)) {
          files.push({
              name: `${p}Form.vue`, path: `${root}/src/views/${p}Form.vue`,
              content: `<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { get, post, put } from '@/services/api';
const route = useRoute(); const router = useRouter();
const data = ref<any>({}); const isNew = route.params.id === 'new';
onMounted(async () => { if(!isNew) { const res = await get('${c}/' + route.params.id); data.value = res.data || res; } });
const save = async () => { if(isNew) await post('${c}', data.value); else await put('${c}/' + route.params.id, data.value); router.push('/${c}'); };
</script>
<template>
  <div class="max-w-2xl mx-auto bg-white p-8 rounded shadow">
    <h1 class="text-xl font-bold mb-6">{{ isNew ? 'Neu' : 'Bearbeiten' }} ${table.name}</h1>
    <form @submit.prevent="save">
        ${table.fields.filter(f => !f.isAutoIncrement).map(f => `
        <div class="mb-4">
            <label class="block text-sm font-bold mb-1">${f.name}</label>
            <input v-model="data.${toCamelCase(f.name)}" class="w-full border rounded p-2" />
        </div>`).join('')}
        <div class="mt-6 flex justify-end gap-2">
            <button type="button" @click="router.back()" class="px-4 py-2 border rounded">Abbrechen</button>
            <button class="px-4 py-2 bg-primary text-white rounded">Speichern</button>
        </div>
    </form>
  </div>
</template>`, language: 'html'
          });
      }
  });

  const generateVueNode = (node: any, states: string[], methods: string[], onMountedCalls: string[]): string => {
      if (!node) return '';
      
      const suffix = node.id?.replace(/-/g, '_') || Math.random().toString(36).substring(7);
      let classNameStr = node.props?.className || '';
      let styleAttr = node.props?.style ? `style="${Object.entries(node.props.style).map(([k,v]) => `${toKebabCase(k)}:${v}`).join(';')}"` : '';
      
      switch (node.type) {
          case 'container': {
              const childrenStr = (node.children || []).map((c: any) => generateVueNode(c, states, methods, onMountedCalls)).join('\n');
              const defaultClass = isBootstrap ? 'p-3 border rounded bg-white' : 'p-4 border border-slate-200 rounded-xl bg-white shadow-sm';
              return `<div class="${classNameStr || defaultClass}" ${styleAttr}>\n${childrenStr}\n</div>`;
          }
          case 'text': {
              const defaultClass = isBootstrap ? 'text-break' : 'break-words text-slate-700';
              return `<div class="${defaultClass} ${classNameStr}" ${styleAttr}>${node.props?.text || ''}</div>`;
          }
          case 'button': {
              const defaultClass = isBootstrap ? 'btn btn-primary' : 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium shadow-xs';
              return `<button class="${defaultClass} ${classNameStr}" ${styleAttr}>${node.props?.label || 'Button'}</button>`;
          }
          case 'divider': {
              const defaultClass = isBootstrap ? 'my-4' : 'border-slate-200 my-4';
              return `<hr class="${defaultClass} ${classNameStr}" ${styleAttr} />`;
          }
          case 'image': {
              return `<img referrerPolicy="no-referrer" src="${node.props?.src || ''}" class="max-w-full h-auto rounded ${classNameStr}" ${styleAttr} alt="${node.props?.alt || ''}" />`;
          }
          case 'html': {
              return `<div v-html="'${(node.props?.html || '').replace(/'/g, "\\'")}'" class="${classNameStr}" ${styleAttr}></div>`;
          }
          case 'dropdown': {
              const stateName = `dropdownData_${suffix}`;
              const loadingState = `dropdownLoading_${suffix}`;
              states.push(`const ${stateName} = ref<any[]>([]);`);
              states.push(`const ${loadingState} = ref(false);`);
              
              let fetchUrl = '';
              if (node.props?.queryId) {
                  const qObj = queries.find(q => q.id === node.props.queryId);
                  if (qObj) fetchUrl = `queries/${toCamelCase(qObj.name)}`;
              } else if (node.props?.dataSourceId) {
                  const tObj = tables.find(t => t.id === node.props.dataSourceId);
                  if (tObj) fetchUrl = `${toCamelCase(tObj.name)}`;
              }
              
              if (fetchUrl) {
                  onMountedCalls.push(`loadDropdown_${suffix}();`);
                  methods.push(`
const loadDropdown_${suffix} = async () => {
  ${loadingState}.value = true;
  try {
    const res = await get('${fetchUrl}');
    ${stateName}.value = res.data || res || [];
  } catch (err) {
    console.error(err);
  } finally {
    ${loadingState}.value = false;
  }
};`);
              }
              
              const valueField = toCamelCase(node.props?.valueField || 'id');
              const labelField = toCamelCase(node.props?.labelField || 'name');
              
              return `
              <div class="mb-4 text-left">
                  <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">${node.props?.label || 'Auswahl'}</label>
                  <select class="w-full max-w-xs border border-slate-200 rounded-lg p-2.5 bg-white text-sm shadow-xs">
                      <option value="">${node.props?.placeholder || '-- Bitte wählen --'}</option>
                      <option v-if="${loadingState}" disabled>Lade Daten...</option>
                      <option v-else v-for="row in ${stateName}" :key="row.${valueField} || row.id" :value="row.${valueField} || row.id">
                          {{ row.${labelField} || row.name || row }}
                      </option>
                  </select>
              </div>`;
          }
          case 'custom_component': {
              const comp = (customComponents || []).find(c => c.id === node.props?.customComponentId);
              if (!comp) {
                  return `<div class="p-3 bg-yellow-50 text-yellow-800 text-center border border-yellow-200 rounded-xl text-sm font-medium">Custom Component nicht verknüpft oder nicht gefunden</div>`;
              }
              
              const conf = comp.configuration || {};
              const stateName = `compData_${suffix}`;
              const loadingState = `compLoading_${suffix}`;
              
              const dsType = conf.dataSourceType || (conf.tableId ? 'table' : '');
              const dsId = conf.dataSourceId || conf.tableId;
              let fetchUrl = '';
              if (dsType === 'table' && dsId) {
                  const tObj = tables.find(t => t.id === dsId);
                  if (tObj) fetchUrl = `${toCamelCase(tObj.name)}`;
              } else if (dsType === 'query' && dsId) {
                  const qObj = queries.find(q => q.id === dsId);
                  if (qObj) fetchUrl = `queries/${toCamelCase(qObj.name)}`;
              }
              
              if (fetchUrl) {
                  states.push(`const ${stateName} = ref<any[]>([]);`);
                  states.push(`const ${loadingState} = ref(false);`);
                  onMountedCalls.push(`loadComp_${suffix}();`);
                  methods.push(`
const loadComp_${suffix} = async () => {
  ${loadingState}.value = true;
  try {
    const res = await get('${fetchUrl}');
    ${stateName}.value = res.data || res || [];
  } catch (err) {
    console.error(err);
  } finally {
    ${loadingState}.value = false;
  }
};`);
              }
              
              if (comp.type === 'table_view') {
                  const searchState = `search_${suffix}`;
                  states.push(`const ${searchState} = ref('');`);
                  
                  const cols = conf.columns || [];
                  let tableHeaderHtml = '';
                  let tableBodyHtml = '';
                  if (cols.length > 0) {
                      tableHeaderHtml = cols.map((col: any) => `<th class="p-4 font-bold text-sm text-slate-600">${col.title || col.field}</th>`).join('');
                      tableBodyHtml = cols.map((col: any) => `<td class="p-4 text-sm text-slate-700">{{row['${col.field}']}}</td>`).join('');
                  } else {
                      tableHeaderHtml = `<th class="p-4 font-bold text-sm text-slate-600">Daten</th>`;
                      tableBodyHtml = `<td class="p-4 text-sm text-slate-700">{{row}}</td>`;
                  }
                  
                  return `
                  <div class="mb-6 text-left">
                      <div class="flex justify-between items-center mb-4">
                          <h4 class="text-lg font-bold text-slate-800">${conf.title || comp.name}</h4>
                          <input v-if="${conf.enableSearch ? 'true' : 'false'}" type="text" class="border border-slate-200 rounded-lg px-3 py-1.5 text-sm max-w-xs focus:ring-2 focus:ring-blue-500 outline-hidden shadow-xs" placeholder="Suchen..." v-model="${searchState}" />
                      </div>
                      <div v-if="${loadingState}" class="text-center py-6 text-sm text-slate-500">Lade Daten...</div>
                      <div v-else-if="${stateName}.length === 0" class="text-slate-400 text-center py-6 text-sm border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">Keine Daten vorhanden.</div>
                      <div v-else class="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
                          <table class="w-full text-left border-collapse bg-white">
                              <thead class="bg-slate-50 border-b border-slate-200">
                                  <tr>
                                      ${tableHeaderHtml}
                                  </tr>
                              </thead>
                              <tbody>
                                  <tr v-for="row in ${stateName}" :key="row.id || Math.random()" class="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                      ${tableBodyHtml}
                                  </tr>
                              </tbody>
                          </table>
                      </div>
                  </div>`;
              }
              
              if (comp.type === 'form_view') {
                  const formObj = forms.find(f => f.id === conf.formId);
                  const tbl = formObj ? tables.find(t => t.id === formObj.sourceId) : null;
                  if (tbl) {
                      const tblCamel = toCamelCase(tbl.name);
                      const fieldsToRender = tbl.fields.filter(f => !f.isAutoIncrement);
                      const formDataState = `formData_${suffix}`;
                      states.push(`const ${formDataState} = ref<Record<string, any>>({});`);
                      
                      methods.push(`
const submitForm_${suffix} = async () => {
  try {
    await post('${tblCamel}', ${formDataState}.value);
    alert('Erfolgreich gespeichert!');
    ${formDataState}.value = {};
  } catch (err) {
    console.error(err);
    alert('Fehler beim Speichern.');
  }
};`);
                      
                      return `
                      <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6 text-left">
                          <h4 v-if="!${conf.hideHeader ? 'true' : 'false'}" class="text-lg font-bold text-slate-800 mb-4">${formObj?.name || comp.name}</h4>
                          <form @submit.prevent="submitForm_${suffix}" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                              ${fieldsToRender.map(f => {
                                  const fCamel = toCamelCase(f.name);
                                  return `
                                  <div class="flex flex-col gap-1">
                                      <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">${f.name}</label>
                                      <input type="text" class="border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-hidden bg-white shadow-xs" v-model="${formDataState}['${fCamel}']" />
                                  </div>`;
                              }).join('\n')}
                              <div v-if="!${conf.hideActions ? 'true' : 'false'}" class="col-span-1 md:col-span-2 flex justify-end mt-4">
                                  <button class="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors shadow-xs">Speichern</button>
                              </div>
                          </form>
                      </div>`;
                  } else {
                      return `<div class="p-4 text-slate-400 text-center text-sm border border-slate-200 rounded-xl">Formular-Datenquelle nicht gefunden</div>`;
                  }
              }
              
              if (comp.type === 'text') {
                  const escapedText = (conf.text || '').replace(/'/g, "\\'");
                  return `<div class="text-slate-700 text-sm py-2 text-left">${escapedText}</div>`;
              }
              
              if (comp.type === 'button') {
                  return `<button class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all shadow-xs m-1">${conf.label || 'Aktions-Button'}</button>`;
              }
              
              if (comp.type === 'dropdown') {
                  const valF = toCamelCase(conf.valueField || 'id');
                  const dspF = toCamelCase(conf.displayField || 'name');
                  return `
                  <div class="mb-4 text-left">
                      <label v-if="'${conf.label || ''}'" class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">${conf.label}</label>
                      <select class="border border-slate-200 rounded-lg p-2.5 bg-white text-sm max-w-xs w-full shadow-xs">
                          <option value="">${conf.placeholder || '-- Bitte wählen --'}</option>
                          <option v-if="${loadingState}" disabled>Lade Daten...</option>
                          <option v-else v-for="row in ${stateName}" :key="row.${valF} || row.id" :value="row.${valF} || row.id">
                              {{ row.${dspF} || row.name || row }}
                          </option>
                      </select>
                  </div>`;
              }
              
              if (comp.type === 'metric_card') {
                  return `
                  <div class="bg-slate-50 border border-slate-200 p-6 rounded-xl text-left max-w-xs shadow-xs mb-4">
                      <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">${conf.title || 'Kennzahl'}</div>
                      <div class="text-3xl font-extrabold text-slate-800 mb-1">${conf.prefix || ''}12.345${conf.suffix || ''}</div>
                      <div class="text-xs text-slate-400 font-medium">${conf.subtext || 'Auswertung geladen'}</div>
                  </div>`;
              }
              
              if (comp.type === 'kanban_board') {
                  return `
                  <div class="mb-6 text-left">
                      <h4 class="text-base font-bold text-slate-800 mb-3">${conf.title || 'Kanban-Board'}</h4>
                      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
                              <div class="font-semibold text-slate-500 text-xs uppercase tracking-wider mb-3">Neu</div>
                              <div class="bg-white p-3 border border-slate-100 rounded-lg shadow-xs mb-2 text-sm font-medium text-slate-700">Beispiel Task 1</div>
                              <div class="bg-white p-3 border border-slate-100 rounded-lg shadow-xs text-sm font-medium text-slate-700">Beispiel Task 2</div>
                          </div>
                      </div>
                  </div>`;
              }
              
              return `<div class="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-center text-sm">[Custom Component \${comp.name} geladen]</div>`;
          }
          default:
              return `<div class="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 text-xs">\${node.type} Component</div>`;
      }
  };

  // Custom Pages
  pages.forEach(p => {
      const pascal = toPascalCase(p.name);
      const kebab = toKebabCase(p.name);
      
      const states: string[] = [];
      const methods: string[] = [];
      const onMountedCalls: string[] = [];
      
      const layoutHtml = generateVueNode(p.layout, states, methods, onMountedCalls);
      
      const content = `<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { get, post, put, remove } from '@/services/api';

${states.join('\n')}

onMounted(() => {
  ${onMountedCalls.join('\n  ')}
});

${methods.join('\n')}
</script>

<template>
  <div class="p-8">
      <div class="mb-6 flex justify-between items-center text-left">
          <h1 class="text-3xl font-bold text-slate-800">${p.name}</h1>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          ${layoutHtml}
      </div>
  </div>
</template>`;

      files.push({ name: `${pascal}.vue`, path: `${root}/src/views/custom/${pascal}.vue`, content, language: 'html' });
  });

  // HomeView
  files.push({
      name: 'HomeView.vue', path: `${root}/src/views/HomeView.vue`,
      content: `<script setup lang="ts">
import { Home } from 'lucide-vue-next';
</script>
<template>
  <div class="p-8 text-left max-w-4xl">
      <div class="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg mb-8">
          <h1 class="text-3xl font-bold mb-2">Willkommen bei \${wl.appName}</h1>
          <p class="text-blue-100 font-medium">Verwalten Sie Ihre Tabellen, benutzerdefinierten Formulare und Seiten direkt über das linke Navigationsmenü.</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 class="text-lg font-bold text-slate-800 mb-2">Schnellstart</h2>
              <p class="text-slate-600 text-sm mb-4">Navigieren Sie durch die verschiedenen Daten-Entitäten und erstellen Sie mühelos neue Einträge.</p>
          </div>
          <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 class="text-lg font-bold text-slate-800 mb-2">Whitelabeling</h2>
              <p class="text-slate-600 text-sm mb-4">Dieses Frontend wurde vollständig unter dem Namen <strong>\${wl.appName}</strong> und im Design Ihrer Corporate Identity erstellt.</p>
          </div>
      </div>
  </div>
</template>`,
      language: 'html'
  });

  // App.vue (unified Layout & elegant Sidebar)
  const appVueContent = `<script setup lang="ts">
import { ref } from 'vue';
import { 
  Database, 
  ChevronRight, 
  Menu, 
  User, 
  Settings, 
  Layers, 
  FileText, 
  BarChart, 
  Home 
} from 'lucide-vue-next';

const isCollapsed = ref(false);
const wl = ref({ appName: '${wl.appName}' });
</script>

<template>
  <div class="min-h-screen flex bg-slate-50 font-sans text-slate-800">
      <!-- Sidebar -->
      <aside 
          :class="[
              'bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col transition-all duration-300',
              isCollapsed ? 'w-16' : 'w-64'
          ]"
      >
          <!-- Sidebar Header -->
          <div class="h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950/40">
              <span v-if="!isCollapsed" class="font-bold text-lg text-white tracking-tight truncate">${wl.appName}</span>
              <span v-else class="font-bold text-lg text-white tracking-tight mx-auto">${wl.appName.charAt(0)}</span>
              <button @click="isCollapsed = !isCollapsed" class="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white hidden md:block">
                  <Menu size="18" />
              </button>
          </div>

          <!-- Sidebar Navigation -->
          <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              <router-link to="/" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all font-medium text-sm" active-class="bg-blue-600 text-white hover:bg-blue-600!">
                  <Home size="18" />
                  <span v-if="!isCollapsed">Übersicht</span>
              </router-link>

              <!-- Tables Section -->
              <div v-if="!isCollapsed" class="px-3 pt-4 pb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tabellen</div>
              ${tables.map(t => {
                  const c = toCamelCase(t.name);
                  return `
              <router-link to="/${c}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all font-medium text-sm" active-class="bg-blue-600 text-white hover:bg-blue-600!">
                  <Database size="18" />
                  <span v-if="!isCollapsed">${t.name}</span>
              </router-link>`;
              }).join('\n')}

              <!-- Custom Forms Section -->
              <div v-if="${forms.length > 0 ? 'true' : 'false'} && !isCollapsed" class="px-3 pt-4 pb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Formulare</div>
              ${forms.map(f => {
                  return `
              <router-link to="/forms/${f.name.toLowerCase()}/new" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all font-medium text-sm" active-class="bg-blue-600 text-white hover:bg-blue-600!">
                  <Layers size="18" />
                  <span v-if="!isCollapsed">${f.name}</span>
              </router-link>`;
              }).join('\n')}

              <!-- Custom Pages Section -->
              <div v-if="${pages.length > 0 ? 'true' : 'false'} && !isCollapsed" class="px-3 pt-4 pb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider font-bold">Seiten</div>
              ${pages.map(p => {
                  const kebab = toKebabCase(p.name);
                  return `
              <router-link to="/custom/${kebab}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all font-medium text-sm" active-class="bg-blue-600 text-white hover:bg-blue-600!">
                  <FileText size="18" />
                  <span v-if="!isCollapsed">${p.name}</span>
              </router-link>`;
              }).join('\n')}
          </nav>

          <!-- Sidebar Footer -->
          <div class="p-4 border-t border-slate-800 flex items-center gap-3 bg-slate-950/20" v-if="!isCollapsed">
              <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-sm">
                  U
              </div>
              <div class="truncate text-left flex-1">
                  <p class="text-sm font-bold text-white truncate">Administrator</p>
                  <p class="text-xs text-slate-500 truncate font-mono">admin@system.local</p>
              </div>
          </div>
      </aside>

      <!-- Main Layout -->
      <div class="flex-1 flex flex-col min-h-screen overflow-hidden">
          <!-- Main Header -->
          <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-xs">
              <div class="flex items-center gap-2">
                  <h2 class="text-sm font-semibold text-slate-500">System Dashboard</h2>
                  <ChevronRight size="14" class="text-slate-400" />
                  <span class="text-sm font-bold text-slate-800">{{ $route.path === '/' ? 'Übersicht' : $route.path.split('/').pop() }}</span>
              </div>
              <div class="flex items-center gap-4">
                  <button class="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors">
                      <Settings size="18" />
                  </button>
              </div>
          </header>

          <!-- Content Canvas -->
          <main class="flex-1 overflow-y-auto bg-slate-50">
              <router-view />
          </main>
      </div>
  </div>
</template>

<style>
/* Reset scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>`;

  files.push({ name: 'App.vue', path: `${root}/src/App.vue`, content: appVueContent, language: 'html' });

  // Base files (Sidebar, App, style)
  files.push({ name: 'main.ts', path: `${root}/src/main.ts`, content: `import { createApp } from 'vue';\nimport './style.css';\nimport App from './App.vue';\nimport router from './router';\n\ncreateApp(App).use(router).mount('#app');`, language: 'typescript' });
  
  // UPDATED: Added withCredentials: true & dynamic API_URL
  const apiContent = "import axios from 'axios';\n" +
                     "const API_URL = import.meta.env.VITE_API_URL || " +
                     "(typeof window !== 'undefined' ? " +
                     "(window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1') ? 'http://localhost:" + config.port + "/api/' : window.location.origin + '/api/') " +
                     ": '/api/');\n" +
                     "const api = axios.create({ baseURL: API_URL, withCredentials: true });\n" +
                     "export const get = async (e: string, p?: any) => (await api.get(e, { params: p })).data;\n" +
                     "export const post = async (e: string, d: any) => (await api.post(e, d)).data;\n" +
                     "export const put = async (e: string, d: any) => (await api.put(e, d)).data;\n" +
                     "export const remove = async (e: string) => await api.delete(e);";
  files.push({ name: 'api.ts', path: `${root}/src/services/api.ts`, content: apiContent, language: 'typescript' });

  return files;
};
