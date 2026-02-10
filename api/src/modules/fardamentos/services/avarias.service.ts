import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AvariaEntity } from '../entities/avaria.entity';
import { MovimentacaoEntity } from '../entities/movimentacao.entity';
import { EstoqueEntity } from '../entities/estoque.entity';
import { VariacaoEntity } from '../entities/variacao.entity';
import type { CreateAvariasDto } from '../dto/avarias/create-avarias.dto';
import type { ListAvariasDto } from '../dto/avarias/list-avarias.dto';
import type { RequestUser } from '../../auth/types/auth.types';

@Injectable()
export class AvariasService {
  constructor(
    @InjectRepository(AvariaEntity, 'primary')
    private readonly avariasRepo: Repository<AvariaEntity>,
    @InjectRepository(MovimentacaoEntity, 'primary')
    private readonly movRepo: Repository<MovimentacaoEntity>,
    @InjectRepository(EstoqueEntity, 'primary')
    private readonly estoqueRepo: Repository<EstoqueEntity>,
    @InjectRepository(VariacaoEntity, 'primary')
    private readonly variacaoRepo: Repository<VariacaoEntity>,
  ) {}

  async registrarAvarias(
    movimentacaoId: string,
    dto: CreateAvariasDto,
    user: RequestUser,
  ) {
    const movimentacao = await this.movRepo.findOne({
      where: { id: movimentacaoId },
      relations: ['unidade'],
    });

    if (!movimentacao) {
      throw new NotFoundException('Movimentação não encontrada.');
    }

    if (movimentacao.tipo !== 'DEVOLUCAO') {
      throw new BadRequestException(
        'Avaria só pode ser registrada em devoluções.',
      );
    }

    if (movimentacao.status !== 'CONCLUIDO') {
      throw new BadRequestException(
        'Avaria só pode ser registrada após conclusão.',
      );
    }

    if (!dto.itens || dto.itens.length === 0) {
      throw new BadRequestException('Informe ao menos uma avaria.');
    }

    const variacoesIds = dto.itens.map((item) => item.variacaoId);
    const variacoes = await this.variacaoRepo.find({
      where: { id: In(variacoesIds) },
    });
    const variacaoMap = new Map(variacoes.map((v) => [v.id, v]));

    const avarias: AvariaEntity[] = [];

    for (const item of dto.itens) {
      const variacao = variacaoMap.get(item.variacaoId);
      if (!variacao) {
        throw new NotFoundException('Variação não encontrada.');
      }

      const estoque = await this.estoqueRepo.findOne({
        where: {
          variacao: { id: variacao.id },
          unidade: { id: movimentacao.unidade?.id },
        },
        relations: ['variacao', 'unidade'],
      });

      if (!estoque) {
        throw new NotFoundException('Estoque não encontrado para a variação.');
      }

      if (estoque.total < item.quantidade) {
        throw new BadRequestException(
          'Quantidade de avaria maior que o estoque total disponível.',
        );
      }

      estoque.total -= item.quantidade;
      await this.estoqueRepo.save(estoque);

      avarias.push(
        this.avariasRepo.create({
          movimentacao,
          variacao,
          quantidade: item.quantidade,
          descricao: item.descricao ?? null,
          usuarioId: String(user.id ?? ''),
          usuarioNome: user.nome ?? user.usuario ?? 'Usuário',
        }),
      );
    }

    const saved = await this.avariasRepo.save(avarias);

    return saved.map((avaria) => ({
      id: avaria.id,
      variacaoId: avaria.variacao?.id,
      quantidade: avaria.quantidade,
      descricao: avaria.descricao,
      createdAt: avaria.createdAt,
    }));
  }

  async listarAvarias(query: ListAvariasDto) {
    const qb = this.avariasRepo
      .createQueryBuilder('avaria')
      .leftJoinAndSelect('avaria.movimentacao', 'movimentacao')
      .leftJoinAndSelect('movimentacao.unidade', 'unidade')
      .leftJoinAndSelect('avaria.variacao', 'variacao')
      .leftJoinAndSelect('variacao.tipo', 'tipo');

    if (query.movimentacaoId) {
      qb.andWhere('movimentacao.id = :movimentacaoId', {
        movimentacaoId: query.movimentacaoId,
      });
    }

    if (query.unidadeId) {
      qb.andWhere('unidade.id = :unidadeId', { unidadeId: query.unidadeId });
    }

    if (query.colaboradorId) {
      qb.andWhere('movimentacao.colaboradorId = :colaboradorId', {
        colaboradorId: query.colaboradorId,
      });
    }

    if (query.tipoId) {
      qb.andWhere('tipo.id = :tipoId', { tipoId: query.tipoId });
    }

    if (query.startDate) {
      qb.andWhere('avaria.createdAt >= :startDate', {
        startDate: query.startDate,
      });
    }

    if (query.endDate) {
      qb.andWhere('avaria.createdAt <= :endDate', {
        endDate: query.endDate,
      });
    }

    if (query.q) {
      qb.andWhere(
        '(movimentacao.colaboradorNome LIKE :q OR movimentacao.colaboradorId LIKE :q OR tipo.nome LIKE :q OR unidade.nome LIKE :q OR variacao.tamanho LIKE :q OR variacao.genero LIKE :q OR avaria.descricao LIKE :q)',
        { q: `%${query.q}%` },
      );
    }

    qb.orderBy('avaria.createdAt', 'DESC');

    const offset = Math.max(0, query.offset ?? 0);
    const limit = Math.min(10, Math.max(1, query.limit ?? 10));
    const [data, total] = await qb.skip(offset).take(limit).getManyAndCount();
    const { totalQuantidade } = (await qb
      .clone()
      .select('COALESCE(SUM(avaria.quantidade), 0)', 'totalQuantidade')
      .getRawOne()) as { totalQuantidade: string | number };

    return {
      data: data.map((avaria) => ({
        id: avaria.id,
        movimentacaoId: avaria.movimentacao?.id ?? '',
        colaboradorId: avaria.movimentacao?.colaboradorId ?? '',
        colaboradorNome: avaria.movimentacao?.colaboradorNome ?? '',
        unidadeNome: avaria.movimentacao?.unidade?.nome ?? '-',
        tipoNome: avaria.variacao?.tipo?.nome ?? '-',
        variacaoLabel: `${avaria.variacao?.tamanho ?? '-'} - ${
          avaria.variacao?.genero ?? '-'
        }`,
        quantidade: avaria.quantidade,
        descricao: avaria.descricao,
        createdAt: avaria.createdAt,
      })),
      total,
      totalQuantidade: Number(totalQuantidade ?? 0),
      offset,
      limit,
    };
  }
}
