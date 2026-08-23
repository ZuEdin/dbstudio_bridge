import fs from 'fs';

let content = fs.readFileSync('utils/generators/angular/components.ts', 'utf8');
content = content.replace(/this\.api\.getAll\('\$\{fetchUrl\}', 1, 1000\)\.subscribe\(\{/g, "this.api.getAll('${fetchUrl}', 1, 10000).subscribe({");
fs.writeFileSync('utils/generators/angular/components.ts', content);
