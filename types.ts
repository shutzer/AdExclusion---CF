
export enum Operator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains'
}

export type ActionType = 'hide' | 'show';
export type LogicalOperator = 'AND' | 'OR';

export type TargetingKey = 
  | 'site' 
  | 'keywords' 
  | 'description_url' 
  | 'ads_enabled' 
  | 'page_type' 
  | 'content_id' 
  | 'domain' 
  | 'section' 
  | 'top_section' 
  | 'ab_test';

export interface Condition {
  targetKey: TargetingKey;
  operator: Operator;
  value: string;
  caseSensitive?: boolean;
}

export interface TargetingData {
  site: string;
  keywords: string[];
  description_url: string;
  ads_enabled: boolean;
  page_type: string;
  content_id: string;
  domain: string;
  section: string;
  top_section: string;
  ab_test: string;
}

export interface BlacklistRule {
  id: string;
  name: string;
  conditions: Condition[];
  logicalOperator: LogicalOperator;
  targetElementSelector: string;
  action: ActionType;
  customJs?: string;
  isActive: boolean;
  respectAdsEnabled: boolean;
  startDate?: number; // Unix timestamp ms
  endDate?: number;   // Unix timestamp ms
  createdAt: number;
}

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH_PROD' | 'PUBLISH_DEV' | 'ROLLBACK' | 'TOGGLE';

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  user: string;
  action: AuditAction;
  details: string;
  snapshotId: string;
}
