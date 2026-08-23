-- Database Script for SQLite
-- Project: FakturierungPro

CREATE TABLE IF NOT EXISTS "Kunden" (
  "Id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "KundenNr" VARCHAR(30) NOT NULL,
  "Firmenname" VARCHAR(150) NOT NULL,
  "Ansprechpartner" VARCHAR(100) NOT NULL,
  "Email" VARCHAR(100) NOT NULL,
  "Telefon" VARCHAR(50) NOT NULL,
  "Strasse" VARCHAR(120) NOT NULL,
  "plz" VARCHAR(20) NOT NULL,
  "Ort" VARCHAR(100) NOT NULL,
  "UStIdNr" VARCHAR(50) NOT NULL,
  "ZahlungszielTage" INT NOT NULL DEFAULT 14,
  "Status" VARCHAR(50) NOT NULL DEFAULT 'Aktiv'
);

CREATE TABLE IF NOT EXISTS "Artikel" (
  "Id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "ArtikelNr" VARCHAR(30) NOT NULL,
  "Bezeichnung" VARCHAR(150) NOT NULL,
  "Kategorie" VARCHAR(50) NOT NULL DEFAULT 'Dienstleistung',
  "Einzelpreis" DECIMAL(12, 2) NOT NULL,
  "SteuerSatz" INT NOT NULL DEFAULT 19,
  "Einheit" VARCHAR(50) NOT NULL DEFAULT 'Std',
  "Lagerbestand" INT NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS "Angebote" (
  "Id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "AngebotsNr" VARCHAR(40) NOT NULL,
  "KundenId" INT NOT NULL,
  "Datum" DATE NOT NULL,
  "GueltigBis" DATE NOT NULL,
  "Status" VARCHAR(50) NOT NULL DEFAULT 'Versendet',
  "NettoBetrag" DECIMAL(12, 2) NOT NULL,
  "BruttoBetrag" DECIMAL(12, 2) NOT NULL,
  "Bemerkung" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "Angebotspositionen" (
  "Id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "AngebotsId" INT NOT NULL,
  "ArtikelId" INT NOT NULL,
  "Menge" DECIMAL(8, 2) NOT NULL DEFAULT 1,
  "Einzelpreis" DECIMAL(12, 2) NOT NULL,
  "RabattProzent" DECIMAL(5, 2) NOT NULL DEFAULT 0,
  "GesamtNetto" DECIMAL(12, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS "Auftraege" (
  "Id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "AuftragsNr" VARCHAR(40) NOT NULL,
  "AngebotsId" INT NOT NULL,
  "KundenId" INT NOT NULL,
  "AuftragsDatum" DATE NOT NULL,
  "LieferDatum" DATE NOT NULL,
  "Status" VARCHAR(50) NOT NULL DEFAULT 'In Bearbeitung',
  "NettoBetrag" DECIMAL(12, 2) NOT NULL,
  "BruttoBetrag" DECIMAL(12, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS "Auftragspositionen" (
  "Id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "AuftragsId" INT NOT NULL,
  "ArtikelId" INT NOT NULL,
  "Menge" DECIMAL(8, 2) NOT NULL DEFAULT 1,
  "Einzelpreis" DECIMAL(12, 2) NOT NULL,
  "GesamtNetto" DECIMAL(12, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS "Rechnungen" (
  "Id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "RechnungsNr" VARCHAR(40) NOT NULL,
  "AuftragsId" INT NOT NULL,
  "KundenId" INT NOT NULL,
  "RechnungsDatum" DATE NOT NULL,
  "FaelligDatum" DATE NOT NULL,
  "ZahlungsStatus" VARCHAR(50) NOT NULL DEFAULT 'Offen',
  "NettoBetrag" DECIMAL(12, 2) NOT NULL,
  "MwStBetrag" DECIMAL(12, 2) NOT NULL,
  "BruttoBetrag" DECIMAL(12, 2) NOT NULL,
  "OffenerBetrag" DECIMAL(12, 2) NOT NULL,
  "SkontoProzent" DECIMAL(5, 2) NOT NULL DEFAULT 2
);

CREATE TABLE IF NOT EXISTS "Rechnungspositionen" (
  "Id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "RechnungsId" INT NOT NULL,
  "ArtikelId" INT NOT NULL,
  "PositionNr" INT NOT NULL DEFAULT 1,
  "Menge" DECIMAL(8, 2) NOT NULL DEFAULT 1,
  "Einzelpreis" DECIMAL(12, 2) NOT NULL,
  "SteuerSatz" INT NOT NULL DEFAULT 19,
  "GesamtNetto" DECIMAL(12, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS "Mahnungen" (
  "Id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "MahnungsNr" VARCHAR(40) NOT NULL,
  "RechnungsId" INT NOT NULL,
  "KundenId" INT NOT NULL,
  "MahnDatum" DATE NOT NULL,
  "Mahnstufe" VARCHAR(50) NOT NULL DEFAULT 'Mahnstufe 1 (Zahlungserinnerung)',
  "Mahngebuehr" DECIMAL(8, 2) NOT NULL DEFAULT 5.00,
  "Verzugszinsen" DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
  "FaelligBis" DATE NOT NULL,
  "Status" VARCHAR(50) NOT NULL DEFAULT 'Offen'
);

CREATE TABLE IF NOT EXISTS "Gutschriften" (
  "Id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "GutschriftNr" VARCHAR(40) NOT NULL,
  "RechnungsId" INT NOT NULL,
  "KundenId" INT NOT NULL,
  "Datum" DATE NOT NULL,
  "Status" VARCHAR(50) NOT NULL DEFAULT 'Erstellt',
  "NettoBetrag" DECIMAL(12, 2) NOT NULL,
  "MwStBetrag" DECIMAL(12, 2) NOT NULL,
  "BruttoBetrag" DECIMAL(12, 2) NOT NULL,
  "Grund" VARCHAR(200) NOT NULL
);

CREATE TABLE IF NOT EXISTS "Gutschriftpositionen" (
  "Id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "GutschriftId" INT NOT NULL,
  "ArtikelId" INT NOT NULL,
  "Menge" DECIMAL(8, 2) NOT NULL DEFAULT 1,
  "Einzelpreis" DECIMAL(12, 2) NOT NULL,
  "GesamtNetto" DECIMAL(12, 2) NOT NULL
);

-- Seed Data
INSERT INTO "Kunden" ("Id", "KundenNr", "Firmenname", "Ansprechpartner", "Email", "Telefon", "Strasse", "plz", "Ort", "UStIdNr", "ZahlungszielTage", "Status") VALUES (1, 'KD-10001', 'Müller & Partner GmbH', 'Dr. Hans Müller', 'h.mueller@mueller-partner.de', '089-1234560', 'Leopoldstraße 42', '80802', 'München', 'DE123456789', 14, 'Aktiv');
INSERT INTO "Kunden" ("Id", "KundenNr", "Firmenname", "Ansprechpartner", "Email", "Telefon", "Strasse", "plz", "Ort", "UStIdNr", "ZahlungszielTage", "Status") VALUES (2, 'KD-10002', 'TechSolutions AG', 'Sandra Meyer', 's.meyer@techsolutions.de', '030-9876543', 'Alexanderplatz 1', '10178', 'Berlin', 'DE987654321', 30, 'Aktiv');
INSERT INTO "Kunden" ("Id", "KundenNr", "Firmenname", "Ansprechpartner", "Email", "Telefon", "Strasse", "plz", "Ort", "UStIdNr", "ZahlungszielTage", "Status") VALUES (3, 'KD-10003', 'InnoDesign Studio', 'Marc Weber', 'm.weber@innodesign.io', '040-5551234', 'Speicherstadt 8', '20457', 'Hamburg', 'DE555444333', 14, 'Aktiv');

INSERT INTO "Artikel" ("Id", "ArtikelNr", "Bezeichnung", "Kategorie", "Einzelpreis", "SteuerSatz", "Einheit", "Lagerbestand") VALUES (1, 'ART-0101', 'IT-Consulting & Softwareentwicklung', 'Dienstleistung', 120, 19, 'Std', 999);
INSERT INTO "Artikel" ("Id", "ArtikelNr", "Bezeichnung", "Kategorie", "Einzelpreis", "SteuerSatz", "Einheit", "Lagerbestand") VALUES (2, 'ART-0102', 'DB Studio Pro Enterprise Lizenz', 'Software', 1490, 19, 'Stk', 50);
INSERT INTO "Artikel" ("Id", "ArtikelNr", "Bezeichnung", "Kategorie", "Einzelpreis", "SteuerSatz", "Einheit", "Lagerbestand") VALUES (3, 'ART-0103', 'Monatliche Cloud-Wartung & Support', 'Wartung', 250, 19, 'Pauschal', 999);
INSERT INTO "Artikel" ("Id", "ArtikelNr", "Bezeichnung", "Kategorie", "Einzelpreis", "SteuerSatz", "Einheit", "Lagerbestand") VALUES (4, 'ART-0104', 'High-Performance Datenbank-Server', 'Hardware', 3200, 19, 'Stk', 12);

INSERT INTO "Angebote" ("Id", "AngebotsNr", "KundenId", "Datum", "GueltigBis", "Status", "NettoBetrag", "BruttoBetrag", "Bemerkung") VALUES (1, 'ANG-2026-0001', 1, '2026-01-10', '2026-02-10', 'Angenommen', 3890, 4629.1, 'Inklusive 10% Projekt-Rabatt');
INSERT INTO "Angebote" ("Id", "AngebotsNr", "KundenId", "Datum", "GueltigBis", "Status", "NettoBetrag", "BruttoBetrag", "Bemerkung") VALUES (2, 'ANG-2026-0002', 2, '2026-01-15', '2026-02-15', 'Versendet', 1490, 1773.1, 'Softwarelizenz für 5 Arbeitsplätze');

INSERT INTO "Angebotspositionen" ("Id", "AngebotsId", "ArtikelId", "Menge", "Einzelpreis", "RabattProzent", "GesamtNetto") VALUES (1, 1, 1, 20, 120, 0, 2400);
INSERT INTO "Angebotspositionen" ("Id", "AngebotsId", "ArtikelId", "Menge", "Einzelpreis", "RabattProzent", "GesamtNetto") VALUES (2, 1, 2, 1, 1490, 0, 1490);
INSERT INTO "Angebotspositionen" ("Id", "AngebotsId", "ArtikelId", "Menge", "Einzelpreis", "RabattProzent", "GesamtNetto") VALUES (3, 2, 2, 1, 1490, 0, 1490);

INSERT INTO "Auftraege" ("Id", "AuftragsNr", "AngebotsId", "KundenId", "AuftragsDatum", "LieferDatum", "Status", "NettoBetrag", "BruttoBetrag") VALUES (1, 'AUF-2026-0001', 1, 1, '2026-01-12', '2026-01-25', 'Abgeschlossen', 3890, 4629.1);
INSERT INTO "Auftraege" ("Id", "AuftragsNr", "AngebotsId", "KundenId", "AuftragsDatum", "LieferDatum", "Status", "NettoBetrag", "BruttoBetrag") VALUES (2, 'AUF-2026-0002', 2, 2, '2026-01-20', '2026-02-05', 'Geliefert', 1490, 1773.1);

INSERT INTO "Auftragspositionen" ("Id", "AuftragsId", "ArtikelId", "Menge", "Einzelpreis", "GesamtNetto") VALUES (1, 1, 1, 20, 120, 2400);
INSERT INTO "Auftragspositionen" ("Id", "AuftragsId", "ArtikelId", "Menge", "Einzelpreis", "GesamtNetto") VALUES (2, 1, 2, 1, 1490, 1490);
INSERT INTO "Auftragspositionen" ("Id", "AuftragsId", "ArtikelId", "Menge", "Einzelpreis", "GesamtNetto") VALUES (3, 2, 2, 1, 1490, 1490);

INSERT INTO "Rechnungen" ("Id", "RechnungsNr", "AuftragsId", "KundenId", "RechnungsDatum", "FaelligDatum", "ZahlungsStatus", "NettoBetrag", "MwStBetrag", "BruttoBetrag", "OffenerBetrag", "SkontoProzent") VALUES (1, 'RE-2026-0001', 1, 1, '2026-01-15', '2026-01-29', 'Bezahlt', 3890, 739.1, 4629.1, 0, 2);
INSERT INTO "Rechnungen" ("Id", "RechnungsNr", "AuftragsId", "KundenId", "RechnungsDatum", "FaelligDatum", "ZahlungsStatus", "NettoBetrag", "MwStBetrag", "BruttoBetrag", "OffenerBetrag", "SkontoProzent") VALUES (2, 'RE-2026-0002', 2, 2, '2026-02-01', '2026-02-15', 'Gemahnt', 1490, 283.1, 1773.1, 1773.1, 0);
INSERT INTO "Rechnungen" ("Id", "RechnungsNr", "AuftragsId", "KundenId", "RechnungsDatum", "FaelligDatum", "ZahlungsStatus", "NettoBetrag", "MwStBetrag", "BruttoBetrag", "OffenerBetrag", "SkontoProzent") VALUES (3, 'RE-2026-0003', NULL, 3, '2026-02-10', '2026-02-24', 'Offen', 250, 47.5, 297.5, 297.5, 2);

INSERT INTO "Rechnungspositionen" ("Id", "RechnungsId", "ArtikelId", "PositionNr", "Menge", "Einzelpreis", "SteuerSatz", "GesamtNetto") VALUES (1, 1, 1, 1, 20, 120, 19, 2400);
INSERT INTO "Rechnungspositionen" ("Id", "RechnungsId", "ArtikelId", "PositionNr", "Menge", "Einzelpreis", "SteuerSatz", "GesamtNetto") VALUES (2, 1, 2, 2, 1, 1490, 19, 1490);
INSERT INTO "Rechnungspositionen" ("Id", "RechnungsId", "ArtikelId", "PositionNr", "Menge", "Einzelpreis", "SteuerSatz", "GesamtNetto") VALUES (3, 2, 2, 1, 1, 1490, 19, 1490);
INSERT INTO "Rechnungspositionen" ("Id", "RechnungsId", "ArtikelId", "PositionNr", "Menge", "Einzelpreis", "SteuerSatz", "GesamtNetto") VALUES (4, 3, 3, 1, 1, 250, 19, 250);

INSERT INTO "Mahnungen" ("Id", "MahnungsNr", "RechnungsId", "KundenId", "MahnDatum", "Mahnstufe", "Mahngebuehr", "Verzugszinsen", "FaelligBis", "Status") VALUES (1, 'MAH-2026-0001', 2, 2, '2026-02-18', 'Mahnstufe 1 (Zahlungserinnerung)', 5, 0, '2026-02-28', 'Offen');

INSERT INTO "Gutschriften" ("Id", "GutschriftNr", "RechnungsId", "KundenId", "Datum", "Status", "NettoBetrag", "MwStBetrag", "BruttoBetrag", "Grund") VALUES (1, 'GUT-2026-0001', 1, 1, '2026-01-20', 'Verrechnet', 120, 22.8, 142.8, 'Kulanzgutschrift wegen vereinbartem Treuerabatt');

INSERT INTO "Gutschriftpositionen" ("Id", "GutschriftId", "ArtikelId", "Menge", "Einzelpreis", "GesamtNetto") VALUES (1, 1, 1, 1, 120, 120);

-- Relationships

-- Performance Indexes
CREATE INDEX "IX_Angebote_KundenId" ON "Angebote" ("KundenId");
CREATE INDEX "IX_Auftraege_KundenId" ON "Auftraege" ("KundenId");
CREATE INDEX "IX_Rechnungen_KundenId" ON "Rechnungen" ("KundenId");
CREATE INDEX "IX_Mahnungen_KundenId" ON "Mahnungen" ("KundenId");
CREATE INDEX "IX_Gutschriften_KundenId" ON "Gutschriften" ("KundenId");
CREATE INDEX "IX_Angebotspositionen_AngebotsId" ON "Angebotspositionen" ("AngebotsId");
CREATE INDEX "IX_Auftraege_AngebotsId" ON "Auftraege" ("AngebotsId");
CREATE INDEX "IX_Auftragspositionen_AuftragsId" ON "Auftragspositionen" ("AuftragsId");
CREATE INDEX "IX_Rechnungen_AuftragsId" ON "Rechnungen" ("AuftragsId");
CREATE INDEX "IX_Rechnungspositionen_RechnungsId" ON "Rechnungspositionen" ("RechnungsId");
CREATE INDEX "IX_Mahnungen_RechnungsId" ON "Mahnungen" ("RechnungsId");
CREATE INDEX "IX_Gutschriften_RechnungsId" ON "Gutschriften" ("RechnungsId");
CREATE INDEX "IX_Gutschriftpositionen_GutschriftId" ON "Gutschriftpositionen" ("GutschriftId");
CREATE INDEX "IX_Angebotspositionen_ArtikelId" ON "Angebotspositionen" ("ArtikelId");
CREATE INDEX "IX_Auftragspositionen_ArtikelId" ON "Auftragspositionen" ("ArtikelId");
CREATE INDEX "IX_Rechnungspositionen_ArtikelId" ON "Rechnungspositionen" ("ArtikelId");
CREATE INDEX "IX_Gutschriftpositionen_ArtikelId" ON "Gutschriftpositionen" ("ArtikelId");
CREATE INDEX "IX_Kunden_KundenNr" ON "Kunden" ("KundenNr");
CREATE INDEX "IX_Kunden_Firmenname" ON "Kunden" ("Firmenname");
CREATE INDEX "IX_Artikel_ArtikelNr" ON "Artikel" ("ArtikelNr");
CREATE INDEX "IX_Artikel_Bezeichnung" ON "Artikel" ("Bezeichnung");
CREATE INDEX "IX_Rechnungen_RechnungsNr" ON "Rechnungen" ("RechnungsNr");

-- Views
CREATE VIEW "OffeneRechnungenMahnstufen" AS
SELECT
  "Rechnungen_1"."RechnungsNr" AS "RechnungsNr",
  "Kunden_0"."Firmenname" AS "Firmenname",
  "Rechnungen_1"."FaelligDatum" AS "FaelligDatum",
  "Rechnungen_1"."ZahlungsStatus" AS "ZahlungsStatus",
  SUM("Rechnungen_1"."OffenerBetrag") AS "OffenerBetrag"
FROM "Kunden" AS "Kunden_0"
LEFT JOIN "Rechnungen" AS "Rechnungen_1" ON "Kunden_0"."Id" = "Rechnungen_1"."KundenId"
WHERE
  ("Rechnungen_1"."ZahlungsStatus" = 'Offen' OR "Rechnungen_1"."ZahlungsStatus" = 'Gemahnt' OR "Rechnungen_1"."ZahlungsStatus" = 'Ueberfaellig')
GROUP BY "Rechnungen_1"."RechnungsNr", "Kunden_0"."Firmenname", "Rechnungen_1"."FaelligDatum", "Rechnungen_1"."ZahlungsStatus"
HAVING
  SUM("Rechnungen_1"."OffenerBetrag") > 0
ORDER BY "Rechnungen_1"."RechnungsNr" ASC, "Kunden_0"."Firmenname" ASC, "Rechnungen_1"."FaelligDatum" ASC, "Rechnungen_1"."ZahlungsStatus" ASC, "Rechnungen_1"."OffenerBetrag" DESC;

