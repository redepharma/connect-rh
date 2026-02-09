import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class ListMovimentacoesDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsUUID('all')
  unidadeId?: string;

  @IsOptional()
  @IsIn(['ENTREGA', 'DEVOLUCAO'])
  tipo?: 'ENTREGA' | 'DEVOLUCAO';

  @IsOptional()
  @IsIn(['SEPARADO', 'EM_TRANSITO', 'CONCLUIDO', 'CANCELADO'])
  status?: 'SEPARADO' | 'EM_TRANSITO' | 'CONCLUIDO' | 'CANCELADO';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
