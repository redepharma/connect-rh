export type Unidade = {
  id: string;
  nome: string;
  descricao?: string | null;
  ativo: boolean;
};

export type TipoFardamento = {
  id: string;
  nome: string;
  unidades: string[];
  variacoesCount: number;
};

export type Variacao = {
  id: string;
  tipoId: string;
  tipoNome: string;
  tamanho: string;
  genero: string;
};

export type EstoqueItem = {
  id: string;
  variacaoId: string;
  tipoNome: string;
  variacaoLabel: string;
  unidade: string;
  total: number;
  reservado: number;
};

export type TipoResponse = {
  id: string;
  nome: string;
  unidades: { id: string; nome: string }[];
};

export type VariacaoResponse = {
  id: string;
  tamanho: string;
  genero: string;
  tipo: { id: string; nome: string };
};

export type EstoqueResponse = {
  id: string;
  total: number;
  reservado: number;
  unidade: { id: string; nome: string };
  variacao: {
    id: string;
    tamanho: string;
    genero: string;
    tipo: { nome: string };
  };
};
