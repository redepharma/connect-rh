import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { RequestUser } from '../types/auth.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest<{ user?: RequestUser }>();
    if (!request.user) {
      throw new UnauthorizedException('Usuário não autenticado');
    }
    return request.user;
  },
);
