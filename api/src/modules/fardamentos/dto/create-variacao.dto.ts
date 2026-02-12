import { IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class CreateVariacaoDto {
  @IsUUID('all')
  tipoId: string;

  @IsString()
  @MaxLength(40)
  @Matches(/^(?:[A-Za-zÀ-ÿ]+|\d+)$/, {
    message:
      '[tamanho] deve conter apenas letras ou apenas numeros (sem misturar).',
  })
  tamanho: string;

  @IsString()
  @MaxLength(40)
  genero: string;
}
