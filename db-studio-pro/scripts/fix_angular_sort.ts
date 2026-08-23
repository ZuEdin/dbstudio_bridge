import fs from 'fs';

let comp = fs.readFileSync('utils/generators/angular/components.ts', 'utf8');

comp = comp.replace(
    /const collectAngularLookups = \(element: FormElement \| undefined, tables: Table\[\], queries: Query\[\] = \[\], accumulated: Set<string> = new Set\(\)\): string\[\] => \{/g,
    `const collectAngularLookups = (element: FormElement | undefined, tables: Table[], queries: Query[] = [], accumulated: Map<string, any> = new Map()): any[] => {`
);

comp = comp.replace(
    /if \(table\) \{\n            accumulated\.add\(table\.name\);\n        \} else \{\n            const query = queries\.find\(q => q\.id === element\.lookup!\.tableId\);\n            if \(query\) accumulated\.add\(query\.name\);\n        \}/g,
    `
        let targetName = '';
        let sortInfo = undefined;
        if (table) {
            targetName = table.name;
            if (element.lookup!.sort) {
                const sortField = table.fields.find(f => f.id === element.lookup!.sort!.fieldId);
                if (sortField) sortInfo = { field: toCamelCase(sortField.name), dir: element.lookup!.sort!.direction };
            }
        } else {
            const query = queries.find(q => q.id === element.lookup!.tableId);
            if (query) {
                targetName = query.name;
                if (element.lookup!.sort) {
                    const sortField = (query as any).columns?.find((c: any) => c.id === element.lookup!.sort!.fieldId);
                    if (sortField) sortInfo = { field: toCamelCase(sortField.alias || sortField.fieldName), dir: element.lookup!.sort!.direction };
                }
            }
        }
        if (targetName && !accumulated.has(targetName)) {
            accumulated.set(targetName, { name: targetName, sort: sortInfo });
        }
    `
);

comp = comp.replace(
    /return Array\.from\(accumulated\);/g,
    'return Array.from(accumulated.values());'
);

comp = comp.replace(
    /const lookupTableNames = collectAngularLookups\(linkedForm\.layout, tables, queries\);/g,
    'const lookups = collectAngularLookups(linkedForm.layout, tables, queries);'
);

comp = comp.replace(
    /listDeclarations = lookupTableNames\.map\(name => `  public \$\{toCamelCase\(name\)\}List: any\[\] = \[\];`\)\.join\('\\n'\);/g,
    'listDeclarations = lookups.map((l: any) => `  public ${toCamelCase(l.name)}List: any[] = [];`).join(\'\\n\');'
);

comp = comp.replace(
    /listFetches = lookupTableNames\.map\(name => `    this\.api\.getAll\('\$\{toCamelCase\(name\)\}', 1, 10000\)\.subscribe\(\(res: any\) => this\.\$\{toCamelCase\(name\)\}List = res\.data \|\| res\);`\)\.join\('\\n'\);/g,
    `listFetches = lookups.map((l: any) => {
        const camel = toCamelCase(l.name);
        let sortLogic = '';
        if (l.sort) {
            const dir = l.sort.dir === 'DESC' ? -1 : 1;
            sortLogic = \`.sort((a: any, b: any) => (a.\${l.sort.field} > b.\${l.sort.field} ? \${dir} : -1 * \${dir}))\`;
        }
        return \`    this.api.getAll('\${camel}', 1, 10000).subscribe((res: any) => this.\${camel}List = (res.data || res)\${sortLogic});\`;
    }).join('\\n');`
);

fs.writeFileSync('utils/generators/angular/components.ts', comp);
