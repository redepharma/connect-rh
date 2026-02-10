import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { VariacoesService } from '../services/variacoes.service';
import { CreateVariacaoDto } from '../dto/create-variacao.dto';
import { UpdateVariacaoDto } from '../dto/update-variacao.dto';
import { ListQueryDto } from '../dto/list-query.dto';
import { PoliciesGuard } from '../../auth/casl/policies.guard';
import { CheckPolicies } from '../../auth/casl/policies.decorator';
import type { AppAbility } from '../../auth/casl/casl.types';

@UseGuards(PoliciesGuard)
@Controller('fardamentos/variacoes')
export class VariacoesController {
  constructor(private readonly variacoesService: VariacoesService) {}

  @Post()
  @CheckPolicies((ability: AppAbility) => ability.can('manage', 'Variacao'))
  create(@Body() dto: CreateVariacaoDto) {
    return this.variacoesService.create(dto);
  }

  @Get()
  @CheckPolicies((ability: AppAbility) => ability.can('read', 'Variacao'))
  findAll(@Query() query: ListQueryDto) {
    return this.variacoesService.findAll(query);
  }

  @Get(':id')
  @CheckPolicies((ability: AppAbility) => ability.can('read', 'Variacao'))
  findOne(@Param('id') id: string) {
    return this.variacoesService.findOne(id);
  }

  @Put(':id')
  @CheckPolicies((ability: AppAbility) => ability.can('manage', 'Variacao'))
  update(@Param('id') id: string, @Body() dto: UpdateVariacaoDto) {
    return this.variacoesService.update(id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability: AppAbility) => ability.can('manage', 'Variacao'))
  async remove(@Param('id') id: string) {
    await this.variacoesService.remove(id);
    return { ok: true };
  }
}
