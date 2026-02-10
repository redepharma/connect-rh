import { Controller, Get, Param } from '@nestjs/common';
import { TermosService } from '../services/termos.service';

@Controller('fardamentos/termos')
export class TermosController {
  constructor(private readonly service: TermosService) {}

  @Get(':id')
  obterTermo(@Param('id') id: string) {
    return this.service.buscarTermo(id);
  }
}
