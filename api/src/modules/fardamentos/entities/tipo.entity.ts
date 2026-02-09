import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UnidadeEntity } from './unidade.entity';

@Entity('tipos_fardamento')
export class TipoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 120 })
  nome: string;

  @ManyToMany(() => UnidadeEntity)
  @JoinTable({
    name: 'tipo_unidades',
    joinColumn: { name: 'tipo_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'unidade_id', referencedColumnName: 'id' },
  })
  unidades: UnidadeEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
