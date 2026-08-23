export type ChartType = 'bar' | 'line' | 'area' | 'pie';

export interface ChartConfig {
  xAxisFieldId: string;
  yAxisFieldIds: string[];
  showGrid?: boolean;
}

export interface Chart {
  id: string;
  name: string;
  type: ChartType;
  sourceType: 'table' | 'query';
  sourceId: string;
  config: ChartConfig;
}
