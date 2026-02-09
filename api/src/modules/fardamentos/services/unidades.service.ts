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

  async findAll(): Promise<UnidadeEntity[]> {
    return this.unidadesRepository.find({ order: { nome: 'ASC' } });
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
