
import { ProjectTemplate, DbType } from '../../../types/index';

const dict: Record<string, any> = {
    de: { 
        name: 'IT-Geräte Management (Pro)', 
        desc: 'Professionelle Inventarverwaltung mit Benutzer-Login, Rollen (Admin/User), Ausleih-Workflow und Überfälligkeits-Warnungen.', 
        t_users: 'Benutzer', t_cat: 'Kategorien', t_dev: 'Geräte', t_rent: 'Ausleihen',
        f_user: 'Benutzer', f_role: 'Rolle', f_cat: 'Kategorie', f_model: 'Modell', f_serial: 'Seriennummer', f_inv: 'InventarNr', f_status: 'Status',
        f_date_out: 'Ausgabedatum', f_date_due: 'Fälligkeitsdatum', f_date_in: 'Rückgabedatum',
        st_avail: 'Verfügbar', st_rented: 'Verliehen', st_broken: 'Defekt', st_maint: 'Wartung',
        rs_req: 'Angefragt', rs_active: 'Aktiv', rs_done: 'Zurückgegeben', rs_over: 'Überfällig',
        q_avail: 'Verfügbare Geräte', q_over: 'Überfällige Rückgaben', q_my: 'Meine Ausleihen',
        r_inv: 'Inventarliste', r_hist: 'Ausleihhistorie',
        f_rent_new: 'Gerät ausleihen', f_dev_man: 'Geräte verwalten', f_return: 'Rückgabe erfassen'
    },
    en: { 
        name: 'IT Device Management (Pro)', 
        desc: 'Professional inventory system with user login, roles, rental workflow and overdue alerts.', 
        t_users: 'Users', t_cat: 'Categories', t_dev: 'Devices', t_rent: 'Rentals',
        f_user: 'User', f_role: 'Role', f_cat: 'Category', f_model: 'Model', f_serial: 'SerialNum', f_inv: 'InventoryNo', f_status: 'Status',
        f_date_out: 'CheckOutDate', f_date_due: 'DueDate', f_date_in: 'ReturnDate',
        st_avail: 'Available', st_rented: 'Rented', st_broken: 'Broken', st_maint: 'Maintenance',
        rs_req: 'Requested', rs_active: 'Active', rs_done: 'Returned', rs_over: 'Overdue',
        q_avail: 'Available Devices', q_over: 'Overdue Rentals', q_my: 'My Rentals',
        r_inv: 'Inventory List', r_hist: 'Rental History',
        f_rent_new: 'New Rental', f_dev_man: 'Manage Devices', f_return: 'Process Return'
    }
};

export const getDeviceRental = (lang: string): ProjectTemplate => {
    const t = dict[lang] || dict['en'];
    
    // Helper to generate Dropdown options based on localized status
    const deviceStatuses = [t.st_avail, t.st_rented, t.st_broken, t.st_maint];
    const rentalStatuses = [t.rs_req, t.rs_active, t.rs_done, t.rs_over];

    return {
        id: 'device_rental_pro',
        name: t.name,
        description: t.desc,
        icon: 'Monitor',
        category: 'Education',
        data: {
          backendConfig: {
            language: 'dotnet',
            dbType: DbType.SQL, // More robust for Pro version
            projectName: 'DeviceManagerPro',
            port: 5005,
            dbConnection: 'Server=.;Database=DeviceManager;Trusted_Connection=True;TrustServerCertificate=True;',
            useSwagger: true,
            frontendFramework: 'react',
            authConfig: { 
                useUserLogin: true, // ENABLE AUTH
                useWindowsAuth: false, 
                useAdGroups: false, 
                devBypass: true, 
                isMobileReady: true 
            }
          },
          tables: [
            {
              // SYSTEM USERS (Extended)
              id: 'sys_users', name: 'sys_users', // Standard name for auth
              fields: [
                { id: 'u1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'u2', name: 'Username', type: 'VARCHAR', length: 50 },
                { id: 'u3', name: 'PasswordHash', type: 'VARCHAR', length: 255 }, // In real app: hashed
                { id: 'u4', name: 'Role', type: 'VARCHAR', length: 20 },
                { id: 'u5', name: 'FullName', type: 'VARCHAR', length: 100 },
                { id: 'u6', name: 'Email', type: 'VARCHAR', length: 100 },
                { id: 'u7', name: 'Department', type: 'VARCHAR', length: 50 }
              ],
              data: [
                { Id: 1, Username: 'admin', PasswordHash: 'admin123', Role: 'Admin', FullName: 'System Administrator', Email: 'admin@school.edu', Department: 'IT' },
                { Id: 2, Username: 'manager', PasswordHash: 'manager123', Role: 'Manager', FullName: 'Lab Manager', Email: 'lab@school.edu', Department: 'Media Lab' },
                { Id: 3, Username: 'student1', PasswordHash: 'user123', Role: 'User', FullName: 'Max Mustermann', Email: 'max@student.edu', Department: 'CS' },
                { Id: 4, Username: 'student2', PasswordHash: 'user123', Role: 'User', FullName: 'Lisa Miller', Email: 'lisa@student.edu', Department: 'Arts' }
              ]
            },
            {
              // CATEGORIES (Lookup)
              id: 't_cat', name: t.t_cat,
              fields: [
                { id: 'c1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'c2', name: 'Name', type: 'VARCHAR', length: 50 },
                { id: 'c3', name: 'Description', type: 'TEXT' }
              ],
              data: [
                { Id: 1, Name: 'Laptops', Description: 'Notebooks and Convertibles' },
                { Id: 2, Name: 'Tablets', Description: 'iPads and Android Tablets' },
                { Id: 3, Name: 'Cameras', Description: 'DSLR and Video Cameras' },
                { Id: 4, Name: 'Accessories', Description: 'Cables, Chargers, Adapters' }
              ]
            },
            {
              // DEVICES (Main Asset)
              id: 't_devices', name: t.t_dev,
              fields: [
                { id: 'd1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'd2', name: 'CategoryId', type: 'INTEGER' },
                { id: 'd3', name: t.f_model, type: 'VARCHAR', length: 100 },
                { id: 'd4', name: t.f_serial, type: 'VARCHAR', length: 50 },
                { id: 'd5', name: t.f_inv, type: 'VARCHAR', length: 20 },
                { id: 'd6', name: 'PurchaseDate', type: 'DATE' },
                { id: 'd7', name: t.f_status, type: 'VARCHAR', length: 20, defaultValue: t.st_avail }
              ],
              data: [
                { Id: 1, CategoryId: 1, [t.f_model]: 'MacBook Pro 14 M2', [t.f_serial]: 'SN-998877', [t.f_inv]: 'IT-001', PurchaseDate: '2023-01-15', [t.f_status]: t.st_avail },
                { Id: 2, CategoryId: 1, [t.f_model]: 'Dell XPS 15', [t.f_serial]: 'DX-223344', [t.f_inv]: 'IT-002', PurchaseDate: '2023-02-01', [t.f_status]: t.st_rented },
                { Id: 3, CategoryId: 3, [t.f_model]: 'Canon EOS R5', [t.f_serial]: 'CA-556677', [t.f_inv]: 'AV-101', PurchaseDate: '2022-11-20', [t.f_status]: t.st_avail },
                { Id: 4, CategoryId: 3, [t.f_model]: 'Sony Alpha 7 IV', [t.f_serial]: 'SO-112233', [t.f_inv]: 'AV-102', PurchaseDate: '2022-12-05', [t.f_status]: t.st_broken },
                { Id: 5, CategoryId: 2, [t.f_model]: 'iPad Air 5', [t.f_serial]: 'AP-334455', [t.f_inv]: 'IT-050', PurchaseDate: '2023-05-10', [t.f_status]: t.st_avail }
              ]
            },
            {
              // RENTALS (Transactions)
              id: 't_rentals', name: t.t_rent,
              fields: [
                { id: 'r1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'r2', name: 'DeviceId', type: 'INTEGER' },
                { id: 'r3', name: 'UserId', type: 'INTEGER' }, // Link to sys_users
                { id: 'r4', name: t.f_date_out, type: 'DATETIME' },
                { id: 'r5', name: t.f_date_due, type: 'DATETIME' },
                { id: 'r6', name: t.f_date_in, type: 'DATETIME', allowNull: true },
                { id: 'r7', name: t.f_status, type: 'VARCHAR', length: 20, defaultValue: t.rs_active },
                { id: 'r8', name: 'Notes', type: 'TEXT' }
              ],
              data: [
                { Id: 1, DeviceId: 2, UserId: 3, [t.f_date_out]: '2023-10-01 09:00:00', [t.f_date_due]: '2023-10-05 17:00:00', [t.f_status]: t.rs_active, Notes: 'Project work' },
                { Id: 2, DeviceId: 4, UserId: 4, [t.f_date_out]: '2023-09-15 10:00:00', [t.f_date_due]: '2023-09-20 17:00:00', [t.f_date_in]: '2023-09-21 09:00:00', [t.f_status]: t.rs_done, Notes: 'Returned slightly late' }
              ]
            }
          ],
          relationships: [
            { id: 'rel_cat_dev', fromTableId: 't_cat', fromFieldId: 'c1', toTableId: 't_devices', toFieldId: 'd2', type: '1:n', referentialIntegrity: true },
            { id: 'rel_dev_rent', fromTableId: 't_devices', fromFieldId: 'd1', toTableId: 't_rentals', toFieldId: 'r2', type: '1:n', referentialIntegrity: true },
            { id: 'rel_user_rent', fromTableId: 'sys_users', fromFieldId: 'u1', toTableId: 't_rentals', toFieldId: 'r3', type: '1:n', referentialIntegrity: true }
          ],
          queries: [
              // 1. Available Devices (Filter by Status)
              {
                  id: 'q_avail', type: 'SELECT', name: t.q_avail,
                  nodes: [
                      { id: 'n1', tableId: 't_devices', x: 50, y: 50 }, 
                      { id: 'n2', tableId: 't_cat', x: 300, y: 50 }
                  ],
                  columns: [
                      { id: 'qc1', tableId: 't_devices', fieldId: 'd3', tableName: t.t_dev, fieldName: t.f_model, sort: '', show: true, criteria: [''] },
                      { id: 'qc2', tableId: 't_cat', fieldId: 'c2', tableName: t.t_cat, fieldName: 'Name', alias: t.f_cat, sort: 'ASC', show: true, criteria: [''] },
                      { id: 'qc3', tableId: 't_devices', fieldId: 'd7', tableName: t.t_dev, fieldName: t.f_status, sort: '', show: true, criteria: [`= "${t.st_avail}"`] },
                      { id: 'qc4', tableId: 't_devices', fieldId: 'd5', tableName: t.t_dev, fieldName: t.f_inv, sort: '', show: true, criteria: [''] }
                  ]
              },
              // 2. Overdue Rentals (Date Logic)
              {
                  id: 'q_overdue', type: 'SELECT', name: t.q_over,
                  nodes: [
                      { id: 'n1', tableId: 't_rentals', x: 250, y: 50 },
                      { id: 'n2', tableId: 'sys_users', x: 50, y: 50 },
                      { id: 'n3', tableId: 't_devices', x: 450, y: 50 }
                  ],
                  columns: [
                      { id: 'oc1', tableId: 'sys_users', fieldId: 'u5', tableName: 'sys_users', fieldName: 'FullName', sort: '', show: true, criteria: [''] },
                      { id: 'oc2', tableId: 't_devices', fieldId: 'd3', tableName: t.t_dev, fieldName: t.f_model, sort: '', show: true, criteria: [''] },
                      { id: 'oc3', tableId: 't_rentals', fieldId: 'r5', tableName: t.t_rent, fieldName: t.f_date_due, sort: 'ASC', show: true, criteria: ['< TODAY'] },
                      { id: 'oc4', tableId: 't_rentals', fieldId: 'r7', tableName: t.t_rent, fieldName: t.f_status, sort: '', show: true, criteria: [`= "${t.rs_active}"`] }
                  ]
              }
          ],
          forms: [
              // 1. New Rental (Process)
              {
                  id: 'f_rent_new', name: t.f_rent_new, sourceType: 'table', sourceId: 't_rentals',
                  fields: [],
                  layout: {
                      id: 'root', type: 'container', className: 'p-6 bg-white space-y-6',
                      children: [
                          { id: 'hdr', type: 'label', label: t.f_rent_new, className: 'text-2xl font-bold text-slate-800 border-b pb-2' },
                          { 
                              id: 'c_main', type: 'container', className: 'grid grid-cols-2 gap-6',
                              children: [
                                  { id: 'f_user', type: 'field', fieldId: 'r3', label: t.t_users, widgetType: 'select', lookup: { tableId: 'sys_users', valueFieldId: 'u1', labelFields: ['u5', 'u2'], displayFormat: [{fieldId:'u5'}, {prefix: ' (', fieldId:'u2', suffix:')'}] } },
                                  { id: 'f_dev', type: 'field', fieldId: 'r2', label: t.t_dev, widgetType: 'select', lookup: { tableId: 't_devices', valueFieldId: 'd1', labelFields: ['d3', 'd5'], displayFormat: [{fieldId:'d3'}, {prefix: ' [', fieldId:'d5', suffix:']'}] } }
                              ]
                          },
                          { 
                              id: 'c_dates', type: 'container', className: 'grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded border',
                              children: [
                                  { id: 'f_from', type: 'field', fieldId: 'r4', label: t.f_date_out, widgetType: 'date' },
                                  { id: 'f_due', type: 'field', fieldId: 'r5', label: t.f_date_due, widgetType: 'date' }
                              ]
                          },
                          { id: 'f_notes', type: 'field', fieldId: 'r8', label: 'Notizen', widgetType: 'textarea' },
                          { id: 'f_status', type: 'field', fieldId: 'r7', label: t.f_status, widgetType: 'select', lookup: { tableId: 't_rentals', valueFieldId: 'r7', labelFields: ['r7'] } } // Self-lookup for status is a simple hack for dropdown
                      ]
                  }
              },
              // 2. Device Management (Admin)
              {
                  id: 'f_dev_man', name: t.f_dev_man, sourceType: 'table', sourceId: 't_devices',
                  fields: [],
                  layout: {
                      id: 'root', type: 'container', className: 'p-6 space-y-4',
                      children: [
                          { id: 'hdr', type: 'label', label: t.f_dev_man, className: 'text-xl font-bold text-slate-700' },
                          { id: 'f_cat', type: 'field', fieldId: 'd2', label: t.t_cat, widgetType: 'select', lookup: { tableId: 't_cat', valueFieldId: 'c1', labelFields: ['c2'], allowQuickCreate: true } },
                          { 
                              id: 'c_details', type: 'container', className: 'grid grid-cols-2 gap-4',
                              children: [
                                  { id: 'f_mod', type: 'field', fieldId: 'd3', label: t.f_model },
                                  { id: 'f_inv', type: 'field', fieldId: 'd5', label: t.f_inv }
                              ]
                          },
                          { id: 'f_ser', type: 'field', fieldId: 'd4', label: t.f_serial },
                          { 
                              id: 'c_meta', type: 'container', className: 'grid grid-cols-2 gap-4',
                              children: [
                                  { id: 'f_buy', type: 'field', fieldId: 'd6', label: 'Kaufdatum', widgetType: 'date' },
                                  { id: 'f_stat', type: 'field', fieldId: 'd7', label: t.f_status, widgetType: 'select', lookup: { tableId: 't_devices', valueFieldId: 'd7', labelFields: ['d7'] } }
                              ]
                          }
                      ]
                  }
              }
          ],
          reports: [
              {
                  id: 'r_inv_list', name: t.r_inv, sourceType: 'table', sourceId: 't_devices',
                  groupingFieldId: 'd2', // Group by Category
                  summaries: [{ fieldId: 'd1', fieldName: 'Id', calculation: 'COUNT' }],
                  columns: [
                      { fieldId: 'd3', label: t.f_model, visible: true, order: 0 },
                      { fieldId: 'd5', label: t.f_inv, visible: true, order: 1 },
                      { fieldId: 'd7', label: t.f_status, visible: true, order: 2, formattingRules: [{ operator: 'eq', value: t.st_broken, style: { color: 'red', bold: true } }, { operator: 'eq', value: t.st_avail, style: { color: 'green', bold: true } }] }
                  ]
              }
          ],
          layout: [],
          tableGroups: []
        }
    };
};
