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
import { TiposService } from '../services/tipos.service';
import { CreateTipoDto } from '../dto/create-tipo.dto';
import { UpdateTipoDto } from '../dto/update-tipo.dto';
import { ListQueryDto } from '../dto/list-query.dto';
import { PoliciesGuard } from '../../auth/casl/policies.guard';
import { CheckPolicies } from '../../auth/casl/policies.decorator';
import type { AppAbility } from '../../auth/casl/casl.types';

@UseGuards(PoliciesGuard)
@Controller('fardamentos/tipos')
export class TiposController {
  constructor(private readonly tiposService: TiposService) {}

  @Post()
  @CheckPolicies((ability: AppAbility) => ability.can('manage', 'Tipo'))
  create(@Body() dto: CreateTipoDto) {
    return this.tiposService.create(dto);
  }

  @Get()
  @CheckPolicies((ability: AppAbility) => ability.can('read', 'Tipo'))
  findAll(@Query() query: ListQueryDto) {
    return this.tiposService.findAll(query);
  }

  @Get(':id')
  @CheckPolicies((ability: AppAbility) => ability.can('read', 'Tipo'))
  findOne(@Param('id') id: string) {
    return this.tiposService.findOne(id);
  }

  @Put(':id')
  @CheckPolicies((ability: AppAbility) => ability.can('manage', 'Tipo'))
  update(@Param('id') id: string, @Body() dto: UpdateTipoDto) {
    return this.tiposService.update(id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability: AppAbility) => ability.can('manage', 'Tipo'))
  async remove(@Param('id') id: string) {
    await this.tiposService.remove(id);
    return { ok: true };
  }
}
