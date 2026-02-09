import type {
  EstoqueItem,
  EstoqueResponse,
  TipoFardamento,
  TipoResponse,
  Unidade,
  Variacao,
  VariacaoResponse,
} from "@/modules/fardamentos/types/fardamentos.types";
import { apiClient } from "@/shared/api-client.service";

export const fetchUnidades = (q?: string) =>
  apiClient<Unidade[]>("/fardamentos/unidades", {
    method: "GET",
    query: q ? { q } : undefined,
  });

export const createUnidade = (data: {
  nome: string;
  descricao?: string | null;
  ativo?: boolean;
}) =>
  apiClient<Unidade>("/fardamentos/unidades", {
    method: "POST",
    body: data,
  });

export const updateUnidade = (
  id: string,
  data: { nome?: string; descricao?: string | null; ativo?: boolean },
) =>
  apiClient<Unidade>(`/fardamentos/unidades/${id}`, {
    method: "PUT",
    body: data,
  });

export const deleteUnidade = (id: string) =>
  apiClient<{ ok: boolean }>(`/fardamentos/unidades/${id}`, {
    method: "DELETE",
  });

export const fetchTipos = (q?: string, unidadeId?: string) =>
  apiClient<TipoResponse[]>("/fardamentos/tipos", {
    method: "GET",
    query: { q, unidadeId },
  });

export const createTipo = (data: { nome: string; unidadesIds: string[] }) =>
  apiClient<TipoResponse>("/fardamentos/tipos", {
    method: "POST",
    body: data,
  });

export const updateTipo = (
  id: string,
  data: { nome?: string; unidadesIds?: string[] },
) =>
  apiClient<TipoResponse>(`/fardamentos/tipos/${id}`, {
    method: "PUT",
    body: data,
  });

export const deleteTipo = (id: string) =>
  apiClient<{ ok: boolean }>(`/fardamentos/tipos/${id}`, {
    method: "DELETE",
  });

export const fetchVariacoes = (q?: string, tipoId?: string) =>
  apiClient<VariacaoResponse[]>("/fardamentos/variacoes", {
    method: "GET",
    query: { q, tipoId },
  });

export const createVariacao = (data: {
  tipoId: string;
  tamanho: string;
  genero: string;
}) =>
  apiClient<VariacaoResponse>("/fardamentos/variacoes", {
    method: "POST",
    body: data,
  });

export const updateVariacao = (
  id: string,
  data: { tipoId?: string; tamanho?: string; genero?: string },
) =>
  apiClient<VariacaoResponse>(`/fardamentos/variacoes/${id}`, {
    method: "PUT",
    body: data,
  });

export const deleteVariacao = (id: string) =>
  apiClient<{ ok: boolean }>(`/fardamentos/variacoes/${id}`, {
    method: "DELETE",
  });

export const fetchEstoque = (filters?: {
  q?: string;
  unidadeId?: string;
  tipoId?: string;
  variacaoId?: string;
  baixoEstoque?: boolean;
}) =>
  apiClient<EstoqueResponse[]>("/fardamentos/estoque", {
    method: "GET",
    query: {
      q: filters?.q,
      unidadeId: filters?.unidadeId,
      tipoId: filters?.tipoId,
      variacaoId: filters?.variacaoId,
      baixoEstoque: filters?.baixoEstoque ? true : undefined,
    },
  });

export const mapTiposToUi = (tipos: TipoResponse[]): TipoFardamento[] =>
  tipos.map((tipo) => ({
    id: tipo.id,
    nome: tipo.nome,
    unidades: (tipo.unidades ?? []).map((u) => u.nome),
    variacoesCount: 0,
  }));

export const mapVariacoesToUi = (variacoes: VariacaoResponse[]): Variacao[] =>
  variacoes.map((item) => ({
    id: item.id,
    tipoId: item.tipo?.id ?? "",
    tipoNome: item.tipo?.nome ?? "-",
    tamanho: item.tamanho,
    genero: item.genero,
  }));

export const mapEstoqueToUi = (estoque: EstoqueResponse[]): EstoqueItem[] =>
  estoque.map((item) => ({
    id: item.id,
    variacaoId: item.variacao?.id ?? "",
    tipoNome: item.variacao?.tipo?.nome ?? "-",
    variacaoLabel: `${item.variacao?.tamanho ?? "-"} - ${
      item.variacao?.genero ?? "-"
    }`,
    unidade: item.unidade?.nome ?? "-",
    total: item.total ?? 0,
    reservado: item.reservado ?? 0,
  }));
