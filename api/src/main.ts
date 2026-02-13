import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { DepartmentGuard } from './modules/auth/guards/department.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3021',
      'http://10.7.0.97:3021',
      'http://10.7.0.117:3021',
      'http://10.7.0.121:3021',
      'http://10.7.0.114:3021',
    ],
    methods: 'GET,POST,PUT, PATCH, DELETE',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true,
  });

  app.useGlobalGuards(app.get(JwtAuthGuard), app.get(DepartmentGuard));
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  await app.listen(process.env.PORT ?? 4006);
}
void bootstrap();
