import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Unique } from 'typeorm';
import { User } from '../../modules/users/user.entity';
import { Review } from './review.entity';

@Entity()
@Unique(['user', 'review'])
export class ReviewLike {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn()
  createdAt!: Date;

  // Relations
  @ManyToOne(() => User)
  user!: User;

  @ManyToOne(() => Review, (review) => review.likes)
  review!: Review;
}
