import { Table, VirtualFile } from '../../../types/index';
import { toPascalCase, resolveType, isNullable } from '../common';

export const generateMauiNativeModels = (
  tables: Table[],
  namespace: string,
  root: string
): VirtualFile[] => {
  const files: VirtualFile[] = [];
  tables.forEach(table => {
    const className = toPascalCase(table.name);
    const props = table.fields.map(f => `        public ${resolveType(f, 'csharp')}${isNullable(f) ? '?' : ''} ${toPascalCase(f.name)} { get; set; }`).join('\n');
    files.push({ 
      name: `${className}.cs`, 
      path: `${root}/Models/${className}.cs`, 
      content: `namespace ${namespace}.Models
{
    public class ${className}
    {
${props}
    }
}`, 
      language: 'csharp' 
    });
  });
  return files;
};
