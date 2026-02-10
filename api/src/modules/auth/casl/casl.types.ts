import type { Ability } from '@casl/ability';

export type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete';

export type Subjects =
  | 'Unidade'
  | 'Tipo'
  | 'Variacao'
  | 'Estoque'
  | 'Movimentacao'
  | 'Termo'
  | 'Avaria'
  | 'Historico'
  | 'all';

export type AppAbility = Ability<[Actions, Subjects]>;
