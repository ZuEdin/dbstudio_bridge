import { Entity, PrimaryGeneratedColumn, PrimaryColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Kunden } from './Kunden';
import { Auftraege } from './Auftraege';
import { Rechnungspositionen } from './Rechnungspositionen';
import { Mahnungen } from './Mahnungen';
import { Gutschriften } from './Gutschriften';

@Entity('rechnungen')
export class Rechnungen {

  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: 'varchar', length: 40 })
  RechnungsNr: string;

  @Column({ type: 'int' })
  AuftragsId: number;

  @Column({ type: 'int' })
  KundenId: number;

  @Column({ type: 'timestamp' })
  RechnungsDatum: Date;

  @Column({ type: 'timestamp' })
  FaelligDatum: Date;

  @Column({ type: 'varchar', length: 255, default: 'Offen' })
  ZahlungsStatus: string;

  @Column({ type: 'decimal' })
  NettoBetrag: number;

  @Column({ type: 'decimal' })
  MwStBetrag: number;

  @Column({ type: 'decimal' })
  BruttoBetrag: number;

  @Column({ type: 'decimal' })
  OffenerBetrag: number;

  @Column({ type: 'decimal', default: 2 })
  SkontoProzent: number;

  @ManyToOne(() => Kunden, parent => parent.rechnungens)
  @JoinColumn({ name: 'KundenId', referencedColumnName: 'Id' })
  kunden: Kunden;

  @ManyToOne(() => Auftraege, parent => parent.rechnungens)
  @JoinColumn({ name: 'AuftragsId', referencedColumnName: 'Id' })
  auftraege: Auftraege;

  @OneToMany(() => Rechnungspositionen, child => child.rechnungen)
  rechnungspositionens: Rechnungspositionen[];

  @OneToMany(() => Mahnungen, child => child.rechnungen)
  mahnungens: Mahnungen[];

  @OneToMany(() => Gutschriften, child => child.rechnungen)
  gutschriftens: Gutschriften[];

}
