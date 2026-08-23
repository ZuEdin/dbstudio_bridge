import { serial, text, real, timestamp, integer, pgTable } from "drizzle-orm/pg-core";

export const Kunden = pgTable("Kunden", {
  Id: serial("Id").primaryKey(),
  KundenNr: text("KundenNr").notNull().unique(),
  Firmenname: text("Firmenname").notNull(),
  Ansprechpartner: text("Ansprechpartner").notNull(),
  Email: text("Email").notNull(),
  Telefon: text("Telefon").notNull(),
  Strasse: text("Strasse").notNull(),
  plz: text("plz").notNull(),
  Ort: text("Ort").notNull(),
  UStIdNr: text("UStIdNr").notNull(),
  ZahlungszielTage: integer("ZahlungszielTage").notNull(),
  Status: text("Status").notNull(),
});

export const Artikel = pgTable("Artikel", {
  Id: serial("Id").primaryKey(),
  ArtikelNr: text("ArtikelNr").notNull().unique(),
  Bezeichnung: text("Bezeichnung").notNull(),
  Kategorie: text("Kategorie").notNull(),
  Einzelpreis: real("Einzelpreis").notNull(),
  SteuerSatz: integer("SteuerSatz").notNull(),
  Einheit: text("Einheit").notNull(),
  Lagerbestand: integer("Lagerbestand").notNull(),
});

export const Angebote = pgTable("Angebote", {
  Id: serial("Id").primaryKey(),
  AngebotsNr: text("AngebotsNr").notNull().unique(),
  KundenId: integer("KundenId").notNull(),
  Datum: timestamp("Datum").notNull(),
  GueltigBis: timestamp("GueltigBis").notNull(),
  Status: text("Status").notNull(),
  NettoBetrag: real("NettoBetrag").notNull(),
  BruttoBetrag: real("BruttoBetrag").notNull(),
  Bemerkung: text("Bemerkung").notNull(),
});

export const Angebotspositionen = pgTable("Angebotspositionen", {
  Id: serial("Id").primaryKey(),
  AngebotsId: integer("AngebotsId").notNull(),
  ArtikelId: integer("ArtikelId").notNull(),
  Menge: real("Menge").notNull(),
  Einzelpreis: real("Einzelpreis").notNull(),
  RabattProzent: real("RabattProzent").notNull(),
  GesamtNetto: real("GesamtNetto").notNull(),
});

export const Auftraege = pgTable("Auftraege", {
  Id: serial("Id").primaryKey(),
  AuftragsNr: text("AuftragsNr").notNull().unique(),
  AngebotsId: integer("AngebotsId").notNull(),
  KundenId: integer("KundenId").notNull(),
  AuftragsDatum: timestamp("AuftragsDatum").notNull(),
  LieferDatum: timestamp("LieferDatum").notNull(),
  Status: text("Status").notNull(),
  NettoBetrag: real("NettoBetrag").notNull(),
  BruttoBetrag: real("BruttoBetrag").notNull(),
});

export const Auftragspositionen = pgTable("Auftragspositionen", {
  Id: serial("Id").primaryKey(),
  AuftragsId: integer("AuftragsId").notNull(),
  ArtikelId: integer("ArtikelId").notNull(),
  Menge: real("Menge").notNull(),
  Einzelpreis: real("Einzelpreis").notNull(),
  GesamtNetto: real("GesamtNetto").notNull(),
});

export const Rechnungen = pgTable("Rechnungen", {
  Id: serial("Id").primaryKey(),
  RechnungsNr: text("RechnungsNr").notNull().unique(),
  AuftragsId: integer("AuftragsId").notNull(),
  KundenId: integer("KundenId").notNull(),
  RechnungsDatum: timestamp("RechnungsDatum").notNull(),
  FaelligDatum: timestamp("FaelligDatum").notNull(),
  ZahlungsStatus: text("ZahlungsStatus").notNull(),
  NettoBetrag: real("NettoBetrag").notNull(),
  MwStBetrag: real("MwStBetrag").notNull(),
  BruttoBetrag: real("BruttoBetrag").notNull(),
  OffenerBetrag: real("OffenerBetrag").notNull(),
  SkontoProzent: real("SkontoProzent").notNull(),
});

export const Rechnungspositionen = pgTable("Rechnungspositionen", {
  Id: serial("Id").primaryKey(),
  RechnungsId: integer("RechnungsId").notNull(),
  ArtikelId: integer("ArtikelId").notNull(),
  PositionNr: integer("PositionNr").notNull(),
  Menge: real("Menge").notNull(),
  Einzelpreis: real("Einzelpreis").notNull(),
  SteuerSatz: integer("SteuerSatz").notNull(),
  GesamtNetto: real("GesamtNetto").notNull(),
});

export const Mahnungen = pgTable("Mahnungen", {
  Id: serial("Id").primaryKey(),
  MahnungsNr: text("MahnungsNr").notNull().unique(),
  RechnungsId: integer("RechnungsId").notNull(),
  KundenId: integer("KundenId").notNull(),
  MahnDatum: timestamp("MahnDatum").notNull(),
  Mahnstufe: text("Mahnstufe").notNull(),
  Mahngebuehr: real("Mahngebuehr").notNull(),
  Verzugszinsen: real("Verzugszinsen").notNull(),
  FaelligBis: timestamp("FaelligBis").notNull(),
  Status: text("Status").notNull(),
});

export const Gutschriften = pgTable("Gutschriften", {
  Id: serial("Id").primaryKey(),
  GutschriftNr: text("GutschriftNr").notNull().unique(),
  RechnungsId: integer("RechnungsId").notNull(),
  KundenId: integer("KundenId").notNull(),
  Datum: timestamp("Datum").notNull(),
  Status: text("Status").notNull(),
  NettoBetrag: real("NettoBetrag").notNull(),
  MwStBetrag: real("MwStBetrag").notNull(),
  BruttoBetrag: real("BruttoBetrag").notNull(),
  Grund: text("Grund").notNull(),
});

export const Gutschriftpositionen = pgTable("Gutschriftpositionen", {
  Id: serial("Id").primaryKey(),
  GutschriftId: integer("GutschriftId").notNull(),
  ArtikelId: integer("ArtikelId").notNull(),
  Menge: real("Menge").notNull(),
  Einzelpreis: real("Einzelpreis").notNull(),
  GesamtNetto: real("GesamtNetto").notNull(),
});

