import { Entity, PrimaryGeneratedColumn, PrimaryColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Rechnungen } from './Rechnungen';
import { Artikel } from './Artikel';

@Entity('rechnungspositionen')
export class Rechnungspositionen {

  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: 'int' })
  RechnungsId: number;

  @Column({ type: 'int' })
  ArtikelId: number;

  @Column({ type: 'int', default: 1 })
  PositionNr: number;

  @Column({ type: 'decimal', default: 1 })
  Menge: number;

  @Column({ type: 'decimal' })
  Einzelpreis: number;

  @Column({ type: 'int', default: 19 })
  SteuerSatz: number;

  @Column({ type: 'decimal' })
  GesamtNetto: number;

  @ManyToOne(() => Rechnungen, parent => parent.rechnungspositionens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'RechnungsId', referencedColumnName: 'Id' })
  rechnungen: Rechnungen;

  @ManyToOne(() => Artikel, parent => parent.rechnungspositionens)
  @JoinColumn({ name: 'ArtikelId', referencedColumnName: 'Id' })
  artikel: Artikel;

}
