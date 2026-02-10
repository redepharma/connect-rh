import { Type } from 'class-transformer';
import {
  IsBooleanString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class EstoqueQueryDto {
  @IsOptional()
  @IsUUID('all')
  unidadeId?: string;

  @IsOptional()
  @IsUUID('all')
  tipoId?: string;

  @IsOptional()
  @IsUUID('all')
  variacaoId?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsBooleanString()
  baixoEstoque?: string;

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
