import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ListQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsUUID('all')
  unidadeId?: string;

  @IsOptional()
  @IsUUID('all')
  tipoId?: string;
}
