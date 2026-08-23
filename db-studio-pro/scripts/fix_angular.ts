import fs from 'fs';

let comp = fs.readFileSync('utils/generators/angular/components.ts', 'utf8');

comp = comp.replace(
    /const collectAngularLookups = \(element: FormElement \| undefined, tables: Table\[\], accumulated: Set<string> = new Set\(\)\): string\[\] => \{/,
    'const collectAngularLookups = (element: FormElement | undefined, tables: Table[], queries: Query[] = [], accumulated: Set<string> = new Set()): string[] => {'
);

comp = comp.replace(
    /if \(table\) \{\n            accumulated.add\(table.name\);\n        \}/,
    `if (table) {
            accumulated.add(table.name);
        } else {
            const query = queries.find(q => q.id === element.lookup!.tableId);
            if (query) accumulated.add(query.name);
        }`
);

comp = comp.replace(
    /element\.children\.forEach\(child => collectAngularLookups\(child, tables, accumulated\)\);/,
    'element.children.forEach(child => collectAngularLookups(child, tables, queries, accumulated));'
);

comp = comp.replace(
    /const lookupTableNames = collectAngularLookups\(linkedForm\.layout, tables\);/g,
    'const lookupTableNames = collectAngularLookups(linkedForm.layout, tables, queries);'
);

comp = comp.replace(
    /generateHtmlForLayout\(linkedForm\.layout, tables, forms\)/g,
    'generateHtmlForLayout(linkedForm.layout, tables, forms, "data", queries)'
);

fs.writeFileSync('utils/generators/angular/components.ts', comp);

let layout = fs.readFileSync('utils/generators/angular/layoutHelper.ts', 'utf8');

layout = layout.replace(
    /export const generateHtmlForLayout = \(element: FormElement, tables: Table\[\], forms: Form\[\]\): string => \{/,
    'export const generateHtmlForLayout = (element: FormElement, tables: Table[], forms: Form[], dataObjName: string = "data", queries: any[] = []): string => {'
);

layout = layout.replace(
    /const children = element\.children\?\.map\(c => generateHtmlForLayout\(c, tables, forms\)\)\.join\('\\n'\) || '';/,
    'const children = element.children?.map(c => generateHtmlForLayout(c, tables, forms, dataObjName, queries)).join(\'\\n\') || \'\';'
);

layout = layout.replace(
    /generateHtmlForLayout\(subFormDef.layout, tables, forms\)/,
    'generateHtmlForLayout(subFormDef.layout, tables, forms, "subData", queries)'
);

layout = layout.replace(
    /const lookupTable = tables.find\(t => t.id === element.lookup!.tableId\);/,
    `let lookupTable: any = tables.find(t => t.id === element.lookup!.tableId);
             let isQuery = false;
             if (!lookupTable) {
                 lookupTable = queries.find((q: any) => q.id === element.lookup!.tableId);
                 if (lookupTable) {
                     isQuery = true;
                     lookupTable = { ...lookupTable, fields: lookupTable.columns || [] };
                 }
             }`
);

fs.writeFileSync('utils/generators/angular/layoutHelper.ts', layout);

