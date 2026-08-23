import { Entity, PrimaryGeneratedColumn, PrimaryColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Kunden } from './Kunden';
import { Rechnungen } from './Rechnungen';
import { Gutschriftpositionen } from './Gutschriftpositionen';

@Entity('gutschriften')
export class Gutschriften {

  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: 'varchar', length: 40 })
  GutschriftNr: string;

  @Column({ type: 'int' })
  RechnungsId: number;

  @Column({ type: 'int' })
  KundenId: number;

  @Column({ type: 'timestamp' })
  Datum: Date;

  @Column({ type: 'varchar', length: 255, default: 'Erstellt' })
  Status: string;

  @Column({ type: 'decimal' })
  NettoBetrag: number;

  @Column({ type: 'decimal' })
  MwStBetrag: number;

  @Column({ type: 'decimal' })
  BruttoBetrag: number;

  @Column({ type: 'varchar', length: 200 })
  Grund: string;

  @ManyToOne(() => Kunden, parent => parent.gutschriftens)
  @JoinColumn({ name: 'KundenId', referencedColumnName: 'Id' })
  kunden: Kunden;

  @ManyToOne(() => Rechnungen, parent => parent.gutschriftens)
  @JoinColumn({ name: 'RechnungsId', referencedColumnName: 'Id' })
  rechnungen: Rechnungen;

  @OneToMany(() => Gutschriftpositionen, child => child.gutschriften)
  gutschriftpositionens: Gutschriftpositionen[];

}
