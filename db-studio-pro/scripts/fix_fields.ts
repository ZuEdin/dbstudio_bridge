import fs from 'fs';

let angular = fs.readFileSync('utils/generators/angular/layoutHelper.ts', 'utf8');

angular = angular.replace(
    /const valProp = valField \? toCamelCase\(valField\.name\) : 'id';/g,
    'const valProp = valField ? toCamelCase(valField.name || valField.alias || valField.fieldName) : "id";'
);

angular = angular.replace(
    /toCamelCase\(f\.name\)/g,
    'toCamelCase(f.name || f.alias || f.fieldName)'
);

angular = angular.replace(
    /f\.name/g,
    '(f.name || f.alias || f.fieldName)'
);

fs.writeFileSync('utils/generators/angular/layoutHelper.ts', angular);

let react = fs.readFileSync('utils/generators/react/layoutHelper.ts', 'utf8');

react = react.replace(
    /const valProp = valField \? toCamelCase\(valField\.name\) : 'id';/g,
    'const valProp = valField ? toCamelCase(valField.name || valField.alias || valField.fieldName) : "id";'
);

react = react.replace(
    /toCamelCase\(f\.name\)/g,
    'toCamelCase(f.name || f.alias || f.fieldName)'
);

fs.writeFileSync('utils/generators/react/layoutHelper.ts', react);
