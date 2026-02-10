import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
