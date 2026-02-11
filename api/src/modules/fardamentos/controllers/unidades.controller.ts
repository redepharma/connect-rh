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
import { UnidadesService } from '../services/unidades.service';
import { CreateUnidadeDto } from '../dto/create-unidade.dto';
import { UpdateUnidadeDto } from '../dto/update-unidade.dto';
import { ListQueryDto } from '../dto/list-query.dto';
import { PoliciesGuard } from '../../auth/casl/policies.guard';
import { CheckPolicies } from '../../auth/casl/policies.decorator';
import type { AppAbility } from '../../auth/casl/casl.types';

@UseGuards(PoliciesGuard)
@Controller('fardamentos/unidades')
export class UnidadesController {
  constructor(private readonly unidadesService: UnidadesService) {}

  @Post()
  @CheckPolicies((ability: AppAbility) => ability.can('manage', 'Unidade'))
  create(@Body() dto: CreateUnidadeDto) {
    return this.unidadesService.create(dto);
  }

  @Get()
  @CheckPolicies((ability: AppAbility) => ability.can('read', 'Unidade'))
  findAll(@Query() query: ListQueryDto) {
    return this.unidadesService.findAll(query);
  }

  @Get(':id')
  @CheckPolicies((ability: AppAbility) => ability.can('read', 'Unidade'))
  findOne(@Param('id') id: string) {
    return this.unidadesService.findOne(id);
  }

  @Get(':id/delete-impact')
  @CheckPolicies((ability: AppAbility) => ability.can('manage', 'Unidade'))
  getDeleteImpact(@Param('id') id: string) {
    return this.unidadesService.getDeleteImpact(id);
  }

  @Put(':id')
  @CheckPolicies((ability: AppAbility) => ability.can('manage', 'Unidade'))
  update(@Param('id') id: string, @Body() dto: UpdateUnidadeDto) {
    return this.unidadesService.update(id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability: AppAbility) => ability.can('manage', 'Unidade'))
  async remove(@Param('id') id: string) {
    await this.unidadesService.remove(id);
    return { ok: true };
  }
}
