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
import { TipoEntity } from './tipo.entity';

@Entity('variacoes_fardamento')
@Unique('uq_variacao_tipo_tamanho_genero', ['tipo', 'tamanho', 'genero'])
export class VariacaoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TipoEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tipo_id' })
  tipo: TipoEntity;

  @Column({ length: 40 })
  tamanho: string;

  @Column({ length: 40 })
  genero: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
