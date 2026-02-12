import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EstoqueService } from '../services/estoque.service';
import { EstoqueQueryDto } from '../dto/estoque-query.dto';
import { CreateEstoqueDto } from '../dto/create-estoque.dto';
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

  @Post()
  @CheckPolicies((ability: AppAbility) => ability.can('manage', 'Estoque'))
  create(@Body() dto: CreateEstoqueDto) {
    return this.estoqueService.create(dto);
  }

  @Get(':id')
  @CheckPolicies((ability: AppAbility) => ability.can('read', 'Estoque'))
  findOne(@Param('id') id: string) {
    return this.estoqueService.findOne(id);
  }
}
