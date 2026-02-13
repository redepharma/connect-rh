import {
  Button,
  DatePicker,
  Input,
  Modal,
  Popover,
  Skeleton,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  gerarTermo,
  listarTermos,
  mapMovimentacoesToUi,
} from "@/modules/fardamentos/services/fardamentos.service";
import type { Unidade } from "@/modules/fardamentos/types/fardamentos.types";
import { formatIsoDateTime } from "@/shared/formatters/date";
import { b64toBlob } from "@/shared/utils/blob";
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
  const [termosOpen, setTermosOpen] = useState(false);
  const [termosLoading, setTermosLoading] = useState(false);
  const [termos, setTermos] = useState<TermoInfo[]>([]);
  const [movSelecionada, setMovSelecionada] = useState<Movimentacao | null>(
    null,
  );
  const showPageSkeleton = loading && data.length === 0;
  const pageBeforeFilterRef = useRef<number>(1);

  const isFiltered = (value: typeof filters) =>
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

  const historicoParams = useMemo(
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

  const loadHistorico = useCallback(async () => {
    setLoading(true);
    try {
      const movResult = await fetchMovimentacoes(historicoParams);
      setData(mapMovimentacoesToUi(movResult.data));
      setTotal(movResult.total);
    } catch (err) {
      toaster.erro("Erro ao carregar historico", err);
    } finally {
      setLoading(false);
    }
  }, [historicoParams]);

  useEffect(() => {
    void loadHistorico();
  }, [loadHistorico]);

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
          {value === MovimentacaoStatus.EM_TRANSITO ? "EM TRANSITO" : value}
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
      title: "Itens",
      key: "itens",
      render: (_: unknown, record: Movimentacao) => {
        const totalQuantidade = record.itens.reduce(
          (total, item) => total + (item.quantidade ?? 0),
          0,
        );
        return (
          <Popover
            trigger="hover"
            title="Detalhes dos itens"
            content={
              <div className="min-w-60 space-y-1">
                {record.itens.map((item) => (
                  <div key={item.id} className="text-xs text-neutral-700">
                    {item.quantidade}x {item.tipoNome} - {item.variacaoLabel}
                  </div>
                ))}
              </div>
            }
          >
            <span className="cursor-help underline decoration-dotted">
              {totalQuantidade} peça(s) - {record.itens.length} item(s)
            </span>
          </Popover>
        );
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
        title: "Versão",
        dataIndex: "versao",
        key: "versao",
      },
      {
        title: "Tipo",
        dataIndex: "tipo",
        key: "tipo",
        render: (value: string) => (
          <Tag
            color={value === MovimentacaoTipo.DEVOLUCAO ? "volcano" : "blue"}
          >
            {value === MovimentacaoTipo.DEVOLUCAO ? "DEVOLUÇÃO" : value}
          </Tag>
        ),
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
        render: (value: string) => formatIsoDateTime(value),
      },
      {
        title: "Ações",
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
        title="Histórico"
        description="Histórico de movimentações e termos gerados."
      >
        <SectionCard
          title="Resumo do histórico"
          description="Filtre por colaborador, unidade, status e período."
          actions={
            showPageSkeleton ? (
              <Space wrap className="w-full max-w-3xl">
                <Skeleton.Input active className="w-full md:min-w-70" />
                <Skeleton.Input active className="w-full md:min-w-45" />
                <Skeleton.Input active className="w-full md:min-w-40" />
                <Skeleton.Input active className="w-full md:min-w-40" />
                <Skeleton.Input active className="w-full md:min-w-50" />
              </Space>
            ) : (
              <Space wrap className="w-full max-w-3xl">
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
                    { label: "Concluído", value: MovimentacaoStatus.CONCLUIDO },
                    { label: "Cancelado", value: MovimentacaoStatus.CANCELADO },
                  ]}
                  className="w-full md:min-w-40"
                />
                <RangePicker
                  format="DD/MM/YYYY"
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
                  className="w-full md:min-w-50"
                />
              </Space>
            )
          }
        >
          {showPageSkeleton ? (
            <div className="space-y-3 rounded-lg border border-neutral-200/70 p-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton
                  key={`historico-skeleton-${index}`}
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

        <Modal
          open={termosOpen}
          onCancel={() => {
            setTermosOpen(false);
            setMovSelecionada(null);
            setTermos([]);
          }}
          title="Termos da movimentação"
          width="44vw"
          styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
          footer={
            <Space wrap>
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
                Abrir último termo
              </Button>
              <Button
                type="primary"
                loading={termosLoading}
                onClick={handleGerarTermo}
                disabled={
                  movSelecionada?.status === MovimentacaoStatus.CONCLUIDO ||
                  movSelecionada?.status === MovimentacaoStatus.CANCELADO
                }
              >
                Gerar novo termo
              </Button>
            </Space>
          }
        >
          <Typography.Text type="secondary">
            {movSelecionada
              ? `${movSelecionada.colaboradorNome} - ${movSelecionada.unidadeNome}`
              : "Selecione uma movimentação para ver os termos."}
          </Typography.Text>
          {termosLoading && termos.length === 0 ? (
            <div className="mt-4 space-y-3 rounded-lg border border-neutral-200/70 p-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton
                  key={`termos-skeleton-${index}`}
                  active
                  title={false}
                  paragraph={{ rows: 1, width: ["100%"] }}
                />
              ))}
            </div>
          ) : (
            <Table
              className="mt-4"
              rowKey="id"
              columns={termoColumns}
              dataSource={termos}
              loading={termosLoading}
              scroll={{ x: 760, y: 300 }}
              pagination={false}
            />
          )}
        </Modal>
      </FardamentosShell>
    </DefaultLayout>
  );
}
