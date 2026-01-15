
export type Language = 'he' | 'en';

export interface DataPoint {
  [key: string]: any;
}

export interface DataIssue {
  column: string;
  type: 'missing' | 'outlier' | 'format';
  description: string;
  count: number;
  fixable: boolean;
}

export interface ColumnMetadata {
  description: string;
  isFilter: boolean;
  isVisible: boolean;
  type: 'number' | 'string' | 'date' | 'boolean';
  role?: 'dimension' | 'measure';
  interpreted?: boolean;
  hierarchyRole?: 'level' | 'member';
  hierarchyLinkedColumn?: string;
}

export interface ClarifyingQuestion {
  column?: string;
  question: string;
}

export interface BusinessQuestion {
  question: string;
  answer: string;
  importance: string;
}

export interface Dataset {
  id: string;
  name: string;
  data: DataPoint[];
  columns: string[];
  metadata: Record<string, ColumnMetadata>;
  createdAt: number;
  healthIssues?: DataIssue[];
}

export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'scatter' | 'radar';

export interface WidgetConfig {
  id: string;
  title: string;
  type: ChartType;
  xAxis: string;
  yAxis: string;
  color?: string;
  description?: string;
}

export interface Dashboard {
  id: string;
  name: string;
  datasetId: string;
  widgets: WidgetConfig[];
  strategy?: BusinessQuestion[];
}

export interface AIInsight {
  id: string;
  title: string;
  content: string;
  severity: 'info' | 'positive' | 'warning';
  action?: string;
  linkedWidgetId?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  suggestedWidget?: WidgetConfig;
}

export interface ChatResponse {
  text: string;
  newWidget?: WidgetConfig;
}
