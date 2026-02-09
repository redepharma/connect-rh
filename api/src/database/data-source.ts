import 'dotenv/config';
import path from 'node:path';
import { DataSource } from 'typeorm';

const rootDir = path.resolve(__dirname, '..');

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? 'root',
  database: process.env.DB_NAME ?? 'connect_rh',
  entities: [
    path.join(rootDir, 'modules', '**', 'entities', '*.entity.{ts,js}'),
  ],
  synchronize: false,
});
