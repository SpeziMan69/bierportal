import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { Beer } from './beer.entity';

@Entity()
export class Brewery {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Original id from an imported source (e.g. the Open Beer Database dump).
  // Used as the upsert key so re-running a seed doesn't create duplicates.
  @Column({ type: 'int', unique: true, nullable: true })
  sourceId!: number;

  @Column()
  name!: string;

  @Column({ nullable: true })
  city!: string;

  @Column({ nullable: true })
  state!: string;

  @Column({ nullable: true })
  country!: string;

  @Column({ nullable: true })
  region!: string;

  @Column({ nullable: true })
  website!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ nullable: true })
  logoUrl!: string;

  @Column({ default: false })
  isVerified!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  // Relations
  @OneToMany(() => Beer, (beer) => beer.brewery)
  beers!: Beer[];
}
