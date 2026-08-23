export interface GeneratorContext {
  states: string[];
  effects: string[];
  imports: Set<string>;
  tables: any[];
  queries: any[];
  forms: any[];
  pages: any[];
  customComponents: any[];
  generateNode: (node: any, ctx: GeneratorContext) => string;
  currentContextVar?: string;
}
