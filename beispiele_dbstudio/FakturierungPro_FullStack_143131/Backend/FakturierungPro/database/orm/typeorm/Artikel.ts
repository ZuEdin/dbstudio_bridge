import { Entity, PrimaryGeneratedColumn, PrimaryColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Angebotspositionen } from './Angebotspositionen';
import { Auftragspositionen } from './Auftragspositionen';
import { Rechnungspositionen } from './Rechnungspositionen';
import { Gutschriftpositionen } from './Gutschriftpositionen';

@Entity('artikel')
export class Artikel {

  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: 'varchar', length: 30 })
  ArtikelNr: string;

  @Column({ type: 'varchar', length: 150 })
  Bezeichnung: string;

  @Column({ type: 'varchar', length: 255, default: 'Dienstleistung' })
  Kategorie: string;

  @Column({ type: 'decimal' })
  Einzelpreis: number;

  @Column({ type: 'int', default: 19 })
  SteuerSatz: number;

  @Column({ type: 'varchar', length: 255, default: 'Std' })
  Einheit: string;

  @Column({ type: 'int', default: 100 })
  Lagerbestand: number;

  @OneToMany(() => Angebotspositionen, child => child.artikel)
  angebotspositionens: Angebotspositionen[];

  @OneToMany(() => Auftragspositionen, child => child.artikel)
  auftragspositionens: Auftragspositionen[];

  @OneToMany(() => Rechnungspositionen, child => child.artikel)
  rechnungspositionens: Rechnungspositionen[];

  @OneToMany(() => Gutschriftpositionen, child => child.artikel)
  gutschriftpositionens: Gutschriftpositionen[];

}
