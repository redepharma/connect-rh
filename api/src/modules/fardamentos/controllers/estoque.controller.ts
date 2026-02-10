import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { EstoqueService } from '../services/estoque.service';
import { EstoqueQueryDto } from '../dto/estoque-query.dto';
import { PoliciesGuard } from '../../auth/casl/policies.guard';
import { CheckPolicies } from '../../auth/casl/policies.decorator';
import type { AppAbility } from '../../auth/casl/casl.types';

@UseGuards(PoliciesGuard)
@Controller('fardamentos/estoque')
export class EstoqueController {
  constructor(private readonly estoqueService: EstoqueService) {}

  @Get()
  @CheckPolicies((ability: AppAbility) => ability.can('read', 'Estoque'))
  findAll(@Query() query: EstoqueQueryDto) {
    return this.estoqueService.findAll(query);
  }

  @Get(':id')
  @CheckPolicies((ability: AppAbility) => ability.can('read', 'Estoque'))
  findOne(@Param('id') id: string) {
    return this.estoqueService.findOne(id);
  }
}
