import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstoqueEntity } from '../entities/estoque.entity';
import { EstoqueQueryDto } from '../dto/estoque-query.dto';

@Injectable()
export class EstoqueService {
  constructor(
    @InjectRepository(EstoqueEntity, 'primary')
    private readonly estoqueRepository: Repository<EstoqueEntity>,
  ) {}

  async findAll(query: EstoqueQueryDto): Promise<EstoqueEntity[]> {
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

    if (query.baixoEstoque === 'true') {
      qb.andWhere('(estoque.total - estoque.reservado) < :minimo', {
        minimo: 3,
      });
    }

    qb.orderBy('tipo.nome', 'ASC');

    return qb.getMany();
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
