import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { User } from '../../modules/users/user.entity';
import { Beer } from './beer.entity';
export enum BeerStatus {
  TRIED = 'tried',
  WISHLIST = 'wishlist',
  CELLAR = 'cellar',
}

@Entity()
@Unique(['user', 'beer'])
export class UserBeerEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: BeerStatus })
  status!: BeerStatus;

  @Column({ nullable: true })
  note!: string;

  @CreateDateColumn()
  addedAt!: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.beerEntries)
  user!: User;

  @ManyToOne(() => Beer, (beer) => beer.userEntries)
  beer!: Beer;
}
