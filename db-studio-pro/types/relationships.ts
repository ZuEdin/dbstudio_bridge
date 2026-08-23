export type ReferentialAction = 'NO ACTION' | 'CASCADE' | 'SET NULL' | 'RESTRICT';

export interface Relationship {
  id: string;
  fromTableId: string;
  fromFieldId: string;
  toTableId: string;
  toFieldId: string;
  fromTable?: string;
  fromField?: string;
  toTable?: string;
  toField?: string;
  type: '1:1' | '1:n' | '1:N' | 'n:m' | 'N:M';
  comment?: string;
  referentialIntegrity?: boolean;
  onDelete?: ReferentialAction;
  onUpdate?: ReferentialAction;
}
