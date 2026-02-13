import {
  Button,
  DatePicker,
  Form,
  Input,
  Popconfirm,
  Select,
  Skeleton,
  Space,
  Spin,
  Table,
  Tag,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { FardamentosShell } from "@/modules/fardamentos/components/fardamentos-shell";
import { SectionCard } from "@/modules/fardamentos/components/section-card";
import { MovimentacaoEntregaWizard } from "@/modules/fardamentos/components/movimentacao-entrega-wizard";
import { MovimentacaoDevolucaoWizard } from "@/modules/fardamentos/components/movimentacao-devolucao-wizard";
import type {
  Unidade,
  Variacao,
} from "@/modules/fardamentos/types/fardamentos.types";
import type { Movimentacao } from "@/modules/fardamentos/types/movimentacoes.types";
import type { TermoInfo } from "@/modules/fardamentos/types/termos.types";
import {
  MovimentacaoStatus,
  MovimentacaoTipo,
} from "@/modules/fardamentos/types/movimentacoes.enums";
import { Genero } from "@/modules/fardamentos/types/genero.enums";
import {
  createDevolucao,
  createEntrega,
  baixarTermo,
  fetchColaboradorSaldos,
  fetchEstoque,
  fetchMovimentacoes,
  fetchUnidades,
  fetchVariacoes,
  gerarTermo,
  listarTermos,
  mapEstoqueToUi,
  mapMovimentacoesToUi,
  mapVariacoesToUi,
  updateMovimentacaoStatus,
} from "@/modules/fardamentos/services/fardamentos.service";
import { parseApiError } from "@/shared/error-handlers/api-errors";
import { formatIsoDateTime } from "@/shared/formatters/date";
import { b64toBlob } from "@/shared/utils/blob";
import { toaster } from "@/components/toaster";
import { useDebounce } from "@/hooks/useDebounce";
import { colaboradoresMock } from "@/modules/fardamentos/types/fardamentos.mock";
import DefaultLayout from "@/layouts/default";

const { RangePicker } = DatePicker;

export default function MovimentacoesPage() {
  const router = useRouter();
  const [data, setData] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    q: "",
    unidadeId: undefined as string | undefined,
    tipo: undefined as MovimentacaoTipo | undefined,
    status: undefined as MovimentacaoStatus | undefined,
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
  });
  const debouncedFiltersQ = useDebounce(filters.q);
  const {
    unidadeId: filtroUnidadeId,
    tipo: filtroTipo,
    status: filtroStatus,
    startDate: filtroStartDate,
    endDate: filtroEndDate,
  } = filters;

  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [unidadesQuery, setUnidadesQuery] = useState("");
  const debouncedUnidadesQuery = useDebounce(unidadesQuery);
  const [unidadesOffset, setUnidadesOffset] = useState(0);
  const [unidadesHasMore, setUnidadesHasMore] = useState(true);
  const [unidadesLoading, setUnidadesLoading] = useState(false);
  const [variacoes, setVariacoes] = useState<Variacao[]>([]);
  const [variacoesOffset, setVariacoesOffset] = useState(0);
  const [variacoesHasMore, setVariacoesHasMore] = useState(true);
  const [variacoesLoading, setVariacoesLoading] = useState(false);
  const [openEntrega, setOpenEntrega] = useState(false);
  const [openDevolucao, setOpenDevolucao] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stepEntrega, setStepEntrega] = useState(0);
  const [stepDevolucao, setStepDevolucao] = useState(0);
  const [entregaColaborador, setEntregaColaborador] = useState<{
    id: string;
    nome: string;
  } | null>(null);
  const [devolucaoColaborador, setDevolucaoColaborador] = useState<{
    id: string;
    nome: string;
  } | null>(null);
  const entregaColaboradorRef = useRef<{ id: string; nome: string } | null>(
    null,
  );
  const devolucaoColaboradorRef = useRef<{ id: string; nome: string } | null>(
    null,
  );
  const [formEntrega] = Form.useForm();
  const [formDevolucao] = Form.useForm();
  const [estoqueEntrega, setEstoqueEntrega] = useState<
    { variacaoId: string; total: number; reservado: number }[]
  >([]);
  const [entregaUnidadeId, setEntregaUnidadeId] = useState<string | null>(null);
  const [entregaTipoId, setEntregaTipoId] = useState<string | null>(null);
  const [entregaGenero, setEntregaGenero] = useState<Genero | null>(null);
  const [entregaTamanho, setEntregaTamanho] = useState<string | null>(null);
  const entregaEstoqueIds = useMemo(
    () => estoqueEntrega.map((item) => item.variacaoId),
    [estoqueEntrega],
  );
  const [devolucaoUnidadeId, setDevolucaoUnidadeId] = useState<string | null>(
    null,
  );
  const [devolucaoTipoId, setDevolucaoTipoId] = useState<string | null>(null);
  const [devolucaoGenero, setDevolucaoGenero] = useState<Genero | null>(null);
  const [devolucaoTamanho, setDevolucaoTamanho] = useState<string | null>(null);
  const [devolucaoEstoqueIds, setDevolucaoEstoqueIds] = useState<string[]>([]);
  const [devolucaoSaldos, setDevolucaoSaldos] = useState<
    {
      id: string;
      variacaoId: string;
      tipoNome: string;
      tamanho: string;
      genero: Genero;
      quantidade: number;
    }[]
  >([]);
  const [devolucaoSaldosLoading, setDevolucaoSaldosLoading] = useState(false);
  const [entregaMovimentacaoId, setEntregaMovimentacaoId] = useState<
    string | null
  >(null);
  const [devolucaoMovimentacaoId, setDevolucaoMovimentacaoId] = useState<
    string | null
  >(null);
  const [entregaTermos, setEntregaTermos] = useState<TermoInfo[]>([]);
  const [devolucaoTermos, setDevolucaoTermos] = useState<TermoInfo[]>([]);
  const [entregaTermosLoading, setEntregaTermosLoading] = useState(false);
  const [devolucaoTermosLoading, setDevolucaoTermosLoading] = useState(false);
  const pageBeforeFilterRef = useRef<number>(1);

  const isFiltered = (value: {
    q?: string;
    unidadeId?: string;
    tipo?: MovimentacaoTipo;
    status?: MovimentacaoStatus;
    startDate?: string;
    endDate?: string;
  }) =>
    Boolean(
      (value.q ?? "").trim() ||
      value.unidadeId ||
      value.tipo ||
      value.status ||
      value.startDate ||
      value.endDate,
    );

  const handleFiltersStateChange = (nextFilters: typeof filters) => {
    const currentFiltered = isFiltered(filters);
    const nextFiltered = isFiltered(nextFilters);

    if (!currentFiltered && nextFiltered) {
      pageBeforeFilterRef.current = page;
      setPage(1);
      return;
    }

    if (currentFiltered && !nextFiltered) {
      setPage(pageBeforeFilterRef.current);
      return;
    }

    if (nextFiltered) {
      setPage(1);
    }
  };

  const clearFilters = () => {
    const nextFilters = {
      q: "",
      unidadeId: undefined,
      tipo: undefined,
      status: undefined,
      startDate: undefined,
      endDate: undefined,
    };
    setFilters(nextFilters);
    handleFiltersStateChange(nextFilters);
  };

  const movimentacoesParams = useMemo(
    () => ({
      q: debouncedFiltersQ || undefined,
      unidadeId: filtroUnidadeId,
      tipo: filtroTipo,
      status: filtroStatus,
      startDate: filtroStartDate,
      endDate: filtroEndDate,
      offset: (page - 1) * pageSize,
      limit: pageSize,
    }),
    [
      debouncedFiltersQ,
      filtroUnidadeId,
      filtroTipo,
      filtroStatus,
      filtroStartDate,
      filtroEndDate,
      page,
      pageSize,
    ],
  );

  const loadMovimentacoes = useCallback(async () => {
    setLoading(true);
    try {
      const movResult = await fetchMovimentacoes(movimentacoesParams);
      setData(mapMovimentacoesToUi(movResult.data));
      setTotal(movResult.total);
    } catch (err) {
      toaster.erro("Erro ao carregar movimentacoes", err);
    } finally {
      setLoading(false);
    }
  }, [movimentacoesParams]);

  const refreshMovimentacoes = useCallback(() => {
    setReloadVersion((value) => value + 1);
  }, []);

  useEffect(() => {
    void loadMovimentacoes();
  }, [loadMovimentacoes, reloadVersion]);

  const loadFiltroUnidades = useCallback(async () => {
    setUnidadesLoading(true);
    try {
      const unidadesResult = await fetchUnidades({
        q: debouncedUnidadesQuery || undefined,
        offset: 0,
        limit: 10,
      });
      setUnidades(unidadesResult.data);
      setUnidadesOffset(unidadesResult.data.length);
      setUnidadesHasMore(unidadesResult.data.length < unidadesResult.total);
    } catch (err) {
      toaster.erro("Erro ao carregar unidades", err);
    } finally {
      setUnidadesLoading(false);
    }
  }, [debouncedUnidadesQuery]);

  useEffect(() => {
    void loadFiltroUnidades();
  }, [loadFiltroUnidades]);

  const loadInitialVariacoes = useCallback(async () => {
    setVariacoesLoading(true);
    try {
      const result = await fetchVariacoes({ offset: 0, limit: 10 });
      setVariacoes(mapVariacoesToUi(result.data));
      setVariacoesOffset(result.data.length);
      setVariacoesHasMore(result.data.length < result.total);
    } catch (err) {
      toaster.erro("Erro ao carregar variações", err);
    } finally {
      setVariacoesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!openEntrega && !openDevolucao) return;
    if (variacoes.length > 0) return;
    void loadInitialVariacoes();
  }, [openEntrega, openDevolucao, variacoes.length, loadInitialVariacoes]);

  const loadMoreVariacoes = useCallback(async () => {
    if (variacoesLoading || !variacoesHasMore) return;
    setVariacoesLoading(true);
    try {
      const result = await fetchVariacoes({
        offset: variacoesOffset,
        limit: 10,
      });
      const mapped = mapVariacoesToUi(result.data);
      setVariacoes((prev) => {
        const map = new Map(prev.map((item) => [item.id, item]));
        mapped.forEach((item) => map.set(item.id, item));
        return Array.from(map.values());
      });
      const nextOffset = variacoesOffset + result.data.length;
      setVariacoesOffset(nextOffset);
      setVariacoesHasMore(nextOffset < result.total);
    } catch (err) {
      toaster.erro("Erro ao carregar variações", err);
    } finally {
      setVariacoesLoading(false);
    }
  }, [variacoesHasMore, variacoesLoading, variacoesOffset]);

  const loadEstoqueByUnidade = useCallback(async (unidadeId: string) => {
    const result = await fetchEstoque({ unidadeId, offset: 0, limit: 100 });
    return mapEstoqueToUi(result.data);
  }, []);

  const loadMoreUnidades = useCallback(async () => {
    if (unidadesLoading || !unidadesHasMore) return;
    setUnidadesLoading(true);
    try {
      const result = await fetchUnidades({
        q: debouncedUnidadesQuery || undefined,
        offset: unidadesOffset,
        limit: 10,
      });
      setUnidades((prev) => [...prev, ...result.data]);
      const nextOffset = unidadesOffset + result.data.length;
      setUnidadesOffset(nextOffset);
      setUnidadesHasMore(nextOffset < result.total);
    } catch (err) {
      toaster.erro("Erro ao carregar unidades", err);
    } finally {
      setUnidadesLoading(false);
    }
  }, [debouncedUnidadesQuery, unidadesHasMore, unidadesLoading, unidadesOffset]);

  useEffect(() => {
    const colaboradorId = devolucaoColaborador?.id;
    if (!colaboradorId) {
      setDevolucaoSaldos([]);
      return;
    }
    setDevolucaoSaldosLoading(true);
    fetchColaboradorSaldos(colaboradorId)
      .then((result) => setDevolucaoSaldos(result))
      .catch((err) => toaster.erro("Erro ao carregar itens em posse", err))
      .finally(() => setDevolucaoSaldosLoading(false));
  }, [devolucaoColaborador]);

  const variacoesById = useMemo(
    () =>
      new Map(
        variacoes.map((variacao) => [
          variacao.id,
          { tipoId: variacao.tipoId, tamanho: variacao.tamanho },
        ]),
      ),
    [variacoes],
  );

  const entregaTiposDisponiveis = useMemo(() => {
    const tiposMap = new Map<string, string>();
    variacoes.forEach((variacao) => {
      if (
        entregaEstoqueIds.length > 0 &&
        !entregaEstoqueIds.includes(variacao.id)
      ) {
        return;
      }
      tiposMap.set(variacao.tipoId, variacao.tipoNome);
    });

    return Array.from(tiposMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  }, [variacoes, entregaEstoqueIds]);

  const entregaTamanhosDisponiveis = useMemo(() => {
    const tamanhos = new Set<string>();
    variacoes.forEach((variacao) => {
      if (
        entregaEstoqueIds.length > 0 &&
        !entregaEstoqueIds.includes(variacao.id)
      ) {
        return;
      }
      if (entregaTipoId && variacao.tipoId !== entregaTipoId) return;
      if (entregaGenero && variacao.genero !== entregaGenero) return;
      tamanhos.add(variacao.tamanho);
    });

    return Array.from(tamanhos).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [variacoes, entregaEstoqueIds, entregaTipoId, entregaGenero]);

  const variacoesFiltradas = useMemo(() => {
    return variacoes.filter((v) => {
      if (entregaEstoqueIds.length > 0 && !entregaEstoqueIds.includes(v.id)) {
        return false;
      }
      if (entregaTipoId && v.tipoId !== entregaTipoId) return false;
      if (entregaGenero && v.genero !== entregaGenero) return false;
      if (entregaTamanho && v.tamanho !== entregaTamanho) return false;
      return true;
    });
  }, [
    variacoes,
    entregaTipoId,
    entregaGenero,
    entregaTamanho,
    entregaEstoqueIds,
  ]);

  const variacaoOptionsFiltradas = useMemo(
    () =>
      variacoesFiltradas.map((v) => ({
        label: `${v.tipoNome} - ${v.tamanho} - ${v.genero}`,
        value: v.id,
      })),
    [variacoesFiltradas],
  );

  const devolucaoTiposDisponiveis = useMemo(() => {
    const tiposMap = new Map<string, string>();
    variacoes.forEach((variacao) => {
      if (
        devolucaoEstoqueIds.length > 0 &&
        !devolucaoEstoqueIds.includes(variacao.id)
      ) {
        return;
      }
      tiposMap.set(variacao.tipoId, variacao.tipoNome);
    });

    return Array.from(tiposMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  }, [variacoes, devolucaoEstoqueIds]);

  const devolucaoTamanhosDisponiveis = useMemo(() => {
    const tamanhos = new Set<string>();
    variacoes.forEach((variacao) => {
      if (
        devolucaoEstoqueIds.length > 0 &&
        !devolucaoEstoqueIds.includes(variacao.id)
      ) {
        return;
      }
      if (devolucaoTipoId && variacao.tipoId !== devolucaoTipoId) return;
      if (devolucaoGenero && variacao.genero !== devolucaoGenero) return;
      tamanhos.add(variacao.tamanho);
    });

    return Array.from(tamanhos).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [variacoes, devolucaoEstoqueIds, devolucaoTipoId, devolucaoGenero]);

  const variacoesDevolucaoFiltradas = useMemo(() => {
    const saldoIds = devolucaoSaldos.map((saldo) => saldo.variacaoId);
    return variacoes.filter((v) => {
      if (
        devolucaoEstoqueIds.length > 0 &&
        !devolucaoEstoqueIds.includes(v.id)
      ) {
        return false;
      }
      if (saldoIds.length > 0 && !saldoIds.includes(v.id)) {
        return false;
      }
      if (devolucaoTipoId && v.tipoId !== devolucaoTipoId) return false;
      if (devolucaoGenero && v.genero !== devolucaoGenero) return false;
      if (devolucaoTamanho && v.tamanho !== devolucaoTamanho) return false;
      return true;
    });
  }, [
    variacoes,
    devolucaoTipoId,
    devolucaoGenero,
    devolucaoTamanho,
    devolucaoEstoqueIds,
    devolucaoSaldos,
  ]);

  const variacaoOptionsDevolucao = useMemo(
    () =>
      variacoesDevolucaoFiltradas.map((v) => ({
        label: `${v.tipoNome} - ${v.tamanho} - ${v.genero}`,
        value: v.id,
      })),
    [variacoesDevolucaoFiltradas],
  );

  const saldosDevolucaoFiltrados = useMemo(() => {
    return devolucaoSaldos.filter((saldo) => {
      if (devolucaoTipoId) {
        const variacao = variacoesById.get(saldo.variacaoId);
        if (!variacao || variacao.tipoId !== devolucaoTipoId) return false;
      }
      if (devolucaoGenero && saldo.genero !== devolucaoGenero) return false;
      if (devolucaoTamanho && saldo.tamanho !== devolucaoTamanho) return false;
      return true;
    });
  }, [
    devolucaoSaldos,
    devolucaoTipoId,
    devolucaoGenero,
    devolucaoTamanho,
    variacoesById,
  ]);

  useEffect(() => {
    if (
      entregaTipoId &&
      !entregaTiposDisponiveis.some((tipo) => tipo.value === entregaTipoId)
    ) {
      setEntregaTipoId(null);
      setEntregaTamanho(null);
    }
  }, [entregaTipoId, entregaTiposDisponiveis]);

  useEffect(() => {
    if (
      entregaTamanho &&
      !entregaTamanhosDisponiveis.includes(entregaTamanho)
    ) {
      setEntregaTamanho(null);
    }
  }, [entregaTamanho, entregaTamanhosDisponiveis]);

  useEffect(() => {
    if (
      devolucaoTipoId &&
      !devolucaoTiposDisponiveis.some((tipo) => tipo.value === devolucaoTipoId)
    ) {
      setDevolucaoTipoId(null);
      setDevolucaoTamanho(null);
    }
  }, [devolucaoTipoId, devolucaoTiposDisponiveis]);

  useEffect(() => {
    if (
      devolucaoTamanho &&
      !devolucaoTamanhosDisponiveis.includes(devolucaoTamanho)
    ) {
      setDevolucaoTamanho(null);
    }
  }, [devolucaoTamanho, devolucaoTamanhosDisponiveis]);

  const handleEntrega = async () => {
    try {
      const values = await formEntrega.validateFields();
      const storedColaboradorId =
        entregaColaborador?.id ??
        entregaColaboradorRef.current?.id ??
        formEntrega.getFieldValue("colaboradorId") ??
        values.colaboradorId;
      const storedColaboradorNome =
        entregaColaborador?.nome ??
        entregaColaboradorRef.current?.nome ??
        formEntrega.getFieldValue("colaboradorNome") ??
        values.colaboradorNome;
      values.colaboradorId = String(storedColaboradorId ?? "");
      values.colaboradorNome = String(storedColaboradorNome ?? "");
      if (!values.colaboradorId) {
        toaster.alerta(
          "Colaborador obrigatório",
          "Selecione um colaborador para continuar.",
        );
        return;
      }
      const unidadeId =
        entregaUnidadeId ??
        formEntrega.getFieldValue("unidadeId") ??
        values.unidadeId;
      values.unidadeId = unidadeId;
      if (!values.unidadeId) {
        toaster.alerta(
          "Unidade indisponivel",
          "Nenhuma unidade disponível para carregar o estoque.",
        );
        return;
      }
      const estoqueUi =
        estoqueEntrega.length > 0
          ? estoqueEntrega.map((item) => ({
              variacaoId: item.variacaoId,
              total: item.total,
              reservado: item.reservado,
            }))
          : await loadEstoqueByUnidade(values.unidadeId);
      const estoqueMap = new Map(
        estoqueUi.map((item) => [item.variacaoId, item]),
      );
      const itens = (values.itens ?? []) as Array<{
        variacaoId: string;
        quantidade: number;
      }>;
      const itensInvalidos = itens.filter((item) => {
        const estoque = estoqueMap.get(item.variacaoId);
        if (!estoque) return false;
        const disponivel = (estoque?.total ?? 0) - (estoque?.reservado ?? 0);
        return item.quantidade > disponivel;
      });

      if (itensInvalidos.length > 0) {
        toaster.alerta(
          "Estoque insuficiente",
          "Estoque insuficiente para um ou mais itens. Verifique o saldo disponível.",
        );
        return;
      }
      setSaving(true);
      const created = await createEntrega(values);
      toaster.sucesso("Entrega registrada", "A movimentação foi criada.");
      setEntregaMovimentacaoId(created.id);
      try {
        await gerarTermo(created.id);
        const termosGerados = await listarTermos(created.id);
        setEntregaTermos(termosGerados);
        toaster.sucesso(
          "Termo gerado automaticamente",
          "A primeira versão do termo já está disponível.",
        );
      } catch (termoErr) {
        setEntregaTermos([]);
        toaster.alerta(
          "Entrega registrada sem termo",
          parseApiError(termoErr).message,
        );
      }
      setStepEntrega(2);
      refreshMovimentacoes();
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "errorFields" in err &&
        Array.isArray((err as { errorFields?: unknown[] }).errorFields)
      ) {
        return;
      }
      toaster.erro("Erro ao registrar entrega", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDevolucao = async (force = false) => {
    try {
      const values = await formDevolucao.validateFields();
      const storedColaboradorId =
        devolucaoColaborador?.id ??
        devolucaoColaboradorRef.current?.id ??
        formDevolucao.getFieldValue("colaboradorId") ??
        values.colaboradorId;
      const storedColaboradorNome =
        devolucaoColaborador?.nome ??
        devolucaoColaboradorRef.current?.nome ??
        formDevolucao.getFieldValue("colaboradorNome") ??
        values.colaboradorNome;
      values.colaboradorId = String(storedColaboradorId ?? "");
      values.colaboradorNome = String(storedColaboradorNome ?? "");
      if (!values.colaboradorId) {
        toaster.alerta(
          "Colaborador obrigatório",
          "Selecione um colaborador para continuar.",
        );
        return;
      }
      if (!values.unidadeId) {
        const defaultUnidadeId = devolucaoUnidadeId ?? unidades[0]?.id;
        if (defaultUnidadeId) {
          formDevolucao.setFieldValue("unidadeId", defaultUnidadeId);
          values.unidadeId = defaultUnidadeId;
        }
      }
      if (!values.unidadeId) {
        toaster.alerta(
          "Unidade indisponivel",
          "Nenhuma unidade disponível para registrar a devolução.",
        );
        return;
      }
      setSaving(true);
      const created = await createDevolucao({ ...values, force });
      await updateMovimentacaoStatus(created.id, MovimentacaoStatus.EM_TRANSITO);
      toaster.sucesso(
        "Devolução registrada",
        "A movimentação foi criada e movida para Em trânsito.",
      );
      if (force) {
        toaster.alerta(
          "Devoluçãao forçada",
          "A devoluçãao foi registrada ignorando o saldo em posse.",
        );
      }
      setDevolucaoMovimentacaoId(created.id);
      try {
        await gerarTermo(created.id);
        const termosGerados = await listarTermos(created.id);
        setDevolucaoTermos(termosGerados);
        toaster.sucesso(
          "Termo gerado automaticamente",
          "A primeira versão do termo já está disponível.",
        );
      } catch (termoErr) {
        setDevolucaoTermos([]);
        toaster.alerta(
          "Devolução registrada sem termo",
          parseApiError(termoErr).message,
        );
      }
      setStepDevolucao(2);
      refreshMovimentacoes();
    } catch (err) {
      toaster.erro("Erro ao registrar devolução", err);
    } finally {
      setSaving(false);
    }
  };

  const handleGerarTermoEntrega = async () => {
    if (!entregaMovimentacaoId) return;
    setEntregaTermosLoading(true);
    try {
      await gerarTermo(entregaMovimentacaoId);
      const result = await listarTermos(entregaMovimentacaoId);
      setEntregaTermos(result);
      toaster.sucesso("Termo gerado", "Uma nova versão foi criada.");
    } catch (err) {
      toaster.erro("Erro ao gerar termo", err);
    } finally {
      setEntregaTermosLoading(false);
    }
  };

  const handleGerarTermoDevolucao = async () => {
    if (!devolucaoMovimentacaoId) return;
    setDevolucaoTermosLoading(true);
    try {
      await gerarTermo(devolucaoMovimentacaoId);
      const result = await listarTermos(devolucaoMovimentacaoId);
      setDevolucaoTermos(result);
      toaster.sucesso("Termo gerado", "Uma nova versão foi criada.");
    } catch (err) {
      toaster.erro("Erro ao gerar termo", err);
    } finally {
      setDevolucaoTermosLoading(false);
    }
  };

  const handleAbrirTermo = async (termoId: string) => {
    try {
      const termo = await baixarTermo(termoId);
      const blob = b64toBlob(termo.pdfBase64, "application/pdf");
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      toaster.erro("Erro ao abrir termo", err);
    }
  };

  const handleBaixarTermo = async (termoId: string) => {
    try {
      const termo = await baixarTermo(termoId);
      const blob = b64toBlob(termo.pdfBase64, "application/pdf");
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = termo.filename || "termo.pdf";
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(link.href);
      link.remove();
    } catch (err) {
      toaster.erro("Erro ao baixar termo", err);
    }
  };

  const handleStatus = async (id: string, status: Movimentacao["status"]) => {
    try {
      setSaving(true);
      await updateMovimentacaoStatus(id, status);
      const label =
        status === MovimentacaoStatus.CONCLUIDO
          ? "concluída"
          : status === MovimentacaoStatus.CANCELADO
            ? "cancelada"
            : "atualizada";
      toaster.sucesso("Movimentação atualizada", `Movimentação ${label}.`);
      refreshMovimentacoes();
    } catch (err) {
      toaster.erro("Erro ao atualizar movimentação", err);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: "Colaborador",
      dataIndex: "colaboradorNome",
      key: "colaboradorNome",
      render: (value: string) => {
        const maxLength = 18;
        const truncated =
          value.length > maxLength
            ? `${value.slice(0, maxLength).trimEnd()}...`
            : value;
        return <span title={value}>{truncated}</span>;
      },
    },
    {
      title: "Tipo",
      dataIndex: "tipo",
      key: "tipo",
      render: (value: string) => (
        <Tag color={value === MovimentacaoTipo.DEVOLUCAO ? "volcano" : "blue"}>
          {value === MovimentacaoTipo.DEVOLUCAO ? "DEVOLUÇÃO" : value}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value: MovimentacaoStatus) => (
        <Tag
          color={
            value === MovimentacaoStatus.CONCLUIDO
              ? "green"
              : value === MovimentacaoStatus.CANCELADO
                ? "red"
                : "gold"
          }
        >
          {value === MovimentacaoStatus.SEPARADO
            ? "SEPARADO"
            : value === MovimentacaoStatus.EM_TRANSITO
              ? "EM TRÂNSITO"
              : value === MovimentacaoStatus.CONCLUIDO
                ? "CONCLUÍDO"
                : "CANCELADO"}
        </Tag>
      ),
    },
    {
      title: "Unidade",
      dataIndex: "unidadeNome",
      key: "unidadeNome",
    },
    {
      title: "Criado em",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value: string) => formatIsoDateTime(value),
    },
    {
      title: "Ações",
      key: "acoes",
      render: (_: unknown, record: Movimentacao) => {
        const canCancel =
          record.status !== MovimentacaoStatus.CONCLUIDO &&
          record.status !== MovimentacaoStatus.CANCELADO;

        return (
          <Space wrap>
            <Popconfirm
              title="Marcar como Em trânsito?"
              onConfirm={() =>
                void handleStatus(record.id, MovimentacaoStatus.EM_TRANSITO)
              }
              okText="Sim"
              cancelText="Não"
            >
              <Button size="small">Em trânsito</Button>
            </Popconfirm>
            <Popconfirm
              title="Concluir movimentação?"
              onConfirm={() =>
                void handleStatus(record.id, MovimentacaoStatus.CONCLUIDO)
              }
              okText="Sim"
              cancelText="Não"
            >
              <Button size="small">Concluir</Button>
            </Popconfirm>
            <Popconfirm
              title="Cancelar movimentação?"
              onConfirm={() =>
                void handleStatus(record.id, MovimentacaoStatus.CANCELADO)
              }
              okText="Sim"
              cancelText="Não"
              disabled={!canCancel}
            >
              <Button size="small" danger disabled={!canCancel}>
                Cancelar
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const rangePresets = useMemo<Array<{ label: string; value: [Dayjs, Dayjs] }>>(
    () => [
      {
        label: "Últimos 7 dias",
        value: [dayjs().subtract(6, "day").startOf("day"), dayjs().endOf("day")],
      },
      {
        label: "Este mês",
        value: [dayjs().startOf("month"), dayjs().endOf("month")],
      },
      {
        label: "Mês passado",
        value: [
          dayjs().subtract(1, "month").startOf("month"),
          dayjs().subtract(1, "month").endOf("month"),
        ],
      },
    ],
    [],
  );
  const showPageSkeleton = loading && data.length === 0;

  useEffect(() => {
    if (!router.isReady) return;

    const novaDevolucao = router.query.novaDevolucao;
    if (novaDevolucao !== "1") return;

    const colaboradorIdQuery = router.query.colaboradorId;
    const colaboradorNomeQuery = router.query.colaboradorNome;
    const colaboradorId =
      typeof colaboradorIdQuery === "string" ? colaboradorIdQuery : "";
    const colaboradorNome =
      typeof colaboradorNomeQuery === "string" ? colaboradorNomeQuery : "";

    setOpenDevolucao(true);
    setStepDevolucao(0);

    if (colaboradorId) {
      formDevolucao.setFieldsValue({
        colaboradorId,
        colaboradorNome,
      });
      const stored = { id: colaboradorId, nome: colaboradorNome };
      setDevolucaoColaborador(stored);
      devolucaoColaboradorRef.current = stored;
    }

    void router.replace(
      { pathname: router.pathname, query: {} },
      undefined,
      { shallow: true },
    );
  }, [formDevolucao, router]);

  return (
    <DefaultLayout>
      <FardamentosShell
        title="Movimentações"
        description="Gerencie entregas e devoluções com reserva e baixa de estoque."
        actions={
          <Space wrap>
            <Button type="primary" onClick={() => setOpenEntrega(true)}>
              Nova entrega
            </Button>
            <Button onClick={() => setOpenDevolucao(true)}>
              Nova devolução
            </Button>
          </Space>
        }
      >
        <SectionCard
          title="Resumo das movimentações"
          description="Filtre por colaborador, unidade, status e período."
          actions={
            showPageSkeleton ? (
              <Space wrap className="max-w-xl w-full">
                <Skeleton.Input active className="w-full md:min-w-72" />
                <Skeleton.Input active className="w-full md:min-w-45" />
                <Skeleton.Input active className="w-full md:min-w-40" />
                <Skeleton.Input active className="w-full md:min-w-40" />
                <Skeleton.Input active className="w-full md:min-w-50" />
              </Space>
            ) : (
              <Space wrap className="max-w-xl w-full">
                <div className="w-full md:w-auto">
                  <Input
                    placeholder="Buscar colaborador"
                    value={filters.q}
                    onChange={(e) => {
                      const nextFilters = { ...filters, q: e.target.value };
                      setFilters(nextFilters);
                      handleFiltersStateChange(nextFilters);
                    }}
                    allowClear
                    className="w-full md:min-w-72"
                  />
                </div>
                <div className="w-full md:w-auto">
                  <Select
                    placeholder="Unidade"
                    allowClear
                    value={filters.unidadeId}
                    onChange={(value) => {
                      const nextFilters = { ...filters, unidadeId: value };
                      setFilters(nextFilters);
                      handleFiltersStateChange(nextFilters);
                    }}
                    showSearch
                    onSearch={(value) => {
                      setUnidadesQuery(value);
                      setUnidadesOffset(0);
                      setUnidadesHasMore(true);
                    }}
                    onPopupScroll={(event) => {
                      const target = event.target as HTMLDivElement;
                      if (
                        target.scrollTop + target.offsetHeight >=
                        target.scrollHeight - 16
                      ) {
                        void loadMoreUnidades();
                      }
                    }}
                    filterOption={false}
                    loading={unidadesLoading}
                    popupRender={(menu) => (
                      <>
                        {menu}
                        {unidadesLoading ? (
                          <div className="px-3 py-2 text-center">
                            <Spin size="small" />
                          </div>
                        ) : null}
                      </>
                    )}
                    options={unidades.map((u) => ({
                      label: u.nome,
                      value: u.id,
                    }))}
                    className="w-full md:min-w-45"
                  />
                </div>
                <div className="w-full md:w-auto">
                  <Select
                    placeholder="Tipo"
                    allowClear
                    value={filters.tipo}
                    onChange={(value) => {
                      const nextFilters = { ...filters, tipo: value };
                      setFilters(nextFilters);
                      handleFiltersStateChange(nextFilters);
                    }}
                    options={[
                      { label: "Entrega", value: MovimentacaoTipo.ENTREGA },
                      { label: "Devolução", value: MovimentacaoTipo.DEVOLUCAO },
                    ]}
                    className="w-full md:min-w-40"
                  />
                </div>
                <div className="w-full md:w-auto">
                  <Select
                    placeholder="Status"
                    allowClear
                    value={filters.status}
                    onChange={(value) => {
                      const nextFilters = { ...filters, status: value };
                      setFilters(nextFilters);
                      handleFiltersStateChange(nextFilters);
                    }}
                    options={[
                      { label: "Separado", value: MovimentacaoStatus.SEPARADO },
                      {
                        label: "Em trânsito",
                        value: MovimentacaoStatus.EM_TRANSITO,
                      },
                      {
                        label: "Concluído",
                        value: MovimentacaoStatus.CONCLUIDO,
                      },
                      {
                        label: "Cancelado",
                        value: MovimentacaoStatus.CANCELADO,
                      },
                    ]}
                    className="w-full md:min-w-40"
                    style={{ minWidth: 120 }}
                  />
                </div>
                <div className="w-full md:w-auto">
                  <RangePicker
                    format="DD/MM/YYYY"
                    presets={rangePresets}
                    placeholder={["Data inicial", "Data final"]}
                    onChange={(dates) => {
                      const nextFilters = {
                        ...filters,
                        startDate: dates?.[0]?.toISOString(),
                        endDate: dates?.[1]?.toISOString(),
                      };
                      setFilters(nextFilters);
                      handleFiltersStateChange(nextFilters);
                    }}
                    className="w-full! max-w-60! md:min-w-50!"
                  />
                </div>
                <div className="w-full md:w-auto">
                  <Button onClick={clearFilters} className="w-full md:w-auto">
                    Limpar filtros
                  </Button>
                </div>
              </Space>
            )
          }
        >
          {showPageSkeleton ? (
            <div className="space-y-3 rounded-lg border border-neutral-200/70 p-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton
                  key={`mov-skeleton-${index}`}
                  active
                  title={false}
                  paragraph={{ rows: 1, width: ["100%"] }}
                />
              ))}
            </div>
          ) : (
            <Table
              rowKey="id"
              columns={columns}
              dataSource={data}
              loading={loading}
              scroll={{ x: 980 }}
              pagination={{
                current: page,
                pageSize,
                total,
                onChange: (nextPage) => setPage(nextPage),
                showSizeChanger: false,
                showTotal: (value) => `Total: ${value}`,
              }}
            />
          )}
        </SectionCard>

        <MovimentacaoEntregaWizard
          open={openEntrega}
          saving={saving}
          step={stepEntrega}
          setStep={setStepEntrega}
          form={formEntrega}
          colaboradores={colaboradoresMock}
          unidades={unidades}
          variacoes={variacoes}
          variacaoOptionsFiltradas={variacaoOptionsFiltradas}
          tamanhosDisponiveis={entregaTamanhosDisponiveis}
          estoqueEntrega={estoqueEntrega}
          entregaUnidadeId={entregaUnidadeId}
          entregaTipoId={entregaTipoId}
          setEntregaTipoId={(value) => {
            setEntregaTipoId(value);
            setEntregaTamanho(null);
          }}
          tiposDisponiveis={entregaTiposDisponiveis}
          setEntregaUnidadeId={async (value) => {
            setEntregaUnidadeId(value);
            setEntregaTipoId(null);
            setEntregaTamanho(null);
            formEntrega.setFieldValue("unidadeId", value ?? undefined);
            if (value) {
              const estoqueUi = await loadEstoqueByUnidade(value);
              setEstoqueEntrega(
                estoqueUi.map((item) => ({
                  variacaoId: item.variacaoId,
                  total: item.total,
                  reservado: item.reservado,
                })),
              );
            } else {
              setEstoqueEntrega([]);
            }
          }}
          entregaGenero={entregaGenero}
          setEntregaGenero={setEntregaGenero}
          entregaTamanho={entregaTamanho}
          setEntregaTamanho={setEntregaTamanho}
          termos={entregaTermos}
          termosLoading={entregaTermosLoading}
          unidadesLoading={unidadesLoading}
          onUnidadesScroll={loadMoreUnidades}
          variacoesLoading={variacoesLoading}
          onVariacoesScroll={loadMoreVariacoes}
          onGerarTermo={handleGerarTermoEntrega}
          onNovaEntrega={() => {
            const unidadeIdAtual =
              entregaUnidadeId ?? formEntrega.getFieldValue("unidadeId");
            formEntrega.setFieldsValue({
              unidadeId: unidadeIdAtual ?? undefined,
              itens: [{ variacaoId: undefined, quantidade: 1 }],
            });
            setStepEntrega(0);
            setEntregaMovimentacaoId(null);
            setEntregaTermos([]);
          }}
          onAbrirTermo={handleAbrirTermo}
          onBaixarTermo={handleBaixarTermo}
          onColaboradorSelect={(colaborador) => {
            setEntregaColaborador(colaborador);
            entregaColaboradorRef.current = colaborador;
          }}
          onAdvance={async () => {
            try {
              await formEntrega.validateFields(["colaboradorId"]);
              const colabId = formEntrega.getFieldValue("colaboradorId");
              const colabNome = formEntrega.getFieldValue("colaboradorNome");
              if (colabId) {
                const stored = {
                  id: String(colabId),
                  nome: String(colabNome ?? ""),
                };
                setEntregaColaborador(stored);
                entregaColaboradorRef.current = stored;
              }
              const currentUnidadeId =
                entregaUnidadeId ??
                formEntrega.getFieldValue("unidadeId") ??
                unidades[0]?.id;
              if (!currentUnidadeId) {
                toaster.alerta(
                  "Unidade indisponivel",
                  "Nenhuma unidade disponivel para carregar o estoque.",
                );
                return;
              }
              if (currentUnidadeId) {
                formEntrega.setFieldValue("unidadeId", currentUnidadeId);
                setEntregaUnidadeId(currentUnidadeId);
                const estoqueUi = await loadEstoqueByUnidade(currentUnidadeId);
                setEstoqueEntrega(
                  estoqueUi.map((item) => ({
                    variacaoId: item.variacaoId,
                    total: item.total,
                    reservado: item.reservado,
                  })),
                );
              }
              setStepEntrega(1);
            } catch (err) {
              const apiError = parseApiError(err);
              toaster.alerta("Verifique os dados", apiError.message);
            }
          }}
          onConfirm={() => void handleEntrega()}
          onCancel={() => {
            setOpenEntrega(false);
            setStepEntrega(0);
            setEstoqueEntrega([]);
            formEntrega.resetFields();
            setEntregaColaborador(null);
            entregaColaboradorRef.current = null;
            setEntregaUnidadeId(null);
            setEntregaTipoId(null);
            setEntregaGenero(null);
            setEntregaTamanho(null);
            setEntregaMovimentacaoId(null);
            setEntregaTermos([]);
          }}
        />

        <MovimentacaoDevolucaoWizard
          open={openDevolucao}
          saving={saving}
          step={stepDevolucao}
          setStep={setStepDevolucao}
          form={formDevolucao}
          colaboradores={colaboradoresMock}
          unidades={unidades}
          variacoes={variacoes}
          variacaoOptionsDevolucao={variacaoOptionsDevolucao}
          tamanhosDisponiveis={devolucaoTamanhosDisponiveis}
          devolucaoUnidadeId={devolucaoUnidadeId}
          devolucaoTipoId={devolucaoTipoId}
          setDevolucaoTipoId={(value) => {
            setDevolucaoTipoId(value);
            setDevolucaoTamanho(null);
          }}
          tiposDisponiveis={devolucaoTiposDisponiveis}
          setDevolucaoUnidadeId={async (value) => {
            setDevolucaoUnidadeId(value);
            setDevolucaoTipoId(null);
            setDevolucaoTamanho(null);
            formDevolucao.setFieldValue("unidadeId", value ?? undefined);
            if (value) {
              const estoqueUi = await loadEstoqueByUnidade(value);
              setDevolucaoEstoqueIds(estoqueUi.map((item) => item.variacaoId));
            } else {
              setDevolucaoEstoqueIds([]);
            }
          }}
          devolucaoGenero={devolucaoGenero}
          setDevolucaoGenero={setDevolucaoGenero}
          devolucaoTamanho={devolucaoTamanho}
          setDevolucaoTamanho={setDevolucaoTamanho}
          devolucaoEstoqueIds={devolucaoEstoqueIds}
          variacoesDevolucaoFiltradas={variacoesDevolucaoFiltradas}
          saldos={saldosDevolucaoFiltrados}
          saldosTotais={devolucaoSaldos}
          saldosLoading={devolucaoSaldosLoading}
          unidadesLoading={unidadesLoading}
          onUnidadesScroll={loadMoreUnidades}
          variacoesLoading={variacoesLoading}
          onVariacoesScroll={loadMoreVariacoes}
          termos={devolucaoTermos}
          termosLoading={devolucaoTermosLoading}
          onGerarTermo={handleGerarTermoDevolucao}
          onAbrirTermo={handleAbrirTermo}
          onBaixarTermo={handleBaixarTermo}
          onColaboradorSelect={(colaborador) => {
            setDevolucaoColaborador(colaborador);
            devolucaoColaboradorRef.current = colaborador;
          }}
          onAdvance={async () => {
            try {
              await formDevolucao.validateFields(["colaboradorId"]);
              const colabId = formDevolucao.getFieldValue("colaboradorId");
              const colabNome = formDevolucao.getFieldValue("colaboradorNome");
              let saldosColaborador = devolucaoSaldos;
              if (colabId) {
                const stored = {
                  id: String(colabId),
                  nome: String(colabNome ?? ""),
                };
                setDevolucaoColaborador(stored);
                devolucaoColaboradorRef.current = stored;
                setDevolucaoSaldosLoading(true);
                try {
                  saldosColaborador = await fetchColaboradorSaldos(stored.id);
                  setDevolucaoSaldos(saldosColaborador);
                } finally {
                  setDevolucaoSaldosLoading(false);
                }
              }
              const itensPreenchidos = saldosColaborador
                .filter((saldo) => saldo.quantidade > 0)
                .map((saldo) => ({
                  variacaoId: saldo.variacaoId,
                  quantidade: saldo.quantidade,
                }));
              formDevolucao.setFieldValue(
                "itens",
                itensPreenchidos.length
                  ? itensPreenchidos
                  : [{ variacaoId: undefined, quantidade: 1 }],
              );
              if (devolucaoUnidadeId) {
                formDevolucao.setFieldValue("unidadeId", devolucaoUnidadeId);
              }
              setStepDevolucao(1);
            } catch (err) {
              const apiError = parseApiError(err);
              toaster.alerta("Verifique os dados", apiError.message);
            }
          }}
          onConfirm={() => void handleDevolucao()}
          onForceConfirm={() => void handleDevolucao(true)}
          onCancel={() => {
            setOpenDevolucao(false);
            setStepDevolucao(0);
            formDevolucao.resetFields();
            setDevolucaoColaborador(null);
            devolucaoColaboradorRef.current = null;
            setDevolucaoUnidadeId(null);
            setDevolucaoTipoId(null);
            setDevolucaoGenero(null);
            setDevolucaoTamanho(null);
            setDevolucaoEstoqueIds([]);
            setDevolucaoSaldos([]);
            setDevolucaoMovimentacaoId(null);
            setDevolucaoTermos([]);
          }}
        />
      </FardamentosShell>
    </DefaultLayout>
  );
}
