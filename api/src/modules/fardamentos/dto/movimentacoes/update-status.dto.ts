import { IsIn } from 'class-validator';

export class UpdateStatusDto {
  @IsIn(['SEPARADO', 'EM_TRANSITO', 'CONCLUIDO', 'CANCELADO'])
  status: 'SEPARADO' | 'EM_TRANSITO' | 'CONCLUIDO' | 'CANCELADO';
}
