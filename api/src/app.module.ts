import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { DepartmentGuard } from './modules/auth/guards/department.guard';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule],
  controllers: [AppController],
  providers: [AppService, JwtAuthGuard, DepartmentGuard],
})
export class AppModule {}
