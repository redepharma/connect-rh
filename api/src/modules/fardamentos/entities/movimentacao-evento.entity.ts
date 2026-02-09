import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MovimentacaoEntity } from './movimentacao.entity';
import type { MovimentacaoStatus } from './movimentacao.entity';

@Entity('movimentacao_eventos')
export class MovimentacaoEventoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MovimentacaoEntity, (mov) => mov.eventos, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'movimentacao_id' })
  movimentacao: MovimentacaoEntity;

  @Column({ type: 'varchar', length: 20 })
  status: MovimentacaoStatus;

  @Column({ name: 'usuario_id', type: 'varchar', length: 120 })
  usuarioId: string;

  @Column({ name: 'usuario_nome', type: 'varchar', length: 160 })
  usuarioNome: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
