import fs from 'fs';

let layout = fs.readFileSync('utils/generators/react/layoutHelper.ts', 'utf8');

layout = layout.replace(
    /accumulated\.push\(\{/g,
    'accumulated.push({ sort: element.lookup!.sort,'
);

fs.writeFileSync('utils/generators/react/layoutHelper.ts', layout);

let pages = fs.readFileSync('utils/generators/react/pages.ts', 'utf8');

pages = pages.replace(
    /const \$\{l\.variableName\}Res = await get\('\$\{l\.endpoint\}', \{ pageSize: 10000 \}\); set\$\{toPascalCase\(l\.variableName\)\}\(\$\{l\.variableName\}Res\.data \|\| \$\{l\.variableName\}Res\);/g,
    `const \${l.variableName}Res = await get('\${l.endpoint}', { pageSize: 10000 });
            let \${l.variableName}Data = \${l.variableName}Res.data || \${l.variableName}Res;
            \${l.sort ? \`
                const sortField = \${l.table.fields?.find((f:any) => f.id === l.sort.fieldId) ? "'" + toCamelCase(l.table.fields?.find((f:any) => f.id === l.sort.fieldId).name || l.table.fields?.find((f:any) => f.id === l.sort.fieldId).alias || l.table.fields?.find((f:any) => f.id === l.sort.fieldId).fieldName) + "'" : 'null'};
                if (sortField) {
                    \${l.variableName}Data = \${l.variableName}Data.sort((a: any, b: any) => (a[sortField] > b[sortField] ? \${l.sort.direction === 'DESC' ? -1 : 1} : -1 * \${l.sort.direction === 'DESC' ? -1 : 1}));
                }
            \` : ''}
            set\${toPascalCase(l.variableName)}(\${l.variableName}Data);`
);

fs.writeFileSync('utils/generators/react/pages.ts', pages);

