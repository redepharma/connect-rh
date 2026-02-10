import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { MovimentacoesService } from '../services/movimentacoes.service';
import { CreateEntregaDto } from '../dto/movimentacoes/create-entrega.dto';
import { CreateDevolucaoDto } from '../dto/movimentacoes/create-devolucao.dto';
import { UpdateStatusDto } from '../dto/movimentacoes/update-status.dto';
import { ListMovimentacoesDto } from '../dto/movimentacoes/list-movimentacoes.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { RequestUser } from '../../auth/types/auth.types';
import { TermosService } from '../services/termos.service';
import { AvariasService } from '../services/avarias.service';
import { GerarTermoDto } from '../dto/termos/gerar-termo.dto';
import { CreateAvariasDto } from '../dto/avarias/create-avarias.dto';

@Controller('fardamentos/movimentacoes')
export class MovimentacoesController {
  constructor(
    private readonly service: MovimentacoesService,
    private readonly termosService: TermosService,
    private readonly avariasService: AvariasService,
  ) {}

  @Get()
  list(@Query() query: ListMovimentacoesDto) {
    return this.service.list(query);
  }

  @Get('colaboradores/:colaboradorId/saldos')
  listarSaldoColaborador(@Param('colaboradorId') colaboradorId: string) {
    return this.service.listarSaldoColaborador(colaboradorId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('entrega')
  createEntrega(
    @Body() dto: CreateEntregaDto,
    @CurrentUser() user: RequestUser,
  ) {
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

  @Post(':id/termos')
  gerarTermo(
    @Param('id') id: string,
    @Body() _dto: GerarTermoDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.termosService.gerarTermo(id, user);
  }

  @Get(':id/termos')
  listarTermos(@Param('id') id: string) {
    return this.termosService.listarPorMovimentacao(id);
  }

  @Post(':id/avarias')
  registrarAvarias(
    @Param('id') id: string,
    @Body() dto: CreateAvariasDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.avariasService.registrarAvarias(id, dto, user);
  }
}
