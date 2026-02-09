import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateVariacaoDto {
  @IsOptional()
  @IsUUID('4')
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
