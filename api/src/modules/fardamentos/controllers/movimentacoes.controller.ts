import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
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
import { PoliciesGuard } from '../../auth/casl/policies.guard';
import { CheckPolicies } from '../../auth/casl/policies.decorator';
import type { AppAbility } from '../../auth/casl/casl.types';

@UseGuards(PoliciesGuard)
@Controller('fardamentos/movimentacoes')
export class MovimentacoesController {
  constructor(
    private readonly service: MovimentacoesService,
    private readonly termosService: TermosService,
    private readonly avariasService: AvariasService,
  ) {}

  @Get()
  @CheckPolicies((ability: AppAbility) => ability.can('read', 'Movimentacao'))
  list(@Query() query: ListMovimentacoesDto) {
    return this.service.list(query);
  }

  @Get('colaboradores/:colaboradorId/saldos')
  @CheckPolicies((ability: AppAbility) => ability.can('read', 'Movimentacao'))
  listarSaldoColaborador(@Param('colaboradorId') colaboradorId: string) {
    return this.service.listarSaldoColaborador(colaboradorId);
  }

  @Get('colaboradores/:colaboradorId/saldos/paginado')
  @CheckPolicies((ability: AppAbility) => ability.can('read', 'Movimentacao'))
  listarSaldoColaboradorPaginado(
    @Param('colaboradorId') colaboradorId: string,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.listarSaldoColaboradorPaginado(colaboradorId, {
      offset: Number(offset ?? 0),
      limit: Number(limit ?? 10),
    });
  }

  @Get(':id')
  @CheckPolicies((ability: AppAbility) => ability.can('read', 'Movimentacao'))
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('entrega')
  @CheckPolicies((ability: AppAbility) => ability.can('manage', 'Movimentacao'))
  createEntrega(
    @Body() dto: CreateEntregaDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.createEntrega(dto, user);
  }

  @Post('devolucao')
  @CheckPolicies((ability: AppAbility) => ability.can('manage', 'Movimentacao'))
  createDevolucao(
    @Body() dto: CreateDevolucaoDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.createDevolucao(dto, user);
  }

  @Patch(':id/status')
  @CheckPolicies((ability: AppAbility) => ability.can('manage', 'Movimentacao'))
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.atualizarStatus(id, dto.status, user);
  }

  @Post(':id/termos')
  @CheckPolicies((ability: AppAbility) => ability.can('manage', 'Movimentacao'))
  gerarTermo(
    @Param('id') id: string,
    @Body() _dto: GerarTermoDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.termosService.gerarTermo(id, user);
  }

  @Get(':id/termos')
  @CheckPolicies((ability: AppAbility) => ability.can('read', 'Termo'))
  listarTermos(@Param('id') id: string) {
    return this.termosService.listarPorMovimentacao(id);
  }

  @Post(':id/avarias')
  @CheckPolicies((ability: AppAbility) => ability.can('manage', 'Movimentacao'))
  registrarAvarias(
    @Param('id') id: string,
    @Body() dto: CreateAvariasDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.avariasService.registrarAvarias(id, dto, user);
  }
}
