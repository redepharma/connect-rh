import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { DepartmentGuard } from './modules/auth/guards/department.guard';
import { DatabaseModule } from './database/database.module';
import { FardamentosModule } from './modules/fardamentos/fardamentos.module';
import { InstitucionalModule } from './modules/institucional/institucional.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    FardamentosModule,
    InstitucionalModule,
  ],
  controllers: [AppController],
  providers: [AppService, JwtAuthGuard, DepartmentGuard],
})
export class AppModule {}
