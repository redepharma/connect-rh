import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MovimentacaoEntity } from './movimentacao.entity';
import { VariacaoEntity } from './variacao.entity';

@Entity('avarias_fardamento')
export class AvariaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MovimentacaoEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movimentacao_id' })
  movimentacao: MovimentacaoEntity;

  @ManyToOne(() => VariacaoEntity, { nullable: false })
  @JoinColumn({ name: 'variacao_id' })
  variacao: VariacaoEntity;

  @Column({ type: 'int' })
  quantidade: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descricao: string | null;

  @Column({ name: 'usuario_id', type: 'varchar', length: 120 })
  usuarioId: string;

  @Column({ name: 'usuario_nome', type: 'varchar', length: 160 })
  usuarioNome: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
