import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnidadeEntity } from '../entities/unidade.entity';
import { CreateUnidadeDto } from '../dto/create-unidade.dto';
import { UpdateUnidadeDto } from '../dto/update-unidade.dto';

@Injectable()
export class UnidadesService {
  constructor(
    @InjectRepository(UnidadeEntity, 'primary')
    private readonly unidadesRepository: Repository<UnidadeEntity>,
  ) {}

  async create(dto: CreateUnidadeDto): Promise<UnidadeEntity> {
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

    this.unidadesRepository.merge(unidade, {
      ...dto,
      descricao: dto.descricao ?? unidade.descricao,
    });

    return this.unidadesRepository.save(unidade);
  }

  async remove(id: string): Promise<void> {
    const unidade = await this.findOne(id);
    await this.unidadesRepository.remove(unidade);
  }
}
