import { IsBooleanString, IsOptional, IsString, IsUUID } from 'class-validator';

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
}
