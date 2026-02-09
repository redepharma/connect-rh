import {
  ArrayNotEmpty,
  IsArray,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateTipoDto {
  @IsString()
  @MaxLength(120)
  nome: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  unidadesIds: string[];
}
