import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { VariacoesService } from '../services/variacoes.service';
import { CreateVariacaoDto } from '../dto/create-variacao.dto';
import { UpdateVariacaoDto } from '../dto/update-variacao.dto';

@Controller('fardamentos/variacoes')
export class VariacoesController {
  constructor(private readonly variacoesService: VariacoesService) {}

  @Post()
  create(@Body() dto: CreateVariacaoDto) {
    return this.variacoesService.create(dto);
  }

  @Get()
  findAll() {
    return this.variacoesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.variacoesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVariacaoDto) {
    return this.variacoesService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.variacoesService.remove(id);
    return { ok: true };
  }
}
