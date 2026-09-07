import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Brewery } from './brewery.entity';
import { BeerStyle } from './beer-style.entity';
import { Review } from './review.entity';
import { UserBeerEntry } from './user-entry.entity';

@Entity()
export class Beer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Original id from an imported source (e.g. the Open Beer Database dump).
  // Used as the upsert key so re-running a seed doesn't create duplicates.
  @Column({ type: 'int', unique: true, nullable: true })
  sourceId!: number;

  @Column()
  name!: string;

  @Column({ nullable: true })
  imageUrl!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true })
  abv!: number;

  @Column({ type: 'decimal', precision: 6, scale: 1, nullable: true })
  ibu!: number;

  @Column({ type: 'decimal', precision: 6, scale: 1, nullable: true })
  ebc!: number;

  // Beer color in degrees SRM, as reported by imported sources (distinct unit from ebc above).
  @Column({ type: 'decimal', precision: 6, scale: 1, nullable: true })
  srm!: number;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  // Relations
  // nullable: seeded beers whose source brewery couldn't be resolved are kept with brewery = null
  // instead of being dropped.
  @ManyToOne(() => Brewery, (brewery) => brewery.beers, { eager: true, nullable: true })
  brewery!: Brewery;

  @ManyToOne(() => BeerStyle, (beerStyle) => beerStyle.beers, { nullable: true })
  style!: BeerStyle;

  @OneToMany(() => Review, (review) => review.beer)
  reviews!: Review[];

  @OneToMany(() => UserBeerEntry, (entry) => entry.beer)
  userEntries!: UserBeerEntry[];

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  avgRating!: number;

  @Column({ default: 0 })
  ratingCount!: number;
}
