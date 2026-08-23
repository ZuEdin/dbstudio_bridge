import axios from 'axios';
const getApiUrl = () => {
    let raw = (import.meta as any).env?.VITE_API_URL || '';
    if (raw) {
        let u = raw.trim();
        if (!u.endsWith('/')) u += '/';
        if (!u.includes('/api/')) u = u.replace(/\/+$/, '') + '/api/';
        return u;
    }
    return typeof window !== 'undefined' && window.location.protocol.startsWith('http')
        ? (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1') ? 'http://localhost:5000/api/' : window.location.origin + '/api/')
        : 'http://localhost:5000/api/';
};
export const isLocalMode = (): boolean => {
    if (typeof window === 'undefined') return false;
    const w = window as any;
    if (w.electronAPI || w.__TAURI__ || window.location.protocol === 'file:') return true;
    if (localStorage.getItem('app_mode') === 'local') return true;
    return false;
};
const API_URL = getApiUrl();

// withCredentials: true is required for Windows Auth (Negotiate) to work cross-origin
export const api = axios.create({ 
    baseURL: API_URL,
    withCredentials: true 
});

const DB_NAME = 'fakturierungpro_db';
const DB_VERSION = 1;

const STORES = [
  {
    "name": "kunden",
    "tableName": "Kunden",
    "keyPath": "id",
    "data": [
      {
        "Id": 1,
        "KundenNr": "KD-10001",
        "Firmenname": "Müller & Partner GmbH",
        "Ansprechpartner": "Dr. Hans Müller",
        "Email": "h.mueller@mueller-partner.de",
        "Telefon": "089-1234560",
        "Strasse": "Leopoldstraße 42",
        "Ort": "München",
        "UStIdNr": "DE123456789",
        "ZahlungszielTage": 14,
        "Status": "Aktiv",
        "plz": "80802",
        "id": 1,
        "kundenNr": "KD-10001",
        "firmenname": "Müller & Partner GmbH",
        "ansprechpartner": "Dr. Hans Müller",
        "email": "h.mueller@mueller-partner.de",
        "telefon": "089-1234560",
        "strasse": "Leopoldstraße 42",
        "ort": "München",
        "uStIdNr": "DE123456789",
        "zahlungszielTage": 14,
        "status": "Aktiv"
      },
      {
        "Id": 2,
        "KundenNr": "KD-10002",
        "Firmenname": "TechSolutions AG",
        "Ansprechpartner": "Sandra Meyer",
        "Email": "s.meyer@techsolutions.de",
        "Telefon": "030-9876543",
        "Strasse": "Alexanderplatz 1",
        "Ort": "Berlin",
        "UStIdNr": "DE987654321",
        "ZahlungszielTage": 30,
        "Status": "Aktiv",
        "plz": "10178",
        "id": 2,
        "kundenNr": "KD-10002",
        "firmenname": "TechSolutions AG",
        "ansprechpartner": "Sandra Meyer",
        "email": "s.meyer@techsolutions.de",
        "telefon": "030-9876543",
        "strasse": "Alexanderplatz 1",
        "ort": "Berlin",
        "uStIdNr": "DE987654321",
        "zahlungszielTage": 30,
        "status": "Aktiv"
      },
      {
        "Id": 3,
        "KundenNr": "KD-10003",
        "Firmenname": "InnoDesign Studio",
        "Ansprechpartner": "Marc Weber",
        "Email": "m.weber@innodesign.io",
        "Telefon": "040-5551234",
        "Strasse": "Speicherstadt 8",
        "Ort": "Hamburg",
        "UStIdNr": "DE555444333",
        "ZahlungszielTage": 14,
        "Status": "Aktiv",
        "plz": "20457",
        "id": 3,
        "kundenNr": "KD-10003",
        "firmenname": "InnoDesign Studio",
        "ansprechpartner": "Marc Weber",
        "email": "m.weber@innodesign.io",
        "telefon": "040-5551234",
        "strasse": "Speicherstadt 8",
        "ort": "Hamburg",
        "uStIdNr": "DE555444333",
        "zahlungszielTage": 14,
        "status": "Aktiv"
      }
    ],
    "fields": [
      "Id",
      "KundenNr",
      "Firmenname",
      "Ansprechpartner",
      "Email",
      "Telefon",
      "Strasse",
      "plz",
      "Ort",
      "UStIdNr",
      "ZahlungszielTage",
      "Status"
    ]
  },
  {
    "name": "artikel",
    "tableName": "Artikel",
    "keyPath": "id",
    "data": [
      {
        "Id": 1,
        "ArtikelNr": "ART-0101",
        "Bezeichnung": "IT-Consulting & Softwareentwicklung",
        "Kategorie": "Dienstleistung",
        "Einzelpreis": 120,
        "SteuerSatz": 19,
        "Einheit": "Std",
        "Lagerbestand": 999,
        "id": 1,
        "artikelNr": "ART-0101",
        "bezeichnung": "IT-Consulting & Softwareentwicklung",
        "kategorie": "Dienstleistung",
        "einzelpreis": 120,
        "steuerSatz": 19,
        "einheit": "Std",
        "lagerbestand": 999
      },
      {
        "Id": 2,
        "ArtikelNr": "ART-0102",
        "Bezeichnung": "DB Studio Pro Enterprise Lizenz",
        "Kategorie": "Software",
        "Einzelpreis": 1490,
        "SteuerSatz": 19,
        "Einheit": "Stk",
        "Lagerbestand": 50,
        "id": 2,
        "artikelNr": "ART-0102",
        "bezeichnung": "DB Studio Pro Enterprise Lizenz",
        "kategorie": "Software",
        "einzelpreis": 1490,
        "steuerSatz": 19,
        "einheit": "Stk",
        "lagerbestand": 50
      },
      {
        "Id": 3,
        "ArtikelNr": "ART-0103",
        "Bezeichnung": "Monatliche Cloud-Wartung & Support",
        "Kategorie": "Wartung",
        "Einzelpreis": 250,
        "SteuerSatz": 19,
        "Einheit": "Pauschal",
        "Lagerbestand": 999,
        "id": 3,
        "artikelNr": "ART-0103",
        "bezeichnung": "Monatliche Cloud-Wartung & Support",
        "kategorie": "Wartung",
        "einzelpreis": 250,
        "steuerSatz": 19,
        "einheit": "Pauschal",
        "lagerbestand": 999
      },
      {
        "Id": 4,
        "ArtikelNr": "ART-0104",
        "Bezeichnung": "High-Performance Datenbank-Server",
        "Kategorie": "Hardware",
        "Einzelpreis": 3200,
        "SteuerSatz": 19,
        "Einheit": "Stk",
        "Lagerbestand": 12,
        "id": 4,
        "artikelNr": "ART-0104",
        "bezeichnung": "High-Performance Datenbank-Server",
        "kategorie": "Hardware",
        "einzelpreis": 3200,
        "steuerSatz": 19,
        "einheit": "Stk",
        "lagerbestand": 12
      }
    ],
    "fields": [
      "Id",
      "ArtikelNr",
      "Bezeichnung",
      "Kategorie",
      "Einzelpreis",
      "SteuerSatz",
      "Einheit",
      "Lagerbestand"
    ]
  },
  {
    "name": "angebote",
    "tableName": "Angebote",
    "keyPath": "id",
    "data": [
      {
        "Id": 1,
        "AngebotsNr": "ANG-2026-0001",
        "KundenId": 1,
        "Datum": "2026-01-10",
        "GueltigBis": "2026-02-10",
        "Status": "Angenommen",
        "NettoBetrag": 3890,
        "BruttoBetrag": 4629.1,
        "Bemerkung": "Inklusive 10% Projekt-Rabatt",
        "id": 1,
        "angebotsNr": "ANG-2026-0001",
        "kundenId": 1,
        "datum": "2026-01-10",
        "gueltigBis": "2026-02-10",
        "status": "Angenommen",
        "nettoBetrag": 3890,
        "bruttoBetrag": 4629.1,
        "bemerkung": "Inklusive 10% Projekt-Rabatt"
      },
      {
        "Id": 2,
        "AngebotsNr": "ANG-2026-0002",
        "KundenId": 2,
        "Datum": "2026-01-15",
        "GueltigBis": "2026-02-15",
        "Status": "Versendet",
        "NettoBetrag": 1490,
        "BruttoBetrag": 1773.1,
        "Bemerkung": "Softwarelizenz für 5 Arbeitsplätze",
        "id": 2,
        "angebotsNr": "ANG-2026-0002",
        "kundenId": 2,
        "datum": "2026-01-15",
        "gueltigBis": "2026-02-15",
        "status": "Versendet",
        "nettoBetrag": 1490,
        "bruttoBetrag": 1773.1,
        "bemerkung": "Softwarelizenz für 5 Arbeitsplätze"
      }
    ],
    "fields": [
      "Id",
      "AngebotsNr",
      "KundenId",
      "Datum",
      "GueltigBis",
      "Status",
      "NettoBetrag",
      "BruttoBetrag",
      "Bemerkung"
    ]
  },
  {
    "name": "angebotspositionen",
    "tableName": "Angebotspositionen",
    "keyPath": "id",
    "data": [
      {
        "Id": 1,
        "AngebotsId": 1,
        "ArtikelId": 1,
        "Menge": 20,
        "Einzelpreis": 120,
        "RabattProzent": 0,
        "GesamtNetto": 2400,
        "id": 1,
        "angebotsId": 1,
        "artikelId": 1,
        "menge": 20,
        "einzelpreis": 120,
        "rabattProzent": 0,
        "gesamtNetto": 2400
      },
      {
        "Id": 2,
        "AngebotsId": 1,
        "ArtikelId": 2,
        "Menge": 1,
        "Einzelpreis": 1490,
        "RabattProzent": 0,
        "GesamtNetto": 1490,
        "id": 2,
        "angebotsId": 1,
        "artikelId": 2,
        "menge": 1,
        "einzelpreis": 1490,
        "rabattProzent": 0,
        "gesamtNetto": 1490
      },
      {
        "Id": 3,
        "AngebotsId": 2,
        "ArtikelId": 2,
        "Menge": 1,
        "Einzelpreis": 1490,
        "RabattProzent": 0,
        "GesamtNetto": 1490,
        "id": 3,
        "angebotsId": 2,
        "artikelId": 2,
        "menge": 1,
        "einzelpreis": 1490,
        "rabattProzent": 0,
        "gesamtNetto": 1490
      }
    ],
    "fields": [
      "Id",
      "AngebotsId",
      "ArtikelId",
      "Menge",
      "Einzelpreis",
      "RabattProzent",
      "GesamtNetto"
    ]
  },
  {
    "name": "auftraege",
    "tableName": "Auftraege",
    "keyPath": "id",
    "data": [
      {
        "Id": 1,
        "AuftragsNr": "AUF-2026-0001",
        "AngebotsId": 1,
        "KundenId": 1,
        "AuftragsDatum": "2026-01-12",
        "LieferDatum": "2026-01-25",
        "Status": "Abgeschlossen",
        "NettoBetrag": 3890,
        "BruttoBetrag": 4629.1,
        "id": 1,
        "auftragsNr": "AUF-2026-0001",
        "angebotsId": 1,
        "kundenId": 1,
        "auftragsDatum": "2026-01-12",
        "lieferDatum": "2026-01-25",
        "status": "Abgeschlossen",
        "nettoBetrag": 3890,
        "bruttoBetrag": 4629.1
      },
      {
        "Id": 2,
        "AuftragsNr": "AUF-2026-0002",
        "AngebotsId": 2,
        "KundenId": 2,
        "AuftragsDatum": "2026-01-20",
        "LieferDatum": "2026-02-05",
        "Status": "Geliefert",
        "NettoBetrag": 1490,
        "BruttoBetrag": 1773.1,
        "id": 2,
        "auftragsNr": "AUF-2026-0002",
        "angebotsId": 2,
        "kundenId": 2,
        "auftragsDatum": "2026-01-20",
        "lieferDatum": "2026-02-05",
        "status": "Geliefert",
        "nettoBetrag": 1490,
        "bruttoBetrag": 1773.1
      }
    ],
    "fields": [
      "Id",
      "AuftragsNr",
      "AngebotsId",
      "KundenId",
      "AuftragsDatum",
      "LieferDatum",
      "Status",
      "NettoBetrag",
      "BruttoBetrag"
    ]
  },
  {
    "name": "auftragspositionen",
    "tableName": "Auftragspositionen",
    "keyPath": "id",
    "data": [
      {
        "Id": 1,
        "AuftragsId": 1,
        "ArtikelId": 1,
        "Menge": 20,
        "Einzelpreis": 120,
        "GesamtNetto": 2400,
        "id": 1,
        "auftragsId": 1,
        "artikelId": 1,
        "menge": 20,
        "einzelpreis": 120,
        "gesamtNetto": 2400
      },
      {
        "Id": 2,
        "AuftragsId": 1,
        "ArtikelId": 2,
        "Menge": 1,
        "Einzelpreis": 1490,
        "GesamtNetto": 1490,
        "id": 2,
        "auftragsId": 1,
        "artikelId": 2,
        "menge": 1,
        "einzelpreis": 1490,
        "gesamtNetto": 1490
      },
      {
        "Id": 3,
        "AuftragsId": 2,
        "ArtikelId": 2,
        "Menge": 1,
        "Einzelpreis": 1490,
        "GesamtNetto": 1490,
        "id": 3,
        "auftragsId": 2,
        "artikelId": 2,
        "menge": 1,
        "einzelpreis": 1490,
        "gesamtNetto": 1490
      }
    ],
    "fields": [
      "Id",
      "AuftragsId",
      "ArtikelId",
      "Menge",
      "Einzelpreis",
      "GesamtNetto"
    ]
  },
  {
    "name": "rechnungen",
    "tableName": "Rechnungen",
    "keyPath": "id",
    "data": [
      {
        "Id": 1,
        "RechnungsNr": "RE-2026-0001",
        "AuftragsId": 1,
        "KundenId": 1,
        "RechnungsDatum": "2026-01-15",
        "FaelligDatum": "2026-01-29",
        "ZahlungsStatus": "Bezahlt",
        "NettoBetrag": 3890,
        "MwStBetrag": 739.1,
        "BruttoBetrag": 4629.1,
        "OffenerBetrag": 0,
        "SkontoProzent": 2,
        "id": 1,
        "rechnungsNr": "RE-2026-0001",
        "auftragsId": 1,
        "kundenId": 1,
        "rechnungsDatum": "2026-01-15",
        "faelligDatum": "2026-01-29",
        "zahlungsStatus": "Bezahlt",
        "nettoBetrag": 3890,
        "mwStBetrag": 739.1,
        "bruttoBetrag": 4629.1,
        "offenerBetrag": 0,
        "skontoProzent": 2
      },
      {
        "Id": 2,
        "RechnungsNr": "RE-2026-0002",
        "AuftragsId": 2,
        "KundenId": 2,
        "RechnungsDatum": "2026-02-01",
        "FaelligDatum": "2026-02-15",
        "ZahlungsStatus": "Gemahnt",
        "NettoBetrag": 1490,
        "MwStBetrag": 283.1,
        "BruttoBetrag": 1773.1,
        "OffenerBetrag": 1773.1,
        "SkontoProzent": 0,
        "id": 2,
        "rechnungsNr": "RE-2026-0002",
        "auftragsId": 2,
        "kundenId": 2,
        "rechnungsDatum": "2026-02-01",
        "faelligDatum": "2026-02-15",
        "zahlungsStatus": "Gemahnt",
        "nettoBetrag": 1490,
        "mwStBetrag": 283.1,
        "bruttoBetrag": 1773.1,
        "offenerBetrag": 1773.1,
        "skontoProzent": 0
      },
      {
        "Id": 3,
        "RechnungsNr": "RE-2026-0003",
        "AuftragsId": null,
        "KundenId": 3,
        "RechnungsDatum": "2026-02-10",
        "FaelligDatum": "2026-02-24",
        "ZahlungsStatus": "Offen",
        "NettoBetrag": 250,
        "MwStBetrag": 47.5,
        "BruttoBetrag": 297.5,
        "OffenerBetrag": 297.5,
        "SkontoProzent": 2,
        "id": 3,
        "rechnungsNr": "RE-2026-0003",
        "auftragsId": null,
        "kundenId": 3,
        "rechnungsDatum": "2026-02-10",
        "faelligDatum": "2026-02-24",
        "zahlungsStatus": "Offen",
        "nettoBetrag": 250,
        "mwStBetrag": 47.5,
        "bruttoBetrag": 297.5,
        "offenerBetrag": 297.5,
        "skontoProzent": 2
      }
    ],
    "fields": [
      "Id",
      "RechnungsNr",
      "AuftragsId",
      "KundenId",
      "RechnungsDatum",
      "FaelligDatum",
      "ZahlungsStatus",
      "NettoBetrag",
      "MwStBetrag",
      "BruttoBetrag",
      "OffenerBetrag",
      "SkontoProzent"
    ]
  },
  {
    "name": "rechnungspositionen",
    "tableName": "Rechnungspositionen",
    "keyPath": "id",
    "data": [
      {
        "Id": 1,
        "RechnungsId": 1,
        "ArtikelId": 1,
        "PositionNr": 1,
        "Menge": 20,
        "Einzelpreis": 120,
        "SteuerSatz": 19,
        "GesamtNetto": 2400,
        "id": 1,
        "rechnungsId": 1,
        "artikelId": 1,
        "positionNr": 1,
        "menge": 20,
        "einzelpreis": 120,
        "steuerSatz": 19,
        "gesamtNetto": 2400
      },
      {
        "Id": 2,
        "RechnungsId": 1,
        "ArtikelId": 2,
        "PositionNr": 2,
        "Menge": 1,
        "Einzelpreis": 1490,
        "SteuerSatz": 19,
        "GesamtNetto": 1490,
        "id": 2,
        "rechnungsId": 1,
        "artikelId": 2,
        "positionNr": 2,
        "menge": 1,
        "einzelpreis": 1490,
        "steuerSatz": 19,
        "gesamtNetto": 1490
      },
      {
        "Id": 3,
        "RechnungsId": 2,
        "ArtikelId": 2,
        "PositionNr": 1,
        "Menge": 1,
        "Einzelpreis": 1490,
        "SteuerSatz": 19,
        "GesamtNetto": 1490,
        "id": 3,
        "rechnungsId": 2,
        "artikelId": 2,
        "positionNr": 1,
        "menge": 1,
        "einzelpreis": 1490,
        "steuerSatz": 19,
        "gesamtNetto": 1490
      },
      {
        "Id": 4,
        "RechnungsId": 3,
        "ArtikelId": 3,
        "PositionNr": 1,
        "Menge": 1,
        "Einzelpreis": 250,
        "SteuerSatz": 19,
        "GesamtNetto": 250,
        "id": 4,
        "rechnungsId": 3,
        "artikelId": 3,
        "positionNr": 1,
        "menge": 1,
        "einzelpreis": 250,
        "steuerSatz": 19,
        "gesamtNetto": 250
      }
    ],
    "fields": [
      "Id",
      "RechnungsId",
      "ArtikelId",
      "PositionNr",
      "Menge",
      "Einzelpreis",
      "SteuerSatz",
      "GesamtNetto"
    ]
  },
  {
    "name": "mahnungen",
    "tableName": "Mahnungen",
    "keyPath": "id",
    "data": [
      {
        "Id": 1,
        "MahnungsNr": "MAH-2026-0001",
        "RechnungsId": 2,
        "KundenId": 2,
        "MahnDatum": "2026-02-18",
        "Mahnstufe": "Mahnstufe 1 (Zahlungserinnerung)",
        "Mahngebuehr": 5,
        "Verzugszinsen": 0,
        "FaelligBis": "2026-02-28",
        "Status": "Offen",
        "id": 1,
        "mahnungsNr": "MAH-2026-0001",
        "rechnungsId": 2,
        "kundenId": 2,
        "mahnDatum": "2026-02-18",
        "mahnstufe": "Mahnstufe 1 (Zahlungserinnerung)",
        "mahngebuehr": 5,
        "verzugszinsen": 0,
        "faelligBis": "2026-02-28",
        "status": "Offen"
      }
    ],
    "fields": [
      "Id",
      "MahnungsNr",
      "RechnungsId",
      "KundenId",
      "MahnDatum",
      "Mahnstufe",
      "Mahngebuehr",
      "Verzugszinsen",
      "FaelligBis",
      "Status"
    ]
  },
  {
    "name": "gutschriften",
    "tableName": "Gutschriften",
    "keyPath": "id",
    "data": [
      {
        "Id": 1,
        "GutschriftNr": "GUT-2026-0001",
        "RechnungsId": 1,
        "KundenId": 1,
        "Datum": "2026-01-20",
        "Status": "Verrechnet",
        "NettoBetrag": 120,
        "MwStBetrag": 22.8,
        "BruttoBetrag": 142.8,
        "Grund": "Kulanzgutschrift wegen vereinbartem Treuerabatt",
        "id": 1,
        "gutschriftNr": "GUT-2026-0001",
        "rechnungsId": 1,
        "kundenId": 1,
        "datum": "2026-01-20",
        "status": "Verrechnet",
        "nettoBetrag": 120,
        "mwStBetrag": 22.8,
        "bruttoBetrag": 142.8,
        "grund": "Kulanzgutschrift wegen vereinbartem Treuerabatt"
      }
    ],
    "fields": [
      "Id",
      "GutschriftNr",
      "RechnungsId",
      "KundenId",
      "Datum",
      "Status",
      "NettoBetrag",
      "MwStBetrag",
      "BruttoBetrag",
      "Grund"
    ]
  },
  {
    "name": "gutschriftpositionen",
    "tableName": "Gutschriftpositionen",
    "keyPath": "id",
    "data": [
      {
        "Id": 1,
        "GutschriftId": 1,
        "ArtikelId": 1,
        "Menge": 1,
        "Einzelpreis": 120,
        "GesamtNetto": 120,
        "id": 1,
        "gutschriftId": 1,
        "artikelId": 1,
        "menge": 1,
        "einzelpreis": 120,
        "gesamtNetto": 120
      }
    ],
    "fields": [
      "Id",
      "GutschriftId",
      "ArtikelId",
      "Menge",
      "Einzelpreis",
      "GesamtNetto"
    ]
  }
];

const normalizeKeys = (row: any, storeConfig: any) => {
    if (!row) return row;
    const normalized = { ...row };
    if (storeConfig && storeConfig.fields) {
        storeConfig.fields.forEach((fName: string) => {
            const camelKey = fName.charAt(0).toLowerCase() + fName.slice(1);
            const pascalKey = fName.charAt(0).toUpperCase() + fName.slice(1);
            const rowKeys = Object.keys(row);
            const matchedKey = rowKeys.find(k => k.toLowerCase() === fName.toLowerCase());
            if (matchedKey !== undefined) {
                normalized[camelKey] = row[matchedKey];
                normalized[pascalKey] = row[matchedKey];
                normalized[fName] = row[matchedKey];
            }
        });
    } else {
        Object.keys(row).forEach(key => {
            const camel = key.charAt(0).toLowerCase() + key.slice(1);
            if (normalized[camel] === undefined) {
                normalized[camel] = row[key];
            }
        });
    }
    return normalized;
};

const normalizeKeysOnWrite = (row: any, storeConfig: any) => {
    if (!row) return row;
    const normalized = { ...row };
    if (storeConfig && storeConfig.fields) {
        storeConfig.fields.forEach((fName: string) => {
            const camelKey = fName.charAt(0).toLowerCase() + fName.slice(1);
            const pascalKey = fName.charAt(0).toUpperCase() + fName.slice(1);
            if (row[camelKey] !== undefined) {
                normalized[fName] = row[camelKey];
                normalized[pascalKey] = row[camelKey];
            } else if (row[fName] !== undefined) {
                normalized[camelKey] = row[fName];
                normalized[pascalKey] = row[fName];
            }
        });
    }
    return normalized;
};

export interface PagedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = request.result;
            STORES.forEach(store => {
                if (!db.objectStoreNames.contains(store.name)) {
                    db.createObjectStore(store.name, { keyPath: store.keyPath });
                }
            });
            if (!db.objectStoreNames.contains('users')) {
                db.createObjectStore('users', { keyPath: 'username' });
            }
        };
        request.onsuccess = () => {
            const db = request.result;
            const seedKey = 'db_seeded_' + DB_NAME + '_v' + DB_VERSION + '_' + STORES.map(s => s.name + '_' + (s.fields?.join('-') || '') + '_' + (s.data?.length || 0)).join('_');
            if (!localStorage.getItem(seedKey)) {
                const promises = STORES.map(store => {
                    if (store.data && store.data.length > 0 && db.objectStoreNames.contains(store.name)) {
                        return new Promise<void>((res) => {
                            try {
                                const tx = db.transaction(store.name, 'readwrite');
                                const objStore = tx.objectStore(store.name);
                                const clearReq = objStore.clear();
                                clearReq.onsuccess = () => {
                                    store.data.forEach((row: any) => {
                                        objStore.add(row);
                                    });
                                    tx.oncomplete = () => res();
                                    tx.onerror = () => res();
                                };
                                clearReq.onerror = () => res();
                            } catch (err) {
                                res();
                            }
                        });
                    }
                    return Promise.resolve();
                });
                
                Promise.all(promises).then(() => {
                    localStorage.setItem(seedKey, 'true');
                    resolve(db);
                }).catch(() => {
                    resolve(db);
                });
            } else {
                resolve(db);
            }
        };
        request.onerror = () => reject(request.error);
    });
};
const generateSimulatedJwt = (payload: any) => {
    try {
        const jsonStr = JSON.stringify(payload);
        const encodedPayload = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (match, p1) => {
            return String.fromCharCode(parseInt(p1, 16));
        }));
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const signature = 'simulated-signature';
        return `${header}.${encodedPayload}.${signature}`;
    } catch (e) {
        return 'mock.jwt.token';
    }
};

const getUserStoreName = (db: IDBDatabase): string => {
    const names = Array.from(db.objectStoreNames);
    const found = names.find(n => {
        const ln = n.toLowerCase().replace(/_|-/g, '');
        return ln === 'sysusers' || ln === 'users';
    });
    return found || 'users';
};

const parseEndpoint = (endpoint: string) => {
    const parts = endpoint.split('/').filter(Boolean);
    if (parts[0] === 'queries') {
        return { type: 'query', target: parts[1], id: undefined };
    }
    return { type: 'table', target: parts[0], id: parts[1] };
};

const findStoreConfig = (target: string) => {
    return STORES.find(s => 
        s.name.toLowerCase() === target.toLowerCase() || 
        (s.tableName && s.tableName.toLowerCase() === target.toLowerCase()) ||
        s.name.toLowerCase().replace(/_|-/g, '') === target.toLowerCase().replace(/_|-/g, '')
    );
};

export const get = async <T>(endpoint: string, params?: any): Promise<PagedResponse<T> | any> => {
    if (endpoint.startsWith('auth/')) {
        if (endpoint === 'auth/me') {
            const token = localStorage.getItem('auth_token');
            const savedUser = localStorage.getItem('auth_user');
            if (token && savedUser) {
                return { user: JSON.parse(savedUser) };
            }
            return null;
        }
        return null;
    }

    const cleanEndpoint = (endpoint || '').replace(/^\/+/g, '');
    const cleanParams: any = {};
    if (params) {
        Object.keys(params).forEach(k => {
            const val = params[k];
            if (val !== undefined && val !== null && val !== '') {
                cleanParams[k] = val;
            }
        });
    }

    if (!isLocalMode()) {
        try {
            const token = localStorage.getItem('auth_token');
            const headers: any = {};
            if (token) {
                headers['Authorization'] = 'Bearer ' + token;
            }
            const response = await api.get(cleanEndpoint, { params: cleanParams, headers });
            if (response && response.data !== undefined && response.data !== null) {
                return response.data;
            }
        } catch (apiErr) {
            // Fallback to IndexedDB simulation if server API request fails or is offline
        }
    } else {
        const w = window as any;
        if (w.electronAPI?.readJson) {
            try {
                const localRes = await w.electronAPI.readJson(cleanEndpoint);
                if (localRes !== undefined && localRes !== null) return localRes;
            } catch(e) {}
        }
    }

    const { type, target, id } = parseEndpoint(endpoint);
    
    if (type === 'query') {
        const storeConfig = findStoreConfig(target);
        if (storeConfig) {
            const db = await openDB();
            if (db.objectStoreNames.contains(storeConfig.name)) {
                return new Promise((resolve, reject) => {
                    const tx = db.transaction(storeConfig.name, 'readonly');
                    const store = tx.objectStore(storeConfig.name);
                    const request = store.getAll();
                    request.onsuccess = () => {
                        let rows = request.result || [];
                        if (params?.search) {
                            const term = String(params.search).toLowerCase();
                            rows = rows.filter(row => Object.values(row).some(val => String(val).toLowerCase().includes(term)));
                        }
                        const page = Number(params?.page || 1);
                        const pageSize = Number(params?.pageSize || 20);
                        const total = rows.length;
                        const totalPages = Math.ceil(total / pageSize) || 1;
                        const startIdx = (page - 1) * pageSize;
                        const pagedRows = rows.slice(startIdx, startIdx + pageSize).map(row => normalizeKeys(row, storeConfig));
                        resolve({ data: pagedRows, total, page, pageSize, totalPages });
                    };
                    request.onerror = () => reject(request.error);
                });
            }
        }
        return { data: [], total: 0, page: 1, pageSize: 20, totalPages: 1 };
    }

    const storeConfig = findStoreConfig(target);
    const storeName = storeConfig ? storeConfig.name : target;

    const db = await openDB();
    if (!db.objectStoreNames.contains(storeName)) {
        return id ? null : { data: [], total: 0, page: 1, pageSize: 20, totalPages: 1 };
    }

    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        
        if (id) {
            const parsedId = isNaN(Number(id)) ? id : Number(id);
            const request = store.get(parsedId);
            request.onsuccess = () => {
                resolve(normalizeKeys(request.result, storeConfig) || null);
            };
            request.onerror = () => reject(request.error);
        } else {
            const request = store.getAll();
            request.onsuccess = () => {
                let rows = request.result || [];
                
                if (params?.search) {
                    const term = String(params.search).toLowerCase();
                    rows = rows.filter(row => {
                        return Object.values(row).some(val => 
                            String(val).toLowerCase().includes(term)
                        );
                    });
                }
                
                const page = Number(params?.page || 1);
                const pageSize = Number(params?.pageSize || 20);
                const total = rows.length;
                const totalPages = Math.ceil(total / pageSize);
                const startIdx = (page - 1) * pageSize;
                const pagedRows = rows.slice(startIdx, startIdx + pageSize).map(row => normalizeKeys(row, storeConfig));
                
                resolve({
                    data: pagedRows,
                    total,
                    page,
                    pageSize,
                    totalPages
                });
            };
            request.onerror = () => reject(request.error);
        }
    });
};

export const post = async <T>(endpoint: string, data: any): Promise<T> => {
    const cleanEndpoint = (endpoint || '').replace(/^\/+/g, '');
    if (endpoint.startsWith('auth/')) {
        if (!isLocalMode()) {
            try {
                const response = await api.post(cleanEndpoint, data);
                if (response && response.data) {
                    if (response.data.token) {
                        localStorage.setItem('auth_token', response.data.token);
                        if (response.data.user) localStorage.setItem('auth_user', JSON.stringify(response.data.user));
                    }
                    return response.data;
                }
            } catch (err) {
                // fallback
            }
        }
        if (endpoint === 'auth/login') {
            return loginUser(data) as any;
        }
        if (endpoint === 'auth/register') {
            return registerUser(data) as any;
        }
        if (endpoint === 'auth/login-sso') {
            const token = generateSimulatedJwt({ unique_name: data.provider || 'sso', role: 'User' });
            const user = { username: (data.provider || 'sso') + 'User', email: 'sso@example.com', role: 'User' };
            localStorage.setItem('auth_token', token);
            localStorage.setItem('auth_user', JSON.stringify(user));
            return { token, user } as any;
        }
        throw new Error('Unsupported auth endpoint: ' + endpoint);
    }

    if (!isLocalMode()) {
        try {
            const token = localStorage.getItem('auth_token');
            const headers: any = {};
            if (token) headers['Authorization'] = 'Bearer ' + token;
            const response = await api.post(cleanEndpoint, data, { headers });
            if (response && response.data !== undefined) {
                return response.data;
            }
        } catch (apiErr) {
            // Fallback to IndexedDB simulation
        }
    }

    const { target } = parseEndpoint(endpoint);
    const storeConfig = findStoreConfig(target);
    const storeName = storeConfig ? storeConfig.name : target;
    const keyPath = storeConfig ? storeConfig.keyPath : 'id';

    const db = await openDB();
    if (!db.objectStoreNames.contains(storeName)) {
        throw new Error('Store not found: ' + storeName);
    }

    const records = await new Promise<any[]>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });

    const payload = normalizeKeysOnWrite({ ...data }, storeConfig);
    
    if (payload[keyPath] === undefined || payload[keyPath] === null || payload[keyPath] === '') {
        const numericKeys = records.map(r => Number(r[keyPath])).filter(n => !isNaN(n));
        if (numericKeys.length > 0) {
            payload[keyPath] = Math.max(...numericKeys) + 1;
        } else {
            payload[keyPath] = Date.now();
        }
    }

    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.add(payload);
        request.onsuccess = () => resolve(normalizeKeys(payload, storeConfig) as T);
        request.onerror = () => reject(request.error);
    });
};

export const put = async <T>(endpoint: string, dataOrId?: any, dataPayload?: any): Promise<T> => {
    let endpointPath = endpoint || '';
    let payloadData = dataOrId;
    if (dataPayload !== undefined) {
        endpointPath = endpointPath + '/' + dataOrId;
        payloadData = dataPayload;
    }
    const cleanEndpoint = endpointPath.replace(/^\/+/g, '');
    if (!isLocalMode()) {
        try {
            const token = localStorage.getItem('auth_token');
            const headers: any = {};
            if (token) headers['Authorization'] = 'Bearer ' + token;
            const response = await api.put(cleanEndpoint, payloadData, { headers });
            if (response && response.data !== undefined) {
                return response.data;
            }
        } catch (apiErr) {
            // Fallback to IndexedDB simulation
        }
    }

    const { target, id } = parseEndpoint(cleanEndpoint);
    const storeConfig = findStoreConfig(target);
    const storeName = storeConfig ? storeConfig.name : target;
    const keyPath = storeConfig ? storeConfig.keyPath : 'id';

    const db = await openDB();
    if (!db.objectStoreNames.contains(storeName)) {
        throw new Error('Store not found: ' + storeName);
    }

    const payload = normalizeKeysOnWrite({ ...payloadData }, storeConfig);
    if (id) {
        payload[keyPath] = isNaN(Number(id)) ? id : Number(id);
    }

    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.put(payload);
        request.onsuccess = () => resolve(normalizeKeys(payload, storeConfig) as T);
        request.onerror = () => reject(request.error);
    });
};

export const remove = async (endpoint: string, itemId?: any): Promise<any> => {
    let endpointPath = endpoint || '';
    if (itemId !== undefined && itemId !== null) {
        endpointPath = endpointPath + '/' + itemId;
    }
    const cleanEndpoint = endpointPath.replace(/^\/+/g, '');
    if (!isLocalMode()) {
        try {
            const token = localStorage.getItem('auth_token');
            const headers: any = {};
            if (token) headers['Authorization'] = 'Bearer ' + token;
            const response = await api.delete(cleanEndpoint, { headers });
            if (response && response.data !== undefined) {
                return response.data;
            }
        } catch (apiErr) {
            // Fallback to IndexedDB simulation
        }
    }

    const { target, id } = parseEndpoint(cleanEndpoint);
    const storeConfig = findStoreConfig(target);
    const storeName = storeConfig ? storeConfig.name : target;

    if (!id) throw new Error('Delete requires an ID');

    const db = await openDB();
    if (!db.objectStoreNames.contains(storeName)) {
        throw new Error('Store not found: ' + storeName);
    }

    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const parsedId = isNaN(Number(id)) ? id : Number(id);
        const request = store.delete(parsedId);
        request.onsuccess = () => resolve({ success: true });
        request.onerror = () => reject(request.error);
    });
};

export const del = remove;

// Local Auth API using IndexedDB
export const loginUser = async (credentials: any) => {
    const db = await openDB();
    const storeName = getUserStoreName(db);
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => {
            const users = request.result || [];
            const user = users.find((u: any) => {
                const uName = (u.Username || u.username || '').toLowerCase();
                return uName === credentials.username.toLowerCase();
            });

            const passwordMatches = user && (
                user.PasswordHash === credentials.password ||
                user.passwordHash === credentials.password ||
                user.Password === credentials.password ||
                user.password === credentials.password
            );

            if (user && passwordMatches) {
                const uName = user.Username || user.username || credentials.username;
                const uEmail = user.Email || user.email || (uName + '@demo.com');
                const roleId = user.RoleId !== undefined ? user.RoleId : (user.roleId !== undefined ? user.roleId : 4);
                let role = user.Role || user.role || 'User';
                if (roleId === 1) role = 'Admin';
                else if (roleId === 2) role = 'Manager';
                else if (roleId === 3) role = 'Editor';
                else if (roleId === 4) role = 'User';

                const token = generateSimulatedJwt({ unique_name: uName, role });
                localStorage.setItem('auth_token', token);
                localStorage.setItem('auth_user', JSON.stringify({ username: uName, email: uEmail, role }));
                resolve({ token, user: { username: uName, email: uEmail, role } });
            } else {
                if (credentials.username === 'admin' && (credentials.password === 'admin' || credentials.password === 'admin123')) {
                    const token = generateSimulatedJwt({ unique_name: 'admin', role: 'Admin' });
                    localStorage.setItem('auth_token', token);
                    localStorage.setItem('auth_user', JSON.stringify({ username: 'admin', email: 'admin@example.com', role: 'Admin' }));
                    resolve({ token, user: { username: 'admin', email: 'admin@example.com', role: 'Admin' } });
                } else if (credentials.username === 'user' && (credentials.password === 'user' || credentials.password === 'user123')) {
                    const token = generateSimulatedJwt({ unique_name: 'user', role: 'User' });
                    localStorage.setItem('auth_token', token);
                    localStorage.setItem('auth_user', JSON.stringify({ username: 'user', email: 'user@example.com', role: 'User' }));
                    resolve({ token, user: { username: 'user', email: 'user@example.com', role: 'User' } });
                } else {
                    reject(new Error('Ungültige Anmeldedaten'));
                }
            }
        };
        request.onerror = () => reject(request.error);
    });
};

export const registerUser = async (userData: any) => {
    const db = await openDB();
    const storeName = getUserStoreName(db);
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        
        const pkField: any = (Array.isArray(store.keyPath) ? store.keyPath[0] : store.keyPath) || 'id';
        const payload: any = {};
        
        payload[pkField] = Date.now();
        payload.Username = userData.username;
        payload.username = userData.username;
        payload.PasswordHash = userData.password;
        payload.password = userData.password;
        payload.Email = userData.email;
        payload.email = userData.email;
        payload.RoleId = 4;
        payload.roleId = 4;
        payload.IsActive = true;
        payload.isActive = true;

        const request = store.add(payload);
        request.onsuccess = () => resolve({ success: true });
        request.onerror = () => reject(request.error);
    });
};

export const changePassword = async (data: any) => {
    const db = await openDB();
    const savedUser = localStorage.getItem('auth_user');
    if (!savedUser) throw new Error('Not logged in');
    const { username } = JSON.parse(savedUser);
    const storeName = getUserStoreName(db);

    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const getReq = store.getAll();
        getReq.onsuccess = () => {
            const users = getReq.result || [];
            const user = users.find((u: any) => {
                const uName = (u.Username || u.username || '').toLowerCase();
                return uName === username.toLowerCase();
            });

            if (user) {
                if (user.PasswordHash !== undefined) user.PasswordHash = data.newPassword;
                if (user.passwordHash !== undefined) user.passwordHash = data.newPassword;
                if (user.Password !== undefined) user.Password = data.newPassword;
                if (user.password !== undefined) user.password = data.newPassword;
                
                const putReq = store.put(user);
                putReq.onsuccess = () => resolve({ success: true });
                putReq.onerror = () => reject(putReq.error);
            } else {
                reject(new Error('User not found'));
            }
        };
        getReq.onerror = () => reject(getReq.error);
    });
};

export const logoutUser = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.location.href = '/login';
};

