import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MovimentacaoEntity,
  MovimentacaoStatus,
  MovimentacaoTipo,
} from '../entities/movimentacao.entity';
import { MovimentacaoItemEntity } from '../entities/movimentacao-item.entity';
import { MovimentacaoEventoEntity } from '../entities/movimentacao-evento.entity';
import { VariacaoEntity } from '../entities/variacao.entity';
import { UnidadeEntity } from '../entities/unidade.entity';
import { EstoqueEntity } from '../entities/estoque.entity';
import { ColaboradorSaldoEntity } from '../entities/colaborador-saldo.entity';
import { CreateEntregaDto } from '../dto/movimentacoes/create-entrega.dto';
import { CreateDevolucaoDto } from '../dto/movimentacoes/create-devolucao.dto';
import type { RequestUser } from '../../auth/types/auth.types';

const STATUS_FLOW: Record<MovimentacaoStatus, MovimentacaoStatus[]> = {
  SEPARADO: ['EM_TRANSITO', 'CONCLUIDO', 'CANCELADO'],
  EM_TRANSITO: ['CONCLUIDO', 'CANCELADO'],
  CONCLUIDO: [],
  CANCELADO: [],
};

@Injectable()
export class MovimentacoesService {
  constructor(
    @InjectRepository(MovimentacaoEntity, 'primary')
    private readonly movRepository: Repository<MovimentacaoEntity>,
    @InjectRepository(MovimentacaoItemEntity, 'primary')
    private readonly itemRepository: Repository<MovimentacaoItemEntity>,
    @InjectRepository(MovimentacaoEventoEntity, 'primary')
    private readonly eventoRepository: Repository<MovimentacaoEventoEntity>,
    @InjectRepository(VariacaoEntity, 'primary')
    private readonly variacaoRepository: Repository<VariacaoEntity>,
    @InjectRepository(UnidadeEntity, 'primary')
    private readonly unidadeRepository: Repository<UnidadeEntity>,
    @InjectRepository(EstoqueEntity, 'primary')
    private readonly estoqueRepository: Repository<EstoqueEntity>,
    @InjectRepository(ColaboradorSaldoEntity, 'primary')
    private readonly saldoRepository: Repository<ColaboradorSaldoEntity>,
  ) {}

  async list(query?: {
    q?: string;
    unidadeId?: string;
    tipo?: MovimentacaoTipo;
    status?: MovimentacaoStatus;
    startDate?: string;
    endDate?: string;
    offset?: number;
    limit?: number;
  }): Promise<{
    data: MovimentacaoEntity[];
    total: number;
    offset: number;
    limit: number;
  }> {
    const qb = this.movRepository
      .createQueryBuilder('mov')
      .leftJoinAndSelect('mov.unidade', 'unidade')
      .leftJoinAndSelect('mov.itens', 'itens')
      .leftJoinAndSelect('itens.variacao', 'variacao')
      .leftJoinAndSelect('variacao.tipo', 'tipo');

    if (query?.unidadeId) {
      qb.andWhere('unidade.id = :unidadeId', { unidadeId: query.unidadeId });
    }

    if (query?.tipo) {
      qb.andWhere('mov.tipo = :tipo', { tipo: query.tipo });
    }

    if (query?.status) {
      qb.andWhere('mov.status = :status', { status: query.status });
    }

    if (query?.q) {
      qb.andWhere(
        '(mov.colaboradorNome LIKE :q OR mov.colaboradorId LIKE :q OR unidade.nome LIKE :q)',
        { q: `%${query.q}%` },
      );
    }

    if (query?.startDate) {
      qb.andWhere('mov.created_at >= :startDate', {
        startDate: query.startDate,
      });
    }

    if (query?.endDate) {
      qb.andWhere('mov.created_at <= :endDate', { endDate: query.endDate });
    }

    qb.orderBy('mov.createdAt', 'DESC');
    const offset = Math.max(0, query?.offset ?? 0);
    const limit = Math.min(10, Math.max(1, query?.limit ?? 10));
    const [data, total] = await qb.skip(offset).take(limit).getManyAndCount();
    return { data, total, offset, limit };
  }

  async findOne(id: string): Promise<MovimentacaoEntity> {
    const mov = await this.movRepository.findOne({
      where: { id },
      relations: [
        'unidade',
        'itens',
        'itens.variacao',
        'itens.variacao.tipo',
        'eventos',
      ],
    });

    if (!mov) throw new NotFoundException('Movimentacao nao encontrada');
    return mov;
  }

  async listarSaldoColaborador(colaboradorId: string) {
    const movimentos = await this.movRepository.find({
      where: { colaboradorId, status: 'CONCLUIDO' },
      relations: ['itens', 'itens.variacao', 'itens.variacao.tipo'],
      order: { createdAt: 'DESC' },
    });

    const saldoMap = new Map<
      string,
      {
        variacaoId: string;
        tipoNome: string;
        tamanho: string;
        genero: string;
        quantidade: number;
      }
    >();

    for (const mov of movimentos) {
      const fator = mov.tipo === 'ENTREGA' ? 1 : -1;
      for (const item of mov.itens ?? []) {
        const variacaoId = item.variacao?.id ?? '';
        if (!variacaoId) continue;
        const atual = saldoMap.get(variacaoId) ?? {
          variacaoId,
          tipoNome: item.variacao?.tipo?.nome ?? '-',
          tamanho: item.variacao?.tamanho ?? '-',
          genero: item.variacao?.genero ?? '-',
          quantidade: 0,
        };
        atual.quantidade += fator * item.quantidade;
        saldoMap.set(variacaoId, atual);
      }
    }

    return Array.from(saldoMap.values()).filter(
      (saldo) => saldo.quantidade > 0,
    );
  }

  async createEntrega(dto: CreateEntregaDto, user: RequestUser) {
    return this.createMovimentacao('ENTREGA', dto, user);
  }

  async createDevolucao(dto: CreateDevolucaoDto, user: RequestUser) {
    return this.createMovimentacao('DEVOLUCAO', dto, user, dto.force === true);
  }

  private async createMovimentacao(
    tipo: MovimentacaoTipo,
    dto: CreateEntregaDto | CreateDevolucaoDto,
    user: RequestUser,
    forceDevolucao = false,
  ) {
    const unidade = await this.unidadeRepository.findOne({
      where: { id: dto.unidadeId },
    });

    if (!unidade) throw new BadRequestException('Unidade invalida');

    const variacoes = await this.variacaoRepository.find({
      where: dto.itens.map((item) => ({ id: item.variacaoId })),
      relations: ['tipo'],
    });

    if (variacoes.length !== dto.itens.length) {
      throw new BadRequestException('Variacoes invalidas');
    }

    const mov = this.movRepository.create({
      tipo,
      status: 'SEPARADO',
      unidade,
      colaboradorId: dto.colaboradorId,
      colaboradorNome: dto.colaboradorNome,
    });

    const itens: MovimentacaoItemEntity[] = dto.itens.map((item) => {
      const variacao = variacoes.find((v) => v.id === item.variacaoId);
      return this.itemRepository.create({
        variacao,
        quantidade: item.quantidade,
      });
    });

    mov.itens = itens;

    await this.movRepository.manager.transaction(async (manager) => {
      const savedMov = await manager.save(MovimentacaoEntity, mov);
      const savedItens = await manager.save(
        MovimentacaoItemEntity,
        itens.map((item) => ({ ...item, movimentacao: savedMov })),
      );

      if (tipo === 'ENTREGA') {
        for (const item of savedItens) {
          await this.reservarEstoque(
            manager,
            unidade.id,
            item.variacao.id,
            item.quantidade,
          );
        }
      }

      if (tipo === 'DEVOLUCAO' && !forceDevolucao) {
        for (const item of savedItens) {
          await this.validarSaldo(
            manager,
            dto.colaboradorId,
            item.variacao.id,
            item.quantidade,
          );
        }
      }

      await manager.save(
        MovimentacaoEventoEntity,
        this.eventoRepository.create({
          movimentacao: savedMov,
          status: 'SEPARADO',
          usuarioId: user.id,
          usuarioNome: user.nome,
          descricao:
            tipo === 'DEVOLUCAO' && forceDevolucao
              ? 'Devolucao forcada (saldo ignorado)'
              : undefined,
        }),
      );
    });

    return this.findOne(mov.id);
  }

  async atualizarStatus(
    id: string,
    status: MovimentacaoStatus,
    user: RequestUser,
  ) {
    const mov = await this.findOne(id);

    if (!STATUS_FLOW[mov.status].includes(status)) {
      throw new BadRequestException('Transicao de status invalida');
    }

    await this.movRepository.manager.transaction(async (manager) => {
      if (status === 'CANCELADO') {
        if (mov.status === 'CONCLUIDO') {
          throw new BadRequestException('Movimentacao ja concluida');
        }
        if (mov.tipo === 'ENTREGA') {
          for (const item of mov.itens) {
            await this.liberarReserva(
              manager,
              mov.unidade.id,
              item.variacao.id,
              item.quantidade,
            );
          }
        }
      }

      if (status === 'CONCLUIDO') {
        if (mov.tipo === 'ENTREGA') {
          for (const item of mov.itens) {
            await this.baixarEstoque(
              manager,
              mov.unidade.id,
              item.variacao.id,
              item.quantidade,
            );
            await this.incrementarSaldo(
              manager,
              mov.colaboradorId,
              item.variacao.id,
              item.quantidade,
            );
          }
        }

        if (mov.tipo === 'DEVOLUCAO') {
          for (const item of mov.itens) {
            await this.entrarEstoque(
              manager,
              mov.unidade.id,
              item.variacao.id,
              item.quantidade,
            );
            await this.decrementarSaldo(
              manager,
              mov.colaboradorId,
              item.variacao.id,
              item.quantidade,
            );
          }
        }
      }

      mov.status = status;
      await manager.save(MovimentacaoEntity, mov);
      await manager.save(
        MovimentacaoEventoEntity,
        this.eventoRepository.create({
          movimentacao: mov,
          status,
          usuarioId: user.id,
          usuarioNome: user.nome,
        }),
      );
    });

    return this.findOne(id);
  }

  private async reservarEstoque(
    manager: Repository<EstoqueEntity>['manager'],
    unidadeId: string,
    variacaoId: string,
    quantidade: number,
  ) {
    const estoque = await manager.findOne(EstoqueEntity, {
      where: { unidade: { id: unidadeId }, variacao: { id: variacaoId } },
      relations: ['unidade', 'variacao'],
    });

    if (!estoque) {
      throw new BadRequestException('Estoque nao encontrado para variacao');
    }

    const disponivel = estoque.total - estoque.reservado;
    if (disponivel < quantidade) {
      throw new BadRequestException('Estoque insuficiente');
    }

    estoque.reservado += quantidade;
    await manager.save(EstoqueEntity, estoque);
  }

  private async liberarReserva(
    manager: Repository<EstoqueEntity>['manager'],
    unidadeId: string,
    variacaoId: string,
    quantidade: number,
  ) {
    const estoque = await manager.findOne(EstoqueEntity, {
      where: { unidade: { id: unidadeId }, variacao: { id: variacaoId } },
      relations: ['unidade', 'variacao'],
    });

    if (!estoque) {
      throw new BadRequestException('Estoque nao encontrado para variacao');
    }

    estoque.reservado = Math.max(0, estoque.reservado - quantidade);
    await manager.save(EstoqueEntity, estoque);
  }

  private async baixarEstoque(
    manager: Repository<EstoqueEntity>['manager'],
    unidadeId: string,
    variacaoId: string,
    quantidade: number,
  ) {
    const estoque = await manager.findOne(EstoqueEntity, {
      where: { unidade: { id: unidadeId }, variacao: { id: variacaoId } },
      relations: ['unidade', 'variacao'],
    });

    if (!estoque) {
      throw new BadRequestException('Estoque nao encontrado para variacao');
    }

    estoque.total = Math.max(0, estoque.total - quantidade);
    estoque.reservado = Math.max(0, estoque.reservado - quantidade);
    await manager.save(EstoqueEntity, estoque);
  }

  private async entrarEstoque(
    manager: Repository<EstoqueEntity>['manager'],
    unidadeId: string,
    variacaoId: string,
    quantidade: number,
  ) {
    let estoque = await manager.findOne(EstoqueEntity, {
      where: { unidade: { id: unidadeId }, variacao: { id: variacaoId } },
      relations: ['unidade', 'variacao'],
    });

    if (!estoque) {
      estoque = manager.create(EstoqueEntity, {
        unidade: { id: unidadeId } as UnidadeEntity,
        variacao: { id: variacaoId } as VariacaoEntity,
        total: 0,
        reservado: 0,
      });
    }

    estoque.total += quantidade;
    await manager.save(EstoqueEntity, estoque);
  }

  private async incrementarSaldo(
    manager: Repository<ColaboradorSaldoEntity>['manager'],
    colaboradorId: string,
    variacaoId: string,
    quantidade: number,
  ) {
    let saldo = await manager.findOne(ColaboradorSaldoEntity, {
      where: { colaboradorId, variacao: { id: variacaoId } },
      relations: ['variacao'],
    });

    if (!saldo) {
      saldo = manager.create(ColaboradorSaldoEntity, {
        colaboradorId,
        variacao: { id: variacaoId } as VariacaoEntity,
        quantidade: 0,
      });
    }

    saldo.quantidade += quantidade;
    await manager.save(ColaboradorSaldoEntity, saldo);
  }

  private async decrementarSaldo(
    manager: Repository<ColaboradorSaldoEntity>['manager'],
    colaboradorId: string,
    variacaoId: string,
    quantidade: number,
  ) {
    let saldo = await manager.findOne(ColaboradorSaldoEntity, {
      where: { colaboradorId, variacao: { id: variacaoId } },
      relations: ['variacao'],
    });

    if (!saldo) {
      saldo = manager.create(ColaboradorSaldoEntity, {
        colaboradorId,
        variacao: { id: variacaoId } as VariacaoEntity,
        quantidade: 0,
      });
    }

    saldo.quantidade = Math.max(0, saldo.quantidade - quantidade);
    await manager.save(ColaboradorSaldoEntity, saldo);
  }

  private async validarSaldo(
    manager: Repository<ColaboradorSaldoEntity>['manager'],
    colaboradorId: string,
    variacaoId: string,
    quantidade: number,
  ) {
    const saldo = await manager.findOne(ColaboradorSaldoEntity, {
      where: { colaboradorId, variacao: { id: variacaoId } },
      relations: ['variacao'],
    });

    if (!saldo || saldo.quantidade < quantidade) {
      throw new BadRequestException(
        'Colaborador não possui registro de entrega deste item para poder realizar a devolucao',
      );
    }
  }
}
