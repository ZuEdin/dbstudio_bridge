import { Table, Field } from '../types/database';
import { TableTemplate, TemplateCategory } from '../types/tableTemplates';
import { BUILTIN_TABLE_TEMPLATES } from '../data/tableTemplates';

const STORAGE_KEY = 'dbstudio_custom_table_templates';

export const getBuiltinTemplates = (): TableTemplate[] => {
  return BUILTIN_TABLE_TEMPLATES;
};

export const getCustomTemplates = (): TableTemplate[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => ({
        ...item,
        isCustom: true,
        category: item.category || 'custom',
        categoryLabel: item.categoryLabel || 'Eigene Vorlagen',
        icon: item.icon || 'Bookmark'
      }));
    }
  } catch (e) {
    console.error('Error loading custom table templates:', e);
  }
  return [];
};

export const getAllTemplates = (): TableTemplate[] => {
  return [...getBuiltinTemplates(), ...getCustomTemplates()];
};

export const saveCustomTemplate = (template: TableTemplate): TableTemplate => {
  const existing = getCustomTemplates();
  const now = new Date().toISOString();
  
  const templateToSave: TableTemplate = {
    ...template,
    id: template.id || `custom_tpl_${Date.now()}`,
    isCustom: true,
    category: 'custom',
    categoryLabel: 'Eigene Vorlagen',
    icon: template.icon || 'Bookmark',
    updatedAt: now,
    createdAt: template.createdAt || now
  };

  const idx = existing.findIndex(t => t.id === templateToSave.id);
  let updatedList: TableTemplate[];
  if (idx >= 0) {
    updatedList = [...existing];
    updatedList[idx] = templateToSave;
  } else {
    updatedList = [templateToSave, ...existing];
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  } catch (e) {
    console.error('Error saving custom table template:', e);
  }

  return templateToSave;
};

export const deleteCustomTemplate = (templateId: string): boolean => {
  const existing = getCustomTemplates();
  const filtered = existing.filter(t => t.id !== templateId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (e) {
    console.error('Error deleting custom table template:', e);
    return false;
  }
};

export const exportCustomTemplatesJson = (): string => {
  const customTemplates = getCustomTemplates();
  return JSON.stringify(customTemplates, null, 2);
};

export const importCustomTemplatesJson = (jsonString: string): { success: boolean; count: number; error?: string } => {
  try {
    const parsed = JSON.parse(jsonString);
    const items = Array.isArray(parsed) ? parsed : [parsed];
    const existing = getCustomTemplates();
    let addedCount = 0;

    const merged = [...existing];
    items.forEach((item: any) => {
      if (item && item.name && Array.isArray(item.fields)) {
        const id = item.id ? `custom_${item.id.replace(/[^a-zA-Z0-9_]/g, '')}` : `custom_tpl_${Date.now()}_${addedCount}`;
        const newTemplate: TableTemplate = {
          id,
          name: item.name,
          category: 'custom',
          categoryLabel: 'Eigene Vorlagen',
          icon: item.icon || 'Bookmark',
          description: item.description || '',
          fields: item.fields,
          sampleData: item.sampleData || [],
          isCustom: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const existIdx = merged.findIndex(m => m.name.toLowerCase() === newTemplate.name.toLowerCase() || m.id === newTemplate.id);
        if (existIdx >= 0) {
          merged[existIdx] = newTemplate;
        } else {
          merged.push(newTemplate);
        }
        addedCount++;
      }
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return { success: true, count: addedCount };
  } catch (e: any) {
    return { success: false, count: 0, error: e.message || 'Ungültiges JSON-Format' };
  }
};

export const saveTableAsTemplate = (
  table: Table,
  options?: { name?: string; description?: string; icon?: string; includeDataAsSample?: boolean }
): TableTemplate => {
  const templateName = options?.name || table.name;
  const sampleData = options?.includeDataAsSample && Array.isArray(table.data) && table.data.length > 0 
    ? table.data.slice(0, 10) 
    : undefined;

  const newTemplate: TableTemplate = {
    id: `custom_tpl_${Date.now()}`,
    name: templateName,
    category: 'custom',
    categoryLabel: 'Eigene Vorlagen',
    icon: options?.icon || 'Bookmark',
    description: options?.description || table.description || `Benutzerdefinierte Vorlage basierend auf ${table.name}`,
    fields: JSON.parse(JSON.stringify(table.fields)),
    sampleData: sampleData ? JSON.parse(JSON.stringify(sampleData)) : [],
    isCustom: true
  };

  return saveCustomTemplate(newTemplate);
};

export const createTableFromTemplate = (
  template: TableTemplate,
  existingTables: Table[],
  includeSampleData: boolean = true
): Table => {
  // Determine unique table name
  let targetName = template.name;
  let counter = 1;
  const lowerNames = existingTables.map(t => t.name.toLowerCase());
  while (lowerNames.includes(targetName.toLowerCase())) {
    targetName = `${template.name}_${counter}`;
    counter++;
  }

  // Clone fields and generate fresh IDs
  const fields: Field[] = template.fields.map(f => ({
    ...f,
    id: crypto.randomUUID()
  }));

  // Ensure there is at least one primary key
  const hasPk = fields.some(f => f.isPrimaryKey);
  if (!hasPk && fields.length > 0) {
    fields[0].isPrimaryKey = true;
  }

  const sampleData = includeSampleData && template.sampleData && template.sampleData.length > 0
    ? JSON.parse(JSON.stringify(template.sampleData))
    : [];

  const tableId = `table_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  return {
    id: tableId,
    name: targetName,
    description: template.description,
    fields,
    data: sampleData
  };
};
