import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class ListAvariasDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsUUID('all')
  movimentacaoId?: string;

  @IsOptional()
  @IsUUID('all')
  unidadeId?: string;

  @IsOptional()
  @IsUUID('all')
  colaboradorId?: string;

  @IsOptional()
  @IsUUID('all')
  tipoId?: string;

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
