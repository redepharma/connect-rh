USE connect_rh;

SET @unidade_loja = UUID();
SET @unidade_escritorio = UUID();
SET @unidade_limpeza = UUID();
SET @unidade_bas = UUID();

INSERT INTO unidades (id, nome, descricao, ativo)
VALUES
  (@unidade_loja, 'Lojas', 'Atendimento e caixa', 1),
  (@unidade_escritorio, 'Escritorio', 'Administrativo', 1),
  (@unidade_limpeza, 'Limpeza', 'Equipe de limpeza', 1),
  (@unidade_bas, 'BAS', 'Base de apoio', 1)
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

SET @tipo_camisa = UUID();
SET @tipo_jaleco = UUID();
SET @tipo_calca = UUID();
SET @tipo_avental = UUID();

INSERT INTO tipos_fardamento (id, nome)
VALUES
  (@tipo_camisa, 'Camisa Polo'),
  (@tipo_jaleco, 'Jaleco'),
  (@tipo_calca, 'Calca Social'),
  (@tipo_avental, 'Avental')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

INSERT INTO tipo_unidades (tipo_id, unidade_id)
VALUES
  (@tipo_camisa, @unidade_loja),
  (@tipo_camisa, @unidade_bas),
  (@tipo_jaleco, @unidade_escritorio),
  (@tipo_jaleco, @unidade_bas),
  (@tipo_calca, @unidade_loja),
  (@tipo_calca, @unidade_escritorio),
  (@tipo_avental, @unidade_limpeza)
ON DUPLICATE KEY UPDATE tipo_id = tipo_id;

SET @var_camisa_p_m = UUID();
SET @var_camisa_m_f = UUID();
SET @var_jaleco_m = UUID();
SET @var_jaleco_g = UUID();
SET @var_calca_40 = UUID();
SET @var_avental_u = UUID();

INSERT INTO variacoes_fardamento (id, tipo_id, tamanho, genero)
VALUES
  (@var_camisa_p_m, @tipo_camisa, 'P', 'Masculino'),
  (@var_camisa_m_f, @tipo_camisa, 'M', 'Feminino'),
  (@var_jaleco_m, @tipo_jaleco, 'M', 'Unissex'),
  (@var_jaleco_g, @tipo_jaleco, 'G', 'Unissex'),
  (@var_calca_40, @tipo_calca, '40', 'Masculino'),
  (@var_avental_u, @tipo_avental, 'Unico', 'Unissex')
ON DUPLICATE KEY UPDATE tamanho = VALUES(tamanho);

INSERT INTO estoques_fardamento (id, variacao_id, unidade_id, total, reservado)
VALUES
  (UUID(), @var_camisa_p_m, @unidade_loja, 12, 4),
  (UUID(), @var_camisa_m_f, @unidade_bas, 3, 1),
  (UUID(), @var_jaleco_m, @unidade_escritorio, 2, 0),
  (UUID(), @var_calca_40, @unidade_loja, 8, 2),
  (UUID(), @var_avental_u, @unidade_limpeza, 1, 0)
ON DUPLICATE KEY UPDATE total = VALUES(total);
