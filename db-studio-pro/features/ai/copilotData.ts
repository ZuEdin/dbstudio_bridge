import { Table, Relationship } from '../../types/index';

export interface SchemaPreset {
  id: string;
  title: string;
  prompt: string;
  tables: Partial<Table>[];
  relationships: Partial<Relationship>[];
}

export interface QueryPreset {
  id: string;
  title: string;
  prompt: string;
  sql: string;
  explanation: string;
  columns: string[];
}

export const SCHEMA_PRESETS: SchemaPreset[] = [
  {
    id: 'hotel',
    title: '🏨 Hotel-Buchungssystem (Zimmer, Gäste, Reservierungen, Rechnungen)',
    prompt: 'Erstelle mir ein Datenmodell für ein Hotel-Buchungssystem mit Zimmern, Gästen, Reservierungen und Rechnungsstatus.',
    tables: [
      {
        id: 'tbl_zimmer',
        name: 'zimmer',
        fields: [
          { id: 'fld_z_1', name: 'id', type: 'INT', isPrimaryKey: true, isNullable: false },
          { id: 'fld_z_2', name: 'zimmer_nr', type: 'VARCHAR', length: 10, isNullable: false },
          { id: 'fld_z_3', name: 'kategorie', type: 'VARCHAR', length: 50, isNullable: false },
          { id: 'fld_z_4', name: 'preis_pro_nacht', type: 'DECIMAL', isNullable: false },
          { id: 'fld_z_5', name: 'status', type: 'VARCHAR', length: 20, isNullable: false, defaultValue: 'VERFUEGBAR' }
        ]
      },
      {
        id: 'tbl_gaeste',
        name: 'gaeste',
        fields: [
          { id: 'fld_g_1', name: 'id', type: 'INT', isPrimaryKey: true, isNullable: false },
          { id: 'fld_g_2', name: 'vorname', type: 'VARCHAR', length: 100, isNullable: false },
          { id: 'fld_g_3', name: 'nachname', type: 'VARCHAR', length: 100, isNullable: false },
          { id: 'fld_g_4', name: 'email', type: 'VARCHAR', length: 150, isNullable: false },
          { id: 'fld_g_5', name: 'telefon', type: 'VARCHAR', length: 30, isNullable: true },
          { id: 'fld_g_6', name: 'ort', type: 'VARCHAR', length: 100, isNullable: true }
        ]
      },
      {
        id: 'tbl_reservierungen',
        name: 'reservierungen',
        fields: [
          { id: 'fld_r_1', name: 'id', type: 'INT', isPrimaryKey: true, isNullable: false },
          { id: 'fld_r_2', name: 'gast_id', type: 'INT', isNullable: false },
          { id: 'fld_r_3', name: 'zimmer_id', type: 'INT', isNullable: false },
          { id: 'fld_r_4', name: 'anreise_datum', type: 'DATE', isNullable: false },
          { id: 'fld_r_5', name: 'abreise_datum', type: 'DATE', isNullable: false },
          { id: 'fld_r_6', name: 'personen_anzahl', type: 'INT', isNullable: false, defaultValue: '1' },
          { id: 'fld_r_7', name: 'status', type: 'VARCHAR', length: 30, isNullable: false, defaultValue: 'BESTAETIGT' }
        ]
      },
      {
        id: 'tbl_rechnungen',
        name: 'rechnungen',
        fields: [
          { id: 'fld_rec_1', name: 'id', type: 'INT', isPrimaryKey: true, isNullable: false },
          { id: 'fld_rec_2', name: 'reservierung_id', type: 'INT', isNullable: false },
          { id: 'fld_rec_3', name: 'rechnungs_datum', type: 'DATE', isNullable: false },
          { id: 'fld_rec_4', name: 'gesamt_betrag', type: 'DECIMAL', isNullable: false },
          { id: 'fld_rec_5', name: 'steuersatz', type: 'DECIMAL', isNullable: false, defaultValue: '20.00' },
          { id: 'fld_rec_6', name: 'zahlungs_status', type: 'VARCHAR', length: 30, isNullable: false, defaultValue: 'OFFEN' }
        ]
      }
    ],
    relationships: [
      {
        id: 'rel_res_gast',
        fromTable: 'reservierungen',
        fromField: 'gast_id',
        toTable: 'gaeste',
        toField: 'id',
        type: '1:N',
        referentialIntegrity: true
      },
      {
        id: 'rel_res_zimmer',
        fromTable: 'reservierungen',
        fromField: 'zimmer_id',
        toTable: 'zimmer',
        toField: 'id',
        type: '1:N',
        referentialIntegrity: true
      },
      {
        id: 'rel_rec_res',
        fromTable: 'rechnungen',
        fromField: 'reservierung_id',
        toTable: 'reservierungen',
        toField: 'id',
        type: '1:1',
        referentialIntegrity: true
      }
    ]
  },
  {
    id: 'ecommerce',
    title: '🛒 E-Commerce & Logistik (Kunden, Produkte, Bestellungen, Positionen)',
    prompt: 'Erstelle ein modulares E-Commerce Datenmodell mit Kunden, Produkten, Bestellungen und Bestellpositionen inklusive Lagerbestand.',
    tables: [
      {
        id: 'tbl_kunden_ecom',
        name: 'kunden',
        fields: [
          { id: 'fld_ke_1', name: 'id', type: 'INT', isPrimaryKey: true, isNullable: false },
          { id: 'fld_ke_2', name: 'firma_oder_name', type: 'VARCHAR', length: 150, isNullable: false },
          { id: 'fld_ke_3', name: 'email', type: 'VARCHAR', length: 150, isNullable: false },
          { id: 'fld_ke_4', name: 'ort', type: 'VARCHAR', length: 100, isNullable: false },
          { id: 'fld_ke_5', name: 'kundengruppe', type: 'VARCHAR', length: 50, isNullable: false, defaultValue: 'STANDARD' }
        ]
      },
      {
        id: 'tbl_produkte_ecom',
        name: 'produkte',
        fields: [
          { id: 'fld_pe_1', name: 'id', type: 'INT', isPrimaryKey: true, isNullable: false },
          { id: 'fld_pe_2', name: 'sku', type: 'VARCHAR', length: 30, isNullable: false },
          { id: 'fld_pe_3', name: 'bezeichnung', type: 'VARCHAR', length: 200, isNullable: false },
          { id: 'fld_pe_4', name: 'netto_preis', type: 'DECIMAL', isNullable: false },
          { id: 'fld_pe_5', name: 'lagerbestand', type: 'INT', isNullable: false, defaultValue: '0' }
        ]
      },
      {
        id: 'tbl_bestellungen_ecom',
        name: 'bestellungen',
        fields: [
          { id: 'fld_be_1', name: 'id', type: 'INT', isPrimaryKey: true, isNullable: false },
          { id: 'fld_be_2', name: 'kunde_id', type: 'INT', isNullable: false },
          { id: 'fld_be_3', name: 'bestell_datum', type: 'DATE', isNullable: false },
          { id: 'fld_be_4', name: 'status', type: 'VARCHAR', length: 30, isNullable: false, defaultValue: 'NEU' },
          { id: 'fld_be_5', name: 'gesamt_netto', type: 'DECIMAL', isNullable: false }
        ]
      },
      {
        id: 'tbl_bestell_pos',
        name: 'bestell_positionen',
        fields: [
          { id: 'fld_bp_1', name: 'id', type: 'INT', isPrimaryKey: true, isNullable: false },
          { id: 'fld_bp_2', name: 'bestellung_id', type: 'INT', isNullable: false },
          { id: 'fld_bp_3', name: 'produkt_id', type: 'INT', isNullable: false },
          { id: 'fld_bp_4', name: 'menge', type: 'INT', isNullable: false, defaultValue: '1' },
          { id: 'fld_bp_5', name: 'einzelpreis', type: 'DECIMAL', isNullable: false }
        ]
      }
    ],
    relationships: [
      {
        id: 'rel_best_kunde',
        fromTable: 'bestellungen',
        fromField: 'kunde_id',
        toTable: 'kunden',
        toField: 'id',
        type: '1:N',
        referentialIntegrity: true
      },
      {
        id: 'rel_pos_bestellung',
        fromTable: 'bestell_positionen',
        fromField: 'bestellung_id',
        toTable: 'bestellungen',
        toField: 'id',
        type: '1:N',
        referentialIntegrity: true
      },
      {
        id: 'rel_pos_produkt',
        fromTable: 'bestell_positionen',
        fromField: 'produkt_id',
        toTable: 'produkte',
        toField: 'id',
        type: '1:N',
        referentialIntegrity: true
      }
    ]
  }
];

export const QUERY_PRESETS: QueryPreset[] = [
  {
    id: 'linz_kunden',
    title: '🎯 Kunden aus Linz ohne Bestellung seit 6 Monaten',
    prompt: 'Finde alle Kunden aus Linz, die seit 6 Monaten nichts bestellt haben.',
    sql: `SELECT k.id, k.vorname, k.nachname, k.email, k.ort, MAX(b.bestell_datum) AS letzte_bestellung\nFROM kunden k\nLEFT JOIN bestellungen b ON k.id = b.kunde_id\nWHERE k.ort = 'Linz'\nGROUP BY k.id, k.vorname, k.nachname, k.email, k.ort\nHAVING MAX(b.bestell_datum) < DATE('now', '-6 months') OR MAX(b.bestell_datum) IS NULL;`,
    explanation: 'Verknüpft die Kundentabelle mit den Bestellungen via LEFT JOIN, filtert auf den Wohnort "Linz" und filtert Gruppen, deren letzte Bestellung älter als 6 Monate ist oder noch nie stattfand.',
    columns: ['id', 'vorname', 'nachname', 'email', 'ort', 'letzte_bestellung']
  },
  {
    id: 'top_sales',
    title: '📈 Umsatzstärkste Produkte mit kritischem Lagerbestand (< 10 Stück)',
    prompt: 'Zeige die Produkte mit dem höchsten Gesamtumsatz, deren Lagerbestand aktuell unter 10 Stück liegt.',
    sql: `SELECT p.sku, p.bezeichnung, p.lagerbestand, SUM(bp.menge * bp.einzelpreis) AS gesamt_umsatz\nFROM produkte p\nJOIN bestell_positionen bp ON p.id = bp.produkt_id\nWHERE p.lagerbestand < 10\nGROUP BY p.id, p.sku, p.bezeichnung, p.lagerbestand\nORDER BY gesamt_umsatz DESC;`,
    explanation: 'Aggregiert die Positionen aller Bestellungen, berechnet den Gesamtumsatz (Menge * Einzelpreis) und sortiert absteigend nach Umsatz bei geringem Lagerbestand.',
    columns: ['sku', 'bezeichnung', 'lagerbestand', 'gesamt_umsatz']
  }
];

export const OPTIMIZER_SAMPLE_SQL = `SELECT k.id, k.nachname, k.ort, COUNT(b.id) AS anzahl_bestellungen, SUM(b.gesamt_netto) AS umsatz\nFROM kunden k\nJOIN bestellungen b ON k.id = b.kunde_id\nWHERE k.ort = 'Wien' AND b.bestell_datum >= '2026-01-01'\nGROUP BY k.id, k.nachname, k.ort\nORDER BY umsatz DESC;`;

export const OPTIMIZER_INDEX_DDL = `CREATE INDEX idx_kunden_ort ON kunden (ort);\nCREATE INDEX idx_bestellungen_kunde_datum ON bestellungen (kunde_id, bestell_datum);`;
