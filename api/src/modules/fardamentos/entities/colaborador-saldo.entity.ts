import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { VariacaoEntity } from './variacao.entity';

@Entity('colaborador_saldos')
@Unique('uq_colaborador_variacao', ['colaboradorId', 'variacao'])
export class ColaboradorSaldoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'colaborador_id', type: 'varchar', length: 120 })
  colaboradorId: string;

  @ManyToOne(() => VariacaoEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variacao_id' })
  variacao: VariacaoEntity;

  @Column({ type: 'integer', default: 0 })
  quantidade: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
