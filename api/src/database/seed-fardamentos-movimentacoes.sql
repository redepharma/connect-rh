USE connect_rh;

SET @user_id = 'seed_user_1';
SET @user_nome = 'Operador RH';

SELECT id INTO @unidade_loja FROM unidades WHERE nome = 'Lojas' LIMIT 1;
SELECT id INTO @unidade_bas FROM unidades WHERE nome = 'BAS' LIMIT 1;
SELECT id INTO @var_camisa FROM variacoes_fardamento WHERE tamanho = 'P' LIMIT 1;
SELECT id INTO @var_avental FROM variacoes_fardamento WHERE tamanho = 'Unico' LIMIT 1;

SET @mov_entrega = UUID();
INSERT INTO movimentacoes_fardamento (id, tipo, status, unidade_id, colaborador_id, colaborador_nome)
VALUES (@mov_entrega, 'ENTREGA', 'SEPARADO', @unidade_loja, 'colab_100', 'Paula Souza');

INSERT INTO movimentacao_itens (id, movimentacao_id, variacao_id, quantidade)
VALUES (UUID(), @mov_entrega, @var_camisa, 2);

UPDATE estoques_fardamento
SET reservado = reservado + 2
WHERE variacao_id = @var_camisa AND unidade_id = @unidade_loja;

INSERT INTO movimentacao_eventos (id, movimentacao_id, status, usuario_id, usuario_nome)
VALUES (UUID(), @mov_entrega, 'SEPARADO', @user_id, @user_nome);

SET @mov_devolucao = UUID();
INSERT INTO movimentacoes_fardamento (id, tipo, status, unidade_id, colaborador_id, colaborador_nome)
VALUES (@mov_devolucao, 'DEVOLUCAO', 'CONCLUIDO', @unidade_bas, 'colab_200', 'Marcos Lima');

INSERT INTO movimentacao_itens (id, movimentacao_id, variacao_id, quantidade)
VALUES (UUID(), @mov_devolucao, @var_avental, 1);

SET @saldo_id = UUID();
INSERT INTO colaborador_saldos (id, colaborador_id, variacao_id, quantidade)
VALUES (@saldo_id, 'colab_200', @var_avental, 2);

UPDATE colaborador_saldos
SET quantidade = quantidade - 1
WHERE id = @saldo_id;

UPDATE estoques_fardamento
SET total = total + 1
WHERE variacao_id = @var_avental AND unidade_id = @unidade_bas;

INSERT INTO movimentacao_eventos (id, movimentacao_id, status, usuario_id, usuario_nome)
VALUES (UUID(), @mov_devolucao, 'CONCLUIDO', @user_id, @user_nome);
