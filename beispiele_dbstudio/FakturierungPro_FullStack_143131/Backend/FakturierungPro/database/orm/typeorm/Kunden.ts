import { Entity, PrimaryGeneratedColumn, PrimaryColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Angebote } from './Angebote';
import { Auftraege } from './Auftraege';
import { Rechnungen } from './Rechnungen';
import { Mahnungen } from './Mahnungen';
import { Gutschriften } from './Gutschriften';

@Entity('kunden')
export class Kunden {

  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: 'varchar', length: 30 })
  KundenNr: string;

  @Column({ type: 'varchar', length: 150 })
  Firmenname: string;

  @Column({ type: 'varchar', length: 100 })
  Ansprechpartner: string;

  @Column({ type: 'varchar', length: 100 })
  Email: string;

  @Column({ type: 'varchar', length: 50 })
  Telefon: string;

  @Column({ type: 'varchar', length: 120 })
  Strasse: string;

  @Column({ type: 'varchar', length: 20 })
  plz: string;

  @Column({ type: 'varchar', length: 100 })
  Ort: string;

  @Column({ type: 'varchar', length: 50 })
  UStIdNr: string;

  @Column({ type: 'int', default: 14 })
  ZahlungszielTage: number;

  @Column({ type: 'varchar', length: 255, default: 'Aktiv' })
  Status: string;

  @OneToMany(() => Angebote, child => child.kunden)
  angebotes: Angebote[];

  @OneToMany(() => Auftraege, child => child.kunden)
  auftraeges: Auftraege[];

  @OneToMany(() => Rechnungen, child => child.kunden)
  rechnungens: Rechnungen[];

  @OneToMany(() => Mahnungen, child => child.kunden)
  mahnungens: Mahnungen[];

  @OneToMany(() => Gutschriften, child => child.kunden)
  gutschriftens: Gutschriften[];

}
