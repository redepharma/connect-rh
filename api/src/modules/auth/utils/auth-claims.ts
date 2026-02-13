import { UnauthorizedException } from '@nestjs/common';
import { JwtPayload, PapelConnectRH } from '../types/auth.types';

const allowedRoles: PapelConnectRH[] = [
  PapelConnectRH.ADMIN,
  PapelConnectRH.TI,
  PapelConnectRH.PADRAO,
];

const normalizeRole = (value?: string | null): PapelConnectRH | null => {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();

  if (normalized === 'ADMIN') return PapelConnectRH.ADMIN;
  if (normalized === 'TI') return PapelConnectRH.TI;
  if (normalized === 'PADRAO') return PapelConnectRH.PADRAO;

  const lower = normalized.toLowerCase() as PapelConnectRH;
  if (allowedRoles.includes(lower)) {
    return lower;
  }

  return null;
};

export const resolvePapelConnectRh = (payload: JwtPayload): PapelConnectRH => {
  const direct =
    normalizeRole(payload.papel_connect_rh) ??
    normalizeRole(payload.papelConnectRh);
  if (direct) return direct;

  const systemRoles = payload.systemRoles?.roles ?? [];
  const normalizedRoles = systemRoles
    .map((role) => normalizeRole(role))
    .filter((role): role is PapelConnectRH => Boolean(role));

  if (normalizedRoles.includes(PapelConnectRH.ADMIN))
    return PapelConnectRH.ADMIN;
  if (normalizedRoles.includes(PapelConnectRH.TI)) return PapelConnectRH.TI;
  if (normalizedRoles.includes(PapelConnectRH.PADRAO))
    return PapelConnectRH.PADRAO;

  throw new UnauthorizedException('Token sem papel válido para Connect RH');
};

export const resolveDepartamento = (payload: JwtPayload): string | null => {
  const explicitDepartamento =
    payload.departamento ?? payload.departamentoNome ?? payload.departamento_nome;

  if (explicitDepartamento) {
    const normalized = String(explicitDepartamento).trim();
    if (normalized.length > 0) {
      return normalized;
    }
  }

  const departamentoId = payload.departamentoId ?? null;
  if (!departamentoId) return null;

  const knownDepartamentoNames: Record<string, string> = {
    dep_ti: 'TI',
    dep_rh: 'RH',
    dep_departamento_pessoal: 'Departamento Pessoal',
  };

  return knownDepartamentoNames[departamentoId] ?? departamentoId;
};
