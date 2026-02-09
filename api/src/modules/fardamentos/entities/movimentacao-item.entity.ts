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

@Entity('movimentacao_itens')
export class MovimentacaoItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MovimentacaoEntity, (mov) => mov.itens, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'movimentacao_id' })
  movimentacao: MovimentacaoEntity;

  @ManyToOne(() => VariacaoEntity, { nullable: false })
  @JoinColumn({ name: 'variacao_id' })
  variacao: VariacaoEntity;

  @Column({ type: 'integer' })
  quantidade: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
