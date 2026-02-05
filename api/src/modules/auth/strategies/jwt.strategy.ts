import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { JWT_AUDIENCE, JWT_ISSUER } from '../auth.constants';
import { JwtPayload, RequestUser } from '../types/auth.types';
import {
  resolveDepartamento,
  resolvePapelConnectRh,
} from '../utils/auth-claims';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: ['RS256'],
      secretOrKey: loadPublicKey(config),
    });
  }

  validate(payload: JwtPayload): RequestUser {
    if (!payload || typeof payload.sub !== 'string') {
      throw new UnauthorizedException('Token inválido');
    }

    if (!payload.usuario || !payload.nome) {
      throw new UnauthorizedException('Token inválido');
    }

    const papelConnectRh = resolvePapelConnectRh(payload);
    const departamento = resolveDepartamento(payload);

    return {
      id: payload.sub,
      usuario: payload.usuario,
      nome: payload.nome,
      papelConnectRh,
      departamentoId: payload.departamentoId ?? null,
      departamento,
      raw: payload,
    };
  }
}

const loadPublicKey = (config: ConfigService): string => {
  const inlineKey = config.get<string>('JWT_PUBLIC_KEY');
  if (inlineKey) {
    return inlineKey.replace(/\\n/g, '\n');
  }

  const defaultKeyPath = path.resolve(process.cwd(), 'jwt-public.pem');
  const keyPath = config.get<string>('JWT_PUBLIC_KEY_PATH') ?? defaultKeyPath;

  if (!fs.existsSync(keyPath)) {
    throw new Error(
      `JWT public key não encontrada em ${keyPath}. ` +
        'Configure JWT_PUBLIC_KEY ou JWT_PUBLIC_KEY_PATH.',
    );
  }

  return fs.readFileSync(keyPath, 'utf8');
};
