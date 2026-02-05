import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './auth.controller';

@Module({
  imports: [ConfigModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [AuthController],
  providers: [JwtStrategy],
})
export class AuthModule {}
