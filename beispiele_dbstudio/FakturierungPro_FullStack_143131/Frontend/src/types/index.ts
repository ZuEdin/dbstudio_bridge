export interface NavigationItem {
  id: string;
  title?: string;
  label?: string;
  icon?: string;
  type?: string;
  route?: string;
  path?: string;
  targetType?: string;
  targetId?: string;
  requiredRoles?: string[];
  roles?: string[];
  children?: NavigationItem[];
  badgeCountQuery?: string;
  translations?: Record<string, string>;
}

export interface Kunden {
  id: number;
  kundenNr?: string;
  firmenname?: string;
  ansprechpartner?: string;
  email?: string;
  telefon?: string;
  strasse?: string;
  plz?: string;
  ort?: string;
  uStIdNr?: string;
  zahlungszielTage?: number;
  status?: string;
}

export interface Artikel {
  id: number;
  artikelNr?: string;
  bezeichnung?: string;
  kategorie?: string;
  einzelpreis?: number;
  steuerSatz?: number;
  einheit?: string;
  lagerbestand?: number;
}

export interface Angebote {
  id: number;
  angebotsNr?: string;
  kundenId?: number;
  datum?: Date;
  gueltigBis?: Date;
  status?: string;
  nettoBetrag?: number;
  bruttoBetrag?: number;
  bemerkung?: string;
}

export interface Angebotspositionen {
  id: number;
  angebotsId?: number;
  artikelId?: number;
  menge?: number;
  einzelpreis?: number;
  rabattProzent?: number;
  gesamtNetto?: number;
}

export interface Auftraege {
  id: number;
  auftragsNr?: string;
  angebotsId?: number;
  kundenId?: number;
  auftragsDatum?: Date;
  lieferDatum?: Date;
  status?: string;
  nettoBetrag?: number;
  bruttoBetrag?: number;
}

export interface Auftragspositionen {
  id: number;
  auftragsId?: number;
  artikelId?: number;
  menge?: number;
  einzelpreis?: number;
  gesamtNetto?: number;
}

export interface Rechnungen {
  id: number;
  rechnungsNr?: string;
  auftragsId?: number;
  kundenId?: number;
  rechnungsDatum?: Date;
  faelligDatum?: Date;
  zahlungsStatus?: string;
  nettoBetrag?: number;
  mwStBetrag?: number;
  bruttoBetrag?: number;
  offenerBetrag?: number;
  skontoProzent?: number;
}

export interface Rechnungspositionen {
  id: number;
  rechnungsId?: number;
  artikelId?: number;
  positionNr?: number;
  menge?: number;
  einzelpreis?: number;
  steuerSatz?: number;
  gesamtNetto?: number;
}

export interface Mahnungen {
  id: number;
  mahnungsNr?: string;
  rechnungsId?: number;
  kundenId?: number;
  mahnDatum?: Date;
  mahnstufe?: string;
  mahngebuehr?: number;
  verzugszinsen?: number;
  faelligBis?: Date;
  status?: string;
}

export interface Gutschriften {
  id: number;
  gutschriftNr?: string;
  rechnungsId?: number;
  kundenId?: number;
  datum?: Date;
  status?: string;
  nettoBetrag?: number;
  mwStBetrag?: number;
  bruttoBetrag?: number;
  grund?: string;
}

export interface Gutschriftpositionen {
  id: number;
  gutschriftId?: number;
  artikelId?: number;
  menge?: number;
  einzelpreis?: number;
  gesamtNetto?: number;
}

export interface OffeneRechnungenMahnstufen {
  rechnungsNr?: string;
  firmenname?: string;
  faelligDatum?: Date;
  zahlungsStatus?: string;
  offenerBetrag?: number;
}

