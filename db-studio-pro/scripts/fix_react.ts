import fs from 'fs';

let layout = fs.readFileSync('utils/generators/react/layoutHelper.ts', 'utf8');

layout = layout.replace(
    /export const collectLookups = \(element: FormElement, tables: Table\[\], accumulated: any\[\] = \[\]\) => \{/,
    'export const collectLookups = (element: FormElement, tables: Table[], queries: any[] = [], accumulated: any[] = []) => {'
);

layout = layout.replace(
    /const table = tables\.find\(t => t\.id === element\.lookup!\.tableId\);/,
    `let table: any = tables.find(t => t.id === element.lookup!.tableId);
        if (!table) table = queries.find((q: any) => q.id === element.lookup!.tableId);`
);

layout = layout.replace(
    /element\.children\.forEach\(child => collectLookups\(child, tables, accumulated\)\);/,
    'element.children.forEach(child => collectLookups(child, tables, queries, accumulated));'
);

layout = layout.replace(
    /export const generateJsxForLayout = \(element: FormElement, tables: Table\[\], forms: Form\[\], dataVar: string = 'data', modals: any\[\] = \[\]\): string => \{/,
    'export const generateJsxForLayout = (element: FormElement, tables: Table[], forms: Form[], dataVar: string = "data", modals: any[] = [], queries: any[] = []): string => {'
);

layout = layout.replace(
    /const children = element\.children\?\.map\(c => generateJsxForLayout\(c, tables, forms, dataVar, modals\)\)\.join\('\\n'\) || '';/,
    'const children = element.children?.map(c => generateJsxForLayout(c, tables, forms, dataVar, modals, queries)).join(\'\\n\') || \'\';'
);

layout = layout.replace(
    /const lookupTable = tables.find\(t => t.id === element.lookup!.tableId\);/,
    `let lookupTable: any = tables.find(t => t.id === element.lookup!.tableId);
             if (!lookupTable) {
                 lookupTable = queries.find((q: any) => q.id === element.lookup!.tableId);
                 if (lookupTable) {
                     lookupTable = { ...lookupTable, fields: lookupTable.columns || [] };
                 }
             }`
);

fs.writeFileSync('utils/generators/react/layoutHelper.ts', layout);

let pages = fs.readFileSync('utils/generators/react/pages.ts', 'utf8');

pages = pages.replace(
    /const lookups = form\.layout \? collectLookups\(form\.layout, tables\) : \[\];/,
    'const lookups = form.layout ? collectLookups(form.layout, tables, queries) : [];'
);

pages = pages.replace(
    /generateJsxForLayout\(form\.layout, tables, forms, 'data', requiredModals\)/,
    'generateJsxForLayout(form.layout, tables, forms, "data", requiredModals, queries)'
);

pages = pages.replace(
    /generateJsxForLayout\(m\.form\.layout, tables, forms, 'subData'\)/,
    'generateJsxForLayout(m.form.layout, tables, forms, "subData", [], queries)'
);

fs.writeFileSync('utils/generators/react/pages.ts', pages);
