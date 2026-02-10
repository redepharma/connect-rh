import { Module } from '@nestjs/common';
import { ImportacaoController } from './controllers/importacao.controller';
import { ImportacaoService } from './services/importacao.service';

@Module({
  controllers: [ImportacaoController],
  providers: [ImportacaoService],
})
export class InstitucionalModule {}
