
import { ProjectTemplate, DbType } from '../../../types/index';

const dict: Record<string, any> = {
    de: {
        name: 'Einfaches CRM',
        desc: 'Kundenverwaltung mit Aufträgen und Produkten. Enthält Master-Detail Formulare und Umsatz-Berichte.',
        t_cust: 'Kunden', f_comp: 'Firma', f_contact: 'Kontakt', f_status: 'Status',
        t_prod: 'Produkte', f_pname: 'Produktname', f_price: 'Preis', f_cat: 'Kategorie',
        t_ord: 'Auftraege', f_date: 'Datum', f_amount: 'Gesamtbetrag',
        t_items: 'Auftragspositionen', f_qty: 'Menge',
        q_rev: 'Umsatz pro Kunde',
        r_list: 'Kundenliste',
        f_ord_form: 'Auftragserfassung',
        d_active: 'Aktiv', d_lead: 'Interessent', d_inactive: 'Inaktiv',
        d_serv: 'Dienstleistung', d_prod: 'Produkt'
    },
    en: {
        name: 'Simple CRM',
        desc: 'Customer management with orders and products. Includes Master-Detail forms and revenue reports.',
        t_cust: 'Customers', f_comp: 'CompanyName', f_contact: 'ContactName', f_status: 'Status',
        t_prod: 'Products', f_pname: 'Name', f_price: 'Price', f_cat: 'Category',
        t_ord: 'Orders', f_date: 'OrderDate', f_amount: 'TotalAmount',
        t_items: 'OrderItems', f_qty: 'Quantity',
        q_rev: 'Revenue per Customer',
        r_list: 'Customer List',
        f_ord_form: 'Order Entry',
        d_active: 'Active', d_lead: 'Lead', d_inactive: 'Inactive',
        d_serv: 'Service', d_prod: 'Product'
    },
    fr: {
        name: 'CRM Simple',
        desc: 'Gestion client avec commandes et produits. Inclut des formulaires Maître-Détail.',
        t_cust: 'Clients', f_comp: 'Société', f_contact: 'Contact', f_status: 'Statut',
        t_prod: 'Produits', f_pname: 'Nom', f_price: 'Prix', f_cat: 'Catégorie',
        t_ord: 'Commandes', f_date: 'Date', f_amount: 'MontantTotal',
        t_items: 'ArticlesCommande', f_qty: 'Quantité',
        q_rev: 'Revenu par Client',
        r_list: 'Liste des Clients',
        f_ord_form: 'Saisie Commande',
        d_active: 'Actif', d_lead: 'Piste', d_inactive: 'Inactif',
        d_serv: 'Service', d_prod: 'Produit'
    },
    it: {
        name: 'CRM Semplice',
        desc: 'Gestione clienti con ordini e prodotti. Include moduli Master-Detail.',
        t_cust: 'Clienti', f_comp: 'Azienda', f_contact: 'Contatto', f_status: 'Stato',
        t_prod: 'Prodotti', f_pname: 'Nome', f_price: 'Prezzo', f_cat: 'Categoria',
        t_ord: 'Ordini', f_date: 'Data', f_amount: 'ImportoTotale',
        t_items: 'ArticoliOrdine', f_qty: 'Quantità',
        q_rev: 'Fatturato per Cliente',
        r_list: 'Lista Clienti',
        f_ord_form: 'Inserimento Ordine',
        d_active: 'Attivo', d_lead: 'Lead', d_inactive: 'Inattivo',
        d_serv: 'Servizio', d_prod: 'Prodotto'
    },
    no: {
        name: 'Enkel CRM',
        desc: 'Kundehåndtering med ordrer og produkter.',
        t_cust: 'Kunder', f_comp: 'Firma', f_contact: 'Kontakt', f_status: 'Status',
        t_prod: 'Produkter', f_pname: 'Navn', f_price: 'Pris', f_cat: 'Kategori',
        t_ord: 'Ordrer', f_date: 'Dato', f_amount: 'Totalbeløp',
        t_items: 'Ordrelinjer', f_qty: 'Antall',
        q_rev: 'Omsetning per Kunde',
        r_list: 'Kundeliste',
        f_ord_form: 'Ordregistrering',
        d_active: 'Aktiv', d_lead: 'Lead', d_inactive: 'Inaktiv',
        d_serv: 'Tjeneste', d_prod: 'Produkt'
    },
    bs: {
        name: 'Jednostavan CRM',
        desc: 'Upravljanje kupcima sa narudžbama i proizvodima.',
        t_cust: 'Kupci', f_comp: 'Kompanija', f_contact: 'Kontakt', f_status: 'Status',
        t_prod: 'Proizvodi', f_pname: 'Naziv', f_price: 'Cijena', f_cat: 'Kategorija',
        t_ord: 'Narudzbe', f_date: 'Datum', f_amount: 'UkupanIznos',
        t_items: 'StavkeNarudzbe', f_qty: 'Kolicina',
        q_rev: 'Prihod po Kupcu',
        r_list: 'Lista Kupaca',
        f_ord_form: 'Unos Narudzbe',
        d_active: 'Aktivan', d_lead: 'Potencijal', d_inactive: 'Neaktivan',
        d_serv: 'Usluga', d_prod: 'Proizvod'
    }
};

export const getCrmSuite = (lang: string): ProjectTemplate => {
    const t = dict[lang] || dict['en']; // Fallback to EN

    return {
        id: 'crm_suite',
        name: t.name,
        description: t.desc,
        icon: 'Briefcase',
        category: 'Business',
        data: {
          backendConfig: {
            language: 'dotnet',
            dbType: DbType.SQL,
            projectName: 'MyCRM',
            port: 5000,
            dbConnection: 'Server=.;Database=MyCRM;Trusted_Connection=True;',
            useSwagger: true,
            frontendFramework: 'react',
            authConfig: { useUserLogin: false, useWindowsAuth: false, useAdGroups: false, devBypass: true, isMobileReady: false }
          },
          tables: [
            {
              id: 't_cust', name: t.t_cust,
              fields: [
                { id: 'c1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'c2', name: t.f_comp, type: 'VARCHAR', length: 100 },
                { id: 'c3', name: t.f_contact, type: 'VARCHAR', length: 100 },
                { id: 'c4', name: 'Email', type: 'VARCHAR', length: 100 },
                { id: 'c5', name: 'Phone', type: 'VARCHAR', length: 20 },
                { id: 'c6', name: t.f_status, type: 'VARCHAR', length: 20, defaultValue: t.d_active }
              ],
              data: [
                { Id: 1, [t.f_comp]: 'TechCorp GmbH', [t.f_contact]: 'Hans Müller', Email: 'h.mueller@techcorp.de', Phone: '030-123456', [t.f_status]: t.d_active },
                { Id: 2, [t.f_comp]: 'Design Studio', [t.f_contact]: 'Lisa Schmidt', Email: 'lisa@design.com', Phone: '040-987654', [t.f_status]: t.d_lead },
                { Id: 3, [t.f_comp]: 'Global Logistics', [t.f_contact]: 'John Doe', Email: 'john@logistics.net', Phone: '069-555666', [t.f_status]: t.d_inactive }
              ]
            },
            {
              id: 't_prod', name: t.t_prod,
              fields: [
                { id: 'p1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'p2', name: t.f_pname, type: 'VARCHAR', length: 100 },
                { id: 'p3', name: t.f_price, type: 'DECIMAL', precision: 10, scale: 2 },
                { id: 'p4', name: t.f_cat, type: 'VARCHAR', length: 50 }
              ],
              data: [
                { Id: 1, [t.f_pname]: 'Consulting Day', [t.f_price]: 1200.00, [t.f_cat]: t.d_serv },
                { Id: 2, [t.f_pname]: 'Software License', [t.f_price]: 499.00, [t.f_cat]: t.d_prod },
                { Id: 3, [t.f_pname]: 'Support Contract', [t.f_price]: 150.00, [t.f_cat]: t.d_serv }
              ]
            },
            {
              id: 't_ord', name: t.t_ord,
              fields: [
                { id: 'o1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'o2', name: 'CustomerId', type: 'INTEGER' },
                { id: 'o3', name: t.f_date, type: 'DATE' },
                { id: 'o4', name: t.f_amount, type: 'DECIMAL', precision: 12, scale: 2 }
              ],
              data: [
                { Id: 1001, CustomerId: 1, [t.f_date]: '2023-10-01', [t.f_amount]: 1699.00 },
                { Id: 1002, CustomerId: 2, [t.f_date]: '2023-10-05', [t.f_amount]: 499.00 }
              ]
            },
            {
              id: 't_items', name: t.t_items,
              fields: [
                { id: 'i1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'i2', name: 'OrderId', type: 'INTEGER' },
                { id: 'i3', name: 'ProductId', type: 'INTEGER' },
                { id: 'i4', name: t.f_qty, type: 'INTEGER', defaultValue: '1' }
              ],
              data: [
                { Id: 1, OrderId: 1001, ProductId: 1, [t.f_qty]: 1 },
                { Id: 2, OrderId: 1001, ProductId: 2, [t.f_qty]: 1 },
                { Id: 3, OrderId: 1002, ProductId: 2, [t.f_qty]: 1 }
              ]
            }
          ],
          relationships: [
            { id: 'r1', fromTableId: 't_cust', fromFieldId: 'c1', toTableId: 't_ord', toFieldId: 'o2', type: '1:n', referentialIntegrity: true },
            { id: 'r2', fromTableId: 't_ord', fromFieldId: 'o1', toTableId: 't_items', toFieldId: 'i2', type: '1:n', referentialIntegrity: true, onDelete: 'CASCADE' },
            { id: 'r3', fromTableId: 't_prod', fromFieldId: 'p1', toTableId: 't_items', toFieldId: 'i3', type: '1:n', referentialIntegrity: true }
          ],
          queries: [
            {
              id: 'q_revenue', type: 'SELECT', name: t.q_rev,
              nodes: [
                { id: 'n1', tableId: 't_cust', x: 50, y: 50 },
                { id: 'n2', tableId: 't_ord', x: 300, y: 50 }
              ],
              columns: [
                { id: 'qc1', tableId: 't_cust', fieldId: 'c2', tableName: t.t_cust, fieldName: t.f_comp, sort: 'ASC', show: true, criteria: [''], aggregate: 'GROUP_BY' },
                { id: 'qc2', tableId: 't_ord', fieldId: 'o4', tableName: t.t_ord, fieldName: t.f_amount, sort: 'DESC', show: true, criteria: [''], aggregate: 'SUM', alias: 'Total' }
              ]
            }
          ],
          forms: [
            {
              id: 'f_orders', name: t.f_ord_form, sourceType: 'table', sourceId: 't_ord',
              fields: [],
              layout: {
                id: 'root', type: 'container', className: 'space-y-4',
                children: [
                  { id: 'l1', type: 'label', label: t.t_ord, className: 'text-lg font-bold border-b pb-2' },
                  { 
                    id: 'c_header', type: 'container', className: 'grid grid-cols-2 gap-4',
                    children: [
                      { id: 'f_cust', type: 'field', fieldId: 'o2', label: t.t_cust, widgetType: 'select', lookup: { tableId: 't_cust', valueFieldId: 'c1', labelFields: ['c2'], allowQuickCreate: true } },
                      { id: 'f_date', type: 'field', fieldId: 'o3', label: t.f_date, widgetType: 'date' }
                    ]
                  },
                  { id: 'f_total', type: 'field', fieldId: 'o4', label: t.f_amount, widgetType: 'number' },
                  { 
                    id: 'sub_items', type: 'subform', label: t.t_items, 
                    subform: { formId: 'f_items_sub', masterLinkFieldId: 'o1', childLinkFieldId: 'i2', canAdd: true, canEdit: true, canDelete: true } 
                  }
                ]
              }
            },
            {
              id: 'f_items_sub', name: 'Positions-Subform', sourceType: 'table', sourceId: 't_items',
              fields: [],
              layout: {
                id: 'sub_root', type: 'container', className: 'grid grid-cols-2 gap-2 p-2 bg-slate-50',
                children: [
                  { id: 'f_prod', type: 'field', fieldId: 'i3', label: t.t_prod, widgetType: 'select', lookup: { tableId: 't_prod', valueFieldId: 'p1', labelFields: ['p2'] } },
                  { id: 'f_qty', type: 'field', fieldId: 'i4', label: t.f_qty, widgetType: 'number' }
                ]
              }
            }
          ],
          reports: [
            {
              id: 'r_cust_list', name: t.r_list, sourceType: 'table', sourceId: 't_cust',
              groupingFieldId: 'c6', // Status
              summaries: [{ fieldId: 'c1', fieldName: 'Id', calculation: 'COUNT' }],
              columns: [
                { fieldId: 'c2', label: t.f_comp, visible: true, order: 0 },
                { fieldId: 'c3', label: t.f_contact, visible: true, order: 1 },
                { fieldId: 'c4', label: 'E-Mail', visible: true, order: 2 },
                { fieldId: 'c6', label: t.f_status, visible: true, order: 3, formattingRules: [{ operator: 'eq', value: t.d_active, style: { color: 'green', bold: true } }] }
              ]
            }
          ],
          layout: [],
          tableGroups: []
        }
    };
};
