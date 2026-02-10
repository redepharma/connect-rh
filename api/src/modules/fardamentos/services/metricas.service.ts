import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnidadeEntity } from '../entities/unidade.entity';
import { TipoEntity } from '../entities/tipo.entity';
import { VariacaoEntity } from '../entities/variacao.entity';
import { EstoqueEntity } from '../entities/estoque.entity';

const LOW_STOCK_THRESHOLD = 3;

@Injectable()
export class MetricasService {
  constructor(
    @InjectRepository(UnidadeEntity, 'primary')
    private readonly unidadeRepo: Repository<UnidadeEntity>,
    @InjectRepository(TipoEntity, 'primary')
    private readonly tipoRepo: Repository<TipoEntity>,
    @InjectRepository(VariacaoEntity, 'primary')
    private readonly variacaoRepo: Repository<VariacaoEntity>,
    @InjectRepository(EstoqueEntity, 'primary')
    private readonly estoqueRepo: Repository<EstoqueEntity>,
  ) {}

  async getDashboardMetrics() {
    const [unidades, tipos, variacoes] = await Promise.all([
      this.unidadeRepo.count(),
      this.tipoRepo.count(),
      this.variacaoRepo.count(),
    ]);

    const raw = await this.estoqueRepo
      .createQueryBuilder('estoque')
      .select('COALESCE(SUM(estoque.total), 0)', 'total')
      .addSelect('COALESCE(SUM(estoque.reservado), 0)', 'reservado')
      .addSelect(
        'COALESCE(SUM(CASE WHEN (estoque.total - estoque.reservado) < :min THEN 1 ELSE 0 END), 0)',
        'lowStock',
      )
      .setParameter('min', LOW_STOCK_THRESHOLD)
      .getRawOne();

    return {
      unidades,
      tipos,
      variacoes,
      estoqueTotal: Number(raw?.total ?? 0),
      estoqueReservado: Number(raw?.reservado ?? 0),
      lowStockCount: Number(raw?.lowStock ?? 0),
    };
  }
}
