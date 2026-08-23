import { Table, TableNode, TableGroup } from './database';
import { Query } from './query';
import { Report } from './report';
import { Form } from './form';
import { Chart } from './chart';
import { Workflow } from './workflow';
import { BackendConfig } from './backend';

export interface ToastInfo {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export interface MessageModalConfig {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
}

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  isOnline: boolean;
  currentAction?: string;
}

export interface LockInfo {
  objectId: string;
  userId: string;
  userName: string;
  lockedAt: number;
}

export interface VirtualFile {
  name: string;
  content: string;
  language: 'csharp' | 'typescript' | 'javascript' | 'php' | 'json' | 'sql' | 'html' | 'css' | 'xml' | 'text' | 'markdown' | 'razor' | 'python' | 'prisma' | 'yaml' | 'toml' | 'rust' | 'hcl' | 'bicep';
  path: string;
}

export interface CustomComponent {
  id: string;
  name: string;
  description?: string;
  type: 'table_view' | 'chart_view' | 'form_view' | 'text' | 'button' | 'dropdown' | 'metric_card' | 'kanban_board' | 'card_template' | 'layout_container' | 'calendar_view'; // Base type
  configuration: Record<string, any>; // JSON configs for dynamic renderer
}

export interface CustomPage {
  id: string;
  name: string;
  description?: string;
  layout: PageComponent;
  isSubpage?: boolean;
  parentPageId?: string;
  expectedParams?: string[];
}

export type PageComponentType = 
  | 'container' 
  | 'row' 
  | 'column' 
  | 'card' 
  | 'grid_layout'
  | 'tabs_container'
  | 'tab_panel'
  | 'accordion'
  | 'accordion_section'
  | 'subform'
  | 'subpage_container'
  | 'list_repeater'
  | 'stat_card'
  | 'kpi_widget'
  | 'alert_box'
  | 'badge_pill'
  | 'action_group'
  | 'search_filter_bar'
  | 'progress_bar'
  | 'timeline_feed'
  | 'text' 
  | 'button' 
  | 'table_view' 
  | 'form_view' 
  | 'chart_view'
  | 'image' 
  | 'divider' 
  | 'dropdown' 
  | 'html' 
  | 'custom_component' 
  | 'hero_section' 
  | 'feature_grid' 
  | 'testimonial' 
  | 'pricing_table' 
  | 'footer' 
  | 'navbar';

export interface PageComponent {
  id: string;
  type: PageComponentType;
  props: Record<string, any>;
  children?: PageComponent[];
}

export interface ProjectData {
  tables: Table[];
  queries: Query[];
  reports: Report[];
  forms: Form[];
  charts?: Chart[];
  workflows?: Workflow[];
  pages?: CustomPage[];
  customComponents?: CustomComponent[];
  relationships: any[]; // Using any[] to avoid circular relationships if any
  layout: TableNode[];
  tableGroups: TableGroup[];
  backendConfig: BackendConfig;
  lastSnapshot?: Table[];
  tickets?: any[];
  chats?: any[];
  records?: Record<string, any[]>;
}

export interface GitConfig {
  repositoryUrl: string;
  branch: string;
  username?: string;
  personalAccessToken?: string;
}

export interface Project {
  id: string;
  name: string;
  lastModified: number;
  isMetadataOnly?: boolean;
  isCloud?: boolean;
  owner?: string;
  collaborators?: string[];
  gitConfig?: GitConfig;
  data: ProjectData;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  data: ProjectData;
}

export type ViewType =
  | { type: 'welcome' }
  | { type: 'app_info' }
  | { type: 'table_create' }
  | { type: 'table_edit'; tableId: string }
  | { type: 'table_data'; tableId: string }
  | { type: 'query_designer'; queryId?: string }
  | { type: 'query_results'; queryId: string }
  | { type: 'relationships' }
  | { type: 'report_view'; reportId: string }
  | { type: 'report_designer'; reportId: string }
  | { type: 'form_view'; formId: string }
  | { type: 'form_designer'; formId: string }
  | { type: 'chart_view'; chartId: string }
  | { type: 'page_designer'; pageId?: string }
  | { type: 'page_view'; pageId: string }
  | { type: 'workflow_designer'; workflowId: string }
  | { type: 'scheduler' }
  | { type: 'backend_generator' }
  | { type: 'navigation_designer' }
  | { type: 'api_import' }
  | { type: 'live_sync' }
  | { type: 'theme_designer' }
  | { type: 'logic_designer' }
  | { type: 'api_routing_designer' }
  | { type: 'lifecycle_designer' }
  | { type: 'multi_tenancy_wizard' }
  | { type: 'data_seeder_view' }
  | { type: 'tickets_board' }
  | { type: 'ai_swarm' }
  | { type: 'dbstudio_backend' }
  | { type: 'roadmap_view' }
  | { type: 'project_management'; panel?: 'dashboard' | 'requirements' | 'vmodel' | 'dotnet' | 'sqlite' | 'rebuild' }
  | { type: 'version_control' }
  | { type: 'audit_trail' }
  | { type: 'custom_component_designer'; componentId?: string }
  | { type: 'custom_components_manager' };
