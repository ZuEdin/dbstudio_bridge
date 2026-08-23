import { Entity, PrimaryGeneratedColumn, PrimaryColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Auftraege } from './Auftraege';
import { Artikel } from './Artikel';

@Entity('auftragspositionen')
export class Auftragspositionen {

  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: 'int' })
  AuftragsId: number;

  @Column({ type: 'int' })
  ArtikelId: number;

  @Column({ type: 'decimal', default: 1 })
  Menge: number;

  @Column({ type: 'decimal' })
  Einzelpreis: number;

  @Column({ type: 'decimal' })
  GesamtNetto: number;

  @ManyToOne(() => Auftraege, parent => parent.auftragspositionens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'AuftragsId', referencedColumnName: 'Id' })
  auftraege: Auftraege;

  @ManyToOne(() => Artikel, parent => parent.auftragspositionens)
  @JoinColumn({ name: 'ArtikelId', referencedColumnName: 'Id' })
  artikel: Artikel;

}
