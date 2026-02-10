import { Controller, Get } from '@nestjs/common';
import { MetricasService } from '../services/metricas.service';

@Controller('fardamentos/metricas')
export class MetricasController {
  constructor(private readonly metricasService: MetricasService) {}

  @Get()
  getMetrics() {
    return this.metricasService.getDashboardMetrics();
  }
}
