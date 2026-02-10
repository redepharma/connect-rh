export type Avaria = {
  id: string;
  movimentacaoId: string;
  colaboradorId: string;
  colaboradorNome: string;
  unidadeNome: string;
  tipoNome: string;
  variacaoLabel: string;
  quantidade: number;
  descricao: string | null;
  createdAt: string;
};

export type CreateAvariaItem = {
  variacaoId: string;
  quantidade: number;
  descricao?: string | null;
};
