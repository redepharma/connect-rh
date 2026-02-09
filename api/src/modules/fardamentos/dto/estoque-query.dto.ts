import { IsBooleanString, IsOptional, IsUUID } from 'class-validator';

export class EstoqueQueryDto {
  @IsOptional()
  @IsUUID('4')
  unidadeId?: string;

  @IsOptional()
  @IsUUID('4')
  tipoId?: string;

  @IsOptional()
  @IsUUID('4')
  variacaoId?: string;

  @IsOptional()
  @IsBooleanString()
  baixoEstoque?: string;
}
