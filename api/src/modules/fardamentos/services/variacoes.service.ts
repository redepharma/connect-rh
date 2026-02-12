import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VariacaoEntity } from '../entities/variacao.entity';
import { TipoEntity } from '../entities/tipo.entity';
import { CreateVariacaoDto } from '../dto/create-variacao.dto';
import { UpdateVariacaoDto } from '../dto/update-variacao.dto';

@Injectable()
export class VariacoesService {
  constructor(
    @InjectRepository(VariacaoEntity, 'primary')
    private readonly variacoesRepository: Repository<VariacaoEntity>,
    @InjectRepository(TipoEntity, 'primary')
    private readonly tiposRepository: Repository<TipoEntity>,
  ) {}

  private async ensureUniqueCombination(params: {
    tipoId: string;
    tamanho: string;
    genero: string;
    excludeId?: string;
  }): Promise<void> {
    const qb = this.variacoesRepository
      .createQueryBuilder('variacao')
      .where('variacao.tipo_id = :tipoId', { tipoId: params.tipoId })
      .andWhere('LOWER(TRIM(variacao.tamanho)) = LOWER(TRIM(:tamanho))', {
        tamanho: params.tamanho,
      })
      .andWhere('LOWER(TRIM(variacao.genero)) = LOWER(TRIM(:genero))', {
        genero: params.genero,
      });

    if (params.excludeId) {
      qb.andWhere('variacao.id <> :excludeId', { excludeId: params.excludeId });
    }

    const existing = await qb.getOne();
    if (existing) {
      throw new ConflictException(
        'Ja existe uma variacao com este tipo, tamanho e genero.',
      );
    }
  }

  async create(dto: CreateVariacaoDto): Promise<VariacaoEntity> {
    const tipo = await this.tiposRepository.findOne({
      where: { id: dto.tipoId },
    });

    if (!tipo) {
      throw new BadRequestException('Tipo invalido');
    }

    await this.ensureUniqueCombination({
      tipoId: tipo.id,
      tamanho: dto.tamanho,
      genero: dto.genero,
    });

    const variacao = this.variacoesRepository.create({
      tipo,
      tamanho: dto.tamanho,
      genero: dto.genero,
    });

    return this.variacoesRepository.save(variacao);
  }

  async findAll(query?: {
    q?: string;
    tipoId?: string;
    offset?: number;
    limit?: number;
  }): Promise<{
    data: VariacaoEntity[];
    total: number;
    offset: number;
    limit: number;
  }> {
    const qb = this.variacoesRepository
      .createQueryBuilder('variacao')
      .leftJoinAndSelect('variacao.tipo', 'tipo');

    if (query?.q) {
      qb.andWhere(
        '(variacao.tamanho LIKE :q OR variacao.genero LIKE :q OR tipo.nome LIKE :q)',
        { q: `%${query.q}%` },
      );
    }

    if (query?.tipoId) {
      qb.andWhere('tipo.id = :tipoId', { tipoId: query.tipoId });
    }

    qb.orderBy('tipo.nome', 'ASC')
      .addOrderBy('variacao.tamanho', 'ASC')
      .addOrderBy('variacao.genero', 'ASC');
    const offset = Math.max(0, query?.offset ?? 0);
    const limit = Math.min(10, Math.max(1, query?.limit ?? 10));
    const [data, total] = await qb.skip(offset).take(limit).getManyAndCount();
    return { data, total, offset, limit };
  }

  async findOne(id: string): Promise<VariacaoEntity> {
    const variacao = await this.variacoesRepository.findOne({
      where: { id },
      relations: ['tipo'],
    });

    if (!variacao) {
      throw new NotFoundException('Variacao nao encontrada');
    }

    return variacao;
  }

  async update(id: string, dto: UpdateVariacaoDto): Promise<VariacaoEntity> {
    const variacao = await this.findOne(id);
    let finalTipo = variacao.tipo;
    let finalTamanho = variacao.tamanho;
    let finalGenero = variacao.genero;

    if (dto.tipoId) {
      const tipo = await this.tiposRepository.findOne({
        where: { id: dto.tipoId },
      });
      if (!tipo) {
        throw new BadRequestException('Tipo invalido');
      }
      finalTipo = tipo;
    }

    if (dto.tamanho) {
      finalTamanho = dto.tamanho;
    }

    if (dto.genero) {
      finalGenero = dto.genero;
    }

    await this.ensureUniqueCombination({
      tipoId: finalTipo.id,
      tamanho: finalTamanho,
      genero: finalGenero,
      excludeId: variacao.id,
    });

    variacao.tipo = finalTipo;
    variacao.tamanho = finalTamanho;
    variacao.genero = finalGenero;

    return this.variacoesRepository.save(variacao);
  }

  async remove(id: string): Promise<void> {
    const variacao = await this.findOne(id);
    await this.variacoesRepository.remove(variacao);
  }
}
