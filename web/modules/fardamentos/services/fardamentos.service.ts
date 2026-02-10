import type {
  EstoqueItem,
  EstoqueResponse,
  TipoFardamento,
  TipoResponse,
  Unidade,
  Variacao,
  VariacaoResponse,
} from "@/modules/fardamentos/types/fardamentos.types";
import type {
  TermoDownload,
  TermoInfo,
} from "@/modules/fardamentos/types/termos.types";
import { Genero } from "@/modules/fardamentos/types/genero.enums";
import type { ColaboradorSaldo } from "@/modules/fardamentos/types/saldos.types";
import {
  MovimentacaoStatus,
  MovimentacaoTipo,
} from "@/modules/fardamentos/types/movimentacoes.enums";
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
  genero: Genero;
}) =>
  apiClient<VariacaoResponse>("/fardamentos/variacoes", {
    method: "POST",
    body: data,
  });

export const updateVariacao = (
  id: string,
  data: { tipoId?: string; tamanho?: string; genero?: Genero },
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

export type MovimentacaoResponse = {
  id: string;
  tipo: MovimentacaoTipo;
  status: MovimentacaoStatus;
  unidade: { id: string; nome: string };
  colaboradorId: string;
  colaboradorNome: string;
  createdAt: string;
  itens: {
    id: string;
    quantidade: number;
    variacao: {
      id: string;
      tamanho: string;
      genero: string;
      tipo: { nome: string };
    };
  }[];
};

export const fetchMovimentacoes = (filters?: {
  q?: string;
  unidadeId?: string;
  tipo?: MovimentacaoTipo;
  status?: MovimentacaoStatus;
  startDate?: string;
  endDate?: string;
}) =>
  apiClient<MovimentacaoResponse[]>("/fardamentos/movimentacoes", {
    method: "GET",
    query: {
      q: filters?.q,
      unidadeId: filters?.unidadeId,
      tipo: filters?.tipo,
      status: filters?.status,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
    },
  });

export const createEntrega = (payload: {
  unidadeId: string;
  colaboradorId: string;
  colaboradorNome: string;
  itens: { variacaoId: string; quantidade: number }[];
}) =>
  apiClient<MovimentacaoResponse>("/fardamentos/movimentacoes/entrega", {
    method: "POST",
    body: payload,
  });

export const createDevolucao = (payload: {
  unidadeId: string;
  colaboradorId: string;
  colaboradorNome: string;
  itens: { variacaoId: string; quantidade: number }[];
  force?: boolean;
}) =>
  apiClient<MovimentacaoResponse>("/fardamentos/movimentacoes/devolucao", {
    method: "POST",
    body: payload,
  });

export const updateMovimentacaoStatus = (
  id: string,
  status: MovimentacaoStatus,
) =>
  apiClient<MovimentacaoResponse>(`/fardamentos/movimentacoes/${id}/status`, {
    method: "PATCH",
    body: { status },
  });

export const gerarTermo = (movimentacaoId: string) =>
  apiClient<{ id: string; versao: number; createdAt: string }>(
    `/fardamentos/movimentacoes/${movimentacaoId}/termos`,
    {
      method: "POST",
    },
  );

export const listarTermos = (movimentacaoId: string) =>
  apiClient<TermoInfo[]>(
    `/fardamentos/movimentacoes/${movimentacaoId}/termos`,
    {
      method: "GET",
    },
  );

export const baixarTermo = (termoId: string) =>
  apiClient<TermoDownload>(`/fardamentos/termos/${termoId}`, {
    method: "GET",
  });

export const fetchColaboradorSaldos = (colaboradorId: string) =>
  apiClient<ColaboradorSaldo[]>(
    `/fardamentos/movimentacoes/colaboradores/${colaboradorId}/saldos`,
    {
      method: "GET",
    },
  );

export const mapMovimentacoesToUi = (data: MovimentacaoResponse[]) =>
  data.map((mov) => ({
    id: mov.id,
    tipo: mov.tipo,
    status: mov.status,
    unidadeId: mov.unidade?.id ?? "",
    unidadeNome: mov.unidade?.nome ?? "-",
    colaboradorId: mov.colaboradorId,
    colaboradorNome: mov.colaboradorNome,
    createdAt: mov.createdAt,
    itens: (mov.itens ?? []).map((item) => ({
      id: item.id,
      variacaoId: item.variacao?.id ?? "",
      tipoNome: item.variacao?.tipo?.nome ?? "-",
      variacaoLabel: `${item.variacao?.tamanho ?? "-"} - ${
        item.variacao?.genero ?? "-"
      }`,
      quantidade: item.quantidade,
    })),
  }));
