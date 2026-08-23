import { Field } from './database';

export type TemplateCategory = 'crm' | 'pm' | 'finance' | 'fakturierung' | 'lookup' | 'org' | 'custom';

export interface TableTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  categoryLabel: string;
  icon: string;
  description: string;
  fields: Field[];
  sampleData?: any[];
  isCustom?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
