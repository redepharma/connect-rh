import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import path from 'node:path';

@Module({
  imports: [
    // Conexão (fardamentos / mysql)
    TypeOrmModule.forRootAsync({
      name: 'primary',
      imports: [],
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

    TypeOrmModule.forRootAsync({
      name: 'institucional',
      imports: [],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        name: 'institucional',
        type: 'postgres',
        host: config.get<string>('INSTITUCIONAL_DB_HOST', 'localhost'),
        port: Number(config.get<string>('INSTITUCIONAL_DB_PORT', '5432')),
        username: config.get<string>('INSTITUCIONAL_DB_USER', 'postgres'),
        password: config.get<string>('INSTITUCIONAL_DB_PASS', ''),
        database: config.get<string>('INSTITUCIONAL_DB_NAME', 'institucional'),

        entities: [
          path.join(
            __dirname,
            '..',
            'modules',
            'institucional',
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
