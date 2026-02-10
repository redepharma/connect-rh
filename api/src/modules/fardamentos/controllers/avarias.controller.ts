import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AvariasService } from '../services/avarias.service';
import { ListAvariasDto } from '../dto/avarias/list-avarias.dto';
import { PoliciesGuard } from '../../auth/casl/policies.guard';
import { CheckPolicies } from '../../auth/casl/policies.decorator';
import type { AppAbility } from '../../auth/casl/casl.types';

@UseGuards(PoliciesGuard)
@Controller('fardamentos/avarias')
export class AvariasController {
  constructor(private readonly avariasService: AvariasService) {}

  @Get()
  @CheckPolicies((ability: AppAbility) => ability.can('read', 'Avaria'))
  list(@Query() query: ListAvariasDto) {
    return this.avariasService.listarAvarias(query);
  }
}
