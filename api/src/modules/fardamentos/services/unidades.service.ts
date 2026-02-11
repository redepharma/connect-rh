import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnidadeEntity } from '../entities/unidade.entity';
import { MovimentacaoEntity } from '../entities/movimentacao.entity';
import { EstoqueEntity } from '../entities/estoque.entity';
import { TipoEntity } from '../entities/tipo.entity';
import { CreateUnidadeDto } from '../dto/create-unidade.dto';
import { UpdateUnidadeDto } from '../dto/update-unidade.dto';

@Injectable()
export class UnidadesService {
  constructor(
    @InjectRepository(UnidadeEntity, 'primary')
    private readonly unidadesRepository: Repository<UnidadeEntity>,
    @InjectRepository(MovimentacaoEntity, 'primary')
    private readonly movimentacoesRepository: Repository<MovimentacaoEntity>,
    @InjectRepository(EstoqueEntity, 'primary')
    private readonly estoqueRepository: Repository<EstoqueEntity>,
    @InjectRepository(TipoEntity, 'primary')
    private readonly tiposRepository: Repository<TipoEntity>,
  ) {}

  private async ensureUniqueName(
    nome: string,
    excludeId?: string,
  ): Promise<void> {
    const qb = this.unidadesRepository
      .createQueryBuilder('unidade')
      .where('LOWER(unidade.nome) = LOWER(:nome)', { nome: nome.trim() });

    if (excludeId) {
      qb.andWhere('unidade.id <> :excludeId', { excludeId });
    }

    const existing = await qb.getOne();
    if (existing) {
      throw new ConflictException('Ja existe uma unidade com este nome.');
    }
  }

  async getDeleteImpact(id: string): Promise<{
    unidadeId: string;
    estoquesVinculados: number;
    tiposVinculados: number;
    movimentacoesVinculadas: number;
    bloqueiaExclusao: boolean;
  }> {
    await this.findOne(id);

    const [estoquesVinculados, tiposVinculados, movimentacoesVinculadas] =
      await Promise.all([
        this.estoqueRepository.count({ where: { unidade: { id } } }),
        this.tiposRepository
          .createQueryBuilder('tipo')
          .innerJoin('tipo.unidades', 'unidade', 'unidade.id = :id', { id })
          .getCount(),
        this.movimentacoesRepository.count({ where: { unidade: { id } } }),
      ]);

    return {
      unidadeId: id,
      estoquesVinculados,
      tiposVinculados,
      movimentacoesVinculadas,
      bloqueiaExclusao: movimentacoesVinculadas > 0,
    };
  }

  async create(dto: CreateUnidadeDto): Promise<UnidadeEntity> {
    await this.ensureUniqueName(dto.nome);

    const unidade = this.unidadesRepository.create({
      nome: dto.nome,
      descricao: dto.descricao ?? null,
      ativo: dto.ativo ?? true,
    });

    return this.unidadesRepository.save(unidade);
  }

  async findAll(query?: {
    q?: string;
    offset?: number;
    limit?: number;
  }): Promise<{
    data: UnidadeEntity[];
    total: number;
    offset: number;
    limit: number;
  }> {
    const qb = this.unidadesRepository.createQueryBuilder('unidade');

    if (query?.q) {
      qb.andWhere('(unidade.nome LIKE :q OR unidade.descricao LIKE :q)', {
        q: `%${query.q}%`,
      });
    }

    qb.orderBy('unidade.nome', 'ASC');
    const offset = Math.max(0, query?.offset ?? 0);
    const limit = Math.min(10, Math.max(1, query?.limit ?? 10));
    const [data, total] = await qb.skip(offset).take(limit).getManyAndCount();
    return { data, total, offset, limit };
  }

  async findOne(id: string): Promise<UnidadeEntity> {
    const unidade = await this.unidadesRepository.findOne({ where: { id } });

    if (!unidade) {
      throw new NotFoundException('Unidade nao encontrada');
    }

    return unidade;
  }

  async update(id: string, dto: UpdateUnidadeDto): Promise<UnidadeEntity> {
    const unidade = await this.findOne(id);

    if (dto.nome && dto.nome.trim().toLowerCase() !== unidade.nome.toLowerCase()) {
      await this.ensureUniqueName(dto.nome, id);
    }

    this.unidadesRepository.merge(unidade, {
      ...dto,
      descricao: dto.descricao ?? unidade.descricao,
    });

    return this.unidadesRepository.save(unidade);
  }

  async remove(id: string): Promise<void> {
    const unidade = await this.findOne(id);
    const impact = await this.getDeleteImpact(id);

    if (impact.bloqueiaExclusao) {
      throw new ConflictException(
        'Nao e possivel excluir a unidade porque existem movimentacoes vinculadas a ela.',
      );
    }

    await this.unidadesRepository.remove(unidade);
  }
}
