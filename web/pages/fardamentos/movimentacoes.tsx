import {
  Button,
  DatePicker,
  Form,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { toaster } from "@/components/toaster";
import { useDebounce } from "@/hooks/useDebounce";

const { RangePicker } = DatePicker;

const colaboradoresMock = [
  { id: "colab_100", nome: "Paula Souza" },
  { id: "colab_200", nome: "Marcos Lima" },
  { id: "colab_300", nome: "Carla Andrade" },
  { id: "colab_400", nome: "Rafael Santos" },
];

export default function MovimentacoesPage() {
  const [data, setData] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [entregaGenero, setEntregaGenero] = useState<Genero | null>(null);
  const [entregaTamanho, setEntregaTamanho] = useState<string | null>(null);
  const entregaEstoqueIds = useMemo(
    () => estoqueEntrega.map((item) => item.variacaoId),
    [estoqueEntrega],
  );
  const [devolucaoUnidadeId, setDevolucaoUnidadeId] = useState<string | null>(
    null,
  );
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

  const load = async () => {
    setLoading(true);
    try {
      const [movResult, unidadesResult, variacoesResult] = await Promise.all([
        fetchMovimentacoes({
          q: debouncedFiltersQ || undefined,
          unidadeId: filtroUnidadeId,
          tipo: filtroTipo,
          status: filtroStatus,
          startDate: filtroStartDate,
          endDate: filtroEndDate,
          offset: (page - 1) * pageSize,
          limit: pageSize,
        }),
        fetchUnidades({
          q: debouncedUnidadesQuery || undefined,
          offset: 0,
          limit: 10,
        }),
        fetchVariacoes({ offset: 0, limit: 10 }),
      ]);
      setData(mapMovimentacoesToUi(movResult.data));
      setTotal(movResult.total);
      setUnidades(unidadesResult.data);
      setUnidadesOffset(unidadesResult.data.length);
      setUnidadesHasMore(unidadesResult.data.length < unidadesResult.total);
      setVariacoes(mapVariacoesToUi(variacoesResult.data));
    } catch (err) {
      toaster.erro("Erro ao carregar movimentacoes", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [
    debouncedFiltersQ,
    filtroUnidadeId,
    filtroTipo,
    filtroStatus,
    filtroStartDate,
    filtroEndDate,
    page,
    debouncedUnidadesQuery,
  ]);

  const loadMoreUnidades = async () => {
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
  };

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

  const variacaoOptions = useMemo(
    () =>
      variacoes.map((v) => ({
        label: `${v.tipoNome} - ${v.tamanho} - ${v.genero}`,
        value: v.id,
      })),
    [variacoes],
  );

  const tamanhosDisponiveis = useMemo(() => {
    const tamanhos = new Set<string>();
    variacoes.forEach((v) => tamanhos.add(v.tamanho));
    return Array.from(tamanhos).sort();
  }, [variacoes]);

  const variacoesFiltradas = useMemo(() => {
    return variacoes.filter((v) => {
      if (entregaEstoqueIds.length > 0 && !entregaEstoqueIds.includes(v.id)) {
        return false;
      }
      if (entregaGenero && v.genero !== entregaGenero) return false;
      if (entregaTamanho && v.tamanho !== entregaTamanho) return false;
      return true;
    });
  }, [variacoes, entregaGenero, entregaTamanho, entregaEstoqueIds]);

  const variacaoOptionsFiltradas = useMemo(
    () =>
      variacoesFiltradas.map((v) => ({
        label: `${v.tipoNome} - ${v.tamanho} - ${v.genero}`,
        value: v.id,
      })),
    [variacoesFiltradas],
  );

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
      if (devolucaoGenero && v.genero !== devolucaoGenero) return false;
      if (devolucaoTamanho && v.tamanho !== devolucaoTamanho) return false;
      return true;
    });
  }, [
    variacoes,
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
      if (devolucaoGenero && saldo.genero !== devolucaoGenero) return false;
      if (devolucaoTamanho && saldo.tamanho !== devolucaoTamanho) return false;
      return true;
    });
  }, [devolucaoSaldos, devolucaoGenero, devolucaoTamanho]);

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
          "Colaborador obrigatorio",
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
          "Nenhuma unidade disponivel para carregar o estoque.",
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
          : mapEstoqueToUi(
              (
                await fetchEstoque({
                  unidadeId: values.unidadeId,
                  offset: 0,
                  limit: 10,
                })
              ).data,
            );
      const estoqueMap = new Map(
        estoqueUi.map((item) => [item.variacaoId, item]),
      );
      const itensInvalidos = (values.itens ?? []).filter((item: any) => {
        const estoque = estoqueMap.get(item.variacaoId);
        const disponivel = (estoque?.total ?? 0) - (estoque?.reservado ?? 0);
        return item.quantidade > disponivel;
      });

      if (itensInvalidos.length > 0) {
        toaster.alerta(
          "Estoque insuficiente",
          "Estoque insuficiente para um ou mais itens. Verifique o saldo disponivel.",
        );
        return;
      }
      setSaving(true);
      const created = await createEntrega(values);
      toaster.sucesso("Entrega registrada", "A movimentacao foi criada.");
      setEntregaMovimentacaoId(created.id);
      setStepEntrega(2);
      setEntregaTermos([]);
      await load();
    } catch (err) {
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
          "Colaborador obrigatorio",
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
          "Nenhuma unidade disponivel para registrar a devolucao.",
        );
        return;
      }
      setSaving(true);
      const created = await createDevolucao({ ...values, force });
      toaster.sucesso("Devolucao registrada", "A movimentacao foi criada.");
      if (force) {
        toaster.alerta(
          "Devolucao forcada",
          "A devolucao foi registrada ignorando o saldo em posse.",
        );
      }
      setDevolucaoMovimentacaoId(created.id);
      setStepDevolucao(2);
      setDevolucaoTermos([]);
      await load();
    } catch (err) {
      toaster.erro("Erro ao registrar devolucao", err);
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
      toaster.sucesso("Termo gerado", "Uma nova versao foi criada.");
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
      toaster.sucesso("Termo gerado", "Uma nova versao foi criada.");
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
          ? "concluida"
          : status === MovimentacaoStatus.CANCELADO
            ? "cancelada"
            : "atualizada";
      toaster.sucesso("Movimentacao atualizada", `Movimentacao ${label}.`);
      await load();
    } catch (err) {
      toaster.erro("Erro ao atualizar movimentacao", err);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: "Colaborador",
      dataIndex: "colaboradorNome",
      key: "colaboradorNome",
    },
    {
      title: "Tipo",
      dataIndex: "tipo",
      key: "tipo",
      render: (value: string) => <Tag>{value}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value: string) => (
        <Tag
          color={
            value === MovimentacaoStatus.CONCLUIDO
              ? "green"
              : value === MovimentacaoStatus.CANCELADO
                ? "red"
                : "gold"
          }
        >
          {value}
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
    },
    {
      title: "Acoes",
      key: "acoes",
      render: (_: unknown, record: Movimentacao) => (
        <Space>
          <Popconfirm
            title="Marcar como Em transito?"
            onConfirm={() =>
              void handleStatus(record.id, MovimentacaoStatus.EM_TRANSITO)
            }
            okText="Sim"
            cancelText="Nao"
          >
            <Button size="small">Em transito</Button>
          </Popconfirm>
          <Popconfirm
            title="Concluir movimentacao?"
            onConfirm={() =>
              void handleStatus(record.id, MovimentacaoStatus.CONCLUIDO)
            }
            okText="Sim"
            cancelText="Nao"
          >
            <Button size="small">Concluir</Button>
          </Popconfirm>
          <Popconfirm
            title="Cancelar movimentacao?"
            onConfirm={() =>
              void handleStatus(record.id, MovimentacaoStatus.CANCELADO)
            }
            okText="Sim"
            cancelText="Nao"
          >
            <Button size="small" danger>
              Cancelar
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <FardamentosShell
      title="Movimentacoes"
      description="Gerencie entregas e devolucoes com reserva e baixa de estoque."
      actions={
        <Space>
          <Button type="primary" onClick={() => setOpenEntrega(true)}>
            Nova entrega
          </Button>
          <Button onClick={() => setOpenDevolucao(true)}>Nova devolucao</Button>
        </Space>
      }
    >
      <SectionCard
        title="Filtros"
        description="Refine por colaborador, unidade, status e periodo."
        actions={
          <Space>
            <Input
              placeholder="Buscar colaborador"
              value={filters.q}
              onChange={(e) => {
                setFilters({ ...filters, q: e.target.value });
                setPage(1);
              }}
              allowClear
            />
            <Select
              placeholder="Unidade"
              allowClear
              value={filters.unidadeId}
              onChange={(value) => {
                setFilters({ ...filters, unidadeId: value });
                setPage(1);
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
              options={unidades.map((u) => ({ label: u.nome, value: u.id }))}
              style={{ minWidth: 180 }}
            />
            <Select
              placeholder="Tipo"
              allowClear
              value={filters.tipo}
              onChange={(value) => {
                setFilters({ ...filters, tipo: value });
                setPage(1);
              }}
              options={[
                { label: "Entrega", value: MovimentacaoTipo.ENTREGA },
                { label: "Devolucao", value: MovimentacaoTipo.DEVOLUCAO },
              ]}
              style={{ minWidth: 160 }}
            />
            <Select
              placeholder="Status"
              allowClear
              value={filters.status}
              onChange={(value) => {
                setFilters({ ...filters, status: value });
                setPage(1);
              }}
              options={[
                { label: "Separado", value: MovimentacaoStatus.SEPARADO },
                { label: "Em transito", value: MovimentacaoStatus.EM_TRANSITO },
                { label: "Concluido", value: MovimentacaoStatus.CONCLUIDO },
                { label: "Cancelado", value: MovimentacaoStatus.CANCELADO },
              ]}
              style={{ minWidth: 160 }}
            />
            <RangePicker
              onChange={(dates) => {
                setFilters({
                  ...filters,
                  startDate: dates?.[0]?.toISOString(),
                  endDate: dates?.[1]?.toISOString(),
                });
                setPage(1);
              }}
            />
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (nextPage) => setPage(nextPage),
            showSizeChanger: false,
            showTotal: (value) => `Total: ${value}`,
          }}
        />
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
        tamanhosDisponiveis={tamanhosDisponiveis}
        estoqueEntrega={estoqueEntrega}
        entregaUnidadeId={entregaUnidadeId}
        setEntregaUnidadeId={async (value) => {
          setEntregaUnidadeId(value);
          formEntrega.setFieldValue("unidadeId", value ?? undefined);
          if (value) {
            const estoqueResult = await fetchEstoque({
              unidadeId: value,
              offset: 0,
              limit: 10,
            });
            const estoqueUi = mapEstoqueToUi(estoqueResult.data);
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
        onGerarTermo={handleGerarTermoEntrega}
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
              const estoqueResult = await fetchEstoque({
                unidadeId: currentUnidadeId,
                offset: 0,
                limit: 10,
              });
              const estoqueUi = mapEstoqueToUi(estoqueResult.data);
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
        tamanhosDisponiveis={tamanhosDisponiveis}
        devolucaoUnidadeId={devolucaoUnidadeId}
        setDevolucaoUnidadeId={async (value) => {
          setDevolucaoUnidadeId(value);
          formDevolucao.setFieldValue("unidadeId", value ?? undefined);
          if (value) {
            const estoqueResult = await fetchEstoque({
              unidadeId: value,
              offset: 0,
              limit: 10,
            });
            const estoqueUi = mapEstoqueToUi(estoqueResult.data);
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
        saldosLoading={devolucaoSaldosLoading}
        unidadesLoading={unidadesLoading}
        onUnidadesScroll={loadMoreUnidades}
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
            if (colabId) {
              const stored = {
                id: String(colabId),
                nome: String(colabNome ?? ""),
              };
              setDevolucaoColaborador(stored);
              devolucaoColaboradorRef.current = stored;
            }
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
          setDevolucaoGenero(null);
          setDevolucaoTamanho(null);
          setDevolucaoEstoqueIds([]);
          setDevolucaoSaldos([]);
          setDevolucaoMovimentacaoId(null);
          setDevolucaoTermos([]);
        }}
      />
    </FardamentosShell>
  );
}

function b64toBlob(b64Data: string, contentType: string) {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }

  return new Blob(byteArrays, { type: contentType });
}
