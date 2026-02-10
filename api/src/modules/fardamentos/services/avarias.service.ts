import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AvariaEntity } from '../entities/avaria.entity';
import { MovimentacaoEntity } from '../entities/movimentacao.entity';
import { EstoqueEntity } from '../entities/estoque.entity';
import { VariacaoEntity } from '../entities/variacao.entity';
import type { CreateAvariasDto } from '../dto/avarias/create-avarias.dto';
import type { RequestUser } from '../../auth/types/auth.types';

@Injectable()
export class AvariasService {
  constructor(
    @InjectRepository(AvariaEntity, 'primary')
    private readonly avariasRepo: Repository<AvariaEntity>,
    @InjectRepository(MovimentacaoEntity, 'primary')
    private readonly movRepo: Repository<MovimentacaoEntity>,
    @InjectRepository(EstoqueEntity, 'primary')
    private readonly estoqueRepo: Repository<EstoqueEntity>,
    @InjectRepository(VariacaoEntity, 'primary')
    private readonly variacaoRepo: Repository<VariacaoEntity>,
  ) {}

  async registrarAvarias(
    movimentacaoId: string,
    dto: CreateAvariasDto,
    user: RequestUser,
  ) {
    const movimentacao = await this.movRepo.findOne({
      where: { id: movimentacaoId },
      relations: ['unidade'],
    });

    if (!movimentacao) {
      throw new NotFoundException('Movimentação não encontrada.');
    }

    if (movimentacao.tipo !== 'DEVOLUCAO') {
      throw new BadRequestException(
        'Avaria só pode ser registrada em devoluções.',
      );
    }

    if (movimentacao.status !== 'CONCLUIDO') {
      throw new BadRequestException(
        'Avaria só pode ser registrada após conclusão.',
      );
    }

    if (!dto.itens || dto.itens.length === 0) {
      throw new BadRequestException('Informe ao menos uma avaria.');
    }

    const variacoesIds = dto.itens.map((item) => item.variacaoId);
    const variacoes = await this.variacaoRepo.find({
      where: { id: In(variacoesIds) },
    });
    const variacaoMap = new Map(variacoes.map((v) => [v.id, v]));

    const avarias: AvariaEntity[] = [];

    for (const item of dto.itens) {
      const variacao = variacaoMap.get(item.variacaoId);
      if (!variacao) {
        throw new NotFoundException('Variação não encontrada.');
      }

      const estoque = await this.estoqueRepo.findOne({
        where: {
          variacao: { id: variacao.id },
          unidade: { id: movimentacao.unidade?.id },
        },
        relations: ['variacao', 'unidade'],
      });

      if (!estoque) {
        throw new NotFoundException('Estoque não encontrado para a variação.');
      }

      if (estoque.total < item.quantidade) {
        throw new BadRequestException(
          'Quantidade de avaria maior que o estoque total disponível.',
        );
      }

      estoque.total -= item.quantidade;
      await this.estoqueRepo.save(estoque);

      avarias.push(
        this.avariasRepo.create({
          movimentacao,
          variacao,
          quantidade: item.quantidade,
          descricao: item.descricao ?? null,
          usuarioId: String(user.id ?? ''),
          usuarioNome: user.nome ?? user.usuario ?? 'Usuário',
        }),
      );
    }

    const saved = await this.avariasRepo.save(avarias);

    return saved.map((avaria) => ({
      id: avaria.id,
      variacaoId: avaria.variacao?.id,
      quantidade: avaria.quantidade,
      descricao: avaria.descricao,
      createdAt: avaria.createdAt,
    }));
  }
}
