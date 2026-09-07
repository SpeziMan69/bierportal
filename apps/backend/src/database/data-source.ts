import * as dotenv from 'dotenv';
import { join, resolve } from 'path';
import { DataSource } from 'typeorm';

dotenv.config({ path: resolve(__dirname, '../../../../.env') });
import { User } from '../modules/users/user.entity';
import { Beer } from '../common/entities/beer.entity';
import { BeerStyle } from '../common/entities/beer-style.entity';
import { Brewery } from '../common/entities/brewery.entity';
import { Review } from '../common/entities/review.entity';
import { ReviewLike } from '../common/entities/review-like.entity';
import { UserBeerEntry } from '../common/entities/user-entry.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env['DB_HOST'] ?? 'localhost',
  port: parseInt(process.env['DB_PORT'] ?? '5432'),
  username: process.env['DB_USER'],
  password: process.env['DB_PASS'],
  database: process.env['DB_NAME'],
  entities: [User, Beer, BeerStyle, Brewery, Review, ReviewLike, UserBeerEntry],
  migrations: [join(__dirname, 'migration', '**', '*.{ts,js}')],
});
