import {
  Column,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Beer } from './beer.entity';
import { ReviewLike } from './review-like.entity';
import { User } from '../../modules/users/user.entity';

@Entity()
@Unique(['user', 'beer'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'decimal', precision: 2, scale: 1 })
  rating!: number;

  @Column({ type: 'text', nullable: true })
  text!: string;

  @Column({ default: false })
  isDraft!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.reviews)
  user!: User;

  @ManyToOne(() => Beer, (beer) => beer.reviews)
  beer!: Beer;

  @OneToMany(() => ReviewLike, (like) => like.review)
  likes!: ReviewLike[];
}
