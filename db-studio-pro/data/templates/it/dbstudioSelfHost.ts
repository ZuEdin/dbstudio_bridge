import { ProjectTemplate, DbType } from '../../../types/index';

const dict: Record<string, any> = {
    de: {
        name: 'DB Studio Pro (Self-Host Backend)',
        desc: 'Vollständiges Self-Hosting Backend & Metadaten-Schema für DB Studio Pro. Enthält sys_projects, sys_tables, sys_fields, sys_queries, sys_users und sys_sync_history.',
        t_projects: 'sys_projects',
        t_tables: 'sys_tables',
        t_fields: 'sys_fields',
        t_queries: 'sys_queries',
        t_relationships: 'sys_relationships',
        t_users: 'sys_users',
        t_sync: 'sys_sync_history',
        t_audit: 'sys_audit_logs',
        q_proj_summary: 'Projekt Übersicht',
        q_user_activity: 'Aktivitäts-Log',
        f_proj_form: 'Projekt-Metadaten Verwalten'
    },
    en: {
        name: 'DB Studio Pro (Self-Host Backend)',
        desc: 'Complete self-hosting backend & metadata schema for DB Studio Pro. Includes sys_projects, sys_tables, sys_fields, sys_queries, sys_users, and sys_sync_history.',
        t_projects: 'sys_projects',
        t_tables: 'sys_tables',
        t_fields: 'sys_fields',
        t_queries: 'sys_queries',
        t_relationships: 'sys_relationships',
        t_users: 'sys_users',
        t_sync: 'sys_sync_history',
        t_audit: 'sys_audit_logs',
        q_proj_summary: 'Project Overview',
        q_user_activity: 'Activity Log',
        f_proj_form: 'Manage Project Metadata'
    }
};

export const getDbstudioSelfHost = (lang: string): ProjectTemplate => {
    const t = dict[lang] || dict['de'];
    return {
        id: 'dbstudio_selfhost_template',
        name: t.name,
        description: t.desc,
        icon: 'Server',
        category: 'IT',
        data: {
            backendConfig: {
                language: 'nodejs',
                dbType: DbType.SQLite,
                projectName: 'DBStudio_SelfHost_Server',
                port: 3000,
                dbConnection: 'Data Source=dbstudio_meta.db;',
                useSwagger: true,
                frontendFramework: 'react',
                authConfig: {
                    useUserLogin: true,
                    useWindowsAuth: true,
                    useAdGroups: true,
                    devBypass: false,
                    isMobileReady: true
                }
            },
            tables: [
                {
                    id: 'sys_projects',
                    name: 'sys_projects',
                    fields: [
                        { id: 'p1', name: 'id', type: 'VARCHAR', length: 36, isPrimaryKey: true, comment: 'UUID Primärschlüssel' },
                        { id: 'p2', name: 'name', type: 'VARCHAR', length: 255, comment: 'Projektname' },
                        { id: 'p3', name: 'db_type', type: 'VARCHAR', length: 50, comment: 'Datenbanktyp (SQLite, Postgres, MSSQL)' },
                        { id: 'p4', name: 'is_cloud', type: 'BOOLEAN', defaultValue: 'false', comment: 'Cloud-Sync Aktiv' },
                        { id: 'p5', name: 'owner_id', type: 'VARCHAR', length: 100, comment: 'Besitzer-ID' },
                        { id: 'p6', name: 'created_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP', comment: 'Erstellung' }
                    ],
                    data: [
                        { id: 'sys_proj_demo_1', name: 'Kundenportal Demo', db_type: 'PostgreSQL', is_cloud: true, owner_id: 'admin_usr_1', created_at: '2026-01-15 10:00:00' },
                        { id: 'sys_proj_demo_2', name: 'Warenwirtschaft Intern', db_type: 'SQLite', is_cloud: false, owner_id: 'admin_usr_1', created_at: '2026-02-01 14:30:00' }
                    ]
                },
                {
                    id: 'sys_tables',
                    name: 'sys_tables',
                    fields: [
                        { id: 'tb1', name: 'id', type: 'VARCHAR', length: 36, isPrimaryKey: true, comment: 'UUID Primärschlüssel' },
                        { id: 'tb2', name: 'project_id', type: 'VARCHAR', length: 36, comment: 'Referenz sys_projects' },
                        { id: 'tb3', name: 'name', type: 'VARCHAR', length: 255, comment: 'Tabellenname' },
                        { id: 'tb4', name: 'description', type: 'TEXT', comment: 'Beschreibung' }
                    ],
                    data: [
                        { id: 't_demo_1', project_id: 'sys_proj_demo_1', name: 'customers', description: 'Stammdaten Kunden' },
                        { id: 't_demo_2', project_id: 'sys_proj_demo_1', name: 'invoices', description: 'Rechnungen' }
                    ]
                },
                {
                    id: 'sys_fields',
                    name: 'sys_fields',
                    fields: [
                        { id: 'f1', name: 'id', type: 'VARCHAR', length: 36, isPrimaryKey: true },
                        { id: 'f2', name: 'table_id', type: 'VARCHAR', length: 36 },
                        { id: 'f3', name: 'name', type: 'VARCHAR', length: 255 },
                        { id: 'f4', name: 'type', type: 'VARCHAR', length: 50 },
                        { id: 'f5', name: 'is_primary_key', type: 'BOOLEAN', defaultValue: 'false' },
                        { id: 'f6', name: 'is_nullable', type: 'BOOLEAN', defaultValue: 'true' },
                        { id: 'f7', name: 'default_value', type: 'VARCHAR', length: 255 }
                    ],
                    data: [
                        { id: 'f_demo_1', table_id: 't_demo_1', name: 'id', type: 'INTEGER', is_primary_key: true, is_nullable: false, default_value: 'AUTOINCREMENT' },
                        { id: 'f_demo_2', table_id: 't_demo_1', name: 'company_name', type: 'VARCHAR', is_primary_key: false, is_nullable: false, default_value: '' }
                    ]
                },
                {
                    id: 'sys_queries',
                    name: 'sys_queries',
                    fields: [
                        { id: 'q1', name: 'id', type: 'VARCHAR', length: 36, isPrimaryKey: true },
                        { id: 'q2', name: 'project_id', type: 'VARCHAR', length: 36 },
                        { id: 'q3', name: 'name', type: 'VARCHAR', length: 255 },
                        { id: 'q4', name: 'raw_sql', type: 'TEXT' }
                    ],
                    data: [
                        { id: 'q_demo_1', project_id: 'sys_proj_demo_1', name: 'Active Customers', raw_sql: 'SELECT * FROM customers WHERE is_active = 1' }
                    ]
                },
                {
                    id: 'sys_relationships',
                    name: 'sys_relationships',
                    fields: [
                        { id: 'r1', name: 'id', type: 'VARCHAR', length: 36, isPrimaryKey: true },
                        { id: 'r2', name: 'project_id', type: 'VARCHAR', length: 36 },
                        { id: 'r3', name: 'from_table', type: 'VARCHAR', length: 255 },
                        { id: 'r4', name: 'from_field', type: 'VARCHAR', length: 255 },
                        { id: 'r5', name: 'to_table', type: 'VARCHAR', length: 255 },
                        { id: 'r6', name: 'to_field', type: 'VARCHAR', length: 255 },
                        { id: 'r7', name: 'rel_type', type: 'VARCHAR', length: 20, defaultValue: '1:n' }
                    ],
                    data: [
                        { id: 'rel_demo_1', project_id: 'sys_proj_demo_1', from_table: 'customers', from_field: 'id', to_table: 'invoices', to_field: 'customer_id', rel_type: '1:n' }
                    ]
                },
                {
                    id: 'sys_users',
                    name: 'sys_users',
                    fields: [
                        { id: 'u1', name: 'id', type: 'VARCHAR', length: 36, isPrimaryKey: true },
                        { id: 'u2', name: 'username', type: 'VARCHAR', length: 100 },
                        { id: 'u3', name: 'email', type: 'VARCHAR', length: 255 },
                        { id: 'u4', name: 'password_hash', type: 'VARCHAR', length: 255 },
                        { id: 'u5', name: 'role', type: 'VARCHAR', length: 50, defaultValue: 'User' },
                        { id: 'u6', name: 'ad_sid', type: 'VARCHAR', length: 255 },
                        { id: 'u7', name: 'created_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP' }
                    ],
                    data: [
                        { id: 'admin_usr_1', username: 'admin', email: 'admin@dbstudio.local', password_hash: '$2b$10$e8...hash', role: 'Admin', ad_sid: 'S-1-5-21-123456789-1', created_at: '2026-01-01 00:00:00' }
                    ]
                },
                {
                    id: 'sys_sync_history',
                    name: 'sys_sync_history',
                    fields: [
                        { id: 'sh1', name: 'id', type: 'VARCHAR', length: 36, isPrimaryKey: true },
                        { id: 'sh2', name: 'project_id', type: 'VARCHAR', length: 36 },
                        { id: 'sh3', name: 'user_id', type: 'VARCHAR', length: 100 },
                        { id: 'sh4', name: 'sync_type', type: 'VARCHAR', length: 50 },
                        { id: 'sh5', name: 'implementation_prompt', type: 'TEXT' },
                        { id: 'sh6', name: 'created_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP' }
                    ],
                    data: [
                        { id: 'sh_demo_1', project_id: 'sys_proj_demo_1', user_id: 'admin_usr_1', sync_type: 'LOCAL_TO_CLOUD', implementation_prompt: 'Kundenportal Backend initial synchronisiert', created_at: '2026-02-10 11:20:00' }
                    ]
                }
            ],
            relationships: [
                { id: 'sys_rel_1', fromTableId: 'sys_projects', fromFieldId: 'p1', toTableId: 'sys_tables', toFieldId: 'tb2', type: '1:n', referentialIntegrity: true, onDelete: 'CASCADE' },
                { id: 'sys_rel_2', fromTableId: 'sys_tables', fromFieldId: 'tb1', toTableId: 'sys_fields', toFieldId: 'f2', type: '1:n', referentialIntegrity: true, onDelete: 'CASCADE' },
                { id: 'sys_rel_3', fromTableId: 'sys_projects', fromFieldId: 'p1', toTableId: 'sys_queries', toFieldId: 'q2', type: '1:n', referentialIntegrity: true, onDelete: 'CASCADE' },
                { id: 'sys_rel_4', fromTableId: 'sys_projects', fromFieldId: 'p1', toTableId: 'sys_sync_history', toFieldId: 'sh2', type: '1:n', referentialIntegrity: true, onDelete: 'CASCADE' }
            ],
            queries: [
                {
                    id: 'q_sys_projects',
                    type: 'SELECT',
                    name: t.q_proj_summary,
                    nodes: [{ id: 'n1', tableId: 'sys_projects', x: 50, y: 50 }],
                    columns: [
                        { id: 'c1', tableId: 'sys_projects', fieldId: 'p2', tableName: 'sys_projects', fieldName: 'name', sort: '', show: true, criteria: [''] },
                        { id: 'c2', tableId: 'sys_projects', fieldId: 'p3', tableName: 'sys_projects', fieldName: 'db_type', sort: '', show: true, criteria: [''] },
                        { id: 'c3', tableId: 'sys_projects', fieldId: 'p4', tableName: 'sys_projects', fieldName: 'is_cloud', sort: '', show: true, criteria: [''] }
                    ]
                }
            ],
            forms: [],
            reports: [],
            layout: [],
            tableGroups: []
        }
    };
};
