
import { ProjectTemplate, DbType } from '../../../types/index';

const dict: Record<string, any> = {
    de: {
        name: 'Warenwirtschaft Light', desc: 'Einfache Lagerverwaltung mit Lieferanten, Artikeln und Lagerbestands-Warnungen.',
        t_supp: 'Lieferanten', f_city: 'Stadt',
        t_art: 'Artikel', f_bez: 'Bezeichnung', f_stock: 'Bestand', f_min: 'MinBestand',
        r_reorder: 'Nachbestell-Liste',
        l_curr: 'Aktueller Bestand', l_min: 'Min. Bestand',
        d_screw: 'Schraube', d_nut: 'Mutter', d_box: 'Karton',
        f_art_form: 'Artikel erfassen', f_supp_form: 'Lieferant'
    },
    en: {
        name: 'Inventory Light', desc: 'Simple inventory management with suppliers, items and stock alerts.',
        t_supp: 'Suppliers', f_city: 'City',
        t_art: 'Articles', f_bez: 'Description', f_stock: 'Stock', f_min: 'MinStock',
        r_reorder: 'Reorder List',
        l_curr: 'Current Stock', l_min: 'Min. Stock',
        d_screw: 'Screw', d_nut: 'Nut', d_box: 'Box',
        f_art_form: 'Edit Article', f_supp_form: 'Supplier'
    },
    fr: {
        name: 'Gestion Stock Light', desc: 'Gestion de stock simple avec fournisseurs et alertes.',
        t_supp: 'Fournisseurs', f_city: 'Ville',
        t_art: 'Articles', f_bez: 'Désignation', f_stock: 'Stock', f_min: 'StockMin',
        r_reorder: 'Liste de Réappro.',
        l_curr: 'Stock Actuel', l_min: 'Stock Min.',
        d_screw: 'Vis', d_nut: 'Écrou', d_box: 'Carton',
        f_art_form: 'Éditer Article', f_supp_form: 'Fournisseur'
    },
    it: {
        name: 'Inventario Light', desc: 'Gestione magazzino semplice con fornitori e avvisi scorte.',
        t_supp: 'Fornitori', f_city: 'Città',
        t_art: 'Articoli', f_bez: 'Descrizione', f_stock: 'Giacenza', f_min: 'ScortaMin',
        r_reorder: 'Lista Riordino',
        l_curr: 'Giacenza Attuale', l_min: 'Scorta Min.',
        d_screw: 'Vite', d_nut: 'Dado', d_box: 'Scatola',
        f_art_form: 'Modifica Articolo', f_supp_form: 'Fornitore'
    },
    no: {
        name: 'Lagerstyring Light', desc: 'Enkel lagerstyring med leverandører og varsler.',
        t_supp: 'Leverandører', f_city: 'By',
        t_art: 'Artikler', f_bez: 'Beskrivelse', f_stock: 'Lager', f_min: 'MinLager',
        r_reorder: 'Bestillingsliste',
        l_curr: 'Aktuelt Lager', l_min: 'Min. Lager',
        d_screw: 'Skrue', d_nut: 'Mutter', d_box: 'Eske',
        f_art_form: 'Rediger Artikkel', f_supp_form: 'Leverandør'
    },
    bs: {
        name: 'Skladište Light', desc: 'Jednostavno upravljanje zalihama sa dobavljačima.',
        t_supp: 'Dobavljači', f_city: 'Grad',
        t_art: 'Artikli', f_bez: 'Opis', f_stock: 'Zaliha', f_min: 'MinZaliha',
        r_reorder: 'Lista za Narudžbu',
        l_curr: 'Trenutna Zaliha', l_min: 'Min. Zaliha',
        d_screw: 'Vijak', d_nut: 'Matica', d_box: 'Kutija',
        f_art_form: 'Uredi Artikal', f_supp_form: 'Dobavljač'
    }
};

export const getInventoryApp = (lang: string): ProjectTemplate => {
    const t = dict[lang] || dict['en'];

    return {
        id: 'inventory_app',
        name: t.name,
        description: t.desc,
        icon: 'Package',
        category: 'Business',
        data: {
          backendConfig: {
            language: 'nodejs',
            dbType: DbType.SQLite,
            projectName: 'InventoryApp',
            port: 3000,
            dbConnection: 'Data Source=inventory.db',
            useSwagger: false,
            frontendFramework: 'react',
            authConfig: { useUserLogin: false, useWindowsAuth: false, useAdGroups: false, devBypass: true, isMobileReady: false }
          },
          tables: [
            {
              id: 't_supp', name: t.t_supp,
              fields: [
                { id: 's1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 's2', name: 'Name', type: 'VARCHAR', length: 100 },
                { id: 's3', name: t.f_city, type: 'VARCHAR', length: 50 }
              ],
              data: [{ Id: 1, Name: 'MegaParts Ltd', [t.f_city]: 'Berlin' }, { Id: 2, Name: 'Global Imports', [t.f_city]: 'Hamburg' }]
            },
            {
              id: 't_art', name: t.t_art,
              fields: [
                { id: 'a1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'a2', name: 'LieferantenId', type: 'INTEGER' },
                { id: 'a3', name: t.f_bez, type: 'VARCHAR', length: 100 },
                { id: 'a4', name: t.f_stock, type: 'INTEGER' },
                { id: 'a5', name: t.f_min, type: 'INTEGER', defaultValue: '10' }
              ],
              data: [
                { Id: 1, LieferantenId: 1, [t.f_bez]: `${t.d_screw} M4`, [t.f_stock]: 500, [t.f_min]: 100 },
                { Id: 2, LieferantenId: 1, [t.f_bez]: `${t.d_nut} M4`, [t.f_stock]: 50, [t.f_min]: 100 }, // Low stock
                { Id: 3, LieferantenId: 2, [t.f_bez]: `${t.d_box} XL`, [t.f_stock]: 200, [t.f_min]: 20 }
              ]
            }
          ],
          relationships: [
            { id: 'r1', fromTableId: 't_supp', fromFieldId: 's1', toTableId: 't_art', toFieldId: 'a2', type: '1:n', referentialIntegrity: true }
          ],
          reports: [
            {
              id: 'r_reorder', name: t.r_reorder, sourceType: 'table', sourceId: 't_art',
              summaries: [],
              columns: [
                { fieldId: 'a3', label: t.t_art, visible: true, order: 0 },
                { fieldId: 'a4', label: t.l_curr, visible: true, order: 1, formattingRules: [{ operator: 'lte', value: '100', style: { color: 'red', bold: true } }] },
                { fieldId: 'a5', label: t.l_min, visible: true, order: 2 }
              ]
            }
          ],
          queries: [],
          forms: [
              {
                  id: 'f_art', name: t.f_art_form, sourceType: 'table', sourceId: 't_art',
                  fields: [],
                  layout: {
                      id: 'root', type: 'container', className: 'p-4 space-y-4',
                      children: [
                          { id: 'l1', type: 'label', label: t.f_art_form, className: 'text-xl font-bold text-slate-800 border-b pb-2' },
                          { id: 'f1', type: 'field', fieldId: 'a3', label: t.f_bez },
                          { 
                              id: 'c1', type: 'container', className: 'grid grid-cols-2 gap-4', 
                              children: [
                                  { id: 'f2', type: 'field', fieldId: 'a4', label: t.f_stock, widgetType: 'number' },
                                  { id: 'f3', type: 'field', fieldId: 'a5', label: t.f_min, widgetType: 'number' }
                              ]
                          },
                          { id: 'f4', type: 'field', fieldId: 'a2', label: t.t_supp, widgetType: 'select', lookup: { tableId: 't_supp', valueFieldId: 's1', labelFields: ['s2'], allowQuickCreate: true } }
                      ]
                  }
              }
          ],
          layout: [],
          tableGroups: []
        }
    };
};
