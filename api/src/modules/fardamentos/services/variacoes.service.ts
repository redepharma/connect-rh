import {
  BadRequestException,
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

  async create(dto: CreateVariacaoDto): Promise<VariacaoEntity> {
    const tipo = await this.tiposRepository.findOne({
      where: { id: dto.tipoId },
    });

    if (!tipo) {
      throw new BadRequestException('Tipo invalido');
    }

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
  }): Promise<VariacaoEntity[]> {
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

    qb.orderBy('variacao.created_at', 'DESC');
    return qb.getMany();
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

    if (dto.tipoId) {
      const tipo = await this.tiposRepository.findOne({
        where: { id: dto.tipoId },
      });
      if (!tipo) {
        throw new BadRequestException('Tipo invalido');
      }
      variacao.tipo = tipo;
    }

    if (dto.tamanho) {
      variacao.tamanho = dto.tamanho;
    }

    if (dto.genero) {
      variacao.genero = dto.genero;
    }

    return this.variacoesRepository.save(variacao);
  }

  async remove(id: string): Promise<void> {
    const variacao = await this.findOne(id);
    await this.variacoesRepository.remove(variacao);
  }
}
