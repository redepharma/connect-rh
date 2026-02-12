import {
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateVariacaoDto {
  @IsOptional()
  @IsUUID('all')
  tipoId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Matches(/^(?:[A-Za-zÀ-ÿ]+|\d+)$/, {
    message:
      '[tamanho] deve conter apenas letras ou apenas numeros (sem misturar).',
  })
  tamanho?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  genero?: string;
}
