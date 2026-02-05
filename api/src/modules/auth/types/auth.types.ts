export enum PapelConnectRH {
  ADMIN = 'admin',
  TI = 'ti',
  PADRAO = 'padrao',
}

export interface SystemRolesPayload {
  clientId?: string;
  roles?: string[];
}

export interface JwtPayload {
  sub: string;
  usuario: string;
  nome: string;
  papelConnect?: string;
  departamentoId?: string | null;
  departamento?: string | null;
  systemRoles?: SystemRolesPayload;
  papel_connect_rh?: string;
  papelConnectRh?: string;
}

export interface RequestUser {
  id: string;
  usuario: string;
  nome: string;
  papelConnectRh: PapelConnectRH;
  departamentoId: string | null;
  departamento: string | null;
  raw: JwtPayload;
}
