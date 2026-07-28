import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

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

  get hasPassword(): boolean {
    return this.passwordHash !== null;
  }

  get hasGoogle(): boolean {
    return this.googleId !== null;
  }
}
