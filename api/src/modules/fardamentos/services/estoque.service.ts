import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstoqueEntity } from '../entities/estoque.entity';
import { EstoqueQueryDto } from '../dto/estoque-query.dto';
import { VariacaoEntity } from '../entities/variacao.entity';
import { UnidadeEntity } from '../entities/unidade.entity';
import { CreateEstoqueDto } from '../dto/create-estoque.dto';

@Injectable()
export class EstoqueService {
  constructor(
    @InjectRepository(EstoqueEntity, 'primary')
    private readonly estoqueRepository: Repository<EstoqueEntity>,
    @InjectRepository(VariacaoEntity, 'primary')
    private readonly variacoesRepository: Repository<VariacaoEntity>,
    @InjectRepository(UnidadeEntity, 'primary')
    private readonly unidadesRepository: Repository<UnidadeEntity>,
  ) {}

  async create(dto: CreateEstoqueDto): Promise<EstoqueEntity> {
    const variacao = await this.variacoesRepository.findOne({
      where: { id: dto.variacaoId },
      relations: ['tipo'],
    });

    if (!variacao) {
      throw new NotFoundException('Variação não encontrada');
    }

    const unidade = await this.unidadesRepository.findOne({
      where: { id: dto.unidadeId },
    });

    if (!unidade) {
      throw new NotFoundException('Unidade não encontrada');
    }

    const tipoDisponivelNaUnidade = await this.unidadesRepository
      .createQueryBuilder('unidade')
      .innerJoin(
        'tipo_unidades',
        'tipoUnidade',
        'tipoUnidade.unidade_id = unidade.id',
      )
      .where('unidade.id = :unidadeId', { unidadeId: unidade.id })
      .andWhere('tipoUnidade.tipo_id = :tipoId', { tipoId: variacao.tipo.id })
      .getExists();

    if (!tipoDisponivelNaUnidade) {
      throw new ConflictException(
        'A variação selecionada pertence a um tipo não vinculado à unidade informada.',
      );
    }

    const existing = await this.estoqueRepository.findOne({
      where: {
        variacao: { id: dto.variacaoId },
        unidade: { id: dto.unidadeId },
      },
      relations: ['variacao', 'unidade'],
    });

    const total = dto.total ?? 0;

    if (existing) {
      existing.total += total;
      return this.estoqueRepository.save(existing);
    }

    const estoque = this.estoqueRepository.create({
      variacao,
      unidade,
      total,
      reservado: 0,
    });

    return this.estoqueRepository.save(estoque);
  }

  async findAll(query: EstoqueQueryDto): Promise<{
    data: EstoqueEntity[];
    total: number;
    offset: number;
    limit: number;
  }> {
    const qb = this.estoqueRepository
      .createQueryBuilder('estoque')
      .leftJoinAndSelect('estoque.variacao', 'variacao')
      .leftJoinAndSelect('variacao.tipo', 'tipo')
      .leftJoinAndSelect('estoque.unidade', 'unidade');

    if (query.unidadeId) {
      qb.andWhere('unidade.id = :unidadeId', { unidadeId: query.unidadeId });
    }

    if (query.variacaoId) {
      qb.andWhere('variacao.id = :variacaoId', {
        variacaoId: query.variacaoId,
      });
    }

    if (query.tipoId) {
      qb.andWhere('tipo.id = :tipoId', { tipoId: query.tipoId });
    }

    if (query.q) {
      qb.andWhere(
        '(tipo.nome LIKE :q OR unidade.nome LIKE :q OR variacao.tamanho LIKE :q OR variacao.genero LIKE :q)',
        { q: `%${query.q}%` },
      );
    }

    if (query.baixoEstoque === 'true') {
      qb.andWhere('(estoque.total - estoque.reservado) < :minimo', {
        minimo: 3,
      });
    }

    qb.orderBy('tipo.nome', 'ASC');

    const offset = Math.max(0, query?.offset ?? 0);
    const limit = Math.min(10, Math.max(1, query?.limit ?? 10));
    const [data, total] = await qb.skip(offset).take(limit).getManyAndCount();
    return { data, total, offset, limit };
  }

  async findOne(id: string): Promise<EstoqueEntity> {
    const estoque = await this.estoqueRepository.findOne({
      where: { id },
      relations: ['variacao', 'variacao.tipo', 'unidade'],
    });

    if (!estoque) {
      throw new NotFoundException('Estoque nao encontrado');
    }

    return estoque;
  }
}
