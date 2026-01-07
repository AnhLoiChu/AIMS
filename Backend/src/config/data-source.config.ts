import { DataSource } from 'typeorm';
import { config } from 'dotenv';
config();
import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get<string>('DB_HOST') || 'localhost',
  port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
  username: configService.get<string>('DB_USERNAME') || 'postgres',
  password: configService.get<string>('DB_PASSWORD') || 'postgres',
  database: configService.get<string>('DB_DATABASE') || 'postgres',
  logging: true,
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  subscribers: [__dirname + '/../**/*.subscriber.{js,ts}'],
  migrations: ['src/database/migrations/*-migration.ts'],
  migrationsRun: false,
});

export default AppDataSource;
