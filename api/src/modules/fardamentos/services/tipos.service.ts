import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoEntity } from '../entities/tipo.entity';
import { UnidadeEntity } from '../entities/unidade.entity';
import { CreateTipoDto } from '../dto/create-tipo.dto';
import { UpdateTipoDto } from '../dto/update-tipo.dto';

@Injectable()
export class TiposService {
  constructor(
    @InjectRepository(TipoEntity, 'primary')
    private readonly tiposRepository: Repository<TipoEntity>,
    @InjectRepository(UnidadeEntity, 'primary')
    private readonly unidadesRepository: Repository<UnidadeEntity>,
  ) {}

  async create(dto: CreateTipoDto): Promise<TipoEntity> {
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
    data: TipoEntity[];
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
    return { data, total, offset, limit };
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
      tipo.nome = dto.nome;
    }

    return this.tiposRepository.save(tipo);
  }

  async remove(id: string): Promise<void> {
    const tipo = await this.findOne(id);
    await this.tiposRepository.remove(tipo);
  }
}
