import { Entity, PrimaryGeneratedColumn, PrimaryColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Kunden } from './Kunden';
import { Angebotspositionen } from './Angebotspositionen';
import { Auftraege } from './Auftraege';

@Entity('angebote')
export class Angebote {

  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: 'varchar', length: 40 })
  AngebotsNr: string;

  @Column({ type: 'int' })
  KundenId: number;

  @Column({ type: 'timestamp' })
  Datum: Date;

  @Column({ type: 'timestamp' })
  GueltigBis: Date;

  @Column({ type: 'varchar', length: 255, default: 'Versendet' })
  Status: string;

  @Column({ type: 'decimal' })
  NettoBetrag: number;

  @Column({ type: 'decimal' })
  BruttoBetrag: number;

  @Column({ type: 'varchar', length: 255 })
  Bemerkung: string;

  @ManyToOne(() => Kunden, parent => parent.angebotes)
  @JoinColumn({ name: 'KundenId', referencedColumnName: 'Id' })
  kunden: Kunden;

  @OneToMany(() => Angebotspositionen, child => child.angebote)
  angebotspositionens: Angebotspositionen[];

  @OneToMany(() => Auftraege, child => child.angebote)
  auftraeges: Auftraege[];

}
