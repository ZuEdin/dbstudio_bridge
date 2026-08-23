export interface TextStyle {
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
  borderBottom?: boolean;
}

export interface FormattingRule {
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
  value: string;
  style: TextStyle;
}

export type ColumnRenderType = 'text' | 'qrcode' | 'barcode' | 'badge' | 'currency' | 'date' | 'image';

export interface ReportColumn {
  fieldId: string;
  label: string;
  visible: boolean;
  order: number;
  renderType?: ColumnRenderType;
  formattingRules?: FormattingRule[];
}

export interface ReportSummary {
  fieldId: string;
  fieldName: string;
  calculation: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX';
  groupFieldId?: string; // If undefined, applies as grand total in Report Footer
}

export interface GroupLevel {
  fieldId: string;
  fieldName?: string;
  sortOrder?: 'asc' | 'desc';
  showHeader?: boolean;
  showFooter?: boolean;
  pageBreakAfter?: boolean;
}

export interface ReportStyles {
  header?: TextStyle;
  groupHeader?: TextStyle;
  columnHeader?: TextStyle;
  detail?: TextStyle;
  footer?: TextStyle;
}

export interface SubReportConfig {
  reportId: string; // ID of the target report to render as sub-report
  foreignKeyFieldId: string; // FK in child report that connects to parent
  parentKeyFieldId: string; // PK in parent report
  title?: string;
}

export interface ReportChartConfig {
  enabled: boolean;
  type: 'bar' | 'pie' | 'line';
  xAxisFieldId: string;
  yAxisFieldId: string;
  title?: string;
}

export interface ReportSettings {
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'A4' | 'Letter';
  pageBreakAfterGroup?: boolean;
  groupMethod?: 'full' | 'firstLetter';
  showReportHeader?: boolean;
  showReportFooter?: boolean;
  showPageFooter?: boolean;
  zebraStriping?: boolean;
  showGridlines?: boolean;
  subtitle?: string;
  companyLogoUrl?: string;
}

export interface DashboardWidget {
  id: string;
  sourceId: string;
  sourceType: 'report' | 'chart' | 'query';
  x: number;
  y: number;
  w: number;
  h: number;
  title?: string;
}

export interface Report {
  id: string;
  name: string;
  sourceType: 'table' | 'query' | 'dashboard';
  sourceId: string;
  groupingFieldId?: string; // Legacy single group
  groupingFields?: GroupLevel[]; // Multi-level grouping
  columns?: ReportColumn[];
  summaries: ReportSummary[];
  styles?: ReportStyles;
  settings?: ReportSettings;
  subReport?: SubReportConfig;
  chartConfig?: ReportChartConfig;
  dashboardWidgets?: DashboardWidget[];
  allowedRoles?: string[];
}
