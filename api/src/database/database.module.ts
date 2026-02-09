import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import path from 'node:path';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      name: 'primary',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        name: 'primary',
        type: 'mysql',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<string>('DB_PORT', '3306')),
        username: config.get<string>('DB_USER', 'root'),
        password: config.get<string>('DB_PASSWORD', 'root'),
        database: config.get<string>('DB_NAME', 'connect_rh'),
        entities: [
          path.join(
            __dirname,
            '..',
            'modules',
            '**',
            'entities',
            '*.entity.{ts,js}',
          ),
        ],
        synchronize: false,
      }),
    }),
    // TypeOrmModule.forRootAsync({
    //   name: 'secondary',
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: (config: ConfigService) => ({
    //     name: 'secondary',
    //     type: 'mysql',
    //     host: config.get<string>('DB2_HOST', 'localhost'),
    //     port: Number(config.get<string>('DB2_PORT', '3306')),
    //     username: config.get<string>('DB2_USER', 'root'),
    //     password: config.get<string>('DB2_PASSWORD', 'root'),
    //     database: config.get<string>('DB2_NAME', 'connect_rh_aux'),
    //     entities: [],
    //     synchronize: false,
    //   }),
    // }),
  ],
})
export class DatabaseModule {}
