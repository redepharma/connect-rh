import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateVariacaoDto {
  @IsOptional()
  @IsUUID('all')
  tipoId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  tamanho?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  genero?: string;
}
