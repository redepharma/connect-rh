import { Injectable } from '@nestjs/common';
import { AbilityBuilder, AbilityClass, Ability } from '@casl/ability';
import type { RequestUser } from '../types/auth.types';
import { PapelConnectRH } from '../types/auth.types';
import type { AppAbility } from './casl.types';

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: RequestUser) {
    const { can, build } = new AbilityBuilder<AppAbility>(
      Ability as AbilityClass<AppAbility>,
    );

    if (user.papelConnectRh === PapelConnectRH.TI) {
      can('manage', 'all');
      return build();
    }

    if (user.papelConnectRh === PapelConnectRH.ADMIN) {
      can('manage', 'Unidade');
      can('manage', 'Tipo');
      can('manage', 'Variacao');
      can('manage', 'Movimentacao');
      can('read', 'Avaria');
      can('read', 'Estoque');
      can('read', 'Movimentacao');
      can('read', 'Termo');
      can('read', 'Historico');
      return build();
    }

    // PADRAO
    can('manage', 'Movimentacao');
    can('read', 'Avaria');
    can('read', 'Historico');
    can('read', 'Termo');
    can('read', 'Unidade');
    can('read', 'Tipo');
    can('read', 'Variacao');
    can('read', 'Estoque');

    return build();
  }
}
