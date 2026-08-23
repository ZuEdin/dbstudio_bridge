import { TableTemplate } from '../types/tableTemplates';

export const BUILTIN_TABLE_TEMPLATES: TableTemplate[] = [
  // CRM & KONTAKTE
  {
    id: 'tpl_kontakte',
    name: 'Kontakte',
    category: 'crm',
    categoryLabel: 'CRM & Personen',
    icon: 'Users',
    description: 'Vollständige Kontaktverwaltung mit Anrede, Adresse, Kontaktdaten und Notizen.',
    fields: [
      { id: 'f_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
      { id: 'f_anrede', name: 'Anrede', type: 'ENUM', enumValues: ['Herr', 'Frau', 'Divers', 'Firma'], defaultValue: 'Herr' },
      { id: 'f_titel', name: 'Titel', type: 'VARCHAR', length: 50, allowNull: true },
      { id: 'f_vorname', name: 'Vorname', type: 'VARCHAR', length: 100 },
      { id: 'f_nachname', name: 'Nachname', type: 'VARCHAR', length: 100, isIndexed: true },
      { id: 'f_firma', name: 'Firma', type: 'VARCHAR', length: 150, allowNull: true, isIndexed: true },
      { id: 'f_position', name: 'Position', type: 'VARCHAR', length: 100, allowNull: true },
      { id: 'f_email', name: 'Email', type: 'EMAIL', length: 150, isIndexed: true },
      { id: 'f_telefon', name: 'Telefon', type: 'PHONE', length: 50, allowNull: true },
      { id: 'f_mobil', name: 'Mobil', type: 'PHONE', length: 50, allowNull: true },
      { id: 'f_strasse', name: 'Strasse', type: 'VARCHAR', length: 150, allowNull: true },
      { id: 'f_plz', name: 'PLZ', type: 'VARCHAR', length: 20, allowNull: true },
      { id: 'f_ort', name: 'Ort', type: 'VARCHAR', length: 100, allowNull: true },
      { id: 'f_land', name: 'Land', type: 'VARCHAR', length: 100, defaultValue: 'Deutschland' },
      { id: 'f_notizen', name: 'Notizen', type: 'TEXT', allowNull: true }
    ],
    sampleData: [
      { Id: 1, Anrede: 'Herr', Titel: 'Dr.', Vorname: 'Maximilian', Nachname: 'Mustermann', Firma: 'Mustermann GmbH', Position: 'Geschäftsführer', Email: 'm.mustermann@example.com', Telefon: '+49 89 123456', Mobil: '+49 170 1234567', Strasse: 'Hauptstraße 12', PLZ: '80331', Ort: 'München', Land: 'Deutschland', Notizen: 'Wichtiger VIP-Kunde' },
      { Id: 2, Anrede: 'Frau', Titel: '', Vorname: 'Sabine', Nachname: 'Schmidt', Firma: 'Schmidt Consulting', Position: 'Projektleiterin', Email: 's.schmidt@consulting.de', Telefon: '+49 30 987654', Mobil: '+49 171 9876543', Strasse: 'Friedrichstraße 44', PLZ: '10117', Ort: 'Berlin', Land: 'Deutschland', Notizen: 'Erstkontakt auf Messe' },
      { Id: 3, Anrede: 'Herr', Titel: '', Vorname: 'Lukas', Nachname: 'Brunner', Firma: 'Alpen Tech AG', Position: 'Lead Architect', Email: 'l.brunner@alpentech.ch', Telefon: '+41 44 5551122', Mobil: '+41 79 1239876', Strasse: 'Bahnhofstrasse 8', PLZ: '8001', Ort: 'Zürich', Land: 'Schweiz', Notizen: 'Interesse an Enterprise Cloud' }
    ]
  },
  {
    id: 'tpl_kunden',
    name: 'Kunden',
    category: 'crm',
    categoryLabel: 'CRM & Personen',
    icon: 'Building',
    description: 'Stammdaten für Geschäftskunden mit USt-Id, Zahlungszielen und Bonität.',
    fields: [
      { id: 'f_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
      { id: 'f_kundennr', name: 'Kundennummer', type: 'VARCHAR', length: 50, isUnique: true, isIndexed: true, sequenceConfig: { enabled: true, prefix: 'KD-', padding: 5, startValue: 10001, step: 1 } },
      { id: 'f_firmenname', name: 'Firmenname', type: 'VARCHAR', length: 150, isIndexed: true },
      { id: 'f_branche', name: 'Branche', type: 'VARCHAR', length: 100, allowNull: true },
      { id: 'f_ustid', name: 'UStIdNr', type: 'VARCHAR', length: 50, allowNull: true },
      { id: 'f_ziel', name: 'ZahlungszielTage', type: 'INTEGER', defaultValue: '30' },
      { id: 'f_bonitaet', name: 'Bonitaet', type: 'ENUM', enumValues: ['Sehr gut', 'Gut', 'Mittel', 'Kritisch'], defaultValue: 'Gut' },
      { id: 'f_status', name: 'Status', type: 'ENUM', enumValues: ['Aktiv', 'Interessent', 'Gesperrt', 'Inaktiv'], defaultValue: 'Aktiv' },
      { id: 'f_email', name: 'Email', type: 'EMAIL', length: 150 },
      { id: 'f_web', name: 'Webseite', type: 'URL', length: 200, allowNull: true }
    ],
    sampleData: [
      { Id: 1, Kundennummer: 'KD-10001', Firmenname: 'Nordwerk Maschinenbau AG', Branche: 'Industrie', UStIdNr: 'DE123456789', ZahlungszielTage: 30, Bonitaet: 'Sehr gut', Status: 'Aktiv', Email: 'info@nordwerk.de', Webseite: 'https://nordwerk.de' },
      { Id: 2, Kundennummer: 'KD-10002', Firmenname: 'Apex Software Labs', Branche: 'IT & Software', UStIdNr: 'DE987654321', ZahlungszielTage: 14, Bonitaet: 'Gut', Status: 'Aktiv', Email: 'billing@apexlabs.io', Webseite: 'https://apexlabs.io' }
    ]
  },
  {
    id: 'tpl_lieferanten',
    name: 'Lieferanten',
    category: 'crm',
    categoryLabel: 'CRM & Personen',
    icon: 'Truck',
    description: 'Lieferantenstammdaten mit konfigurierter fortlaufender Nummerierung (LIF-00010...).',
    fields: [
      { id: 'f_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
      { id: 'f_liefnr', name: 'Lieferantennummer', type: 'VARCHAR', length: 50, isUnique: true, isIndexed: true, sequenceConfig: { enabled: true, prefix: 'LIF-', padding: 5, startValue: 10, step: 1 } },
      { id: 'f_firma', name: 'Firmenname', type: 'VARCHAR', length: 150, isIndexed: true },
      { id: 'f_kontakt', name: 'Ansprechpartner', type: 'VARCHAR', length: 100, allowNull: true },
      { id: 'f_email', name: 'Email', type: 'EMAIL', length: 150 },
      { id: 'f_tel', name: 'Telefon', type: 'PHONE', length: 50, allowNull: true },
      { id: 'f_rating', name: 'Rating', type: 'INTEGER', defaultValue: '5' },
      { id: 'f_aktiv', name: 'Aktiv', type: 'BOOLEAN', defaultValue: 'true' }
    ],
    sampleData: [
      { Id: 1, Lieferantennummer: 'LIF-00010', Firmenname: 'Global Supply Parts', Ansprechpartner: 'Thomas Weber', Email: 'order@globalsupply.com', Telefon: '+49 69 400100', Rating: 5, Aktiv: true },
      { Id: 2, Lieferantennummer: 'LIF-00011', Firmenname: 'Euro Logistic Network', Ansprechpartner: 'Monika Keller', Email: 'dispo@eurolog.eu', Telefon: '+49 711 300200', Rating: 4, Aktiv: true }
    ]
  },

  // PROJEKTE & AUFGABEN
  {
    id: 'tpl_aufgaben',
    name: 'Aufgaben',
    category: 'pm',
    categoryLabel: 'Projekte & Aufgaben',
    icon: 'CheckSquare',
    description: 'Aufgabenverwaltung mit Fälligkeit, Priorität, Status und Fortschritt.',
    fields: [
      { id: 'f_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
      { id: 'f_titel', name: 'Titel', type: 'VARCHAR', length: 200, isIndexed: true },
      { id: 'f_beschr', name: 'Beschreibung', type: 'TEXT', allowNull: true },
      { id: 'f_status', name: 'Status', type: 'ENUM', enumValues: ['Offen', 'In Bearbeitung', 'Review', 'Erledigt', 'Blockiert'], defaultValue: 'Offen' },
      { id: 'f_prio', name: 'Prioritaet', type: 'ENUM', enumValues: ['Niedrig', 'Normal', 'Hoch', 'Dringend'], defaultValue: 'Normal' },
      { id: 'f_faellig', name: 'Faelligkeitsdatum', type: 'DATE', allowNull: true },
      { id: 'f_zugewiesen', name: 'ZugewiesenAn', type: 'VARCHAR', length: 100, allowNull: true },
      { id: 'f_fortschritt', name: 'Fortschritt', type: 'INTEGER', defaultValue: '0', rendererType: 'progress' }
    ],
    sampleData: [
      { Id: 1, Titel: 'Datenbankschema für Kundenbereich fertigstellen', Beschreibung: 'Fremdschlüssel und Indizes für Performance optimieren.', Status: 'In Bearbeitung', Prioritaet: 'Hoch', Faelligkeitsdatum: new Date().toISOString().slice(0, 10), ZugewiesenAn: 'Max Mustermann', Fortschritt: 65 },
      { Id: 2, Titel: 'Rechnungs-PDF Vorlage gestalten', Beschreibung: 'Header-Logo und MwSt.-Tabelle einfügen.', Status: 'Offen', Prioritaet: 'Normal', Faelligkeitsdatum: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10), ZugewiesenAn: 'Sabine Schmidt', Fortschritt: 20 },
      { Id: 3, Titel: 'Backupsystem prüfen', Beschreibung: 'Automatisierte tägliche Dumps verifizieren.', Status: 'Erledigt', Prioritaet: 'Dringend', Faelligkeitsdatum: new Date(Date.now() - 86400000).toISOString().slice(0, 10), ZugewiesenAn: 'Admin', Fortschritt: 100 }
    ]
  },
  {
    id: 'tpl_probleme',
    name: 'Probleme',
    category: 'pm',
    categoryLabel: 'Projekte & Aufgaben',
    icon: 'AlertCircle',
    description: 'Ticket- & Vorfallstracking mit Schweregrad, Zuweisung und Lösungsdokumentation.',
    fields: [
      { id: 'f_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
      { id: 'f_nr', name: 'Vorgangsnummer', type: 'VARCHAR', length: 50, isUnique: true, isIndexed: true, sequenceConfig: { enabled: true, prefix: 'TICK-', padding: 5, startValue: 101, step: 1 } },
      { id: 'f_betreff', name: 'Betreff', type: 'VARCHAR', length: 200, isIndexed: true },
      { id: 'f_kat', name: 'Kategorie', type: 'ENUM', enumValues: ['Software-Bug', 'Hardware', 'Netzwerk', 'Berechtigung', 'Bedienfehler'], defaultValue: 'Software-Bug' },
      { id: 'f_grad', name: 'Schweregrad', type: 'ENUM', enumValues: ['Gering', 'Normal', 'Hoch', 'Kritisch'], defaultValue: 'Normal' },
      { id: 'f_status', name: 'Status', type: 'ENUM', enumValues: ['Neu', 'In Bearbeitung', 'Warten auf Kunde', 'Gelöst', 'Geschlossen'], defaultValue: 'Neu' },
      { id: 'f_gemeldet', name: 'GemeldetVon', type: 'VARCHAR', length: 100 },
      { id: 'f_bearb', name: 'Bearbeiter', type: 'VARCHAR', length: 100, allowNull: true },
      { id: 'f_loesung', name: 'Loesung', type: 'TEXT', allowNull: true }
    ],
    sampleData: [
      { Id: 1, Vorgangsnummer: 'TICK-00101', Betreff: 'Login schlägt bei Umlauten im Benutzernamen fehl', Kategorie: 'Software-Bug', Schweregrad: 'Hoch', Status: 'In Bearbeitung', GemeldetVon: 'Lukas Brunner', Bearbeiter: 'Dev-Team', Loesung: '' },
      { Id: 2, Vorgangsnummer: 'TICK-00102', Betreff: 'VPN-Zugang für neuen Mitarbeiter einrichten', Kategorie: 'Berechtigung', Schweregrad: 'Normal', Status: 'Neu', GemeldetVon: 'HR Abteilung', Bearbeiter: '', Loesung: '' }
    ]
  },

  // WAREN & ARTIKEL
  {
    id: 'tpl_artikel',
    name: 'Artikel',
    category: 'finance',
    categoryLabel: 'Waren & Finanzen',
    icon: 'Package',
    description: 'Produkte- und Artikelkatalog mit automatischer Artikelnummer (ART-0001...).',
    fields: [
      { id: 'f_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
      { id: 'f_artnr', name: 'Artikelnummer', type: 'VARCHAR', length: 50, isUnique: true, isIndexed: true, sequenceConfig: { enabled: true, prefix: 'ART-', padding: 4, startValue: 1, step: 1 } },
      { id: 'f_bezeichnung', name: 'Bezeichnung', type: 'VARCHAR', length: 200, isIndexed: true },
      { id: 'f_kategorie', name: 'Kategorie', type: 'VARCHAR', length: 100, allowNull: true },
      { id: 'f_ek', name: 'Einkaufspreis', type: 'DECIMAL', precision: 10, scale: 2, defaultValue: '0.00', rendererType: 'currency' },
      { id: 'f_vk', name: 'Verkaufspreis', type: 'DECIMAL', precision: 10, scale: 2, defaultValue: '0.00', rendererType: 'currency' },
      { id: 'f_mwst', name: 'Steuersatz', type: 'DECIMAL', precision: 5, scale: 2, defaultValue: '19.00' },
      { id: 'f_bestand', name: 'Bestand', type: 'INTEGER', defaultValue: '0' },
      { id: 'f_minbestand', name: 'Mindestbestand', type: 'INTEGER', defaultValue: '5' },
      { id: 'f_einheit', name: 'Einheit', type: 'ENUM', enumValues: ['Stück', 'Stunde', 'Meter', 'kg', 'Pauschale'], defaultValue: 'Stück' },
      { id: 'f_aktiv', name: 'Aktiv', type: 'BOOLEAN', defaultValue: 'true' }
    ],
    sampleData: [
      { Id: 1, Artikelnummer: 'ART-0001', Bezeichnung: 'Office Laptop Pro 15 Zoll', Kategorie: 'Hardware', Einkaufspreis: 650.00, Verkaufspreis: 999.00, Steuersatz: 19.00, Bestand: 14, Mindestbestand: 3, Einheit: 'Stück', Aktiv: true },
      { Id: 2, Artikelnummer: 'ART-0002', Bezeichnung: 'USB-C Dockingstation 4K', Kategorie: 'Zubehör', Einkaufspreis: 75.00, Verkaufspreis: 129.90, Steuersatz: 19.00, Bestand: 28, Mindestbestand: 5, Einheit: 'Stück', Aktiv: true },
      { Id: 3, Artikelnummer: 'ART-0003', Bezeichnung: 'USB-C Ladekabel 2m', Kategorie: 'Zubehör', Einkaufspreis: 5.00, Verkaufspreis: 19.90, Steuersatz: 19.00, Bestand: 120, Mindestbestand: 20, Einheit: 'Stück', Aktiv: true }
    ]
  },

  // STAMMDATEN & NACHSCHLAGETABELLEN (LOOKUPS)
  {
    id: 'tpl_anreden',
    name: 'Anreden',
    category: 'lookup',
    categoryLabel: 'Stammdaten & Lookups',
    icon: 'Tag',
    description: 'Nachschlagetabelle für Personen-Anreden und automatische Briefanreden.',
    fields: [
      { id: 'f_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
      { id: 'f_code', name: 'Code', type: 'VARCHAR', length: 20, isUnique: true },
      { id: 'f_name', name: 'Bezeichnung', type: 'VARCHAR', length: 50 },
      { id: 'f_brief', name: 'Briefanrede', type: 'VARCHAR', length: 100 },
      { id: 'f_sort', name: 'Sortierung', type: 'INTEGER', defaultValue: '10' },
      { id: 'f_aktiv', name: 'Aktiv', type: 'BOOLEAN', defaultValue: 'true' }
    ],
    sampleData: [
      { Id: 1, Code: 'HERR', Bezeichnung: 'Herr', Briefanrede: 'Sehr geehrter Herr', Sortierung: 10, Aktiv: true },
      { Id: 2, Code: 'FRAU', Bezeichnung: 'Frau', Briefanrede: 'Sehr geehrte Frau', Sortierung: 20, Aktiv: true },
      { Id: 3, Code: 'DIVERS', Bezeichnung: 'Divers', Briefanrede: 'Guten Tag', Sortierung: 30, Aktiv: true },
      { Id: 4, Code: 'FIRMA', Bezeichnung: 'Firma', Briefanrede: 'Sehr geehrte Damen und Herren', Sortierung: 40, Aktiv: true }
    ]
  },
  {
    id: 'tpl_laender',
    name: 'Staaten',
    category: 'lookup',
    categoryLabel: 'Stammdaten & Lookups',
    icon: 'Globe',
    description: 'Länderliste nach ISO-Standards mit Vorwahl, Kontinent und EU-Kennzeichnung.',
    fields: [
      { id: 'f_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
      { id: 'f_iso2', name: 'ISO2', type: 'VARCHAR', length: 2, isUnique: true, isIndexed: true },
      { id: 'f_iso3', name: 'ISO3', type: 'VARCHAR', length: 3, isUnique: true },
      { id: 'f_name', name: 'LandName', type: 'VARCHAR', length: 100, isIndexed: true },
      { id: 'f_vorwahl', name: 'TelefonVorwahl', type: 'VARCHAR', length: 20, allowNull: true },
      { id: 'f_kontinent', name: 'Kontinent', type: 'VARCHAR', length: 50, defaultValue: 'Europa' },
      { id: 'f_eu', name: 'EU_Mitglied', type: 'BOOLEAN', defaultValue: 'true' }
    ],
    sampleData: [
      { Id: 1, ISO2: 'DE', ISO3: 'DEU', LandName: 'Deutschland', TelefonVorwahl: '+49', Kontinent: 'Europa', EU_Mitglied: true },
      { Id: 2, ISO2: 'AT', ISO3: 'AUT', LandName: 'Österreich', TelefonVorwahl: '+43', Kontinent: 'Europa', EU_Mitglied: true },
      { Id: 3, ISO2: 'CH', ISO3: 'CHE', LandName: 'Schweiz', TelefonVorwahl: '+41', Kontinent: 'Europa', EU_Mitglied: false },
      { Id: 4, ISO2: 'FR', ISO3: 'FRA', LandName: 'Frankreich', TelefonVorwahl: '+33', Kontinent: 'Europa', EU_Mitglied: true },
      { Id: 5, ISO2: 'IT', ISO3: 'ITA', LandName: 'Italien', TelefonVorwahl: '+39', Kontinent: 'Europa', EU_Mitglied: true },
      { Id: 6, ISO2: 'US', ISO3: 'USA', LandName: 'Vereinigte Staaten', TelefonVorwahl: '+1', Kontinent: 'Nordamerika', EU_Mitglied: false },
      { Id: 7, ISO2: 'GB', ISO3: 'GBR', LandName: 'Großbritannien', TelefonVorwahl: '+44', Kontinent: 'Europa', EU_Mitglied: false }
    ]
  },
  {
    id: 'tpl_zahlungsarten',
    name: 'Zahlungsarten',
    category: 'lookup',
    categoryLabel: 'Stammdaten & Lookups',
    icon: 'Hash',
    description: 'Zahlungsmodalitäten mit Skonto- und Netto-Zahlungszielen.',
    fields: [
      { id: 'f_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
      { id: 'f_code', name: 'Code', type: 'VARCHAR', length: 30, isUnique: true },
      { id: 'f_name', name: 'Bezeichnung', type: 'VARCHAR', length: 100 },
      { id: 'f_skontotage', name: 'SkontoTage', type: 'INTEGER', defaultValue: '0' },
      { id: 'f_skontoprozent', name: 'SkontoProzent', type: 'DECIMAL', precision: 5, scale: 2, defaultValue: '0.00' },
      { id: 'f_nettotage', name: 'NettoTage', type: 'INTEGER', defaultValue: '14' },
      { id: 'f_aktiv', name: 'Aktiv', type: 'BOOLEAN', defaultValue: 'true' }
    ],
    sampleData: [
      { Id: 1, Code: 'RECHNUNG_14', Bezeichnung: 'Rechnung 14 Tage netto', SkontoTage: 0, SkontoProzent: 0.0, NettoTage: 14, Aktiv: true },
      { Id: 2, Code: 'SKONTO_8_30', Bezeichnung: '2% Skonto innerhalb 8 Tage, 30 Tage netto', SkontoTage: 8, SkontoProzent: 2.0, NettoTage: 30, Aktiv: true },
      { Id: 3, Code: 'VORKASSE', Bezeichnung: 'Vorkasse / Vorabüberweisung', SkontoTage: 0, SkontoProzent: 0.0, NettoTage: 0, Aktiv: true },
      { Id: 4, Code: 'LASTSCHRIFT', Bezeichnung: 'SEPA-Basislastschrift', SkontoTage: 0, SkontoProzent: 0.0, NettoTage: 5, Aktiv: true },
      { Id: 5, Code: 'PAYPAL', Bezeichnung: 'PayPal', SkontoTage: 0, SkontoProzent: 0.0, NettoTage: 0, Aktiv: true },
      { Id: 6, Code: 'BAR', Bezeichnung: 'Barzahlung', SkontoTage: 0, SkontoProzent: 0.0, NettoTage: 0, Aktiv: true }
    ]
  },
  {
    id: 'tpl_einheiten',
    name: 'Einheiten',
    category: 'lookup',
    categoryLabel: 'Stammdaten & Lookups',
    icon: 'Tag',
    description: 'Mengeneinheiten für Artikel und Dienstleistungen.',
    fields: [
      { id: 'f_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
      { id: 'f_code', name: 'Code', type: 'VARCHAR', length: 20, isUnique: true },
      { id: 'f_name', name: 'Bezeichnung', type: 'VARCHAR', length: 50 },
      { id: 'f_abk', name: 'Abkuerzung', type: 'VARCHAR', length: 10 },
      { id: 'f_aktiv', name: 'Aktiv', type: 'BOOLEAN', defaultValue: 'true' }
    ],
    sampleData: [
      { Id: 1, Code: 'STK', Bezeichnung: 'Stück', Abkuerzung: 'Stk.', Aktiv: true },
      { Id: 2, Code: 'STD', Bezeichnung: 'Stunde', Abkuerzung: 'Std.', Aktiv: true },
      { Id: 3, Code: 'TAG', Bezeichnung: 'Tag', Abkuerzung: 'Tage', Aktiv: true },
      { Id: 4, Code: 'MTR', Bezeichnung: 'Meter', Abkuerzung: 'm', Aktiv: true },
      { Id: 5, Code: 'KGM', Bezeichnung: 'Kilogramm', Abkuerzung: 'kg', Aktiv: true },
      { Id: 6, Code: 'PSCH', Bezeichnung: 'Pauschale', Abkuerzung: 'Psch.', Aktiv: true }
    ]
  },
  {
    id: 'tpl_steuersaetze',
    name: 'Steuersaetze',
    category: 'lookup',
    categoryLabel: 'Stammdaten & Lookups',
    icon: 'Hash',
    description: 'Mehrwertsteuersätze und Steuerbefreiungscodes.',
    fields: [
      { id: 'f_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
      { id: 'f_code', name: 'Code', type: 'VARCHAR', length: 20, isUnique: true },
      { id: 'f_name', name: 'Bezeichnung', type: 'VARCHAR', length: 50 },
      { id: 'f_prozent', name: 'Prozentsatz', type: 'DECIMAL', precision: 5, scale: 2 },
      { id: 'f_default', name: 'Standard', type: 'BOOLEAN', defaultValue: 'false' },
      { id: 'f_aktiv', name: 'Aktiv', type: 'BOOLEAN', defaultValue: 'true' }
    ],
    sampleData: [
      { Id: 1, Code: 'NORM_19', Bezeichnung: 'Regelsteuersatz 19%', Prozentsatz: 19.00, Standard: true, Aktiv: true },
      { Id: 2, Code: 'ERM_7', Bezeichnung: 'Ermäßigter Steuersatz 7%', Prozentsatz: 7.00, Standard: false, Aktiv: true },
      { Id: 3, Code: 'FREI_0', Bezeichnung: 'Steuerfrei (0%)', Prozentsatz: 0.00, Standard: false, Aktiv: true }
    ]
  },

  // ORGANISATION & PROTOKOLLE
  {
    id: 'tpl_notizen',
    name: 'Notizen',
    category: 'org',
    categoryLabel: 'Organisation & Doku',
    icon: 'FileText',
    description: 'Memos, Besprechungsnotizen und wichtige Vermerke.',
    fields: [
      { id: 'f_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
      { id: 'f_datum', name: 'Datum', type: 'DATETIME' },
      { id: 'f_titel', name: 'Titel', type: 'VARCHAR', length: 200, isIndexed: true },
      { id: 'f_autor', name: 'Autor', type: 'VARCHAR', length: 100 },
      { id: 'f_kategorie', name: 'Kategorie', type: 'VARCHAR', length: 100, allowNull: true },
      { id: 'f_inhalt', name: 'Inhalt', type: 'TEXT' },
      { id: 'f_wichtig', name: 'Wichtig', type: 'BOOLEAN', defaultValue: 'false' }
    ],
    sampleData: [
      { Id: 1, Datum: new Date().toISOString().slice(0, 16), Titel: 'Kick-Off Meeting Notiz', Autor: 'Admin', Kategorie: 'Projekt', Inhalt: 'Wichtige Beschlüsse aus dem Steuerungsmeeting erfasst.', Wichtig: true }
    ]
  },

  // FAKTURIERUNG & FINANZEN
  {
    id: 'tpl_rechnungen',
    name: 'Rechnungen',
    category: 'fakturierung',
    categoryLabel: 'Fakturierung & Finanzen',
    icon: 'Receipt',
    description: 'Rechnungsstammdaten mit autom. RE-Nummernkreis, Zahlungsstatus und Beträgen.',
    fields: [
      { id: 'f_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
      { id: 'f_rechnr', name: 'Rechnungsnummer', type: 'VARCHAR', length: 50, isUnique: true, isIndexed: true, sequenceConfig: { enabled: true, prefix: 'RE-2026-', padding: 4, startValue: 1001, step: 1 } },
      { id: 'f_kundenid', name: 'KundenId', type: 'INTEGER', isIndexed: true },
      { id: 'f_datum', name: 'Rechnungsdatum', type: 'DATE' },
      { id: 'f_faellig', name: 'Faelligkeitsdatum', type: 'DATE' },
      { id: 'f_status', name: 'Zahlungsstatus', type: 'ENUM', enumValues: ['Offen', 'Bezahlt', 'Ueberfaellig', 'Gemahnt', 'Teilbezahlt'], defaultValue: 'Offen' },
      { id: 'f_netto', name: 'NettoBetrag', type: 'DECIMAL', precision: 12, scale: 2 },
      { id: 'f_mwst', name: 'MwStBetrag', type: 'DECIMAL', precision: 12, scale: 2 },
      { id: 'f_brutto', name: 'BruttoBetrag', type: 'DECIMAL', precision: 12, scale: 2 },
      { id: 'f_offen', name: 'OffenerBetrag', type: 'DECIMAL', precision: 12, scale: 2 }
    ],
    sampleData: [
      { Id: 1, Rechnungsnummer: 'RE-2026-1001', KundenId: 1, Rechnungsdatum: '2026-02-01', Faelligkeitsdatum: '2026-02-15', Zahlungsstatus: 'Offen', NettoBetrag: 1200.00, MwStBetrag: 228.00, BruttoBetrag: 1428.00, OffenerBetrag: 1428.00 },
      { Id: 2, Rechnungsnummer: 'RE-2026-1002', KundenId: 2, Rechnungsdatum: '2026-01-15', Faelligkeitsdatum: '2026-01-29', Zahlungsstatus: 'Bezahlt', NettoBetrag: 3500.00, MwStBetrag: 665.00, BruttoBetrag: 4165.00, OffenerBetrag: 0.00 }
    ]
  },
  {
    id: 'tpl_angebote',
    name: 'Angebote',
    category: 'fakturierung',
    categoryLabel: 'Fakturierung & Finanzen',
    icon: 'FileText',
    description: 'Angebotsverwaltung mit Gültigkeitsdatum, Status und automatischer Nummerierung.',
    fields: [
      { id: 'f_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
      { id: 'f_angnr', name: 'Angebotsnummer', type: 'VARCHAR', length: 50, isUnique: true, isIndexed: true, sequenceConfig: { enabled: true, prefix: 'ANG-2026-', padding: 4, startValue: 1001, step: 1 } },
      { id: 'f_kundenid', name: 'KundenId', type: 'INTEGER', isIndexed: true },
      { id: 'f_datum', name: 'Angebotsdatum', type: 'DATE' },
      { id: 'f_gueltig', name: 'GueltigBis', type: 'DATE' },
      { id: 'f_status', name: 'Status', type: 'ENUM', enumValues: ['Entwurf', 'Versendet', 'Angenommen', 'Abgelehnt'], defaultValue: 'Versendet' },
      { id: 'f_netto', name: 'NettoBetrag', type: 'DECIMAL', precision: 12, scale: 2 },
      { id: 'f_brutto', name: 'BruttoBetrag', type: 'DECIMAL', precision: 12, scale: 2 }
    ],
    sampleData: [
      { Id: 1, Angebotsnummer: 'ANG-2026-1001', KundenId: 1, Angebotsdatum: '2026-02-10', GueltigBis: '2026-03-10', Status: 'Versendet', NettoBetrag: 2400.00, BruttoBetrag: 2856.00 }
    ]
  },
  {
    id: 'tpl_mahnungen',
    name: 'Mahnungen',
    category: 'fakturierung',
    categoryLabel: 'Fakturierung & Finanzen',
    icon: 'AlertTriangle',
    description: 'Mahnwesen mit Mahnstufen, Gebühren, Verzugszinsen und Fristen.',
    fields: [
      { id: 'f_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
      { id: 'f_mahnnr', name: 'Mahnungsnummer', type: 'VARCHAR', length: 50, isUnique: true, isIndexed: true, sequenceConfig: { enabled: true, prefix: 'MAH-2026-', padding: 4, startValue: 1001, step: 1 } },
      { id: 'f_rechnungsid', name: 'RechnungsId', type: 'INTEGER', isIndexed: true },
      { id: 'f_kundenid', name: 'KundenId', type: 'INTEGER', isIndexed: true },
      { id: 'f_mahndatum', name: 'MahnDatum', type: 'DATE' },
      { id: 'f_stufe', name: 'Mahnstufe', type: 'ENUM', enumValues: ['Mahnstufe 1', 'Mahnstufe 2', 'Letzte Mahnung', 'Inkasso'], defaultValue: 'Mahnstufe 1' },
      { id: 'f_gebuehr', name: 'Mahngebuehr', type: 'DECIMAL', precision: 8, scale: 2, defaultValue: '5.00' },
      { id: 'f_zinsen', name: 'Verzugszinsen', type: 'DECIMAL', precision: 8, scale: 2, defaultValue: '0.00' },
      { id: 'f_faellig', name: 'Zahlungsfrist', type: 'DATE' },
      { id: 'f_status', name: 'Status', type: 'ENUM', enumValues: ['Offen', 'Bezahlt', 'Storniert'], defaultValue: 'Offen' }
    ],
    sampleData: [
      { Id: 1, Mahnungsnummer: 'MAH-2026-1001', RechnungsId: 1, KundenId: 1, MahnDatum: '2026-02-16', Mahnstufe: 'Mahnstufe 1', Mahngebuehr: 5.00, Verzugszinsen: 0.00, Zahlungsfrist: '2026-02-26', Status: 'Offen' }
    ]
  },
  {
    id: 'tpl_gutschriften',
    name: 'Gutschriften',
    category: 'fakturierung',
    categoryLabel: 'Fakturierung & Finanzen',
    icon: 'CreditCard',
    description: 'Gutschriften und Korrekturbelege mit Rechnungsbezug und Verrechnungsstatus.',
    fields: [
      { id: 'f_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
      { id: 'f_gutnr', name: 'Gutschriftnummer', type: 'VARCHAR', length: 50, isUnique: true, isIndexed: true, sequenceConfig: { enabled: true, prefix: 'GUT-2026-', padding: 4, startValue: 1001, step: 1 } },
      { id: 'f_rechnungsid', name: 'RechnungsId', type: 'INTEGER', isIndexed: true },
      { id: 'f_kundenid', name: 'KundenId', type: 'INTEGER', isIndexed: true },
      { id: 'f_datum', name: 'Datum', type: 'DATE' },
      { id: 'f_status', name: 'Status', type: 'ENUM', enumValues: ['Entwurf', 'Erstellt', 'Verrechnet', 'Ausgezahlt'], defaultValue: 'Erstellt' },
      { id: 'f_brutto', name: 'BruttoBetrag', type: 'DECIMAL', precision: 12, scale: 2 },
      { id: 'f_grund', name: 'Grund', type: 'VARCHAR', length: 200 }
    ],
    sampleData: [
      { Id: 1, Gutschriftnummer: 'GUT-2026-1001', RechnungsId: 2, KundenId: 2, Datum: '2026-01-20', Status: 'Verrechnet', BruttoBetrag: 150.00, Grund: 'Rückvergütung wegen Skontovereinbarung' }
    ]
  }
];
