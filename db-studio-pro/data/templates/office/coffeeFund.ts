
import { ProjectTemplate, DbType } from '../../../types/index';

const dict: Record<string, any> = {
    de: {
        name: 'Kaffeekasse & Kiosk (POS)',
        desc: 'Tablet-optimiertes Kiosk-System zur Erfassung von Getränken am Automaten mit Guthaben- und Inventarverwaltung.',
        t_users: 'Mitarbeiter', f_name: 'Name', f_dept: 'Abteilung', f_rfid: 'RFID-Badge', f_pin: 'PIN-Code',
        t_prod: 'Produkte', f_pname: 'Produkt', f_price: 'Preis', f_cat: 'Kategorie', f_stock: 'Bestand', f_img: 'Bild-URL',
        t_journal: 'Buchungen', f_amount: 'Betrag', f_date: 'Zeitstempel',
        q_neg: 'Offene Forderungen', q_top: 'Leaderboard (Koffein)',
        r_bill: 'Monatsabrechnung', r_inventory: 'Inventar Warnliste',
        f_pos: 'Self-Service Terminal', f_admin: 'Admin Dashboard',
        cat_hot: 'Heissgetränk', cat_cold: 'Kaltgetränk', cat_snack: 'Nervennahrung'
    },
    en: {
        name: 'Coffee Fund & Kiosk (POS)',
        desc: 'Tablet-optimized kiosk system for beverage tracking at the machine with balance and inventory management.',
        t_users: 'Employees', f_name: 'Name', f_dept: 'Department', f_rfid: 'RFID-Badge', f_pin: 'PIN-Code',
        t_prod: 'Products', f_pname: 'Product', f_price: 'Price', f_cat: 'Category', f_stock: 'Stock', f_img: 'Image URL',
        t_journal: 'Journal', f_amount: 'Amount', f_date: 'Timestamp',
        q_neg: 'Negative Balances', q_top: 'Leaderboard (Caffeine)',
        r_bill: 'Monthly Bill', r_inventory: 'Low Inventory Alert',
        f_pos: 'Self-Service Terminal', f_admin: 'Admin Dashboard',
        cat_hot: 'Hot Drink', cat_cold: 'Cold Drink', cat_snack: 'Snacks'
    }
};

export const getCoffeeFund = (lang: string): ProjectTemplate => {
    const t = dict[lang] || dict['de'];

    return {
        id: 'coffee_fund',
        name: t.name,
        description: t.desc,
        icon: 'Coffee', 
        category: 'Office',
        data: {
          backendConfig: {
            language: 'nodejs',
            dbType: DbType.SQLite,
            projectName: 'CoffeeKiosk',
            port: 3000,
            dbConnection: 'Data Source=kiosk.db',
            useSwagger: true,
            frontendFramework: 'react',
            authConfig: { useUserLogin: true, useWindowsAuth: false, useAdGroups: false, devBypass: true, isMobileReady: true }
          },
          tables: [
            {
              id: 't_users', name: t.t_users,
              fields: [
                { id: 'u1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'u2', name: t.f_name, type: 'VARCHAR', length: 100 },
                { id: 'u3', name: 'Email', type: 'VARCHAR', length: 100 },
                { id: 'u4', name: t.f_dept, type: 'VARCHAR', length: 50 },
                { id: 'u5', name: t.f_rfid, type: 'VARCHAR', length: 50 },
                { id: 'u6', name: t.f_pin, type: 'VARCHAR', length: 10 }
              ],
              data: [
                { Id: 1, [t.f_name]: 'Anna Admin', Email: 'anna@firma.de', [t.f_dept]: 'IT', [t.f_rfid]: 'AABBCCDD', [t.f_pin]: '1234' },
                { Id: 2, [t.f_name]: 'Bernd Buchhalter', Email: 'bernd@firma.de', [t.f_dept]: 'Finance', [t.f_rfid]: '11223344', [t.f_pin]: '0000' },
                { Id: 3, [t.f_name]: 'Clara Coder', Email: 'clara@firma.de', [t.f_dept]: 'Dev', [t.f_rfid]: '99887766', [t.f_pin]: '1337' }
              ]
            },
            {
              id: 't_prod', name: t.t_prod,
              fields: [
                { id: 'p1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'p2', name: t.f_pname, type: 'VARCHAR', length: 50 },
                { id: 'p3', name: t.f_price, type: 'DECIMAL', precision: 10, scale: 2 },
                { id: 'p4', name: t.f_cat, type: 'VARCHAR', length: 50 },
                { id: 'p5', name: t.f_stock, type: 'INTEGER', defaultValue: '100' },
                { id: 'p6', name: t.f_img, type: 'VARCHAR', length: 255 }
              ],
              data: [
                { Id: 1, [t.f_pname]: 'Schwarzer Kaffee', [t.f_price]: 0.50, [t.f_cat]: t.cat_hot, [t.f_stock]: 500 },
                { Id: 2, [t.f_pname]: 'Cappuccino', [t.f_price]: 0.80, [t.f_cat]: t.cat_hot, [t.f_stock]: 500 },
                { Id: 3, [t.f_pname]: 'Club Mate', [t.f_price]: 1.50, [t.f_cat]: t.cat_cold, [t.f_stock]: 24 },
                { Id: 4, [t.f_pname]: 'Fritz Kola', [t.f_price]: 1.50, [t.f_cat]: t.cat_cold, [t.f_stock]: 12 },
                { Id: 5, [t.f_pname]: 'Snickers', [t.f_price]: 1.20, [t.f_cat]: t.cat_snack, [t.f_stock]: 30 }
              ]
            },
            {
              id: 't_journal', name: t.t_journal,
              fields: [
                { id: 'j1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'j2', name: 'UserId', type: 'INTEGER' },
                { id: 'j3', name: 'ProductId', type: 'INTEGER', allowNull: true }, 
                { id: 'j4', name: t.f_amount, type: 'DECIMAL', precision: 10, scale: 2 }, 
                { id: 'j5', name: t.f_date, type: 'DATETIME', defaultValue: 'NOW' }
              ],
              data: [
                { Id: 1, UserId: 1, ProductId: null, [t.f_amount]: 50.00, [t.f_date]: '2023-11-01 09:00:00' }, 
                { Id: 2, UserId: 1, ProductId: 2, [t.f_amount]: -0.80, [t.f_date]: '2023-11-01 10:30:00' }, 
                { Id: 3, UserId: 2, ProductId: 1, [t.f_amount]: -0.50, [t.f_date]: '2023-11-01 11:00:00' },
                { Id: 4, UserId: 3, ProductId: 3, [t.f_amount]: -1.50, [t.f_date]: '2023-11-01 14:00:00' }
              ]
            }
          ],
          relationships: [
            { id: 'r1', fromTableId: 't_users', fromFieldId: 'u1', toTableId: 't_journal', toFieldId: 'j2', type: '1:n', referentialIntegrity: true },
            { id: 'r2', fromTableId: 't_prod', fromFieldId: 'p1', toTableId: 't_journal', toFieldId: 'j3', type: '1:n', referentialIntegrity: true }
          ],
          queries: [
            {
                id: 'q_balance', type: 'SELECT', name: t.q_neg,
                nodes: [
                    { id: 'n1', tableId: 't_users', x: 50, y: 50 },
                    { id: 'n2', tableId: 't_journal', x: 300, y: 50 }
                ],
                columns: [
                    { id: 'c1', tableId: 't_users', fieldId: 'u2', tableName: t.t_users, fieldName: t.f_name, show: true, criteria: [''], aggregate: 'GROUP_BY' },
                    { id: 'c2', tableId: 't_journal', fieldId: 'j4', tableName: t.t_journal, fieldName: t.f_amount, show: true, criteria: ['< 0'], aggregate: 'SUM', alias: 'Saldo' }
                ]
            }
          ],
          forms: [
            {
              id: 'f_pos', name: t.f_pos, sourceType: 'table', sourceId: 't_journal',
              fields: [],
              layout: {
                id: 'root', type: 'container', className: 'h-screen w-full flex bg-slate-900 text-white',
                children: [
                    {
                        id: 'left_col', type: 'container', className: 'w-2/3 p-8 flex flex-col',
                        children: [
                             { id: 'l_header', type: 'label', label: 'Wähle dein Getränk', className: 'text-4xl font-black text-white mb-8' },
                             { 
                                 id: 'grid_prod', type: 'container', className: 'grid grid-cols-3 gap-6 flex-1 auto-rows-max',
                                 children: [
                                     { id: 'btn_1', type: 'button', label: '☕ Schwarzer Kaffee (0.50€)', className: 'h-32 bg-slate-800 hover:bg-slate-700 rounded-2xl text-xl font-medium border border-slate-700 shadow-2xl transition-transform active:scale-95', actions: [] },
                                     { id: 'btn_2', type: 'button', label: '🥛 Cappuccino (0.80€)', className: 'h-32 bg-slate-800 hover:bg-slate-700 rounded-2xl text-xl font-medium border border-slate-700 shadow-2xl transition-transform active:scale-95', actions: [] },
                                     { id: 'btn_3', type: 'button', label: '🧉 Club Mate (1.50€)', className: 'h-32 bg-slate-800 hover:bg-yellow-900 rounded-2xl text-xl font-medium border border-slate-700 shadow-2xl transition-transform active:scale-95', actions: [] },
                                     { id: 'btn_4', type: 'button', label: '🥤 Fritz Kola (1.50€)', className: 'h-32 bg-slate-800 hover:bg-slate-700 rounded-2xl text-xl font-medium border border-slate-700 shadow-2xl transition-transform active:scale-95', actions: [] },
                                     { id: 'btn_5', type: 'button', label: '🍫 Snickers (1.20€)', className: 'h-32 bg-slate-800 hover:bg-slate-700 rounded-2xl text-xl font-medium border border-slate-700 shadow-2xl transition-transform active:scale-95', actions: [] }
                                 ]
                             }
                        ]
                    },
                    {
                        id: 'right_col', type: 'container', className: 'w-1/3 bg-slate-800 p-8 flex flex-col shadow-2xl z-10 border-l border-slate-700',
                        children: [
                             { id: 'r_header', type: 'label', label: 'Identifikation', className: 'text-2xl font-bold text-slate-300 mb-6' },
                             { id: 'scan_prompt', type: 'label', label: 'Bitte RFID-Chip auflegen oder PIN eingeben...', className: 'text-slate-400 mb-4 animate-pulse' },
                             { id: 'pin_input', type: 'field', fieldId: 'j2', label: 'PIN', className: 'bg-slate-900 text-white text-3xl text-center p-4 rounded-xl border border-slate-700 w-full mb-8 tracking-widest', widgetType: 'text' },
                             {
                                  id: 'numpad', type: 'container', className: 'grid grid-cols-3 gap-3 mb-auto',
                                  children: [
                                      { id: 'num1', type: 'button', label: '1', className: 'h-16 bg-slate-700 text-2xl rounded-xl hover:bg-slate-600', actions: [] },
                                      { id: 'num2', type: 'button', label: '2', className: 'h-16 bg-slate-700 text-2xl rounded-xl hover:bg-slate-600', actions: [] },
                                      { id: 'num3', type: 'button', label: '3', className: 'h-16 bg-slate-700 text-2xl rounded-xl hover:bg-slate-600', actions: [] },
                                      { id: 'num4', type: 'button', label: '4', className: 'h-16 bg-slate-700 text-2xl rounded-xl hover:bg-slate-600', actions: [] },
                                      { id: 'num5', type: 'button', label: '5', className: 'h-16 bg-slate-700 text-2xl rounded-xl hover:bg-slate-600', actions: [] },
                                      { id: 'num6', type: 'button', label: '6', className: 'h-16 bg-slate-700 text-2xl rounded-xl hover:bg-slate-600', actions: [] },
                                      { id: 'num7', type: 'button', label: '7', className: 'h-16 bg-slate-700 text-2xl rounded-xl hover:bg-slate-600', actions: [] },
                                      { id: 'num8', type: 'button', label: '8', className: 'h-16 bg-slate-700 text-2xl rounded-xl hover:bg-slate-600', actions: [] },
                                      { id: 'num9', type: 'button', label: '9', className: 'h-16 bg-slate-700 text-2xl rounded-xl hover:bg-slate-600', actions: [] },
                                      { id: 'num_clr', type: 'button', label: 'C', className: 'h-16 bg-red-900/50 text-red-400 text-xl font-bold rounded-xl hover:bg-red-800', actions: [] },
                                      { id: 'num0', type: 'button', label: '0', className: 'h-16 bg-slate-700 text-2xl rounded-xl hover:bg-slate-600', actions: [] },
                                      { id: 'num_ok', type: 'button', label: 'OK', className: 'h-16 bg-emerald-700 text-white text-xl font-bold rounded-xl hover:bg-emerald-600', actions: [] }
                                  ]
                             },
                             { id: 'checkout_btn', type: 'button', label: 'BUCHEN', className: 'w-full h-20 bg-blue-600 rounded-xl text-2xl font-black text-white hover:bg-blue-500 shadow-lg mt-4 transition-transform active:scale-95', actions: [] }
                        ]
                    }
                ]
              }
            }
          ],
          reports: [
            {
                id: 'r_bill', name: t.r_bill, sourceType: 'table', sourceId: 't_journal',
                groupingFieldId: 'j2', 
                summaries: [{ fieldId: 'j4', fieldName: t.f_amount, calculation: 'SUM' }],
                columns: [
                    { fieldId: 'j5', label: t.f_date, visible: true, order: 0 },
                    { fieldId: 'j3', label: t.t_prod, visible: true, order: 1 },
                    { fieldId: 'j4', label: 'Betrag (€)', visible: true, order: 2, formattingRules: [{ operator: 'lt', value: '0', style: { color: 'red' } }, { operator: 'gt', value: '0', style: { color: 'green' } }] }
                ]
            }
          ],
          layout: [],
          tableGroups: []
        }
    };
};

