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

  async findAll(): Promise<TipoEntity[]> {
    return this.tiposRepository.find({
      relations: ['unidades'],
      order: { nome: 'ASC' },
    });
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
