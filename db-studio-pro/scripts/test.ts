import fs from 'fs';
let c = fs.readFileSync('utils/generators/angular/components.ts', 'utf8');
console.log(c.substring(0, 1000));
