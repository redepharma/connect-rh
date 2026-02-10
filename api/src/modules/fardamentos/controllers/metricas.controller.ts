import { Controller, Get, UseGuards } from '@nestjs/common';
import { MetricasService } from '../services/metricas.service';
import { PoliciesGuard } from '../../auth/casl/policies.guard';
import { CheckPolicies } from '../../auth/casl/policies.decorator';
import type { AppAbility } from '../../auth/casl/casl.types';

@UseGuards(PoliciesGuard)
@Controller('fardamentos/metricas')
export class MetricasController {
  constructor(private readonly metricasService: MetricasService) {}

  @Get()
  @CheckPolicies((ability: AppAbility) => ability.can('read', 'Estoque'))
  getMetrics() {
    return this.metricasService.getDashboardMetrics();
  }
}
