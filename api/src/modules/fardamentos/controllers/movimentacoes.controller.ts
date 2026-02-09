import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { MovimentacoesService } from '../services/movimentacoes.service';
import { CreateEntregaDto } from '../dto/movimentacoes/create-entrega.dto';
import { CreateDevolucaoDto } from '../dto/movimentacoes/create-devolucao.dto';
import { UpdateStatusDto } from '../dto/movimentacoes/update-status.dto';
import { ListMovimentacoesDto } from '../dto/movimentacoes/list-movimentacoes.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { RequestUser } from '../../auth/types/auth.types';

@Controller('fardamentos/movimentacoes')
export class MovimentacoesController {
  constructor(private readonly service: MovimentacoesService) {}

  @Get()
  list(@Query() query: ListMovimentacoesDto) {
    return this.service.list(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('entrega')
  createEntrega(@Body() dto: CreateEntregaDto, @CurrentUser() user: RequestUser) {
    return this.service.createEntrega(dto, user);
  }

  @Post('devolucao')
  createDevolucao(
    @Body() dto: CreateDevolucaoDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.createDevolucao(dto, user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.atualizarStatus(id, dto.status, user);
  }
}
