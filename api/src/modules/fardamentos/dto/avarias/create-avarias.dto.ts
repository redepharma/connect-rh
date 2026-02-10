import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateAvariaItemDto {
  @IsUUID('all', { message: '[variacaoId] deve ser um UUID válido.' })
  variacaoId: string;

  @IsInt({ message: '[quantidade] deve ser um número inteiro.' })
  @Min(1, { message: '[quantidade] deve ser maior ou igual a 1.' })
  quantidade: number;

  @IsOptional()
  @IsString({ message: '[descricao] deve ser uma string.' })
  @MaxLength(255, { message: '[descricao] máximo de 255 caracteres.' })
  descricao?: string;
}

export class CreateAvariasDto {
  @IsArray({ message: '[itens] deve ser um array.' })
  itens: CreateAvariaItemDto[];
}
