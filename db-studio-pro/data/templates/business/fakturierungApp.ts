import { ProjectTemplate, DbType } from '../../../types/index';

const dict: Record<string, any> = {
    de: {
        name: 'Fakturierung & WaWi Suite',
        desc: 'Vollständiges Fakturierungsprogramm mit Rechnungen, Angeboten, Aufträgen, Artikeln, Mahnungen und Gutschriften inklusive Positionen-Subformularen.',
        t_kunden: 'Kunden',
        t_artikel: 'Artikel',
        t_angebote: 'Angebote',
        t_angebotspos: 'Angebotspositionen',
        t_auftraege: 'Auftraege',
        t_auftragspos: 'Auftragspositionen',
        t_rechnungen: 'Rechnungen',
        t_rechnungspos: 'Rechnungspositionen',
        t_mahnungen: 'Mahnungen',
        t_gutschriften: 'Gutschriften',
        t_gutschriftpos: 'Gutschriftpositionen',
        f_rechnung_form: 'Rechnungserfassung',
        f_angebot_form: 'Angebotserfassung',
        f_auftrag_form: 'Auftragserfassung',
        f_mahnung_form: 'Mahnungserfassung',
        f_gutschrift_form: 'Gutschrifterfassung',
        q_offene_rechnungen: 'Offene Rechnungen',
        q_mahnstufen: 'Mahnstufen & Offene Mahnungen',
        r_rechnungsbuch: 'Rechnungsjournal & Umsätze'
    },
    en: {
        name: 'Billing & Invoicing Suite',
        desc: 'Complete invoicing and billing application with Invoices, Quotes, Orders, Products, Dunning Reminders and Credit Notes.',
        t_kunden: 'Customers',
        t_artikel: 'Products',
        t_angebote: 'Quotes',
        t_angebotspos: 'QuoteItems',
        t_auftraege: 'Orders',
        t_auftragspos: 'OrderItems',
        t_rechnungen: 'Invoices',
        t_rechnungspos: 'InvoiceItems',
        t_mahnungen: 'DunningReminders',
        t_gutschriften: 'CreditNotes',
        t_gutschriftpos: 'CreditNoteItems',
        f_rechnung_form: 'Invoice Entry',
        f_angebot_form: 'Quote Entry',
        f_auftrag_form: 'Order Entry',
        f_mahnung_form: 'Dunning Entry',
        f_gutschrift_form: 'Credit Note Entry',
        q_offene_rechnungen: 'Open Invoices',
        q_mahnstufen: 'Dunning Levels & Open Reminders',
        r_rechnungsbuch: 'Invoice Journal & Revenue'
    }
};

export const getFakturierungApp = (lang: string): ProjectTemplate => {
    const t = dict[lang] || dict['de'];

    return {
        id: 'fakturierung_suite',
        name: t.name,
        description: t.desc,
        icon: 'Receipt',
        category: 'Business',
        data: {
          backendConfig: {
            language: 'dotnet',
            dbType: DbType.SQL,
            projectName: 'FakturierungPro',
            port: 5000,
            dbConnection: 'Server=.;Database=FakturierungPro;Trusted_Connection=True;',
            useSwagger: true,
            frontendFramework: 'react',
            authConfig: { useUserLogin: false, useWindowsAuth: false, useAdGroups: false, devBypass: true, isMobileReady: false }
          },
          tables: [
            // 1. KUNDEN
            {
              id: 't_kunden', name: t.t_kunden,
              fields: [
                { id: 'k1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'k2', name: 'KundenNr', type: 'VARCHAR', length: 30, isUnique: true, isIndexed: true, sequenceConfig: { enabled: true, prefix: 'KD-', padding: 5, startValue: 10001, step: 1 } },
                { id: 'k3', name: 'Firmenname', type: 'VARCHAR', length: 150, isIndexed: true },
                { id: 'k4', name: 'Ansprechpartner', type: 'VARCHAR', length: 100 },
                { id: 'k5', name: 'Email', type: 'VARCHAR', length: 100 },
                { id: 'k6', name: 'Telefon', type: 'VARCHAR', length: 50 },
                { id: 'k7', name: 'Strasse', type: 'VARCHAR', length: 120 },
                { id: 'k8', name: 'PLZ', type: 'VARCHAR', length: 20 },
                { id: 'k9', name: 'Ort', type: 'VARCHAR', length: 100 },
                { id: 'k10', name: 'UStIdNr', type: 'VARCHAR', length: 50 },
                { id: 'k11', name: 'ZahlungszielTage', type: 'INTEGER', defaultValue: '14' },
                { id: 'k12', name: 'Status', type: 'ENUM', enumValues: ['Aktiv', 'Interessent', 'Gesperrt'], defaultValue: 'Aktiv' }
              ],
              data: [
                { Id: 1, KundenNr: 'KD-10001', Firmenname: 'Müller & Partner GmbH', Ansprechpartner: 'Dr. Hans Müller', Email: 'h.mueller@mueller-partner.de', Telefon: '089-1234560', Strasse: 'Leopoldstraße 42', PLZ: '80802', Ort: 'München', UStIdNr: 'DE123456789', ZahlungszielTage: 14, Status: 'Aktiv' },
                { Id: 2, KundenNr: 'KD-10002', Firmenname: 'TechSolutions AG', Ansprechpartner: 'Sandra Meyer', Email: 's.meyer@techsolutions.de', Telefon: '030-9876543', Strasse: 'Alexanderplatz 1', PLZ: '10178', Ort: 'Berlin', UStIdNr: 'DE987654321', ZahlungszielTage: 30, Status: 'Aktiv' },
                { Id: 3, KundenNr: 'KD-10003', Firmenname: 'InnoDesign Studio', Ansprechpartner: 'Marc Weber', Email: 'm.weber@innodesign.io', Telefon: '040-5551234', Strasse: 'Speicherstadt 8', PLZ: '20457', Ort: 'Hamburg', UStIdNr: 'DE555444333', ZahlungszielTage: 14, Status: 'Aktiv' }
              ]
            },

            // 2. ARTIKEL
            {
              id: 't_artikel', name: t.t_artikel,
              fields: [
                { id: 'a1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'a2', name: 'ArtikelNr', type: 'VARCHAR', length: 30, isUnique: true, isIndexed: true, sequenceConfig: { enabled: true, prefix: 'ART-', padding: 4, startValue: 101, step: 1 } },
                { id: 'a3', name: 'Bezeichnung', type: 'VARCHAR', length: 150, isIndexed: true },
                { id: 'a4', name: 'Kategorie', type: 'ENUM', enumValues: ['Dienstleistung', 'Software', 'Hardware', 'Wartung'], defaultValue: 'Dienstleistung' },
                { id: 'a5', name: 'Einzelpreis', type: 'DECIMAL', precision: 12, scale: 2 },
                { id: 'a6', name: 'SteuerSatz', type: 'INTEGER', defaultValue: '19' },
                { id: 'a7', name: 'Einheit', type: 'ENUM', enumValues: ['Stk', 'Std', 'Pauschal', 'Tag'], defaultValue: 'Std' },
                { id: 'a8', name: 'Lagerbestand', type: 'INTEGER', defaultValue: '100' }
              ],
              data: [
                { Id: 1, ArtikelNr: 'ART-0101', Bezeichnung: 'IT-Consulting & Softwareentwicklung', Kategorie: 'Dienstleistung', Einzelpreis: 120.00, SteuerSatz: 19, Einheit: 'Std', Lagerbestand: 999 },
                { Id: 2, ArtikelNr: 'ART-0102', Bezeichnung: 'DB Studio Pro Enterprise Lizenz', Kategorie: 'Software', Einzelpreis: 1490.00, SteuerSatz: 19, Einheit: 'Stk', Lagerbestand: 50 },
                { Id: 3, ArtikelNr: 'ART-0103', Bezeichnung: 'Monatliche Cloud-Wartung & Support', Kategorie: 'Wartung', Einzelpreis: 250.00, SteuerSatz: 19, Einheit: 'Pauschal', Lagerbestand: 999 },
                { Id: 4, ArtikelNr: 'ART-0104', Bezeichnung: 'High-Performance Datenbank-Server', Kategorie: 'Hardware', Einzelpreis: 3200.00, SteuerSatz: 19, Einheit: 'Stk', Lagerbestand: 12 }
              ]
            },

            // 3. ANGEBOTE
            {
              id: 't_angebote', name: t.t_angebote,
              fields: [
                { id: 'ang1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'ang2', name: 'AngebotsNr', type: 'VARCHAR', length: 40, isUnique: true, sequenceConfig: { enabled: true, prefix: 'ANG-2026-', padding: 4, startValue: 1, step: 1 } },
                { id: 'ang3', name: 'KundenId', type: 'INTEGER' },
                { id: 'ang4', name: 'Datum', type: 'DATE' },
                { id: 'ang5', name: 'GueltigBis', type: 'DATE' },
                { id: 'ang6', name: 'Status', type: 'ENUM', enumValues: ['Entwurf', 'Versendet', 'Angenommen', 'Abgelehnt'], defaultValue: 'Versendet' },
                { id: 'ang7', name: 'NettoBetrag', type: 'DECIMAL', precision: 12, scale: 2 },
                { id: 'ang8', name: 'BruttoBetrag', type: 'DECIMAL', precision: 12, scale: 2 },
                { id: 'ang9', name: 'Bemerkung', type: 'TEXT' }
              ],
              data: [
                { Id: 1, AngebotsNr: 'ANG-2026-0001', KundenId: 1, Datum: '2026-01-10', GueltigBis: '2026-02-10', Status: 'Angenommen', NettoBetrag: 3890.00, BruttoBetrag: 4629.10, Bemerkung: 'Inklusive 10% Projekt-Rabatt' },
                { Id: 2, AngebotsNr: 'ANG-2026-0002', KundenId: 2, Datum: '2026-01-15', GueltigBis: '2026-02-15', Status: 'Versendet', NettoBetrag: 1490.00, BruttoBetrag: 1773.10, Bemerkung: 'Softwarelizenz für 5 Arbeitsplätze' }
              ]
            },

            // 4. ANGEBOTSPOSITIONEN
            {
              id: 't_angebotspos', name: t.t_angebotspos,
              fields: [
                { id: 'ap1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'ap2', name: 'AngebotsId', type: 'INTEGER' },
                { id: 'ap3', name: 'ArtikelId', type: 'INTEGER' },
                { id: 'ap4', name: 'Menge', type: 'DECIMAL', precision: 8, scale: 2, defaultValue: '1' },
                { id: 'ap5', name: 'Einzelpreis', type: 'DECIMAL', precision: 12, scale: 2 },
                { id: 'ap6', name: 'RabattProzent', type: 'DECIMAL', precision: 5, scale: 2, defaultValue: '0' },
                { id: 'ap7', name: 'GesamtNetto', type: 'DECIMAL', precision: 12, scale: 2 }
              ],
              data: [
                { Id: 1, AngebotsId: 1, ArtikelId: 1, Menge: 20, Einzelpreis: 120.00, RabattProzent: 0, GesamtNetto: 2400.00 },
                { Id: 2, AngebotsId: 1, ArtikelId: 2, Menge: 1, Einzelpreis: 1490.00, RabattProzent: 0, GesamtNetto: 1490.00 },
                { Id: 3, AngebotsId: 2, ArtikelId: 2, Menge: 1, Einzelpreis: 1490.00, RabattProzent: 0, GesamtNetto: 1490.00 }
              ]
            },

            // 5. AUFTRÄGE
            {
              id: 't_auftraege', name: t.t_auftraege,
              fields: [
                { id: 'auf1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'auf2', name: 'AuftragsNr', type: 'VARCHAR', length: 40, isUnique: true, sequenceConfig: { enabled: true, prefix: 'AUF-2026-', padding: 4, startValue: 1, step: 1 } },
                { id: 'auf3', name: 'AngebotsId', type: 'INTEGER' },
                { id: 'auf4', name: 'KundenId', type: 'INTEGER' },
                { id: 'auf5', name: 'AuftragsDatum', type: 'DATE' },
                { id: 'auf6', name: 'LieferDatum', type: 'DATE' },
                { id: 'auf7', name: 'Status', type: 'ENUM', enumValues: ['In Bearbeitung', 'Geliefert', 'Abgeschlossen', 'Storniert'], defaultValue: 'In Bearbeitung' },
                { id: 'auf8', name: 'NettoBetrag', type: 'DECIMAL', precision: 12, scale: 2 },
                { id: 'auf9', name: 'BruttoBetrag', type: 'DECIMAL', precision: 12, scale: 2 }
              ],
              data: [
                { Id: 1, AuftragsNr: 'AUF-2026-0001', AngebotsId: 1, KundenId: 1, AuftragsDatum: '2026-01-12', LieferDatum: '2026-01-25', Status: 'Abgeschlossen', NettoBetrag: 3890.00, BruttoBetrag: 4629.10 },
                { Id: 2, AuftragsNr: 'AUF-2026-0002', AngebotsId: 2, KundenId: 2, AuftragsDatum: '2026-01-20', LieferDatum: '2026-02-05', Status: 'Geliefert', NettoBetrag: 1490.00, BruttoBetrag: 1773.10 }
              ]
            },

            // 6. AUFTRAGSPOSITIONEN
            {
              id: 't_auftragspos', name: t.t_auftragspos,
              fields: [
                { id: 'aup1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'aup2', name: 'AuftragsId', type: 'INTEGER' },
                { id: 'aup3', name: 'ArtikelId', type: 'INTEGER' },
                { id: 'aup4', name: 'Menge', type: 'DECIMAL', precision: 8, scale: 2, defaultValue: '1' },
                { id: 'aup5', name: 'Einzelpreis', type: 'DECIMAL', precision: 12, scale: 2 },
                { id: 'aup6', name: 'GesamtNetto', type: 'DECIMAL', precision: 12, scale: 2 }
              ],
              data: [
                { Id: 1, AuftragsId: 1, ArtikelId: 1, Menge: 20, Einzelpreis: 120.00, GesamtNetto: 2400.00 },
                { Id: 2, AuftragsId: 1, ArtikelId: 2, Menge: 1, Einzelpreis: 1490.00, GesamtNetto: 1490.00 },
                { Id: 3, AuftragsId: 2, ArtikelId: 2, Menge: 1, Einzelpreis: 1490.00, GesamtNetto: 1490.00 }
              ]
            },

            // 7. RECHNUNGEN
            {
              id: 't_rechnungen', name: t.t_rechnungen,
              fields: [
                { id: 'r1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'r2', name: 'RechnungsNr', type: 'VARCHAR', length: 40, isUnique: true, isIndexed: true, sequenceConfig: { enabled: true, prefix: 'RE-2026-', padding: 4, startValue: 1, step: 1 } },
                { id: 'r3', name: 'AuftragsId', type: 'INTEGER' },
                { id: 'r4', name: 'KundenId', type: 'INTEGER' },
                { id: 'r5', name: 'RechnungsDatum', type: 'DATE' },
                { id: 'r6', name: 'FaelligDatum', type: 'DATE' },
                { id: 'r7', name: 'ZahlungsStatus', type: 'ENUM', enumValues: ['Offen', 'Bezahlt', 'Ueberfaellig', 'Gemahnt', 'Teilbezahlt'], defaultValue: 'Offen' },
                { id: 'r8', name: 'NettoBetrag', type: 'DECIMAL', precision: 12, scale: 2 },
                { id: 'r9', name: 'MwStBetrag', type: 'DECIMAL', precision: 12, scale: 2 },
                { id: 'r10', name: 'BruttoBetrag', type: 'DECIMAL', precision: 12, scale: 2 },
                { id: 'r11', name: 'OffenerBetrag', type: 'DECIMAL', precision: 12, scale: 2 },
                { id: 'r12', name: 'SkontoProzent', type: 'DECIMAL', precision: 5, scale: 2, defaultValue: '2' }
              ],
              data: [
                { Id: 1, RechnungsNr: 'RE-2026-0001', AuftragsId: 1, KundenId: 1, RechnungsDatum: '2026-01-15', FaelligDatum: '2026-01-29', ZahlungsStatus: 'Bezahlt', NettoBetrag: 3890.00, MwStBetrag: 739.10, BruttoBetrag: 4629.10, OffenerBetrag: 0.00, SkontoProzent: 2 },
                { Id: 2, RechnungsNr: 'RE-2026-0002', AuftragsId: 2, KundenId: 2, RechnungsDatum: '2026-02-01', FaelligDatum: '2026-02-15', ZahlungsStatus: 'Gemahnt', NettoBetrag: 1490.00, MwStBetrag: 283.10, BruttoBetrag: 1773.10, OffenerBetrag: 1773.10, SkontoProzent: 0 },
                { Id: 3, RechnungsNr: 'RE-2026-0003', AuftragsId: null, KundenId: 3, RechnungsDatum: '2026-02-10', FaelligDatum: '2026-02-24', ZahlungsStatus: 'Offen', NettoBetrag: 250.00, MwStBetrag: 47.50, BruttoBetrag: 297.50, OffenerBetrag: 297.50, SkontoProzent: 2 }
              ]
            },

            // 8. RECHNUNGSPOSITIONEN
            {
              id: 't_rechnungspos', name: t.t_rechnungspos,
              fields: [
                { id: 'rp1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'rp2', name: 'RechnungsId', type: 'INTEGER' },
                { id: 'rp3', name: 'ArtikelId', type: 'INTEGER' },
                { id: 'rp4', name: 'PositionNr', type: 'INTEGER', defaultValue: '1' },
                { id: 'rp5', name: 'Menge', type: 'DECIMAL', precision: 8, scale: 2, defaultValue: '1' },
                { id: 'rp6', name: 'Einzelpreis', type: 'DECIMAL', precision: 12, scale: 2 },
                { id: 'rp7', name: 'SteuerSatz', type: 'INTEGER', defaultValue: '19' },
                { id: 'rp8', name: 'GesamtNetto', type: 'DECIMAL', precision: 12, scale: 2 }
              ],
              data: [
                { Id: 1, RechnungsId: 1, ArtikelId: 1, PositionNr: 1, Menge: 20, Einzelpreis: 120.00, SteuerSatz: 19, GesamtNetto: 2400.00 },
                { Id: 2, RechnungsId: 1, ArtikelId: 2, PositionNr: 2, Menge: 1, Einzelpreis: 1490.00, SteuerSatz: 19, GesamtNetto: 1490.00 },
                { Id: 3, RechnungsId: 2, ArtikelId: 2, PositionNr: 1, Menge: 1, Einzelpreis: 1490.00, SteuerSatz: 19, GesamtNetto: 1490.00 },
                { Id: 4, RechnungsId: 3, ArtikelId: 3, PositionNr: 1, Menge: 1, Einzelpreis: 250.00, SteuerSatz: 19, GesamtNetto: 250.00 }
              ]
            },

            // 9. MAHNUNGEN
            {
              id: 't_mahnungen', name: t.t_mahnungen,
              fields: [
                { id: 'm1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'm2', name: 'MahnungsNr', type: 'VARCHAR', length: 40, isUnique: true, sequenceConfig: { enabled: true, prefix: 'MAH-2026-', padding: 4, startValue: 1, step: 1 } },
                { id: 'm3', name: 'RechnungsId', type: 'INTEGER' },
                { id: 'm4', name: 'KundenId', type: 'INTEGER' },
                { id: 'm5', name: 'MahnDatum', type: 'DATE' },
                { id: 'm6', name: 'Mahnstufe', type: 'ENUM', enumValues: ['Mahnstufe 1 (Zahlungserinnerung)', 'Mahnstufe 2 (Aufforderung)', 'Mahnstufe 3 (Letzte Mahnung)', 'Inkasso'], defaultValue: 'Mahnstufe 1 (Zahlungserinnerung)' },
                { id: 'm7', name: 'Mahngebuehr', type: 'DECIMAL', precision: 8, scale: 2, defaultValue: '5.00' },
                { id: 'm8', name: 'Verzugszinsen', type: 'DECIMAL', precision: 8, scale: 2, defaultValue: '0.00' },
                { id: 'm9', name: 'FaelligBis', type: 'DATE' },
                { id: 'm10', name: 'Status', type: 'ENUM', enumValues: ['Offen', 'Bezahlt', 'Storniert'], defaultValue: 'Offen' }
              ],
              data: [
                { Id: 1, MahnungsNr: 'MAH-2026-0001', RechnungsId: 2, KundenId: 2, MahnDatum: '2026-02-18', Mahnstufe: 'Mahnstufe 1 (Zahlungserinnerung)', Mahngebuehr: 5.00, Verzugszinsen: 0.00, FaelligBis: '2026-02-28', Status: 'Offen' }
              ]
            },

            // 10. GUTSCHRIFTEN
            {
              id: 't_gutschriften', name: t.t_gutschriften,
              fields: [
                { id: 'g1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'g2', name: 'GutschriftNr', type: 'VARCHAR', length: 40, isUnique: true, sequenceConfig: { enabled: true, prefix: 'GUT-2026-', padding: 4, startValue: 1, step: 1 } },
                { id: 'g3', name: 'RechnungsId', type: 'INTEGER' },
                { id: 'g4', name: 'KundenId', type: 'INTEGER' },
                { id: 'g5', name: 'Datum', type: 'DATE' },
                { id: 'g6', name: 'Status', type: 'ENUM', enumValues: ['Entwurf', 'Erstellt', 'Verrechnet', 'Ausgezahlt'], defaultValue: 'Erstellt' },
                { id: 'g7', name: 'NettoBetrag', type: 'DECIMAL', precision: 12, scale: 2 },
                { id: 'g8', name: 'MwStBetrag', type: 'DECIMAL', precision: 12, scale: 2 },
                { id: 'g9', name: 'BruttoBetrag', type: 'DECIMAL', precision: 12, scale: 2 },
                { id: 'g10', name: 'Grund', type: 'VARCHAR', length: 200 }
              ],
              data: [
                { Id: 1, GutschriftNr: 'GUT-2026-0001', RechnungsId: 1, KundenId: 1, Datum: '2026-01-20', Status: 'Verrechnet', NettoBetrag: 120.00, MwStBetrag: 22.80, BruttoBetrag: 142.80, Grund: 'Kulanzgutschrift wegen vereinbartem Treuerabatt' }
              ]
            },

            // 11. GUTSCHRIFTPOSITIONEN
            {
              id: 't_gutschriftpos', name: t.t_gutschriftpos,
              fields: [
                { id: 'gp1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'gp2', name: 'GutschriftId', type: 'INTEGER' },
                { id: 'gp3', name: 'ArtikelId', type: 'INTEGER' },
                { id: 'gp4', name: 'Menge', type: 'DECIMAL', precision: 8, scale: 2, defaultValue: '1' },
                { id: 'gp5', name: 'Einzelpreis', type: 'DECIMAL', precision: 12, scale: 2 },
                { id: 'gp6', name: 'GesamtNetto', type: 'DECIMAL', precision: 12, scale: 2 }
              ],
              data: [
                { Id: 1, GutschriftId: 1, ArtikelId: 1, Menge: 1, Einzelpreis: 120.00, GesamtNetto: 120.00 }
              ]
            }
          ],

          relationships: [
            // Kunden Rel
            { id: 'r_k_ang', fromTableId: 't_kunden', fromFieldId: 'k1', toTableId: 't_angebote', toFieldId: 'ang3', type: '1:n', referentialIntegrity: true },
            { id: 'r_k_auf', fromTableId: 't_kunden', fromFieldId: 'k1', toTableId: 't_auftraege', toFieldId: 'auf4', type: '1:n', referentialIntegrity: true },
            { id: 'r_k_rech', fromTableId: 't_kunden', fromFieldId: 'k1', toTableId: 't_rechnungen', toFieldId: 'r4', type: '1:n', referentialIntegrity: true },
            { id: 'r_k_mahn', fromTableId: 't_kunden', fromFieldId: 'k1', toTableId: 't_mahnungen', toFieldId: 'm4', type: '1:n', referentialIntegrity: true },
            { id: 'r_k_gut', fromTableId: 't_kunden', fromFieldId: 'k1', toTableId: 't_gutschriften', toFieldId: 'g4', type: '1:n', referentialIntegrity: true },

            // Angebote & Pos Rel
            { id: 'r_ang_pos', fromTableId: 't_angebote', fromFieldId: 'ang1', toTableId: 't_angebotspos', toFieldId: 'ap2', type: '1:n', referentialIntegrity: true, onDelete: 'CASCADE' },
            { id: 'r_ang_auf', fromTableId: 't_angebote', fromFieldId: 'ang1', toTableId: 't_auftraege', toFieldId: 'auf3', type: '1:n', referentialIntegrity: false },

            // Aufträge & Pos Rel
            { id: 'r_auf_pos', fromTableId: 't_auftraege', fromFieldId: 'auf1', toTableId: 't_auftragspos', toFieldId: 'aup2', type: '1:n', referentialIntegrity: true, onDelete: 'CASCADE' },
            { id: 'r_auf_rech', fromTableId: 't_auftraege', fromFieldId: 'auf1', toTableId: 't_rechnungen', toFieldId: 'r3', type: '1:n', referentialIntegrity: false },

            // Rechnungen & Sub Rel
            { id: 'r_rech_pos', fromTableId: 't_rechnungen', fromFieldId: 'r1', toTableId: 't_rechnungspos', toFieldId: 'rp2', type: '1:n', referentialIntegrity: true, onDelete: 'CASCADE' },
            { id: 'r_rech_mahn', fromTableId: 't_rechnungen', fromFieldId: 'r1', toTableId: 't_mahnungen', toFieldId: 'm3', type: '1:n', referentialIntegrity: true, onDelete: 'CASCADE' },
            { id: 'r_rech_gut', fromTableId: 't_rechnungen', fromFieldId: 'r1', toTableId: 't_gutschriften', toFieldId: 'g3', type: '1:n', referentialIntegrity: false },

            // Gutschriften & Pos Rel
            { id: 'r_gut_pos', fromTableId: 't_gutschriften', fromFieldId: 'g1', toTableId: 't_gutschriftpos', toFieldId: 'gp2', type: '1:n', referentialIntegrity: true, onDelete: 'CASCADE' },

            // Artikel FKs
            { id: 'r_art_angpos', fromTableId: 't_artikel', fromFieldId: 'a1', toTableId: 't_angebotspos', toFieldId: 'ap3', type: '1:n', referentialIntegrity: true },
            { id: 'r_art_aufpos', fromTableId: 't_artikel', fromFieldId: 'a1', toTableId: 't_auftragspos', toFieldId: 'aup3', type: '1:n', referentialIntegrity: true },
            { id: 'r_art_rechpos', fromTableId: 't_artikel', fromFieldId: 'a1', toTableId: 't_rechnungspos', toFieldId: 'rp3', type: '1:n', referentialIntegrity: true },
            { id: 'r_art_gutpos', fromTableId: 't_artikel', fromFieldId: 'a1', toTableId: 't_gutschriftpos', toFieldId: 'gp3', type: '1:n', referentialIntegrity: true }
          ],

          queries: [
            {
              id: 'q_offene_rechnungen', type: 'SELECT', name: t.q_offene_rechnungen,
              nodes: [
                { id: 'n1', tableId: 't_kunden', x: 50, y: 50 },
                { id: 'n2', tableId: 't_rechnungen', x: 300, y: 50 }
              ],
              columns: [
                { id: 'qc1', tableId: 't_rechnungen', fieldId: 'r2', tableName: t.t_rechnungen, fieldName: 'RechnungsNr', sort: 'ASC', show: true, criteria: [''] },
                { id: 'qc2', tableId: 't_kunden', fieldId: 'k3', tableName: t.t_kunden, fieldName: 'Firmenname', sort: 'ASC', show: true, criteria: [''] },
                { id: 'qc3', tableId: 't_rechnungen', fieldId: 'r6', tableName: t.t_rechnungen, fieldName: 'FaelligDatum', sort: 'ASC', show: true, criteria: [''] },
                { id: 'qc4', tableId: 't_rechnungen', fieldId: 'r7', tableName: t.t_rechnungen, fieldName: 'ZahlungsStatus', sort: 'ASC', show: true, criteria: ['Offen', 'Gemahnt', 'Ueberfaellig'] },
                { id: 'qc5', tableId: 't_rechnungen', fieldId: 'r11', tableName: t.t_rechnungen, fieldName: 'OffenerBetrag', sort: 'DESC', show: true, criteria: ['> 0'] }
              ]
            },
            {
              id: 'q_mahnstufen', type: 'SELECT', name: t.q_mahnstufen,
              nodes: [
                { id: 'mn1', tableId: 't_kunden', x: 50, y: 50 },
                { id: 'mn2', tableId: 't_rechnungen', x: 300, y: 50 },
                { id: 'mn3', tableId: 't_mahnungen', x: 550, y: 50 }
              ],
              columns: [
                { id: 'mq1', tableId: 't_mahnungen', fieldId: 'm2', tableName: t.t_mahnungen, fieldName: 'MahnungsNr', sort: 'ASC', show: true, criteria: [''] },
                { id: 'mq2', tableId: 't_mahnungen', fieldId: 'm6', tableName: t.t_mahnungen, fieldName: 'Mahnstufe', sort: 'ASC', show: true, criteria: [''] },
                { id: 'mq3', tableId: 't_mahnungen', fieldId: 'm5', tableName: t.t_mahnungen, fieldName: 'MahnDatum', sort: 'DESC', show: true, criteria: [''] },
                { id: 'mq4', tableId: 't_mahnungen', fieldId: 'm9', tableName: t.t_mahnungen, fieldName: 'FaelligBis', sort: 'ASC', show: true, criteria: [''] },
                { id: 'mq5', tableId: 't_rechnungen', fieldId: 'r2', tableName: t.t_rechnungen, fieldName: 'RechnungsNr', sort: 'ASC', show: true, criteria: [''] },
                { id: 'mq6', tableId: 't_kunden', fieldId: 'k3', tableName: t.t_kunden, fieldName: 'Firmenname', sort: 'ASC', show: true, criteria: [''] },
                { id: 'mq7', tableId: 't_rechnungen', fieldId: 'r11', tableName: t.t_rechnungen, fieldName: 'OffenerBetrag', sort: 'DESC', show: true, criteria: [''] },
                { id: 'mq8', tableId: 't_mahnungen', fieldId: 'm7', tableName: t.t_mahnungen, fieldName: 'Mahngebuehr', sort: 'ASC', show: true, criteria: [''] }
              ]
            }
          ],

          forms: [
            // RECHNUNG FORM
            {
              id: 'f_rechnung', name: t.f_rechnung_form, sourceType: 'table', sourceId: 't_rechnungen',
              fields: [],
              layout: {
                id: 'root', type: 'container', className: 'space-y-4 p-4 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800',
                children: [
                  { id: 'hdr', type: 'label', label: '📄 Rechnungs-Erfassung & Druckvorbereitung', className: 'text-xl font-bold text-slate-800 dark:text-slate-100 border-b pb-3 flex items-center gap-2' },
                  { 
                    id: 'grid_meta', type: 'container', className: 'grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800',
                    children: [
                      { id: 'f_r_nr', type: 'field', fieldId: 'r2', label: 'Rechnungs-Nr', widgetType: 'text' },
                      { id: 'f_r_kd', type: 'field', fieldId: 'r4', label: 'Empfänger / Kunde', widgetType: 'select', lookup: { tableId: 't_kunden', valueFieldId: 'k1', labelFields: ['k3', 'k2'], allowQuickCreate: true } },
                      { id: 'f_r_status', type: 'field', fieldId: 'r7', label: 'Zahlungsstatus', widgetType: 'select' },
                      { id: 'f_r_datum', type: 'field', fieldId: 'r5', label: 'Rechnungsdatum', widgetType: 'date' },
                      { id: 'f_r_faellig', type: 'field', fieldId: 'r6', label: 'Fälligkeitsdatum', widgetType: 'date' },
                      { id: 'f_r_auf', type: 'field', fieldId: 'r3', label: 'Zugrunde liegender Auftrag', widgetType: 'select', lookup: { tableId: 't_auftraege', valueFieldId: 'auf1', labelFields: ['auf2'] } }
                    ]
                  },
                  { 
                    id: 'sub_pos', type: 'subform', label: 'Rechnungspositionen (Artikel & Leistungen)', 
                    subform: { formId: 'f_rechnung_pos_sub', masterLinkFieldId: 'r1', childLinkFieldId: 'rp2', canAdd: true, canEdit: true, canDelete: true } 
                  },
                  { 
                    id: 'grid_tot', type: 'container', className: 'grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-100 dark:bg-slate-800 p-4 rounded-xl font-semibold',
                    children: [
                      { id: 'f_r_netto', type: 'field', fieldId: 'r8', label: 'Netto-Gesamt (€)', widgetType: 'number' },
                      { id: 'f_r_mwst', type: 'field', fieldId: 'r9', label: 'MwSt Betrag (€)', widgetType: 'number' },
                      { id: 'f_r_brutto', type: 'field', fieldId: 'r10', label: 'Brutto-Endbetrag (€)', widgetType: 'number' },
                      { id: 'f_r_offen', type: 'field', fieldId: 'r11', label: 'Noch offener Betrag (€)', widgetType: 'number' }
                    ]
                  }
                ]
              }
            },
            {
              id: 'f_rechnung_pos_sub', name: 'Rechnungspositionen Subform', sourceType: 'table', sourceId: 't_rechnungspos',
              fields: [],
              layout: {
                id: 'sub_root_r', type: 'container', className: 'grid grid-cols-4 gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg',
                children: [
                  { id: 'f_rp_art', type: 'field', fieldId: 'rp3', label: 'Artikel / Dienstleistung', widgetType: 'select', lookup: { tableId: 't_artikel', valueFieldId: 'a1', labelFields: ['a3', 'a2'] } },
                  { id: 'f_rp_menge', type: 'field', fieldId: 'rp5', label: 'Menge', widgetType: 'number' },
                  { id: 'f_rp_preis', type: 'field', fieldId: 'rp6', label: 'Einzelpreis (€)', widgetType: 'number' },
                  { id: 'f_rp_gesamt', type: 'field', fieldId: 'rp8', label: 'Gesamt Netto (€)', widgetType: 'number' }
                ]
              }
            },

            // ANGEBOT FORM
            {
              id: 'f_angebot', name: t.f_angebot_form, sourceType: 'table', sourceId: 't_angebote',
              fields: [],
              layout: {
                id: 'root_ang', type: 'container', className: 'space-y-4 p-4 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800',
                children: [
                  { id: 'hdr_ang', type: 'label', label: '📋 Angebotserfassung & Kalkulation', className: 'text-xl font-bold text-slate-800 dark:text-slate-100 border-b pb-3' },
                  { 
                    id: 'grid_ang_meta', type: 'container', className: 'grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800',
                    children: [
                      { id: 'f_ang_nr', type: 'field', fieldId: 'ang2', label: 'Angebots-Nr', widgetType: 'text' },
                      { id: 'f_ang_kd', type: 'field', fieldId: 'ang3', label: 'Kunde', widgetType: 'select', lookup: { tableId: 't_kunden', valueFieldId: 'k1', labelFields: ['k3'] } },
                      { id: 'f_ang_status', type: 'field', fieldId: 'ang6', label: 'Status', widgetType: 'select' },
                      { id: 'f_ang_datum', type: 'field', fieldId: 'ang4', label: 'Angebotsdatum', widgetType: 'date' },
                      { id: 'f_ang_gueltig', type: 'field', fieldId: 'ang5', label: 'Gültig bis', widgetType: 'date' }
                    ]
                  },
                  { 
                    id: 'sub_ang_pos', type: 'subform', label: 'Angebotspositionen', 
                    subform: { formId: 'f_angebot_pos_sub', masterLinkFieldId: 'ang1', childLinkFieldId: 'ap2', canAdd: true, canEdit: true, canDelete: true } 
                  }
                ]
              }
            },
            {
              id: 'f_angebot_pos_sub', name: 'Angebotspositionen Subform', sourceType: 'table', sourceId: 't_angebotspos',
              fields: [],
              layout: {
                id: 'sub_root_ang', type: 'container', className: 'grid grid-cols-4 gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg',
                children: [
                  { id: 'f_ap_art', type: 'field', fieldId: 'ap3', label: 'Artikel', widgetType: 'select', lookup: { tableId: 't_artikel', valueFieldId: 'a1', labelFields: ['a3'] } },
                  { id: 'f_ap_menge', type: 'field', fieldId: 'ap4', label: 'Menge', widgetType: 'number' },
                  { id: 'f_ap_preis', type: 'field', fieldId: 'ap5', label: 'Einzelpreis (€)', widgetType: 'number' },
                  { id: 'f_ap_gesamt', type: 'field', fieldId: 'ap7', label: 'Gesamt Netto (€)', widgetType: 'number' }
                ]
              }
            },

            // AUFTRAG FORM
            {
              id: 'f_auftrag', name: t.f_auftrag_form, sourceType: 'table', sourceId: 't_auftraege',
              fields: [],
              layout: {
                id: 'root_auf', type: 'container', className: 'space-y-4 p-4 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800',
                children: [
                  { id: 'hdr_auf', type: 'label', label: '📦 Auftragsabwicklung', className: 'text-xl font-bold text-slate-800 dark:text-slate-100 border-b pb-3' },
                  { 
                    id: 'grid_auf_meta', type: 'container', className: 'grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800',
                    children: [
                      { id: 'f_auf_nr', type: 'field', fieldId: 'auf2', label: 'Auftrags-Nr', widgetType: 'text' },
                      { id: 'f_auf_kd', type: 'field', fieldId: 'auf4', label: 'Kunde', widgetType: 'select', lookup: { tableId: 't_kunden', valueFieldId: 'k1', labelFields: ['k3'] } },
                      { id: 'f_auf_status', type: 'field', fieldId: 'auf7', label: 'Auftragsstatus', widgetType: 'select' },
                      { id: 'f_auf_datum', type: 'field', fieldId: 'auf5', label: 'Auftragsdatum', widgetType: 'date' },
                      { id: 'f_auf_liefer', type: 'field', fieldId: 'auf6', label: 'Geplantes Lieferdatum', widgetType: 'date' }
                    ]
                  },
                  { 
                    id: 'sub_auf_pos', type: 'subform', label: 'Auftragspositionen', 
                    subform: { formId: 'f_auftrag_pos_sub', masterLinkFieldId: 'auf1', childLinkFieldId: 'aup2', canAdd: true, canEdit: true, canDelete: true } 
                  }
                ]
              }
            },
            {
              id: 'f_auftrag_pos_sub', name: 'Auftragspositionen Subform', sourceType: 'table', sourceId: 't_auftragspos',
              fields: [],
              layout: {
                id: 'sub_root_auf', type: 'container', className: 'grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg',
                children: [
                  { id: 'f_aup_art', type: 'field', fieldId: 'aup3', label: 'Artikel', widgetType: 'select', lookup: { tableId: 't_artikel', valueFieldId: 'a1', labelFields: ['a3'] } },
                  { id: 'f_aup_menge', type: 'field', fieldId: 'aup4', label: 'Menge', widgetType: 'number' },
                  { id: 'f_aup_gesamt', type: 'field', fieldId: 'aup6', label: 'Gesamt Netto (€)', widgetType: 'number' }
                ]
              }
            },

            // MAHNUNG FORM
            {
              id: 'f_mahnung', name: t.f_mahnung_form, sourceType: 'table', sourceId: 't_mahnungen',
              fields: [],
              layout: {
                id: 'root_mahn', type: 'container', className: 'space-y-4 p-4 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800',
                children: [
                  { id: 'hdr_mahn', type: 'label', label: '⚠️ Mahnwesen & Zahlungserinnerung', className: 'text-xl font-bold text-amber-600 dark:text-amber-400 border-b pb-3' },
                  { 
                    id: 'grid_mahn_meta', type: 'container', className: 'grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800',
                    children: [
                      { id: 'f_m_nr', type: 'field', fieldId: 'm2', label: 'Mahnungs-Nr', widgetType: 'text' },
                      { id: 'f_m_rech', type: 'field', fieldId: 'm3', label: 'Referenz-Rechnung', widgetType: 'select', lookup: { tableId: 't_rechnungen', valueFieldId: 'r1', labelFields: ['r2', 'r10'] } },
                      { id: 'f_m_kd', type: 'field', fieldId: 'm4', label: 'Kunde', widgetType: 'select', lookup: { tableId: 't_kunden', valueFieldId: 'k1', labelFields: ['k3'] } },
                      { id: 'f_m_stufe', type: 'field', fieldId: 'm6', label: 'Mahnstufe', widgetType: 'select' },
                      { id: 'f_m_datum', type: 'field', fieldId: 'm5', label: 'Mahndatum', widgetType: 'date' },
                      { id: 'f_m_faellig', type: 'field', fieldId: 'm9', label: 'Zahlungsfrist bis', widgetType: 'date' },
                      { id: 'f_m_gebuehr', type: 'field', fieldId: 'm7', label: 'Mahngebühr (€)', widgetType: 'number' },
                      { id: 'f_m_zins', type: 'field', fieldId: 'm8', label: 'Verzugszinsen (€)', widgetType: 'number' },
                      { id: 'f_m_status', type: 'field', fieldId: 'm10', label: 'Mahnstatus', widgetType: 'select' }
                    ]
                  }
                ]
              }
            },

            // GUTSCHRIFT FORM
            {
              id: 'f_gutschrift', name: t.f_gutschrift_form, sourceType: 'table', sourceId: 't_gutschriften',
              fields: [],
              layout: {
                id: 'root_gut', type: 'container', className: 'space-y-4 p-4 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800',
                children: [
                  { id: 'hdr_gut', type: 'label', label: '💳 Gutschriften & Korrekturrechnungen', className: 'text-xl font-bold text-indigo-600 dark:text-indigo-400 border-b pb-3' },
                  { 
                    id: 'grid_gut_meta', type: 'container', className: 'grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800',
                    children: [
                      { id: 'f_g_nr', type: 'field', fieldId: 'g2', label: 'Gutschrift-Nr', widgetType: 'text' },
                      { id: 'f_g_rech', type: 'field', fieldId: 'g3', label: 'Ursprung-Rechnung', widgetType: 'select', lookup: { tableId: 't_rechnungen', valueFieldId: 'r1', labelFields: ['r2'] } },
                      { id: 'f_g_kd', type: 'field', fieldId: 'g4', label: 'Empfänger / Kunde', widgetType: 'select', lookup: { tableId: 't_kunden', valueFieldId: 'k1', labelFields: ['k3'] } },
                      { id: 'f_g_datum', type: 'field', fieldId: 'g5', label: 'Gutschriftdatum', widgetType: 'date' },
                      { id: 'f_g_status', type: 'field', fieldId: 'g6', label: 'Status', widgetType: 'select' },
                      { id: 'f_g_grund', type: 'field', fieldId: 'g10', label: 'Gutschriftgrund / Kommentar', widgetType: 'text' }
                    ]
                  },
                  { 
                    id: 'sub_gut_pos', type: 'subform', label: 'Gutschriftpositionen', 
                    subform: { formId: 'f_gutschrift_pos_sub', masterLinkFieldId: 'g1', childLinkFieldId: 'gp2', canAdd: true, canEdit: true, canDelete: true } 
                  }
                ]
              }
            },
            {
              id: 'f_gutschrift_pos_sub', name: 'Gutschriftpositionen Subform', sourceType: 'table', sourceId: 't_gutschriftpos',
              fields: [],
              layout: {
                id: 'sub_root_gut', type: 'container', className: 'grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg',
                children: [
                  { id: 'f_gp_art', type: 'field', fieldId: 'gp3', label: 'Artikel', widgetType: 'select', lookup: { tableId: 't_artikel', valueFieldId: 'a1', labelFields: ['a3'] } },
                  { id: 'f_gp_menge', type: 'field', fieldId: 'gp4', label: 'Menge', widgetType: 'number' },
                  { id: 'f_gp_gesamt', type: 'field', fieldId: 'gp6', label: 'Gutschrift Betrag (€)', widgetType: 'number' }
                ]
              }
            }
          ],

          reports: [
            {
              id: 'r_rechnungsjournal', name: t.r_rechnungsbuch, sourceType: 'table', sourceId: 't_rechnungen',
              groupingFieldId: 'r7', // ZahlungsStatus
              summaries: [
                { fieldId: 'r10', fieldName: 'BruttoBetrag', calculation: 'SUM' },
                { fieldId: 'r11', fieldName: 'OffenerBetrag', calculation: 'SUM' }
              ],
              columns: [
                { fieldId: 'r2', label: 'RechnungsNr', visible: true, order: 0 },
                { fieldId: 'r5', label: 'Datum', visible: true, order: 1 },
                { fieldId: 'r6', label: 'Fälligkeit', visible: true, order: 2 },
                { fieldId: 'r7', label: 'Status', visible: true, order: 3 },
                { fieldId: 'r10', label: 'Brutto (€)', visible: true, order: 4 },
                { fieldId: 'r11', label: 'Offen (€)', visible: true, order: 5 }
              ]
            },
            {
              id: 'r_offene_rechnungen', name: t.q_offene_rechnungen, sourceType: 'query', sourceId: 'q_offene_rechnungen',
              summaries: [
                { fieldId: 'r11', fieldName: 'OffenerBetrag', calculation: 'SUM' }
              ],
              columns: [
                { fieldId: 'qc1', label: 'RechnungsNr', visible: true, order: 0 },
                { fieldId: 'qc2', label: 'Firmenname', visible: true, order: 1 },
                { fieldId: 'qc3', label: 'FaelligDatum', visible: true, order: 2 },
                { fieldId: 'qc4', label: 'ZahlungsStatus', visible: true, order: 3 },
                { fieldId: 'qc5', label: 'OffenerBetrag', visible: true, order: 4 }
              ]
            },
            {
              id: 'r_mahnstufen', name: t.q_mahnstufen, sourceType: 'query', sourceId: 'q_mahnstufen',
              summaries: [],
              columns: [
                { fieldId: 'mq1', label: 'MahnungsNr', visible: true, order: 0 },
                { fieldId: 'mq2', label: 'Mahnstufe', visible: true, order: 1 },
                { fieldId: 'mq3', label: 'MahnDatum', visible: true, order: 2 },
                { fieldId: 'mq4', label: 'FaelligBis', visible: true, order: 3 },
                { fieldId: 'mq5', label: 'RechnungsNr', visible: true, order: 4 },
                { fieldId: 'mq6', label: 'Firmenname', visible: true, order: 5 },
                { fieldId: 'mq7', label: 'OffenerBetrag', visible: true, order: 6 },
                { fieldId: 'mq8', label: 'Mahngebuehr', visible: true, order: 7 }
              ]
            }
          ],
          layout: [],
          tableGroups: []
        }
    };
};
