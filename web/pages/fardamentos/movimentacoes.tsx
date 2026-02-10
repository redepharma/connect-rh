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
import { useEffect, useMemo, useState } from "react";
import { FardamentosShell } from "@/modules/fardamentos/components/fardamentos-shell";
import { SectionCard } from "@/modules/fardamentos/components/section-card";
import { MovimentacaoEntregaWizard } from "@/modules/fardamentos/components/movimentacao-entrega-wizard";
import { MovimentacaoDevolucaoWizard } from "@/modules/fardamentos/components/movimentacao-devolucao-wizard";
import type {
  Unidade,
  Variacao,
} from "@/modules/fardamentos/types/fardamentos.types";
import type { Movimentacao } from "@/modules/fardamentos/types/movimentacoes.types";
import {
  MovimentacaoStatus,
  MovimentacaoTipo,
} from "@/modules/fardamentos/types/movimentacoes.enums";
import { Genero } from "@/modules/fardamentos/types/genero.enums";
import {
  createDevolucao,
  createEntrega,
  fetchEstoque,
  fetchMovimentacoes,
  fetchUnidades,
  fetchVariacoes,
  mapEstoqueToUi,
  mapMovimentacoesToUi,
  mapVariacoesToUi,
  updateMovimentacaoStatus,
} from "@/modules/fardamentos/services/fardamentos.service";
import { parseApiError } from "@/shared/error-handlers/api-errors";
import { toaster } from "@/components/toaster";

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
  const [filters, setFilters] = useState({
    q: "",
    unidadeId: undefined as string | undefined,
    tipo: undefined as MovimentacaoTipo | undefined,
    status: undefined as MovimentacaoStatus | undefined,
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
  });

  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [variacoes, setVariacoes] = useState<Variacao[]>([]);
  const [openEntrega, setOpenEntrega] = useState(false);
  const [openDevolucao, setOpenDevolucao] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stepEntrega, setStepEntrega] = useState(0);
  const [stepDevolucao, setStepDevolucao] = useState(0);
  const [formEntrega] = Form.useForm();
  const [formDevolucao] = Form.useForm();
  const [estoqueEntrega, setEstoqueEntrega] = useState<
    { variacaoId: string; total: number; reservado: number }[]
  >([]);
  const [entregaUnidadeId, setEntregaUnidadeId] = useState<string | null>(null);
  const [entregaGenero, setEntregaGenero] = useState<Genero | null>(null);
  const [entregaTamanho, setEntregaTamanho] = useState<string | null>(null);
  const [devolucaoUnidadeId, setDevolucaoUnidadeId] = useState<string | null>(
    null,
  );
  const [devolucaoGenero, setDevolucaoGenero] = useState<Genero | null>(null);
  const [devolucaoTamanho, setDevolucaoTamanho] = useState<string | null>(null);
  const [devolucaoEstoqueIds, setDevolucaoEstoqueIds] = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [movResult, unidadesResult, variacoesResult] = await Promise.all([
        fetchMovimentacoes(filters),
        fetchUnidades(),
        fetchVariacoes(),
      ]);
      setData(mapMovimentacoesToUi(movResult));
      setUnidades(unidadesResult);
      setVariacoes(mapVariacoesToUi(variacoesResult));
    } catch (err) {
      toaster.erro("Erro ao carregar movimentacoes", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [filters]);

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
      if (entregaGenero && v.genero !== entregaGenero) return false;
      if (entregaTamanho && v.tamanho !== entregaTamanho) return false;
      return true;
    });
  }, [variacoes, entregaGenero, entregaTamanho]);

  const variacaoOptionsFiltradas = useMemo(
    () =>
      variacoesFiltradas.map((v) => ({
        label: `${v.tipoNome} - ${v.tamanho} - ${v.genero}`,
        value: v.id,
      })),
    [variacoesFiltradas],
  );

  const variacoesDevolucaoFiltradas = useMemo(() => {
    return variacoes.filter((v) => {
      if (
        devolucaoEstoqueIds.length > 0 &&
        !devolucaoEstoqueIds.includes(v.id)
      ) {
        return false;
      }
      if (devolucaoGenero && v.genero !== devolucaoGenero) return false;
      if (devolucaoTamanho && v.tamanho !== devolucaoTamanho) return false;
      return true;
    });
  }, [variacoes, devolucaoGenero, devolucaoTamanho, devolucaoEstoqueIds]);

  const variacaoOptionsDevolucao = useMemo(
    () =>
      variacoesDevolucaoFiltradas.map((v) => ({
        label: `${v.tipoNome} - ${v.tamanho} - ${v.genero}`,
        value: v.id,
      })),
    [variacoesDevolucaoFiltradas],
  );

  const handleEntrega = async () => {
    try {
      const values = await formEntrega.validateFields();
      if (!values.unidadeId) {
        const defaultUnidadeId = unidades[0]?.id;
        if (defaultUnidadeId) {
          formEntrega.setFieldValue("unidadeId", defaultUnidadeId);
          values.unidadeId = defaultUnidadeId;
        }
      }
      if (!values.unidadeId) {
        toaster.alerta(
          "Unidade indisponivel",
          "Nenhuma unidade disponivel para carregar o estoque.",
        );
        return;
      }
      const estoqueResult = await fetchEstoque({
        unidadeId: values.unidadeId,
      });
      const estoqueUi = mapEstoqueToUi(estoqueResult);
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
      await createEntrega(values);
      toaster.sucesso("Entrega registrada", "A movimentacao foi criada.");
      setOpenEntrega(false);
      setStepEntrega(0);
      formEntrega.resetFields();
      setEstoqueEntrega([]);
      setEntregaUnidadeId(null);
      setEntregaGenero(null);
      setEntregaTamanho(null);
      await load();
    } catch (err) {
      toaster.erro("Erro ao registrar entrega", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDevolucao = async () => {
    try {
      const values = await formDevolucao.validateFields();
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
      await createDevolucao(values);
      toaster.sucesso("Devolucao registrada", "A movimentacao foi criada.");
      setOpenDevolucao(false);
      setStepDevolucao(0);
      formDevolucao.resetFields();
      setDevolucaoUnidadeId(null);
      setDevolucaoGenero(null);
      setDevolucaoTamanho(null);
      setDevolucaoEstoqueIds([]);
      await load();
    } catch (err) {
      toaster.erro("Erro ao registrar devolucao", err);
    } finally {
      setSaving(false);
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
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              allowClear
            />
            <Select
              placeholder="Unidade"
              allowClear
              value={filters.unidadeId}
              onChange={(value) => setFilters({ ...filters, unidadeId: value })}
              options={unidades.map((u) => ({ label: u.nome, value: u.id }))}
              style={{ minWidth: 180 }}
            />
            <Select
              placeholder="Tipo"
              allowClear
              value={filters.tipo}
              onChange={(value) => setFilters({ ...filters, tipo: value })}
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
              onChange={(value) => setFilters({ ...filters, status: value })}
              options={[
                { label: "Separado", value: MovimentacaoStatus.SEPARADO },
                { label: "Em transito", value: MovimentacaoStatus.EM_TRANSITO },
                { label: "Concluido", value: MovimentacaoStatus.CONCLUIDO },
                { label: "Cancelado", value: MovimentacaoStatus.CANCELADO },
              ]}
              style={{ minWidth: 160 }}
            />
            <RangePicker
              onChange={(dates) =>
                setFilters({
                  ...filters,
                  startDate: dates?.[0]?.toISOString(),
                  endDate: dates?.[1]?.toISOString(),
                })
              }
            />
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
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
            });
            const estoqueUi = mapEstoqueToUi(estoqueResult);
            setEstoqueEntrega(
              estoqueUi.map((item) => ({
                variacaoId: item.variacaoId,
                total: item.total,
                reservado: item.reservado,
              })),
            );
          }
        }}
        entregaGenero={entregaGenero}
        setEntregaGenero={setEntregaGenero}
        entregaTamanho={entregaTamanho}
        setEntregaTamanho={setEntregaTamanho}
        onAdvance={async () => {
          try {
            await formEntrega.validateFields(["colaboradorId"]);
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
              });
              const estoqueUi = mapEstoqueToUi(estoqueResult);
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
          setEntregaUnidadeId(null);
          setEntregaGenero(null);
          setEntregaTamanho(null);
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
            });
            const estoqueUi = mapEstoqueToUi(estoqueResult);
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
        onAdvance={async () => {
          try {
            await formDevolucao.validateFields(["colaboradorId"]);
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
        onCancel={() => {
          setOpenDevolucao(false);
          setStepDevolucao(0);
          formDevolucao.resetFields();
          setDevolucaoUnidadeId(null);
          setDevolucaoGenero(null);
          setDevolucaoTamanho(null);
          setDevolucaoEstoqueIds([]);
        }}
      />
    </FardamentosShell>
  );
}
