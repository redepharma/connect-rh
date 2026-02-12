import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateEstoqueDto {
  @IsUUID('all')
  variacaoId: string;

  @IsUUID('all')
  unidadeId: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  total?: number;
}
