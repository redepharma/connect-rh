import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GerarTermoDto {
  @IsOptional()
  @IsString({ message: '[observacao] deve ser uma string.' })
  @MaxLength(255, { message: '[observacao] máximo de 255 caracteres.' })
  observacao?: string;
}
