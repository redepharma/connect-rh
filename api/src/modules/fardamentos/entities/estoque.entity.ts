import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { UnidadeEntity } from './unidade.entity';
import { VariacaoEntity } from './variacao.entity';

@Entity('estoques_fardamento')
@Unique('uq_estoque_variacao_unidade', ['variacao', 'unidade'])
export class EstoqueEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => VariacaoEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variacao_id' })
  variacao: VariacaoEntity;

  @ManyToOne(() => UnidadeEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'unidade_id' })
  unidade: UnidadeEntity;

  @Column({ type: 'integer', default: 0 })
  total: number;

  @Column({ type: 'integer', default: 0 })
  reservado: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
