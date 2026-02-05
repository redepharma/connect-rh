import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import {
  IS_PUBLIC_KEY,
  DEFAULT_ALLOWED_DEPARTAMENTO_IDS,
} from '../auth.constants';
import { RequestUser } from '../types/auth.types';

@Injectable()
export class DepartmentGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
  ) {}

  private getAllowedDepartamentoIds(): string[] {
    const envValue = this.config.get<string>('ALLOWED_DEPARTAMENTO_IDS');
    if (!envValue) return DEFAULT_ALLOWED_DEPARTAMENTO_IDS;
    return envValue
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Usuário não autenticado');
    }

    const allowedIds = this.getAllowedDepartamentoIds();

    if (user.departamentoId && allowedIds.includes(user.departamentoId)) {
      return true;
    }

    throw new ForbiddenException(
      'Acesso restrito aos departamentos permitidos',
    );
  }
}
