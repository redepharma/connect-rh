import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { DepartmentGuard } from './modules/auth/guards/department.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalGuards(app.get(JwtAuthGuard), app.get(DepartmentGuard));
  await app.listen(process.env.PORT ?? 4006);
}
bootstrap();
