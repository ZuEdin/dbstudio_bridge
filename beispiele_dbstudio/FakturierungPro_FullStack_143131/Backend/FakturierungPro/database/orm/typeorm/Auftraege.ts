import { Entity, PrimaryGeneratedColumn, PrimaryColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Kunden } from './Kunden';
import { Angebote } from './Angebote';
import { Auftragspositionen } from './Auftragspositionen';
import { Rechnungen } from './Rechnungen';

@Entity('auftraege')
export class Auftraege {

  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: 'varchar', length: 40 })
  AuftragsNr: string;

  @Column({ type: 'int' })
  AngebotsId: number;

  @Column({ type: 'int' })
  KundenId: number;

  @Column({ type: 'timestamp' })
  AuftragsDatum: Date;

  @Column({ type: 'timestamp' })
  LieferDatum: Date;

  @Column({ type: 'varchar', length: 255, default: 'In Bearbeitung' })
  Status: string;

  @Column({ type: 'decimal' })
  NettoBetrag: number;

  @Column({ type: 'decimal' })
  BruttoBetrag: number;

  @ManyToOne(() => Kunden, parent => parent.auftraeges)
  @JoinColumn({ name: 'KundenId', referencedColumnName: 'Id' })
  kunden: Kunden;

  @ManyToOne(() => Angebote, parent => parent.auftraeges)
  @JoinColumn({ name: 'AngebotsId', referencedColumnName: 'Id' })
  angebote: Angebote;

  @OneToMany(() => Auftragspositionen, child => child.auftraege)
  auftragspositionens: Auftragspositionen[];

  @OneToMany(() => Rechnungen, child => child.auftraege)
  rechnungens: Rechnungen[];

}
