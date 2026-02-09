import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateUnidadeDto {
  @IsString()
  @MaxLength(120)
  nome: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  descricao?: string | null;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
