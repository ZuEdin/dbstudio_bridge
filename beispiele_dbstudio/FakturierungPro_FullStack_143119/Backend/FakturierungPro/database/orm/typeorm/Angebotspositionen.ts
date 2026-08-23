import { Entity, PrimaryGeneratedColumn, PrimaryColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Angebote } from './Angebote';
import { Artikel } from './Artikel';

@Entity('angebotspositionen')
export class Angebotspositionen {

  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: 'int' })
  AngebotsId: number;

  @Column({ type: 'int' })
  ArtikelId: number;

  @Column({ type: 'decimal', default: 1 })
  Menge: number;

  @Column({ type: 'decimal' })
  Einzelpreis: number;

  @Column({ type: 'decimal', default: 0 })
  RabattProzent: number;

  @Column({ type: 'decimal' })
  GesamtNetto: number;

  @ManyToOne(() => Angebote, parent => parent.angebotspositionens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'AngebotsId', referencedColumnName: 'Id' })
  angebote: Angebote;

  @ManyToOne(() => Artikel, parent => parent.angebotspositionens)
  @JoinColumn({ name: 'ArtikelId', referencedColumnName: 'Id' })
  artikel: Artikel;

}
