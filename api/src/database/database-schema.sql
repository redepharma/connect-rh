CREATE DATABASE IF NOT EXISTS connect_rh
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE connect_rh;

CREATE TABLE IF NOT EXISTS fardamento_status (
  id VARCHAR(30) NOT NULL,
  descricao VARCHAR(60) NOT NULL,
  CONSTRAINT pk_fardamento_status PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS fardamento_operacoes (
  id VARCHAR(30) NOT NULL,
  descricao VARCHAR(60) NOT NULL,
  CONSTRAINT pk_fardamento_operacoes PRIMARY KEY (id)
) ENGINE=InnoDB;

INSERT INTO fardamento_status (id, descricao) VALUES
  ('SEPARADO', 'Separado'),
  ('EM_TRANSITO', 'Em transito'),
  ('CONCLUIDO', 'Concluido'),
  ('CANCELADO', 'Cancelado')
ON DUPLICATE KEY UPDATE descricao = VALUES(descricao);

INSERT INTO fardamento_operacoes (id, descricao) VALUES
  ('ENTREGA', 'Entrega'),
  ('DEVOLUCAO', 'Devolucao')
ON DUPLICATE KEY UPDATE descricao = VALUES(descricao);

CREATE TABLE IF NOT EXISTS unidades (
  id CHAR(36) NOT NULL,
  nome VARCHAR(120) NOT NULL,
  descricao VARCHAR(255) NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_unidades PRIMARY KEY (id),
  CONSTRAINT uq_unidades_nome UNIQUE (nome)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tipos_fardamento (
  id CHAR(36) NOT NULL,
  nome VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_tipos_fardamento PRIMARY KEY (id),
  CONSTRAINT uq_tipos_fardamento_nome UNIQUE (nome)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tipo_unidades (
  tipo_id CHAR(36) NOT NULL,
  unidade_id CHAR(36) NOT NULL,
  CONSTRAINT pk_tipo_unidades PRIMARY KEY (tipo_id, unidade_id),
  CONSTRAINT fk_tipo_unidades_tipo FOREIGN KEY (tipo_id) REFERENCES tipos_fardamento(id) ON DELETE CASCADE,
  CONSTRAINT fk_tipo_unidades_unidade FOREIGN KEY (unidade_id) REFERENCES unidades(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS variacoes_fardamento (
  id CHAR(36) NOT NULL,
  tipo_id CHAR(36) NOT NULL,
  tamanho VARCHAR(40) NOT NULL,
  genero VARCHAR(40) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_variacoes_fardamento PRIMARY KEY (id),
  CONSTRAINT fk_variacoes_fardamento_tipo FOREIGN KEY (tipo_id) REFERENCES tipos_fardamento(id) ON DELETE CASCADE,
  CONSTRAINT uq_variacao_tipo_tamanho_genero UNIQUE (tipo_id, tamanho, genero)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS estoques_fardamento (
  id CHAR(36) NOT NULL,
  variacao_id CHAR(36) NOT NULL,
  unidade_id CHAR(36) NOT NULL,
  total INT NOT NULL DEFAULT 0,
  reservado INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_estoques_fardamento PRIMARY KEY (id),
  CONSTRAINT fk_estoques_variacao FOREIGN KEY (variacao_id) REFERENCES variacoes_fardamento(id) ON DELETE CASCADE,
  CONSTRAINT fk_estoques_unidade FOREIGN KEY (unidade_id) REFERENCES unidades(id) ON DELETE CASCADE,
  CONSTRAINT uq_estoque_variacao_unidade UNIQUE (variacao_id, unidade_id)
) ENGINE=InnoDB;

CREATE INDEX idx_estoque_unidade ON estoques_fardamento (unidade_id);
CREATE INDEX idx_estoque_variacao ON estoques_fardamento (variacao_id);

CREATE TABLE IF NOT EXISTS movimentacoes_fardamento (
  id CHAR(36) NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  unidade_id CHAR(36) NOT NULL,
  colaborador_id VARCHAR(120) NOT NULL,
  colaborador_nome VARCHAR(160) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_movimentacoes_fardamento PRIMARY KEY (id),
  CONSTRAINT fk_movimentacao_unidade FOREIGN KEY (unidade_id) REFERENCES unidades(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_movimentacoes_unidade ON movimentacoes_fardamento (unidade_id);
CREATE INDEX idx_movimentacoes_tipo ON movimentacoes_fardamento (tipo);
CREATE INDEX idx_movimentacoes_status ON movimentacoes_fardamento (status);
CREATE INDEX idx_movimentacoes_colaborador ON movimentacoes_fardamento (colaborador_id);
CREATE INDEX idx_movimentacoes_created_at ON movimentacoes_fardamento (created_at);

CREATE TABLE IF NOT EXISTS movimentacao_itens (
  id CHAR(36) NOT NULL,
  movimentacao_id CHAR(36) NOT NULL,
  variacao_id CHAR(36) NOT NULL,
  quantidade INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_movimentacao_itens PRIMARY KEY (id),
  CONSTRAINT fk_mov_item_mov FOREIGN KEY (movimentacao_id) REFERENCES movimentacoes_fardamento(id) ON DELETE CASCADE,
  CONSTRAINT fk_mov_item_variacao FOREIGN KEY (variacao_id) REFERENCES variacoes_fardamento(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_mov_item_variacao ON movimentacao_itens (variacao_id);

CREATE TABLE IF NOT EXISTS movimentacao_eventos (
  id CHAR(36) NOT NULL,
  movimentacao_id CHAR(36) NOT NULL,
  status VARCHAR(20) NOT NULL,
  usuario_id VARCHAR(120) NOT NULL,
  usuario_nome VARCHAR(160) NOT NULL,
  descricao VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_movimentacao_eventos PRIMARY KEY (id),
  CONSTRAINT fk_mov_evento_mov FOREIGN KEY (movimentacao_id) REFERENCES movimentacoes_fardamento(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_mov_evento_status ON movimentacao_eventos (status);
CREATE INDEX idx_mov_evento_created_at ON movimentacao_eventos (created_at);

CREATE TABLE IF NOT EXISTS termos_fardamento (
  id CHAR(36) NOT NULL,
  movimentacao_id CHAR(36) NOT NULL,
  versao INT NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  pdf_base64 LONGTEXT NOT NULL,
  usuario_id VARCHAR(120) NOT NULL,
  usuario_nome VARCHAR(160) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_termos_fardamento PRIMARY KEY (id),
  CONSTRAINT fk_termo_mov FOREIGN KEY (movimentacao_id) REFERENCES movimentacoes_fardamento(id) ON DELETE CASCADE,
  CONSTRAINT uq_termo_mov_versao UNIQUE (movimentacao_id, versao)
) ENGINE=InnoDB;

CREATE INDEX idx_termo_mov ON termos_fardamento (movimentacao_id);

CREATE TABLE IF NOT EXISTS avarias_fardamento (
  id CHAR(36) NOT NULL,
  movimentacao_id CHAR(36) NOT NULL,
  variacao_id CHAR(36) NOT NULL,
  quantidade INT NOT NULL,
  descricao VARCHAR(255) NULL,
  usuario_id VARCHAR(120) NOT NULL,
  usuario_nome VARCHAR(160) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_avarias_fardamento PRIMARY KEY (id),
  CONSTRAINT fk_avaria_mov FOREIGN KEY (movimentacao_id) REFERENCES movimentacoes_fardamento(id) ON DELETE CASCADE,
  CONSTRAINT fk_avaria_variacao FOREIGN KEY (variacao_id) REFERENCES variacoes_fardamento(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_avaria_mov ON avarias_fardamento (movimentacao_id);
CREATE INDEX idx_avaria_variacao ON avarias_fardamento (variacao_id);

CREATE TABLE IF NOT EXISTS colaborador_saldos (
  id CHAR(36) NOT NULL,
  colaborador_id VARCHAR(120) NOT NULL,
  variacao_id CHAR(36) NOT NULL,
  quantidade INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_colaborador_saldos PRIMARY KEY (id),
  CONSTRAINT fk_saldo_variacao FOREIGN KEY (variacao_id) REFERENCES variacoes_fardamento(id) ON DELETE CASCADE,
  CONSTRAINT uq_colaborador_variacao UNIQUE (colaborador_id, variacao_id)
) ENGINE=InnoDB;

CREATE INDEX idx_saldo_colaborador ON colaborador_saldos (colaborador_id);
