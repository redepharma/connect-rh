import { IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateVariacaoDto {
  @IsUUID('all')
  tipoId: string;

  @IsString()
  @MaxLength(40)
  tamanho: string;

  @IsString()
  @MaxLength(40)
  genero: string;
}
