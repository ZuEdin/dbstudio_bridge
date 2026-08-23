import { ProjectTemplate, DbType } from '../../../types/index';

const dict: Record<string, any> = {
    de: {
        name: 'Headless CMS (API)',
        desc: 'Advanced Content Management System mit JWT Authentication, User-Rollen und API-Endpunkten für Native Apps und Websites.',
        t_users: 'Benutzer', f_username: 'Benutzername', f_email: 'E-Mail', f_password: 'PasswordHash', f_role: 'RollenID',
        t_roles: 'Rollen', f_rname: 'Rollenname', f_perms: 'Berechtigungen',
        t_posts: 'Beiträge', f_title: 'Titel', f_slug: 'Slug', f_content: 'Inhalt', f_status: 'Status', f_author: 'AutorID',
        t_categories: 'Kategorien', f_catname: 'Kategorie', f_catdesc: 'Beschreibung',
        t_postcat: 'BeitragKategorien',
        t_settings: 'SystemEinstellungen', f_key: 'EinstellungsSchluessel', f_val: 'Wert',
        d_published: 'Publiziert', d_draft: 'Entwurf', d_admin: 'Administrator', d_editor: 'Redakteur', d_viewer: 'Leser'
    },
    en: {
        name: 'Headless CMS (API)',
        desc: 'Advanced Content Management System with JWT Authentication, User Roles, and API endpoints for Native Apps and Websites.',
        t_users: 'Users', f_username: 'Username', f_email: 'Email', f_password: 'PasswordHash', f_role: 'RoleID',
        t_roles: 'Roles', f_rname: 'RoleName', f_perms: 'Permissions',
        t_posts: 'Posts', f_title: 'Title', f_slug: 'Slug', f_content: 'Content', f_status: 'Status', f_author: 'AuthorID',
        t_categories: 'Categories', f_catname: 'CategoryName', f_catdesc: 'Description',
        t_postcat: 'PostCategories',
        t_settings: 'SystemSettings', f_key: 'SettingKey', f_val: 'Value',
        d_published: 'Published', d_draft: 'Draft', d_admin: 'Administrator', d_editor: 'Editor', d_viewer: 'Viewer'
    }
};

export const getCmsTemplate = (lang: string): ProjectTemplate => {
    const t = dict[lang] || dict['en'];

    return {
        id: 'cms_advanced',
        name: t.name,
        description: t.desc,
        icon: 'Layout',
        category: 'Business',
        data: {
          backendConfig: {
            language: 'nodejs',
            dbType: DbType.SQL,
            projectName: 'HeadlessCMS',
            port: 3000,
            dbConnection: 'postgres://user:pass@localhost:5432/cms',
            useSwagger: true,
            frontendFramework: 'react',
            authConfig: { 
                useUserLogin: true, 
                useWindowsAuth: false, 
                useAdGroups: false, 
                devBypass: false, 
                isMobileReady: true // Enables JWT Tokens and App Endpoints
            }
          },
          tables: [
            {
              id: 't_roles', name: t.t_roles,
              fields: [
                { id: 'r1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'r2', name: t.f_rname, type: 'VARCHAR', length: 50 },
                { id: 'r3', name: t.f_perms, type: 'TEXT' }
              ],
              data: [
                { Id: 1, [t.f_rname]: t.d_admin, [t.f_perms]: 'all' },
                { Id: 2, [t.f_rname]: t.d_editor, [t.f_perms]: 'read,write' },
                { Id: 3, [t.f_rname]: t.d_viewer, [t.f_perms]: 'read' }
              ]
            },
            {
              id: 't_users', name: t.t_users,
              fields: [
                { id: 'u1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'u2', name: t.f_username, type: 'VARCHAR', length: 50 },
                { id: 'u3', name: t.f_email, type: 'VARCHAR', length: 150 },
                { id: 'u4', name: t.f_password, type: 'VARCHAR', length: 255 },
                { id: 'u5', name: t.f_role, type: 'INTEGER' }
              ],
              data: [
                { Id: 1, [t.f_username]: 'admin', [t.f_email]: 'admin@system.com', [t.f_password]: 'hash123', [t.f_role]: 1 },
                { Id: 2, [t.f_username]: 'editor', [t.f_email]: 'editor@system.com', [t.f_password]: 'hash456', [t.f_role]: 2 }
              ]
            },
            {
              id: 't_posts', name: t.t_posts,
              fields: [
                { id: 'p1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'p2', name: t.f_title, type: 'VARCHAR', length: 255 },
                { id: 'p3', name: t.f_slug, type: 'VARCHAR', length: 255 },
                { id: 'p4', name: t.f_content, type: 'TEXT' },
                { id: 'p5', name: t.f_status, type: 'VARCHAR', length: 20, defaultValue: t.d_draft },
                { id: 'p6', name: t.f_author, type: 'INTEGER' },
                { id: 'p7', name: 'CreatedAt', type: 'DATETIME' }
              ],
              data: [
                { Id: 1, [t.f_title]: 'First Post', [t.f_slug]: 'first-post', [t.f_content]: '# Hello World...', [t.f_status]: t.d_published, [t.f_author]: 1 }
              ]
            },
            {
              id: 't_categories', name: t.t_categories,
              fields: [
                { id: 'c1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'c2', name: t.f_catname, type: 'VARCHAR', length: 100 },
                { id: 'c3', name: t.f_catdesc, type: 'TEXT' }
              ],
              data: [
                { Id: 1, [t.f_catname]: 'Tech', [t.f_catdesc]: 'Technology News' },
                { Id: 2, [t.f_catname]: 'Tutorials', [t.f_catdesc]: 'Guides and How-Tos' }
              ]
            },
            {
              id: 't_postcat', name: t.t_postcat,
              fields: [
                { id: 'pc1', name: 'PostId', type: 'INTEGER', isPrimaryKey: true },
                { id: 'pc2', name: 'CategoryId', type: 'INTEGER', isPrimaryKey: true }
              ],
              data: [
                { PostId: 1, CategoryId: 1 }
              ]
            },
            {
              id: 't_settings', name: t.t_settings,
              fields: [
                { id: 's1', name: t.f_key, type: 'VARCHAR', length: 100, isPrimaryKey: true },
                { id: 's2', name: t.f_val, type: 'TEXT' }
              ],
              data: [
                { [t.f_key]: 'site_name', [t.f_val]: 'My Headless CMS' },
                { [t.f_key]: 'api_version', [t.f_val]: 'v1' }
              ]
            }
          ],
          relationships: [
            { id: 'r1', fromTableId: 't_roles', fromFieldId: 'r1', toTableId: 't_users', toFieldId: 'u5', type: '1:n', referentialIntegrity: true },
            { id: 'r2', fromTableId: 't_users', fromFieldId: 'u1', toTableId: 't_posts', toFieldId: 'p6', type: '1:n', referentialIntegrity: true },
            { id: 'r3', fromTableId: 't_posts', fromFieldId: 'p1', toTableId: 't_postcat', toFieldId: 'pc1', type: '1:n', referentialIntegrity: true, onDelete: 'CASCADE' },
            { id: 'r4', fromTableId: 't_categories', fromFieldId: 'c1', toTableId: 't_postcat', toFieldId: 'pc2', type: '1:n', referentialIntegrity: true, onDelete: 'CASCADE' }
          ],
          queries: [],
          forms: [
            {
                id: 'cms_login_form',
                name: 'Login Portal',
                sourceId: '',
                sourceType: 'table',
                mode: 'edit',
                fields: [],
               layout: {
                  id: 'cms_login_root', type: 'container', className: 'p-8 max-w-sm mx-auto bg-white rounded-xl shadow-md border border-slate-200 mt-10', children: [
                      { id: 'cms_log_1', type: 'label', label: 'CMS System Login', className: 'text-2xl font-bold text-center text-slate-800 mb-2' },
                      { id: 'cms_log_2', type: 'label', label: 'Bitte authentifizieren Sie sich (JWT)', className: 'text-sm text-center text-slate-500 mb-6 font-normal' },
                      { id: 'cms_log_3', type: 'field', fieldId: 'username', label: 'E-Mail', className: 'mb-4', widgetType: 'text' },
                      { id: 'cms_log_4', type: 'field', fieldId: 'password', label: 'Passwort', className: 'mb-6', widgetType: 'text' },
                      { id: 'cms_log_5', type: 'button', label: 'Einloggen', className: 'w-full bg-slate-800 hover:bg-slate-900 focus:ring focus:ring-slate-300 text-white font-bold py-2.5 px-4 rounded-lg transition-colors', actions: [] },
                      { id: 'cms_log_6', type: 'container', className: 'flex justify-between mt-6 text-sm', children: [
                          { id: 'cms_log_7', type: 'label', label: 'Passwort vergessen?', className: 'text-slate-500 hover:text-slate-800 cursor-pointer transition-colors' },
                          { id: 'cms_log_8', type: 'label', label: 'Registrieren', className: 'text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer transition-colors' }
                      ]}
                  ]
               }
             },
             {
                id: 'cms_post_editor',
                name: 'Editor',
                sourceId: 't_posts',
                sourceType: 'table',
                mode: 'edit',
                fields: [],
                layout: {
                   id: 'cms_editor_root', type: 'container', className: 'p-6 bg-white rounded-lg shadow-sm w-full', children: [
                       { id: 'ce1', type: 'label', label: 'Neuen Beitrag verfassen', className: 'text-2xl font-bold mb-4' },
                       { id: 'ce2', type: 'container', className: 'grid grid-cols-3 gap-6', children: [
                            { id: 'ce_col1', type: 'container', className: 'col-span-2 space-y-4', children: [
                                { id: 'ce3', type: 'field', fieldId: 'p2', label: 'Beitragstitel', className: 'w-full', widgetType: 'text' },
                                { id: 'ce4', type: 'field', fieldId: 'p4', label: 'Hauptinhalt (Markdown/HTML)', className: 'w-full', widgetType: 'textarea' },
                            ]},
                            { id: 'ce_col2', type: 'container', className: 'col-span-1 space-y-4 bg-slate-50 p-4 rounded border border-slate-200', children: [
                                { id: 'ce5', type: 'field', fieldId: 'p3', label: 'URL Slug', className: 'w-full', widgetType: 'text' },
                                { id: 'ce6', type: 'field', fieldId: 'p5', label: 'Sichtbarkeit/Status', className: 'w-full', widgetType: 'select' },
                                { id: 'ce8', type: 'button', label: 'Speichern & Publizieren', className: 'w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4', actions: [] }
                            ]}
                       ]}
                   ]
                }
             }
          ],
          reports: [],
          layout: [],
          tableGroups: []
        }
    };
};
