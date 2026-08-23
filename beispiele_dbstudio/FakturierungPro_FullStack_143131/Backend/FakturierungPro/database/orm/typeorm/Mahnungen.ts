import { Entity, PrimaryGeneratedColumn, PrimaryColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Kunden } from './Kunden';
import { Rechnungen } from './Rechnungen';

@Entity('mahnungen')
export class Mahnungen {

  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: 'varchar', length: 40 })
  MahnungsNr: string;

  @Column({ type: 'int' })
  RechnungsId: number;

  @Column({ type: 'int' })
  KundenId: number;

  @Column({ type: 'timestamp' })
  MahnDatum: Date;

  @Column({ type: 'varchar', length: 255, default: 'Mahnstufe 1 (Zahlungserinnerung)' })
  Mahnstufe: string;

  @Column({ type: 'decimal', default: 5.00 })
  Mahngebuehr: number;

  @Column({ type: 'decimal', default: 0.00 })
  Verzugszinsen: number;

  @Column({ type: 'timestamp' })
  FaelligBis: Date;

  @Column({ type: 'varchar', length: 255, default: 'Offen' })
  Status: string;

  @ManyToOne(() => Kunden, parent => parent.mahnungens)
  @JoinColumn({ name: 'KundenId', referencedColumnName: 'Id' })
  kunden: Kunden;

  @ManyToOne(() => Rechnungen, parent => parent.mahnungens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'RechnungsId', referencedColumnName: 'Id' })
  rechnungen: Rechnungen;

}
