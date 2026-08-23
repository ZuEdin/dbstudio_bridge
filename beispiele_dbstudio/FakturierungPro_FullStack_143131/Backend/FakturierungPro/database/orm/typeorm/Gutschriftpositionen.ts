import { Entity, PrimaryGeneratedColumn, PrimaryColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Gutschriften } from './Gutschriften';
import { Artikel } from './Artikel';

@Entity('gutschriftpositionen')
export class Gutschriftpositionen {

  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: 'int' })
  GutschriftId: number;

  @Column({ type: 'int' })
  ArtikelId: number;

  @Column({ type: 'decimal', default: 1 })
  Menge: number;

  @Column({ type: 'decimal' })
  Einzelpreis: number;

  @Column({ type: 'decimal' })
  GesamtNetto: number;

  @ManyToOne(() => Gutschriften, parent => parent.gutschriftpositionens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'GutschriftId', referencedColumnName: 'Id' })
  gutschriften: Gutschriften;

  @ManyToOne(() => Artikel, parent => parent.gutschriftpositionens)
  @JoinColumn({ name: 'ArtikelId', referencedColumnName: 'Id' })
  artikel: Artikel;

}
