import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from './decorators/current-user.decorator';
import type { RequestUser } from './types/auth.types';

@Controller('auth')
export class AuthController {
  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    return user;
  }
}
