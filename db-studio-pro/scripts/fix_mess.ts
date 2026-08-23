import fs from 'fs';

let angular = fs.readFileSync('utils/generators/angular/layoutHelper.ts', 'utf8');
if (angular.startsWith("const children =")) {
    angular = angular.substring(angular.indexOf('import { Table'));
}
fs.writeFileSync('utils/generators/angular/layoutHelper.ts', angular);

let react = fs.readFileSync('utils/generators/react/layoutHelper.ts', 'utf8');
if (react.startsWith("const children =")) {
    react = react.substring(react.indexOf('import { Table'));
}
fs.writeFileSync('utils/generators/react/layoutHelper.ts', react);
