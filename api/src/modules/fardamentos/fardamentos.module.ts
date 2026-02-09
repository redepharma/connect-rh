import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnidadeEntity } from './entities/unidade.entity';
import { TipoEntity } from './entities/tipo.entity';
import { VariacaoEntity } from './entities/variacao.entity';
import { EstoqueEntity } from './entities/estoque.entity';
import { UnidadesService } from './services/unidades.service';
import { TiposService } from './services/tipos.service';
import { VariacoesService } from './services/variacoes.service';
import { EstoqueService } from './services/estoque.service';
import { UnidadesController } from './controllers/unidades.controller';
import { TiposController } from './controllers/tipos.controller';
import { VariacoesController } from './controllers/variacoes.controller';
import { EstoqueController } from './controllers/estoque.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [UnidadeEntity, TipoEntity, VariacaoEntity, EstoqueEntity],
      'primary',
    ),
  ],
  controllers: [
    UnidadesController,
    TiposController,
    VariacoesController,
    EstoqueController,
  ],
  providers: [UnidadesService, TiposService, VariacoesService, EstoqueService],
})
export class FardamentosModule {}
