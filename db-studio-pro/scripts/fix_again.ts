import fs from 'fs';

let angular = fs.readFileSync('utils/generators/angular/layoutHelper.ts', 'utf8');
angular = angular.replace(
    /const children = element\.children\?\.map\(c => generateHtmlForLayout\(c, tables, forms\)\)\.join\('\\n'\) \|\| '';/g,
    'const children = element.children?.map(c => generateHtmlForLayout(c, tables, forms, dataObjName, queries)).join(\'\\n\') || \'\';'
);

// We still have error TS2339: Property 'alias' does not exist on type 'Field'.
// So instead of (f.name || f.alias || f.fieldName), we should cast `f` to `any`
angular = angular.replace(/\(f\.name \|\| f\.alias \|\| f\.fieldName\)/g, "((f as any).name || (f as any).alias || (f as any).fieldName)");
angular = angular.replace(/valField\.name \|\| valField\.alias \|\| valField\.fieldName/g, "(valField as any).name || (valField as any).alias || (valField as any).fieldName");

fs.writeFileSync('utils/generators/angular/layoutHelper.ts', angular);

let react = fs.readFileSync('utils/generators/react/layoutHelper.ts', 'utf8');
react = react.replace(
    /const children = element\.children\?\.map\(c => generateJsxForLayout\(c, tables, forms, dataVar, modals\)\)\.join\('\\n'\) \|\| '';/g,
    'const children = element.children?.map(c => generateJsxForLayout(c, tables, forms, dataVar, modals, queries)).join(\'\\n\') || \'\';'
);
react = react.replace(/\(f\.name \|\| f\.alias \|\| f\.fieldName\)/g, "((f as any).name || (f as any).alias || (f as any).fieldName)");
react = react.replace(/valField\.name \|\| valField\.alias \|\| valField\.fieldName/g, "(valField as any).name || (valField as any).alias || (valField as any).fieldName");

fs.writeFileSync('utils/generators/react/layoutHelper.ts', react);
