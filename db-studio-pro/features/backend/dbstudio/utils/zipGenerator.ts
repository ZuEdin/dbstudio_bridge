import JSZip from 'jszip';
import { Table, Query, Relationship } from '../../../../types/index';
import { generateNodejsBackend } from './generators/nodejs';
import { generateCsharpBackend } from './generators/csharp';
import { generatePhpBackend } from './generators/php';
import { generatePythonBackend } from './generators/python';

export const handleDownloadSelfHostZip = async (
  selfHostLang: 'nodejs' | 'csharp' | 'php' | 'python',
  tables: Table[],
  selectedTables: Record<string, boolean>,
  queries: Query[],
  selectedQueries: Record<string, boolean>,
  relationships: Relationship[],
  showMessage: (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => void,
  adServerAddress?: string,
  adBaseDn?: string,
  adGroupMappings?: { id: string; adGroup: string; appRole: string }[],
  adServiceAccountUsername?: string,
  adServiceAccountPassword?: string,
  subfolderPath: string = '',
  includeWwwroot: boolean = true
) => {
  try {
    const zip = new JSZip();

    // Common Schema SQL - Fully mirrors all IndexedDB Object Stores & DB Studio Pro State
    const schemaSql = `-- DB Studio Pro Self-Host System Schema
-- Fully mirrors all IndexedDB Object Stores & DB Studio Pro State

-- 1. Projects Metadata
CREATE TABLE IF NOT EXISTS sys_projects (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  db_type VARCHAR(50) DEFAULT 'SQLite',
  language VARCHAR(50) DEFAULT 'nodejs',
  is_cloud INTEGER DEFAULT 0,
  owner_id VARCHAR(100) DEFAULT 'admin',
  last_modified BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Projects Complete Payload (Full JSON Dump matching IndexedDB projects_data)
CREATE TABLE IF NOT EXISTS sys_project_payloads (
  project_id VARCHAR(36) PRIMARY KEY,
  data_json TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES sys_projects(id) ON DELETE CASCADE
);

-- 3. Normalized Tables Metadata
CREATE TABLE IF NOT EXISTS sys_tables (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_api_import INTEGER DEFAULT 0,
  api_config_json TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES sys_projects(id) ON DELETE CASCADE
);

-- 4. Normalized Fields Metadata
CREATE TABLE IF NOT EXISTS sys_fields (
  id VARCHAR(36) PRIMARY KEY,
  table_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  is_primary_key INTEGER DEFAULT 0,
  is_auto_increment INTEGER DEFAULT 0,
  is_unique INTEGER DEFAULT 0,
  is_nullable INTEGER DEFAULT 1,
  default_value VARCHAR(255),
  comment TEXT,
  FOREIGN KEY (table_id) REFERENCES sys_tables(id) ON DELETE CASCADE
);

-- 5. Foreign Key Relationships
CREATE TABLE IF NOT EXISTS sys_relationships (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  from_table_id VARCHAR(255),
  from_field_id VARCHAR(255),
  to_table_id VARCHAR(255),
  to_field_id VARCHAR(255),
  rel_type VARCHAR(20) DEFAULT '1:n',
  on_delete VARCHAR(50) DEFAULT 'CASCADE',
  FOREIGN KEY (project_id) REFERENCES sys_projects(id) ON DELETE CASCADE
);

-- 6. Saved SQL Queries
CREATE TABLE IF NOT EXISTS sys_queries (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  query_type VARCHAR(50) DEFAULT 'SELECT',
  raw_sql TEXT,
  nodes_json TEXT,
  columns_json TEXT,
  FOREIGN KEY (project_id) REFERENCES sys_projects(id) ON DELETE CASCADE
);

-- 7. Forms Builder Definitions
CREATE TABLE IF NOT EXISTS sys_forms (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  table_id VARCHAR(255),
  layout_json TEXT,
  FOREIGN KEY (project_id) REFERENCES sys_projects(id) ON DELETE CASCADE
);

-- 8. Reports & Dashboards
CREATE TABLE IF NOT EXISTS sys_reports (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  config_json TEXT,
  FOREIGN KEY (project_id) REFERENCES sys_projects(id) ON DELETE CASCADE
);

-- 9. Custom Pages & SDUI Custom Components
CREATE TABLE IF NOT EXISTS sys_pages (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  definition_json TEXT,
  FOREIGN KEY (project_id) REFERENCES sys_projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sys_custom_components (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  definition_json TEXT,
  FOREIGN KEY (project_id) REFERENCES sys_projects(id) ON DELETE CASCADE
);

-- 10. Dynamic Table Records (Stores user data rows for all custom tables)
CREATE TABLE IF NOT EXISTS sys_table_data (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  table_name VARCHAR(255) NOT NULL,
  record_id VARCHAR(255) NOT NULL,
  data_json TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. System Users & Auth
CREATE TABLE IF NOT EXISTS sys_users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'User',
  ad_sid VARCHAR(255),
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Support Tickets & AI Chats Storage
CREATE TABLE IF NOT EXISTS sys_chats (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36),
  user_id VARCHAR(100),
  title VARCHAR(255),
  messages_json TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sys_tickets (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36),
  user_id VARCHAR(100),
  title VARCHAR(255),
  status VARCHAR(50) DEFAULT 'OPEN',
  payload_json TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Sync & Audit History
CREATE TABLE IF NOT EXISTS sys_sync_history (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(100) NOT NULL,
  sync_type VARCHAR(50) NOT NULL,
  implementation_prompt TEXT,
  metadata_payload TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. External Backend API Configurations & Cache Registry
CREATE TABLE IF NOT EXISTS sys_backend_api_configs (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  method VARCHAR(10) DEFAULT 'GET',
  headers TEXT DEFAULT '{}',
  query_params TEXT DEFAULT '[]',
  option CHAR(1) DEFAULT 'A',
  refresh_interval INTEGER DEFAULT 0,
  fields TEXT DEFAULT '[]',
  last_sync BIGINT DEFAULT 0,
  auth_type VARCHAR(50) DEFAULT 'none',
  auth_api_key_name VARCHAR(100),
  auth_api_key_value TEXT,
  auth_api_key_prefix VARCHAR(50),
  auth_api_key_location VARCHAR(50) DEFAULT 'header',
  auth_bearer_token TEXT,
  auth_username VARCHAR(100),
  auth_password TEXT
);

-- 15. Simulated SMTP Outbox with TLS Log
CREATE TABLE IF NOT EXISTS sys_sent_emails (
  id VARCHAR(36) PRIMARY KEY,
  message_id VARCHAR(100) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  sender VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT,
  attachments TEXT DEFAULT '[]',
  object_context TEXT DEFAULT '{}',
  timestamp VARCHAR(100) NOT NULL,
  security_log TEXT,
  status VARCHAR(50) DEFAULT 'DELIVERED'
);

INSERT OR IGNORE INTO sys_users (id, username, email, password_hash, role)
VALUES ('admin_usr_1', 'admin', 'admin@dbstudio.local', '$2b$10$hash_demo', 'Admin');

INSERT OR IGNORE INTO sys_projects (id, name, db_type, is_cloud, owner_id)
VALUES ('proj_default', 'Hauptprojekt', 'PostgreSQL', 1, 'admin');
`;
    zip.file("schema.sql", schemaSql);

    // Dynamic modular dispatching of backend generator packages
    if (selfHostLang === 'nodejs') {
      generateNodejsBackend(zip, schemaSql, subfolderPath, includeWwwroot);
    } else if (selfHostLang === 'csharp') {
      generateCsharpBackend(zip, schemaSql, adServerAddress, adBaseDn, adGroupMappings, adServiceAccountUsername, adServiceAccountPassword, subfolderPath, includeWwwroot);
    } else if (selfHostLang === 'php') {
      generatePhpBackend(zip, schemaSql, subfolderPath, includeWwwroot);
    } else if (selfHostLang === 'python') {
      generatePythonBackend(zip, schemaSql, subfolderPath, includeWwwroot);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = window.URL.createObjectURL(content);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    a.href = url;
    const langLabel = selfHostLang === 'nodejs' ? 'NodeJS' : selfHostLang === 'csharp' ? 'DotNet_CSharp' : selfHostLang === 'php' ? 'Laravel_PHP' : 'Python_FastAPI';
    a.download = `DBStudio_SelfHost_Backend_${langLabel}.zip`;
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showMessage(
      "Self-Host Backend Heruntergeladen",
      `Das vollständige, modulare Self-Hosting Backend (${selfHostLang.toUpperCase()}) für DB Studio Pro wurde erfolgreich als ZIP heruntergeladen.`,
      "success"
    );
  } catch (err: any) {
    showMessage("Export-Fehler", err?.message || "Fehler beim Erstellen des Self-Host ZIP Pakets", "error");
  }
};
