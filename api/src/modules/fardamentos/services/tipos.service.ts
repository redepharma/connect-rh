import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoEntity } from '../entities/tipo.entity';
import { UnidadeEntity } from '../entities/unidade.entity';
import { VariacaoEntity } from '../entities/variacao.entity';
import { CreateTipoDto } from '../dto/create-tipo.dto';
import { UpdateTipoDto } from '../dto/update-tipo.dto';

@Injectable()
export class TiposService {
  constructor(
    @InjectRepository(TipoEntity, 'primary')
    private readonly tiposRepository: Repository<TipoEntity>,
    @InjectRepository(UnidadeEntity, 'primary')
    private readonly unidadesRepository: Repository<UnidadeEntity>,
    @InjectRepository(VariacaoEntity, 'primary')
    private readonly variacoesRepository: Repository<VariacaoEntity>,
  ) {}

  private async ensureUniqueName(
    nome: string,
    excludeId?: string,
  ): Promise<void> {
    const qb = this.tiposRepository
      .createQueryBuilder('tipo')
      .where('LOWER(tipo.nome) = LOWER(:nome)', { nome: nome.trim() });

    if (excludeId) {
      qb.andWhere('tipo.id <> :excludeId', { excludeId });
    }

    const existing = await qb.getOne();
    if (existing) {
      throw new ConflictException('Ja existe um tipo com este nome.');
    }
  }

  async create(dto: CreateTipoDto): Promise<TipoEntity> {
    await this.ensureUniqueName(dto.nome);

    const unidades = await this.unidadesRepository.find({
      where: dto.unidadesIds.map((id) => ({ id })),
    });

    if (unidades.length !== dto.unidadesIds.length) {
      throw new BadRequestException('Unidades invalidas para o tipo');
    }

    const tipo = this.tiposRepository.create({
      nome: dto.nome,
      unidades,
    });

    return this.tiposRepository.save(tipo);
  }

  async findAll(query?: {
    q?: string;
    unidadeId?: string;
    offset?: number;
    limit?: number;
  }): Promise<{
    data: Array<TipoEntity & { variacoesCount: number }>;
    total: number;
    offset: number;
    limit: number;
  }> {
    const qb = this.tiposRepository
      .createQueryBuilder('tipo')
      .leftJoinAndSelect('tipo.unidades', 'unidade');

    if (query?.q) {
      qb.andWhere('tipo.nome LIKE :q', { q: `%${query.q}%` });
    }

    if (query?.unidadeId) {
      qb.andWhere('unidade.id = :unidadeId', { unidadeId: query.unidadeId });
    }

    qb.orderBy('tipo.nome', 'ASC');
    const offset = Math.max(0, query?.offset ?? 0);
    const limit = Math.min(10, Math.max(1, query?.limit ?? 10));
    const [data, total] = await qb.skip(offset).take(limit).getManyAndCount();

    const tipoIds = data.map((tipo) => tipo.id);
    const variacoesCountByTipoId = new Map<string, number>();

    if (tipoIds.length > 0) {
      const rawCounts = await this.variacoesRepository
        .createQueryBuilder('variacao')
        .select('variacao.tipo_id', 'tipoId')
        .addSelect('COUNT(variacao.id)', 'total')
        .where('variacao.tipo_id IN (:...tipoIds)', { tipoIds })
        .groupBy('variacao.tipo_id')
        .getRawMany<{ tipoId: string; total: string }>();

      for (const item of rawCounts) {
        variacoesCountByTipoId.set(item.tipoId, Number(item.total) || 0);
      }
    }

    const dataWithCount = data.map((tipo) =>
      Object.assign(tipo, {
        variacoesCount: variacoesCountByTipoId.get(tipo.id) ?? 0,
      }),
    );

    return { data: dataWithCount, total, offset, limit };
  }

  async findOne(id: string): Promise<TipoEntity> {
    const tipo = await this.tiposRepository.findOne({
      where: { id },
      relations: ['unidades'],
    });

    if (!tipo) {
      throw new NotFoundException('Tipo nao encontrado');
    }

    return tipo;
  }

  async update(id: string, dto: UpdateTipoDto): Promise<TipoEntity> {
    const tipo = await this.findOne(id);

    if (dto.unidadesIds) {
      const unidades = await this.unidadesRepository.find({
        where: dto.unidadesIds.map((unitId) => ({ id: unitId })),
      });

      if (unidades.length !== dto.unidadesIds.length) {
        throw new BadRequestException('Unidades invalidas para o tipo');
      }

      tipo.unidades = unidades;
    }

    if (dto.nome) {
      if (dto.nome.trim().toLowerCase() !== tipo.nome.toLowerCase()) {
        await this.ensureUniqueName(dto.nome, id);
      }
      tipo.nome = dto.nome;
    }

    return this.tiposRepository.save(tipo);
  }

  async remove(id: string): Promise<void> {
    const tipo = await this.findOne(id);
    await this.tiposRepository.remove(tipo);
  }
}
