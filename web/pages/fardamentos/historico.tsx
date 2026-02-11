import {
  Button,
  DatePicker,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { FardamentosShell } from "@/modules/fardamentos/components/fardamentos-shell";
import { SectionCard } from "@/modules/fardamentos/components/section-card";
import type { Movimentacao } from "@/modules/fardamentos/types/movimentacoes.types";
import type { TermoInfo } from "@/modules/fardamentos/types/termos.types";
import {
  MovimentacaoStatus,
  MovimentacaoTipo,
} from "@/modules/fardamentos/types/movimentacoes.enums";
import {
  baixarTermo,
  fetchMovimentacoes,
  fetchUnidades,
  fetchVariacoes,
  gerarTermo,
  listarTermos,
  mapMovimentacoesToUi,
  mapVariacoesToUi,
} from "@/modules/fardamentos/services/fardamentos.service";
import type {
  Unidade,
  Variacao,
} from "@/modules/fardamentos/types/fardamentos.types";
import { toaster } from "@/components/toaster";
import { useDebounce } from "@/hooks/useDebounce";
import DefaultLayout from "@/layouts/default";

const { RangePicker } = DatePicker;

export default function HistoricoMovimentacoesPage() {
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
  const [_variacoes, setVariacoes] = useState<Variacao[]>([]);
  const [termosOpen, setTermosOpen] = useState(false);
  const [termosLoading, setTermosLoading] = useState(false);
  const [termos, setTermos] = useState<TermoInfo[]>([]);
  const [movSelecionada, setMovSelecionada] = useState<Movimentacao | null>(
    null,
  );

  useEffect(() => {
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
        toaster.erro("Erro ao carregar historico", err);
      } finally {
        setLoading(false);
      }
    };
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

  const openTermos = async (mov: Movimentacao) => {
    setMovSelecionada(mov);
    setTermosOpen(true);
    setTermosLoading(true);
    try {
      const result = await listarTermos(mov.id);
      setTermos(result);
    } catch (err) {
      toaster.erro("Erro ao carregar termos", err);
    } finally {
      setTermosLoading(false);
    }
  };

  const handleGerarTermo = async () => {
    if (!movSelecionada) return;
    setTermosLoading(true);
    try {
      await gerarTermo(movSelecionada.id);
      toaster.sucesso("Termo gerado", "Uma nova versao foi criada.");
      const result = await listarTermos(movSelecionada.id);
      setTermos(result);
    } catch (err) {
      toaster.erro("Erro ao gerar termo", err);
    } finally {
      setTermosLoading(false);
    }
  };

  const handleAbrir = async (termoId: string) => {
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

  const handleBaixar = async (termoId: string) => {
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
      title: "Itens",
      key: "itens",
      render: (_: unknown, record: Movimentacao) => {
        const totalQuantidade = record.itens.reduce(
          (total, item) => total + (item.quantidade ?? 0),
          0,
        );
        return `${totalQuantidade} peça(s) - ${record.itens.length} item(s)`;
      },
    },
    {
      title: "Termos",
      key: "termos",
      render: (_: unknown, record: Movimentacao) => (
        <Button size="small" onClick={() => void openTermos(record)}>
          Ver termos
        </Button>
      ),
    },
  ];

  const termoColumns = useMemo(
    () => [
      {
        title: "Versao",
        dataIndex: "versao",
        key: "versao",
      },
      {
        title: "Tipo",
        dataIndex: "tipo",
        key: "tipo",
      },
      {
        title: "Gerado por",
        dataIndex: "usuarioNome",
        key: "usuarioNome",
      },
      {
        title: "Criado em",
        dataIndex: "createdAt",
        key: "createdAt",
      },
      {
        title: "Acoes",
        key: "acoes",
        render: (_: unknown, record: TermoInfo) => (
          <Space>
            <Button size="small" onClick={() => void handleAbrir(record.id)}>
              Abrir
            </Button>
            <Button size="small" onClick={() => void handleBaixar(record.id)}>
              Baixar
            </Button>
          </Space>
        ),
      },
    ],
    [],
  );

  return (
    <DefaultLayout>
      <FardamentosShell
        title="Historico"
        description="Historico de movimentacoes e termos gerados."
        actions={
          <Space>
            <Button
              onClick={() => {
                setFilters({ ...filters });
                setPage(1);
              }}
            >
              Atualizar
            </Button>
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
                  {
                    label: "Em transito",
                    value: MovimentacaoStatus.EM_TRANSITO,
                  },
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

        <Modal
          open={termosOpen}
          onCancel={() => {
            setTermosOpen(false);
            setMovSelecionada(null);
            setTermos([]);
          }}
          title="Termos da movimentacao"
          width={760}
          styles={{ body: { maxHeight: "60vh", overflowY: "auto" } }}
          footer={
            <Space>
              <Button
                onClick={() => {
                  setTermosOpen(false);
                  setMovSelecionada(null);
                  setTermos([]);
                }}
              >
                Fechar
              </Button>
              <Button
                onClick={() => {
                  const ultimo = termos[0];
                  if (ultimo) {
                    void handleAbrir(ultimo.id);
                  }
                }}
                disabled={!termos.length}
              >
                Abrir ultimo termo
              </Button>
              <Button
                type="primary"
                loading={termosLoading}
                onClick={handleGerarTermo}
              >
                Gerar termo
              </Button>
            </Space>
          }
        >
          <Typography.Text type="secondary">
            {movSelecionada
              ? `${movSelecionada.colaboradorNome} - ${movSelecionada.unidadeNome}`
              : "Selecione uma movimentacao para ver os termos."}
          </Typography.Text>
          <Table
            className="mt-4"
            rowKey="id"
            columns={termoColumns}
            dataSource={termos}
            loading={termosLoading}
            scroll={{ y: 300 }}
            pagination={false}
          />
        </Modal>
      </FardamentosShell>
    </DefaultLayout>
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
