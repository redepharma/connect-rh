import { ArrayMinSize, IsArray, IsInt, IsString, IsUUID, Min } from 'class-validator';

export class DevolucaoItemDto {
  @IsUUID('all')
  variacaoId: string;

  @IsInt()
  @Min(1)
  quantidade: number;
}

export class CreateDevolucaoDto {
  @IsUUID('all')
  unidadeId: string;

  @IsString()
  colaboradorId: string;

  @IsString()
  colaboradorNome: string;

  @IsArray()
  @ArrayMinSize(1)
  itens: DevolucaoItemDto[];
}
