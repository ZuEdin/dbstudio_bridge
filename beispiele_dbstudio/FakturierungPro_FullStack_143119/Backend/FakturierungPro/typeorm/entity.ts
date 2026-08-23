import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";

@Entity("Kunden")
export class Kunden {
    @PrimaryGeneratedColumn()
    Id!: number;

    @Column({ type: "varchar", nullable: undefined })
    KundenNr!: string;

    @Column({ type: "varchar", nullable: undefined })
    Firmenname!: string;

    @Column({ type: "varchar", nullable: undefined })
    Ansprechpartner!: string;

    @Column({ type: "varchar", nullable: undefined })
    Email!: string;

    @Column({ type: "varchar", nullable: undefined })
    Telefon!: string;

    @Column({ type: "varchar", nullable: undefined })
    Strasse!: string;

    @Column({ type: "varchar", nullable: undefined })
    plz!: string;

    @Column({ type: "varchar", nullable: undefined })
    Ort!: string;

    @Column({ type: "varchar", nullable: undefined })
    UStIdNr!: string;

    @Column({ type: "int", nullable: undefined })
    ZahlungszielTage!: number;

    @Column({ type: "varchar", nullable: undefined })
    Status!: string;

    @ManyToOne(() => Angebote, angebote => angebote.kundens)
    @JoinColumn({ name: "Id" })
    angebote: Angebote;

    @ManyToOne(() => Auftraege, auftraege => auftraege.kundens)
    @JoinColumn({ name: "Id" })
    auftraege: Auftraege;

    @ManyToOne(() => Rechnungen, rechnungen => rechnungen.kundens)
    @JoinColumn({ name: "Id" })
    rechnungen: Rechnungen;

    @ManyToOne(() => Mahnungen, mahnungen => mahnungen.kundens)
    @JoinColumn({ name: "Id" })
    mahnungen: Mahnungen;

    @ManyToOne(() => Gutschriften, gutschriften => gutschriften.kundens)
    @JoinColumn({ name: "Id" })
    gutschriften: Gutschriften;

}

@Entity("Artikel")
export class Artikel {
    @PrimaryGeneratedColumn()
    Id!: number;

    @Column({ type: "varchar", nullable: undefined })
    ArtikelNr!: string;

    @Column({ type: "varchar", nullable: undefined })
    Bezeichnung!: string;

    @Column({ type: "varchar", nullable: undefined })
    Kategorie!: string;

    @Column({ type: "decimal", nullable: undefined })
    Einzelpreis!: number;

    @Column({ type: "int", nullable: undefined })
    SteuerSatz!: number;

    @Column({ type: "varchar", nullable: undefined })
    Einheit!: string;

    @Column({ type: "int", nullable: undefined })
    Lagerbestand!: number;

    @ManyToOne(() => Angebotspositionen, angebotspositionen => angebotspositionen.artikels)
    @JoinColumn({ name: "Id" })
    angebotspositionen: Angebotspositionen;

    @ManyToOne(() => Auftragspositionen, auftragspositionen => auftragspositionen.artikels)
    @JoinColumn({ name: "Id" })
    auftragspositionen: Auftragspositionen;

    @ManyToOne(() => Rechnungspositionen, rechnungspositionen => rechnungspositionen.artikels)
    @JoinColumn({ name: "Id" })
    rechnungspositionen: Rechnungspositionen;

    @ManyToOne(() => Gutschriftpositionen, gutschriftpositionen => gutschriftpositionen.artikels)
    @JoinColumn({ name: "Id" })
    gutschriftpositionen: Gutschriftpositionen;

}

@Entity("Angebote")
export class Angebote {
    @PrimaryGeneratedColumn()
    Id!: number;

    @Column({ type: "varchar", nullable: undefined })
    AngebotsNr!: string;

    @Column({ type: "int", nullable: undefined })
    KundenId!: number;

    @Column({ type: "timestamp", nullable: undefined })
    Datum!: Date;

    @Column({ type: "timestamp", nullable: undefined })
    GueltigBis!: Date;

    @Column({ type: "varchar", nullable: undefined })
    Status!: string;

    @Column({ type: "decimal", nullable: undefined })
    NettoBetrag!: number;

    @Column({ type: "decimal", nullable: undefined })
    BruttoBetrag!: number;

    @Column({ type: "varchar", nullable: undefined })
    Bemerkung!: string;

    @ManyToOne(() => Angebotspositionen, angebotspositionen => angebotspositionen.angebotes)
    @JoinColumn({ name: "Id" })
    angebotspositionen: Angebotspositionen;

    @ManyToOne(() => Auftraege, auftraege => auftraege.angebotes)
    @JoinColumn({ name: "Id" })
    auftraege: Auftraege;

    @OneToMany(() => Kunden, kunden => kunden.angebote)
    kundens: Kunden[];

}

@Entity("Angebotspositionen")
export class Angebotspositionen {
    @PrimaryGeneratedColumn()
    Id!: number;

    @Column({ type: "int", nullable: undefined })
    AngebotsId!: number;

    @Column({ type: "int", nullable: undefined })
    ArtikelId!: number;

    @Column({ type: "decimal", nullable: undefined })
    Menge!: number;

    @Column({ type: "decimal", nullable: undefined })
    Einzelpreis!: number;

    @Column({ type: "decimal", nullable: undefined })
    RabattProzent!: number;

    @Column({ type: "decimal", nullable: undefined })
    GesamtNetto!: number;

    @OneToMany(() => Angebote, angebote => angebote.angebotspositionen)
    angebotes: Angebote[];

    @OneToMany(() => Artikel, artikel => artikel.angebotspositionen)
    artikels: Artikel[];

}

@Entity("Auftraege")
export class Auftraege {
    @PrimaryGeneratedColumn()
    Id!: number;

    @Column({ type: "varchar", nullable: undefined })
    AuftragsNr!: string;

    @Column({ type: "int", nullable: undefined })
    AngebotsId!: number;

    @Column({ type: "int", nullable: undefined })
    KundenId!: number;

    @Column({ type: "timestamp", nullable: undefined })
    AuftragsDatum!: Date;

    @Column({ type: "timestamp", nullable: undefined })
    LieferDatum!: Date;

    @Column({ type: "varchar", nullable: undefined })
    Status!: string;

    @Column({ type: "decimal", nullable: undefined })
    NettoBetrag!: number;

    @Column({ type: "decimal", nullable: undefined })
    BruttoBetrag!: number;

    @ManyToOne(() => Auftragspositionen, auftragspositionen => auftragspositionen.auftraeges)
    @JoinColumn({ name: "Id" })
    auftragspositionen: Auftragspositionen;

    @ManyToOne(() => Rechnungen, rechnungen => rechnungen.auftraeges)
    @JoinColumn({ name: "Id" })
    rechnungen: Rechnungen;

    @OneToMany(() => Kunden, kunden => kunden.auftraege)
    kundens: Kunden[];

    @OneToMany(() => Angebote, angebote => angebote.auftraege)
    angebotes: Angebote[];

}

@Entity("Auftragspositionen")
export class Auftragspositionen {
    @PrimaryGeneratedColumn()
    Id!: number;

    @Column({ type: "int", nullable: undefined })
    AuftragsId!: number;

    @Column({ type: "int", nullable: undefined })
    ArtikelId!: number;

    @Column({ type: "decimal", nullable: undefined })
    Menge!: number;

    @Column({ type: "decimal", nullable: undefined })
    Einzelpreis!: number;

    @Column({ type: "decimal", nullable: undefined })
    GesamtNetto!: number;

    @OneToMany(() => Auftraege, auftraege => auftraege.auftragspositionen)
    auftraeges: Auftraege[];

    @OneToMany(() => Artikel, artikel => artikel.auftragspositionen)
    artikels: Artikel[];

}

@Entity("Rechnungen")
export class Rechnungen {
    @PrimaryGeneratedColumn()
    Id!: number;

    @Column({ type: "varchar", nullable: undefined })
    RechnungsNr!: string;

    @Column({ type: "int", nullable: undefined })
    AuftragsId!: number;

    @Column({ type: "int", nullable: undefined })
    KundenId!: number;

    @Column({ type: "timestamp", nullable: undefined })
    RechnungsDatum!: Date;

    @Column({ type: "timestamp", nullable: undefined })
    FaelligDatum!: Date;

    @Column({ type: "varchar", nullable: undefined })
    ZahlungsStatus!: string;

    @Column({ type: "decimal", nullable: undefined })
    NettoBetrag!: number;

    @Column({ type: "decimal", nullable: undefined })
    MwStBetrag!: number;

    @Column({ type: "decimal", nullable: undefined })
    BruttoBetrag!: number;

    @Column({ type: "decimal", nullable: undefined })
    OffenerBetrag!: number;

    @Column({ type: "decimal", nullable: undefined })
    SkontoProzent!: number;

    @ManyToOne(() => Rechnungspositionen, rechnungspositionen => rechnungspositionen.rechnungens)
    @JoinColumn({ name: "Id" })
    rechnungspositionen: Rechnungspositionen;

    @ManyToOne(() => Mahnungen, mahnungen => mahnungen.rechnungens)
    @JoinColumn({ name: "Id" })
    mahnungen: Mahnungen;

    @ManyToOne(() => Gutschriften, gutschriften => gutschriften.rechnungens)
    @JoinColumn({ name: "Id" })
    gutschriften: Gutschriften;

    @OneToMany(() => Kunden, kunden => kunden.rechnungen)
    kundens: Kunden[];

    @OneToMany(() => Auftraege, auftraege => auftraege.rechnungen)
    auftraeges: Auftraege[];

}

@Entity("Rechnungspositionen")
export class Rechnungspositionen {
    @PrimaryGeneratedColumn()
    Id!: number;

    @Column({ type: "int", nullable: undefined })
    RechnungsId!: number;

    @Column({ type: "int", nullable: undefined })
    ArtikelId!: number;

    @Column({ type: "int", nullable: undefined })
    PositionNr!: number;

    @Column({ type: "decimal", nullable: undefined })
    Menge!: number;

    @Column({ type: "decimal", nullable: undefined })
    Einzelpreis!: number;

    @Column({ type: "int", nullable: undefined })
    SteuerSatz!: number;

    @Column({ type: "decimal", nullable: undefined })
    GesamtNetto!: number;

    @OneToMany(() => Rechnungen, rechnungen => rechnungen.rechnungspositionen)
    rechnungens: Rechnungen[];

    @OneToMany(() => Artikel, artikel => artikel.rechnungspositionen)
    artikels: Artikel[];

}

@Entity("Mahnungen")
export class Mahnungen {
    @PrimaryGeneratedColumn()
    Id!: number;

    @Column({ type: "varchar", nullable: undefined })
    MahnungsNr!: string;

    @Column({ type: "int", nullable: undefined })
    RechnungsId!: number;

    @Column({ type: "int", nullable: undefined })
    KundenId!: number;

    @Column({ type: "timestamp", nullable: undefined })
    MahnDatum!: Date;

    @Column({ type: "varchar", nullable: undefined })
    Mahnstufe!: string;

    @Column({ type: "decimal", nullable: undefined })
    Mahngebuehr!: number;

    @Column({ type: "decimal", nullable: undefined })
    Verzugszinsen!: number;

    @Column({ type: "timestamp", nullable: undefined })
    FaelligBis!: Date;

    @Column({ type: "varchar", nullable: undefined })
    Status!: string;

    @OneToMany(() => Kunden, kunden => kunden.mahnungen)
    kundens: Kunden[];

    @OneToMany(() => Rechnungen, rechnungen => rechnungen.mahnungen)
    rechnungens: Rechnungen[];

}

@Entity("Gutschriften")
export class Gutschriften {
    @PrimaryGeneratedColumn()
    Id!: number;

    @Column({ type: "varchar", nullable: undefined })
    GutschriftNr!: string;

    @Column({ type: "int", nullable: undefined })
    RechnungsId!: number;

    @Column({ type: "int", nullable: undefined })
    KundenId!: number;

    @Column({ type: "timestamp", nullable: undefined })
    Datum!: Date;

    @Column({ type: "varchar", nullable: undefined })
    Status!: string;

    @Column({ type: "decimal", nullable: undefined })
    NettoBetrag!: number;

    @Column({ type: "decimal", nullable: undefined })
    MwStBetrag!: number;

    @Column({ type: "decimal", nullable: undefined })
    BruttoBetrag!: number;

    @Column({ type: "varchar", nullable: undefined })
    Grund!: string;

    @ManyToOne(() => Gutschriftpositionen, gutschriftpositionen => gutschriftpositionen.gutschriftens)
    @JoinColumn({ name: "Id" })
    gutschriftpositionen: Gutschriftpositionen;

    @OneToMany(() => Kunden, kunden => kunden.gutschriften)
    kundens: Kunden[];

    @OneToMany(() => Rechnungen, rechnungen => rechnungen.gutschriften)
    rechnungens: Rechnungen[];

}

@Entity("Gutschriftpositionen")
export class Gutschriftpositionen {
    @PrimaryGeneratedColumn()
    Id!: number;

    @Column({ type: "int", nullable: undefined })
    GutschriftId!: number;

    @Column({ type: "int", nullable: undefined })
    ArtikelId!: number;

    @Column({ type: "decimal", nullable: undefined })
    Menge!: number;

    @Column({ type: "decimal", nullable: undefined })
    Einzelpreis!: number;

    @Column({ type: "decimal", nullable: undefined })
    GesamtNetto!: number;

    @OneToMany(() => Gutschriften, gutschriften => gutschriften.gutschriftpositionen)
    gutschriftens: Gutschriften[];

    @OneToMany(() => Artikel, artikel => artikel.gutschriftpositionen)
    artikels: Artikel[];

}

