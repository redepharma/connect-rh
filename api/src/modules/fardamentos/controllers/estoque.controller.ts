import { Controller, Get, Param, Query } from '@nestjs/common';
import { EstoqueService } from '../services/estoque.service';
import { EstoqueQueryDto } from '../dto/estoque-query.dto';

@Controller('fardamentos/estoque')
export class EstoqueController {
  constructor(private readonly estoqueService: EstoqueService) {}

  @Get()
  findAll(@Query() query: EstoqueQueryDto) {
    return this.estoqueService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.estoqueService.findOne(id);
  }
}
