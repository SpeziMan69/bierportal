import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Beer } from './beer.entity';

@Entity()
export class BeerStyle {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ nullable: true })
  parentStyle!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @OneToMany(() => Beer, (beer) => beer.style)
  beers!: Beer[];
}
