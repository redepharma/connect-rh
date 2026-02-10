import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnidadeEntity } from './entities/unidade.entity';
import { TipoEntity } from './entities/tipo.entity';
import { VariacaoEntity } from './entities/variacao.entity';
import { EstoqueEntity } from './entities/estoque.entity';
import { MovimentacaoEntity } from './entities/movimentacao.entity';
import { MovimentacaoItemEntity } from './entities/movimentacao-item.entity';
import { MovimentacaoEventoEntity } from './entities/movimentacao-evento.entity';
import { ColaboradorSaldoEntity } from './entities/colaborador-saldo.entity';
import { TermoEntity } from './entities/termo.entity';
import { AvariaEntity } from './entities/avaria.entity';
import { UnidadesService } from './services/unidades.service';
import { TiposService } from './services/tipos.service';
import { VariacoesService } from './services/variacoes.service';
import { EstoqueService } from './services/estoque.service';
import { MovimentacoesService } from './services/movimentacoes.service';
import { TermosService } from './services/termos.service';
import { AvariasService } from './services/avarias.service';
import { MetricasService } from './services/metricas.service';
import { UnidadesController } from './controllers/unidades.controller';
import { TiposController } from './controllers/tipos.controller';
import { VariacoesController } from './controllers/variacoes.controller';
import { EstoqueController } from './controllers/estoque.controller';
import { MovimentacoesController } from './controllers/movimentacoes.controller';
import { AvariasController } from './controllers/avarias.controller';
import { TermosController } from './controllers/termos.controller';
import { MetricasController } from './controllers/metricas.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature(
      [
        UnidadeEntity,
        TipoEntity,
        VariacaoEntity,
        EstoqueEntity,
        MovimentacaoEntity,
        MovimentacaoItemEntity,
        MovimentacaoEventoEntity,
        ColaboradorSaldoEntity,
        TermoEntity,
        AvariaEntity,
      ],
      'primary',
    ),
  ],
  controllers: [
    UnidadesController,
    TiposController,
    VariacoesController,
    EstoqueController,
    MovimentacoesController,
    AvariasController,
    TermosController,
    MetricasController,
  ],
  providers: [
    UnidadesService,
    TiposService,
    VariacoesService,
    EstoqueService,
    MovimentacoesService,
    TermosService,
    AvariasService,
    MetricasService,
  ],
})
export class FardamentosModule {}
