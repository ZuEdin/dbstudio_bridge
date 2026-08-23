const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({ dialect: 'sqlite', storage: 'app.db' });
const db = {};

db.Kunden = sequelize.define('Kunden', {
    id: {
        type: DataTypes.INTEGER,
        field: 'Id',
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    kundenNr: {
        type: DataTypes.STRING(30),
        field: 'KundenNr'
    },
    firmenname: {
        type: DataTypes.STRING(150),
        field: 'Firmenname'
    },
    ansprechpartner: {
        type: DataTypes.STRING(100),
        field: 'Ansprechpartner'
    },
    email: {
        type: DataTypes.STRING(100),
        field: 'Email'
    },
    telefon: {
        type: DataTypes.STRING(50),
        field: 'Telefon'
    },
    strasse: {
        type: DataTypes.STRING(120),
        field: 'Strasse'
    },
    plz: {
        type: DataTypes.STRING(20),
        field: 'plz'
    },
    ort: {
        type: DataTypes.STRING(100),
        field: 'Ort'
    },
    uStIdNr: {
        type: DataTypes.STRING(50),
        field: 'UStIdNr'
    },
    zahlungszielTage: {
        type: DataTypes.INTEGER,
        field: 'ZahlungszielTage',
        defaultValue: 14
    },
    status: {
        type: DataTypes.ENUM('Aktiv', 'Interessent', 'Gesperrt'),
        field: 'Status',
        defaultValue: 'Aktiv'
    }
});

db.Artikel = sequelize.define('Artikel', {
    id: {
        type: DataTypes.INTEGER,
        field: 'Id',
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    artikelNr: {
        type: DataTypes.STRING(30),
        field: 'ArtikelNr'
    },
    bezeichnung: {
        type: DataTypes.STRING(150),
        field: 'Bezeichnung'
    },
    kategorie: {
        type: DataTypes.ENUM('Dienstleistung', 'Software', 'Hardware', 'Wartung'),
        field: 'Kategorie',
        defaultValue: 'Dienstleistung'
    },
    einzelpreis: {
        type: DataTypes.DECIMAL(12, 2),
        field: 'Einzelpreis'
    },
    steuerSatz: {
        type: DataTypes.INTEGER,
        field: 'SteuerSatz',
        defaultValue: 19
    },
    einheit: {
        type: DataTypes.ENUM('Stk', 'Std', 'Pauschal', 'Tag'),
        field: 'Einheit',
        defaultValue: 'Std'
    },
    lagerbestand: {
        type: DataTypes.INTEGER,
        field: 'Lagerbestand',
        defaultValue: 100
    }
});

db.Angebote = sequelize.define('Angebote', {
    id: {
        type: DataTypes.INTEGER,
        field: 'Id',
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    angebotsNr: {
        type: DataTypes.STRING(40),
        field: 'AngebotsNr'
    },
    kundenId: {
        type: DataTypes.INTEGER,
        field: 'KundenId'
    },
    datum: {
        type: DataTypes.DATEONLY,
        field: 'Datum'
    },
    gueltigBis: {
        type: DataTypes.DATEONLY,
        field: 'GueltigBis'
    },
    status: {
        type: DataTypes.ENUM('Entwurf', 'Versendet', 'Angenommen', 'Abgelehnt'),
        field: 'Status',
        defaultValue: 'Versendet'
    },
    nettoBetrag: {
        type: DataTypes.DECIMAL(12, 2),
        field: 'NettoBetrag'
    },
    bruttoBetrag: {
        type: DataTypes.DECIMAL(12, 2),
        field: 'BruttoBetrag'
    },
    bemerkung: {
        type: DataTypes.TEXT,
        field: 'Bemerkung'
    }
});

db.Angebotspositionen = sequelize.define('Angebotspositionen', {
    id: {
        type: DataTypes.INTEGER,
        field: 'Id',
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    angebotsId: {
        type: DataTypes.INTEGER,
        field: 'AngebotsId'
    },
    artikelId: {
        type: DataTypes.INTEGER,
        field: 'ArtikelId'
    },
    menge: {
        type: DataTypes.DECIMAL(8, 2),
        field: 'Menge',
        defaultValue: 1
    },
    einzelpreis: {
        type: DataTypes.DECIMAL(12, 2),
        field: 'Einzelpreis'
    },
    rabattProzent: {
        type: DataTypes.DECIMAL(5, 2),
        field: 'RabattProzent',
        defaultValue: 0
    },
    gesamtNetto: {
        type: DataTypes.DECIMAL(12, 2),
        field: 'GesamtNetto'
    }
});

db.Auftraege = sequelize.define('Auftraege', {
    id: {
        type: DataTypes.INTEGER,
        field: 'Id',
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    auftragsNr: {
        type: DataTypes.STRING(40),
        field: 'AuftragsNr'
    },
    angebotsId: {
        type: DataTypes.INTEGER,
        field: 'AngebotsId'
    },
    kundenId: {
        type: DataTypes.INTEGER,
        field: 'KundenId'
    },
    auftragsDatum: {
        type: DataTypes.DATEONLY,
        field: 'AuftragsDatum'
    },
    lieferDatum: {
        type: DataTypes.DATEONLY,
        field: 'LieferDatum'
    },
    status: {
        type: DataTypes.ENUM('In Bearbeitung', 'Geliefert', 'Abgeschlossen', 'Storniert'),
        field: 'Status',
        defaultValue: 'In Bearbeitung'
    },
    nettoBetrag: {
        type: DataTypes.DECIMAL(12, 2),
        field: 'NettoBetrag'
    },
    bruttoBetrag: {
        type: DataTypes.DECIMAL(12, 2),
        field: 'BruttoBetrag'
    }
});

db.Auftragspositionen = sequelize.define('Auftragspositionen', {
    id: {
        type: DataTypes.INTEGER,
        field: 'Id',
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    auftragsId: {
        type: DataTypes.INTEGER,
        field: 'AuftragsId'
    },
    artikelId: {
        type: DataTypes.INTEGER,
        field: 'ArtikelId'
    },
    menge: {
        type: DataTypes.DECIMAL(8, 2),
        field: 'Menge',
        defaultValue: 1
    },
    einzelpreis: {
        type: DataTypes.DECIMAL(12, 2),
        field: 'Einzelpreis'
    },
    gesamtNetto: {
        type: DataTypes.DECIMAL(12, 2),
        field: 'GesamtNetto'
    }
});

db.Rechnungen = sequelize.define('Rechnungen', {
    id: {
        type: DataTypes.INTEGER,
        field: 'Id',
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    rechnungsNr: {
        type: DataTypes.STRING(40),
        field: 'RechnungsNr'
    },
    auftragsId: {
        type: DataTypes.INTEGER,
        field: 'AuftragsId'
    },
    kundenId: {
        type: DataTypes.INTEGER,
        field: 'KundenId'
    },
    rechnungsDatum: {
        type: DataTypes.DATEONLY,
        field: 'RechnungsDatum'
    },
    faelligDatum: {
        type: DataTypes.DATEONLY,
        field: 'FaelligDatum'
    },
    zahlungsStatus: {
        type: DataTypes.ENUM('Offen', 'Bezahlt', 'Ueberfaellig', 'Gemahnt', 'Teilbezahlt'),
        field: 'ZahlungsStatus',
        defaultValue: 'Offen'
    },
    nettoBetrag: {
        type: DataTypes.DECIMAL(12, 2),
        field: 'NettoBetrag'
    },
    mwStBetrag: {
        type: DataTypes.DECIMAL(12, 2),
        field: 'MwStBetrag'
    },
    bruttoBetrag: {
        type: DataTypes.DECIMAL(12, 2),
        field: 'BruttoBetrag'
    },
    offenerBetrag: {
        type: DataTypes.DECIMAL(12, 2),
        field: 'OffenerBetrag'
    },
    skontoProzent: {
        type: DataTypes.DECIMAL(5, 2),
        field: 'SkontoProzent',
        defaultValue: 2
    }
});

db.Rechnungspositionen = sequelize.define('Rechnungspositionen', {
    id: {
        type: DataTypes.INTEGER,
        field: 'Id',
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    rechnungsId: {
        type: DataTypes.INTEGER,
        field: 'RechnungsId'
    },
    artikelId: {
        type: DataTypes.INTEGER,
        field: 'ArtikelId'
    },
    positionNr: {
        type: DataTypes.INTEGER,
        field: 'PositionNr',
        defaultValue: 1
    },
    menge: {
        type: DataTypes.DECIMAL(8, 2),
        field: 'Menge',
        defaultValue: 1
    },
    einzelpreis: {
        type: DataTypes.DECIMAL(12, 2),
        field: 'Einzelpreis'
    },
    steuerSatz: {
        type: DataTypes.INTEGER,
        field: 'SteuerSatz',
        defaultValue: 19
    },
    gesamtNetto: {
        type: DataTypes.DECIMAL(12, 2),
        field: 'GesamtNetto'
    }
});

db.Mahnungen = sequelize.define('Mahnungen', {
    id: {
        type: DataTypes.INTEGER,
        field: 'Id',
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    mahnungsNr: {
        type: DataTypes.STRING(40),
        field: 'MahnungsNr'
    },
    rechnungsId: {
        type: DataTypes.INTEGER,
        field: 'RechnungsId'
    },
    kundenId: {
        type: DataTypes.INTEGER,
        field: 'KundenId'
    },
    mahnDatum: {
        type: DataTypes.DATEONLY,
        field: 'MahnDatum'
    },
    mahnstufe: {
        type: DataTypes.ENUM('Mahnstufe 1 (Zahlungserinnerung)', 'Mahnstufe 2 (Aufforderung)', 'Mahnstufe 3 (Letzte Mahnung)', 'Inkasso'),
        field: 'Mahnstufe',
        defaultValue: 'Mahnstufe 1 (Zahlungserinnerung)'
    },
    mahngebuehr: {
        type: DataTypes.DECIMAL(8, 2),
        field: 'Mahngebuehr',
        defaultValue: 5.00
    },
    verzugszinsen: {
        type: DataTypes.DECIMAL(8, 2),
        field: 'Verzugszinsen',
        defaultValue: 0.00
    },
    faelligBis: {
        type: DataTypes.DATEONLY,
        field: 'FaelligBis'
    },
    status: {
        type: DataTypes.ENUM('Offen', 'Bezahlt', 'Storniert'),
        field: 'Status',
        defaultValue: 'Offen'
    }
});

db.Gutschriften = sequelize.define('Gutschriften', {
    id: {
        type: DataTypes.INTEGER,
        field: 'Id',
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    gutschriftNr: {
        type: DataTypes.STRING(40),
        field: 'GutschriftNr'
    },
    rechnungsId: {
        type: DataTypes.INTEGER,
        field: 'RechnungsId'
    },
    kundenId: {
        type: DataTypes.INTEGER,
        field: 'KundenId'
    },
    datum: {
        type: DataTypes.DATEONLY,
        field: 'Datum'
    },
    status: {
        type: DataTypes.ENUM('Entwurf', 'Erstellt', 'Verrechnet', 'Ausgezahlt'),
        field: 'Status',
        defaultValue: 'Erstellt'
    },
    nettoBetrag: {
        type: DataTypes.DECIMAL(12, 2),
        field: 'NettoBetrag'
    },
    mwStBetrag: {
        type: DataTypes.DECIMAL(12, 2),
        field: 'MwStBetrag'
    },
    bruttoBetrag: {
        type: DataTypes.DECIMAL(12, 2),
        field: 'BruttoBetrag'
    },
    grund: {
        type: DataTypes.STRING(200),
        field: 'Grund'
    }
});

db.Gutschriftpositionen = sequelize.define('Gutschriftpositionen', {
    id: {
        type: DataTypes.INTEGER,
        field: 'Id',
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    gutschriftId: {
        type: DataTypes.INTEGER,
        field: 'GutschriftId'
    },
    artikelId: {
        type: DataTypes.INTEGER,
        field: 'ArtikelId'
    },
    menge: {
        type: DataTypes.DECIMAL(8, 2),
        field: 'Menge',
        defaultValue: 1
    },
    einzelpreis: {
        type: DataTypes.DECIMAL(12, 2),
        field: 'Einzelpreis'
    },
    gesamtNetto: {
        type: DataTypes.DECIMAL(12, 2),
        field: 'GesamtNetto'
    }
});

// Relationships
db.Kunden.hasMany(db.Angebote, { foreignKey: 'kundenId' });
db.Angebote.belongsTo(db.Kunden, { foreignKey: 'kundenId' });
db.Kunden.hasMany(db.Auftraege, { foreignKey: 'kundenId' });
db.Auftraege.belongsTo(db.Kunden, { foreignKey: 'kundenId' });
db.Kunden.hasMany(db.Rechnungen, { foreignKey: 'kundenId' });
db.Rechnungen.belongsTo(db.Kunden, { foreignKey: 'kundenId' });
db.Kunden.hasMany(db.Mahnungen, { foreignKey: 'kundenId' });
db.Mahnungen.belongsTo(db.Kunden, { foreignKey: 'kundenId' });
db.Kunden.hasMany(db.Gutschriften, { foreignKey: 'kundenId' });
db.Gutschriften.belongsTo(db.Kunden, { foreignKey: 'kundenId' });
db.Angebote.hasMany(db.Angebotspositionen, { foreignKey: 'angebotsId', onDelete: 'CASCADE' });
db.Angebotspositionen.belongsTo(db.Angebote, { foreignKey: 'angebotsId', onDelete: 'CASCADE' });
db.Angebote.hasMany(db.Auftraege, { foreignKey: 'angebotsId' });
db.Auftraege.belongsTo(db.Angebote, { foreignKey: 'angebotsId' });
db.Auftraege.hasMany(db.Auftragspositionen, { foreignKey: 'auftragsId', onDelete: 'CASCADE' });
db.Auftragspositionen.belongsTo(db.Auftraege, { foreignKey: 'auftragsId', onDelete: 'CASCADE' });
db.Auftraege.hasMany(db.Rechnungen, { foreignKey: 'auftragsId' });
db.Rechnungen.belongsTo(db.Auftraege, { foreignKey: 'auftragsId' });
db.Rechnungen.hasMany(db.Rechnungspositionen, { foreignKey: 'rechnungsId', onDelete: 'CASCADE' });
db.Rechnungspositionen.belongsTo(db.Rechnungen, { foreignKey: 'rechnungsId', onDelete: 'CASCADE' });
db.Rechnungen.hasMany(db.Mahnungen, { foreignKey: 'rechnungsId', onDelete: 'CASCADE' });
db.Mahnungen.belongsTo(db.Rechnungen, { foreignKey: 'rechnungsId', onDelete: 'CASCADE' });
db.Rechnungen.hasMany(db.Gutschriften, { foreignKey: 'rechnungsId' });
db.Gutschriften.belongsTo(db.Rechnungen, { foreignKey: 'rechnungsId' });
db.Gutschriften.hasMany(db.Gutschriftpositionen, { foreignKey: 'gutschriftId', onDelete: 'CASCADE' });
db.Gutschriftpositionen.belongsTo(db.Gutschriften, { foreignKey: 'gutschriftId', onDelete: 'CASCADE' });
db.Artikel.hasMany(db.Angebotspositionen, { foreignKey: 'artikelId' });
db.Angebotspositionen.belongsTo(db.Artikel, { foreignKey: 'artikelId' });
db.Artikel.hasMany(db.Auftragspositionen, { foreignKey: 'artikelId' });
db.Auftragspositionen.belongsTo(db.Artikel, { foreignKey: 'artikelId' });
db.Artikel.hasMany(db.Rechnungspositionen, { foreignKey: 'artikelId' });
db.Rechnungspositionen.belongsTo(db.Artikel, { foreignKey: 'artikelId' });
db.Artikel.hasMany(db.Gutschriftpositionen, { foreignKey: 'artikelId' });
db.Gutschriftpositionen.belongsTo(db.Artikel, { foreignKey: 'artikelId' });

db.Sequelize = Sequelize;
db.sequelize = sequelize;
module.exports = db;