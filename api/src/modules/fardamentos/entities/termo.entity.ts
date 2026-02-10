import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MovimentacaoEntity } from './movimentacao.entity';
import type { MovimentacaoTipo } from './movimentacao.entity';

@Entity('termos_fardamento')
export class TermoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MovimentacaoEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movimentacao_id' })
  movimentacao: MovimentacaoEntity;

  @Column({ type: 'int' })
  versao: number;

  @Column({ type: 'varchar', length: 20 })
  tipo: MovimentacaoTipo;

  @Column({ name: 'pdf_base64', type: 'longtext' })
  pdfBase64: string;

  @Column({ name: 'usuario_id', type: 'varchar', length: 120 })
  usuarioId: string;

  @Column({ name: 'usuario_nome', type: 'varchar', length: 160 })
  usuarioNome: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
