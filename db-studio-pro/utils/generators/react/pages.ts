import { Table, Form, Report, VirtualFile, Query, CustomPage } from '../../../types/index';
import { generateListPage } from './pages/listPageGenerator';
import { generateFormPage } from './pages/formPageGenerator';
import { generateCustomFormPage } from './pages/customFormPageGenerator';
import { generateQueryPage } from './pages/queryPageGenerator';
import { generateReportPage } from './pages/reportPageGenerator';
import { generateCustomPage } from './pages/customPageGenerator';

export const generateReactPages = (
  tables: Table[],
  forms: Form[],
  reports: Report[],
  root: string,
  queries: Query[] = [],
  pages: CustomPage[] = [],
  customComponents: any[] = []
): VirtualFile[] => {
  const files: VirtualFile[] = [];

  // 1. Table Lists (Standard CRUD) & Forms
  tables.forEach(table => {
    // Generate List Page
    files.push(generateListPage(table, forms, tables, root));

    // Generate Standard Form Page if no Custom Form override is defined
    const customForm = forms.find(f => f.sourceId === table.id && f.sourceType === 'table');
    if (!customForm) {
      files.push(generateFormPage(table, root));
    }
  });

  // 2. Custom Forms
  forms.forEach(form => {
    const customFormFile = generateCustomFormPage(form, tables, queries, root, forms);
    if (customFormFile) {
      files.push(customFormFile);
    }
  });

  // 3. Queries (Read-Only Select & Update/Action Queries)
  queries.forEach(query => {
    files.push(generateQueryPage(query, tables, root));
  });

  // 4. Reports (With Grouping)
  reports.forEach(report => {
    files.push(generateReportPage(report, tables, queries, root));
  });

  // 5. Custom Pages
  pages.forEach(page => {
    files.push(generateCustomPage(page, tables, queries, forms, root, pages, customComponents));
  });

  return files;
};
