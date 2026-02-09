import { MovimentacaoStatus, MovimentacaoTipo } from "./movimentacoes.enums";

export type MovimentacaoItem = {
  id: string;
  variacaoId: string;
  tipoNome: string;
  variacaoLabel: string;
  quantidade: number;
};

export type Movimentacao = {
  id: string;
  tipo: MovimentacaoTipo;
  status: MovimentacaoStatus;
  unidadeId: string;
  unidadeNome: string;
  colaboradorId: string;
  colaboradorNome: string;
  createdAt: string;
  itens: MovimentacaoItem[];
};
