import * as dotenv from 'dotenv';
import { join, resolve } from 'path';
import { DataSource } from 'typeorm';

dotenv.config({ path: resolve(__dirname, '../../../../.env') });
import { User } from '../modules/users/user.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env['DB_HOST'] ?? 'localhost',
  port: parseInt(process.env['DB_PORT'] ?? '5432'),
  username: process.env['DB_USER'],
  password: process.env['DB_PASS'],
  database: process.env['DB_NAME'],
  entities: [User],
  migrations: [join(__dirname, 'migration', '**', '*.{ts,js}')],
});
