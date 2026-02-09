import type { Unidade, TipoFardamento, Variacao, EstoqueItem } from "./fardamentos.types";

export const unidadesMock: Unidade[] = [
  { id: "uni_loja", nome: "Lojas", descricao: "Atendimento e caixa", ativo: true },
  { id: "uni_escritorio", nome: "Escritorio", descricao: "Administrativo", ativo: true },
  { id: "uni_limpeza", nome: "Limpeza", descricao: "Equipe de limpeza", ativo: true },
  { id: "uni_bas", nome: "BAS", descricao: "Base de apoio", ativo: true },
];

export const tiposMock: TipoFardamento[] = [
  { id: "tipo_camisa_polo", nome: "Camisa Polo", unidades: ["Lojas", "BAS"], variacoesCount: 6 },
  { id: "tipo_jaleco", nome: "Jaleco", unidades: ["Escritorio", "BAS"], variacoesCount: 4 },
  { id: "tipo_calca", nome: "Calca Social", unidades: ["Lojas", "Escritorio"], variacoesCount: 5 },
  { id: "tipo_avental", nome: "Avental", unidades: ["Limpeza"], variacoesCount: 3 },
];

export const variacoesMock: Variacao[] = [
  { id: "var_polo_p_m", tipoId: "tipo_camisa_polo", tipoNome: "Camisa Polo", tamanho: "P", genero: "Masculino" },
  { id: "var_polo_m_f", tipoId: "tipo_camisa_polo", tipoNome: "Camisa Polo", tamanho: "M", genero: "Feminino" },
  { id: "var_jaleco_m", tipoId: "tipo_jaleco", tipoNome: "Jaleco", tamanho: "M", genero: "Unissex" },
  { id: "var_jaleco_g", tipoId: "tipo_jaleco", tipoNome: "Jaleco", tamanho: "G", genero: "Unissex" },
  { id: "var_calca_40", tipoId: "tipo_calca", tipoNome: "Calca Social", tamanho: "40", genero: "Masculino" },
  { id: "var_avental_u", tipoId: "tipo_avental", tipoNome: "Avental", tamanho: "Unico", genero: "Unissex" },
];

export const estoqueMock: EstoqueItem[] = [
  {
    id: "est_1",
    variacaoId: "var_polo_p_m",
    tipoNome: "Camisa Polo",
    variacaoLabel: "P - Masculino",
    unidade: "Lojas",
    total: 12,
    reservado: 4,
  },
  {
    id: "est_2",
    variacaoId: "var_polo_m_f",
    tipoNome: "Camisa Polo",
    variacaoLabel: "M - Feminino",
    unidade: "BAS",
    total: 3,
    reservado: 1,
  },
  {
    id: "est_3",
    variacaoId: "var_jaleco_m",
    tipoNome: "Jaleco",
    variacaoLabel: "M - Unissex",
    unidade: "Escritorio",
    total: 2,
    reservado: 0,
  },
  {
    id: "est_4",
    variacaoId: "var_calca_40",
    tipoNome: "Calca Social",
    variacaoLabel: "40 - Masculino",
    unidade: "Lojas",
    total: 8,
    reservado: 2,
  },
  {
    id: "est_5",
    variacaoId: "var_avental_u",
    tipoNome: "Avental",
    variacaoLabel: "Unico - Unissex",
    unidade: "Limpeza",
    total: 1,
    reservado: 0,
  },
];
