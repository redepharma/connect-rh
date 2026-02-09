import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UnidadeEntity } from './unidade.entity';
import { MovimentacaoItemEntity } from './movimentacao-item.entity';
import { MovimentacaoEventoEntity } from './movimentacao-evento.entity';

export type MovimentacaoTipo = 'ENTREGA' | 'DEVOLUCAO';
export type MovimentacaoStatus =
  | 'SEPARADO'
  | 'EM_TRANSITO'
  | 'CONCLUIDO'
  | 'CANCELADO';

@Entity('movimentacoes_fardamento')
export class MovimentacaoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  tipo: MovimentacaoTipo;

  @Column({ type: 'varchar', length: 20 })
  status: MovimentacaoStatus;

  @ManyToOne(() => UnidadeEntity, { nullable: false })
  @JoinColumn({ name: 'unidade_id' })
  unidade: UnidadeEntity;

  @Column({ name: 'colaborador_id', type: 'varchar', length: 120 })
  colaboradorId: string;

  @Column({ name: 'colaborador_nome', type: 'varchar', length: 160 })
  colaboradorNome: string;

  @OneToMany(() => MovimentacaoItemEntity, (item) => item.movimentacao, {
    cascade: true,
  })
  itens: MovimentacaoItemEntity[];

  @OneToMany(() => MovimentacaoEventoEntity, (evento) => evento.movimentacao, {
    cascade: true,
  })
  eventos: MovimentacaoEventoEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
