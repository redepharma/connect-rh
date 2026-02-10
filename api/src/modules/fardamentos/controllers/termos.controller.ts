import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { TermosService } from '../services/termos.service';
import { PoliciesGuard } from '../../auth/casl/policies.guard';
import { CheckPolicies } from '../../auth/casl/policies.decorator';
import type { AppAbility } from '../../auth/casl/casl.types';

@UseGuards(PoliciesGuard)
@Controller('fardamentos/termos')
export class TermosController {
  constructor(private readonly service: TermosService) {}

  @Get(':id')
  @CheckPolicies((ability: AppAbility) => ability.can('read', 'Termo'))
  obterTermo(@Param('id') id: string) {
    return this.service.buscarTermo(id);
  }
}
