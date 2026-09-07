import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Review } from '../../common/entities/review.entity';
import { UserBeerEntry } from '../../common/entities/user-entry.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  username!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ type: 'varchar', nullable: true })
  passwordHash!: string | null;

  @Column({ type: 'varchar', nullable: true, unique: true })
  googleId!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ type: 'varchar', nullable: true })
  picture!: string | null;

  @Column({ type: 'bool', default: false })
  isUsernameSet!: boolean;

  @OneToMany(() => Review, (review) => review.user)
  reviews!: Review[];

  @OneToMany(() => UserBeerEntry, (entry) => entry.user)
  beerEntries!: UserBeerEntry[];

  get hasPassword(): boolean {
    return this.passwordHash !== null;
  }

  get hasGoogle(): boolean {
    return this.googleId !== null;
  }
}
