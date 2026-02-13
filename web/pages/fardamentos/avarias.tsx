import {
  Button,
  DatePicker,
  Empty,
  Input,
  Select,
  Skeleton,
  Space,
  Spin,
  Table,
  Tag,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FardamentosShell } from "@/modules/fardamentos/components/fardamentos-shell";
import { SectionCard } from "@/modules/fardamentos/components/section-card";
import type {
  TipoFardamento,
  Unidade,
} from "@/modules/fardamentos/types/fardamentos.types";
import type { Avaria } from "@/modules/fardamentos/types/avarias.types";
import {
  fetchAvarias,
  fetchTipos,
  fetchUnidades,
  mapTiposToUi,
} from "@/modules/fardamentos/services/fardamentos.service";
import { colaboradoresMock } from "@/modules/fardamentos/types/fardamentos.mock";
import { toaster } from "@/components/toaster";
import { useDebounce } from "@/hooks/useDebounce";
import DefaultLayout from "@/layouts/default";
import { formatIsoDateTime } from "@/shared/formatters/date";

const { RangePicker } = DatePicker;

export default function AvariasPage() {
  const [data, setData] = useState<Avaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query);
  const [unidadeId, setUnidadeId] = useState<string | undefined>();
  const [tipoId, setTipoId] = useState<string | undefined>();
  const [colaboradorId, setColaboradorId] = useState<string | undefined>();
  const [periodo, setPeriodo] = useState<[string, string] | null>(null);

  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [unidadesQuery, setUnidadesQuery] = useState("");
  const debouncedUnidadesQuery = useDebounce(unidadesQuery);
  const [unidadesOffset, setUnidadesOffset] = useState(0);
  const [unidadesHasMore, setUnidadesHasMore] = useState(true);
  const [unidadesLoading, setUnidadesLoading] = useState(false);

  const [tipos, setTipos] = useState<TipoFardamento[]>([]);
  const [tiposQuery, setTiposQuery] = useState("");
  const debouncedTiposQuery = useDebounce(tiposQuery);
  const [tiposOffset, setTiposOffset] = useState(0);
  const [tiposHasMore, setTiposHasMore] = useState(true);
  const [tiposLoading, setTiposLoading] = useState(false);
  const pageBeforeFilterRef = useRef<number>(1);
  const showPageSkeleton = loading && data.length === 0;

  const isFiltered = useCallback(
    (value: {
      query: string;
      unidadeId?: string;
      tipoId?: string;
      colaboradorId?: string;
      periodo: [string, string] | null;
    }) =>
      Boolean(
        value.query.trim() ||
        value.unidadeId ||
        value.tipoId ||
        value.colaboradorId ||
        value.periodo?.[0] ||
        value.periodo?.[1],
      ),
    [],
  );

  const handleFiltersStateChange = useCallback(
    (nextFilters: {
      query: string;
      unidadeId?: string;
      tipoId?: string;
      colaboradorId?: string;
      periodo: [string, string] | null;
    }) => {
      const currentFiltered = isFiltered({
        query,
        unidadeId,
        tipoId,
        colaboradorId,
        periodo,
      });
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
    },
    [colaboradorId, isFiltered, page, periodo, query, tipoId, unidadeId],
  );

  const loadAvariasPage = useCallback(async () => {
    setLoading(true);
    try {
      const [avariasResult, unidadesResult, tiposResult] = await Promise.all([
        fetchAvarias({
          q: debouncedQuery || undefined,
          unidadeId,
          tipoId,
          colaboradorId,
          startDate: periodo?.[0],
          endDate: periodo?.[1],
          offset: (page - 1) * pageSize,
          limit: pageSize,
        }),
        fetchUnidades({
          q: debouncedUnidadesQuery || undefined,
          offset: 0,
          limit: 10,
        }),
        fetchTipos({
          q: debouncedTiposQuery || undefined,
          offset: 0,
          limit: 10,
        }),
      ]);

      setData(avariasResult.data);
      setTotal(avariasResult.total);
      setUnidades(unidadesResult.data);
      setUnidadesOffset(unidadesResult.data.length);
      setUnidadesHasMore(unidadesResult.data.length < unidadesResult.total);
      setTipos(mapTiposToUi(tiposResult.data));
      setTiposOffset(tiposResult.data.length);
      setTiposHasMore(tiposResult.data.length < tiposResult.total);
    } catch (err) {
      toaster.erro("Erro ao carregar avarias", err);
    } finally {
      setLoading(false);
    }
  }, [
    colaboradorId,
    debouncedQuery,
    debouncedTiposQuery,
    debouncedUnidadesQuery,
    page,
    periodo,
    tipoId,
    unidadeId,
  ]);

  useEffect(() => {
    void loadAvariasPage();
  }, [loadAvariasPage]);

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
  }, [
    debouncedUnidadesQuery,
    unidadesHasMore,
    unidadesLoading,
    unidadesOffset,
  ]);

  const loadMoreTipos = useCallback(async () => {
    if (tiposLoading || !tiposHasMore) return;
    setTiposLoading(true);
    try {
      const result = await fetchTipos({
        q: debouncedTiposQuery || undefined,
        offset: tiposOffset,
        limit: 10,
      });
      setTipos((prev) => [...prev, ...mapTiposToUi(result.data)]);
      const nextOffset = tiposOffset + result.data.length;
      setTiposOffset(nextOffset);
      setTiposHasMore(nextOffset < result.total);
    } catch (err) {
      toaster.erro("Erro ao carregar tipos", err);
    } finally {
      setTiposLoading(false);
    }
  }, [debouncedTiposQuery, tiposHasMore, tiposLoading, tiposOffset]);

  const totalQuantidadePagina = useMemo(
    () => data.reduce((acc, item) => acc + item.quantidade, 0),
    [data],
  );

  const filtrosAtivos = useMemo(
    () =>
      Boolean(
        debouncedQuery ||
        unidadeId ||
        tipoId ||
        colaboradorId ||
        periodo?.[0] ||
        periodo?.[1],
      ),
    [colaboradorId, debouncedQuery, periodo, tipoId, unidadeId],
  );

  const columns = useMemo(
    () => [
      {
        title: "Colaborador",
        dataIndex: "colaboradorNome",
        key: "colaboradorNome",
      },
      {
        title: "Unidade",
        dataIndex: "unidadeNome",
        key: "unidadeNome",
      },
      {
        title: "Tipo",
        dataIndex: "tipoNome",
        key: "tipoNome",
      },
      {
        title: "Variação",
        dataIndex: "variacaoLabel",
        key: "variacaoLabel",
      },
      {
        title: "Qtd.",
        dataIndex: "quantidade",
        key: "quantidade",
      },
      {
        title: "Descrição",
        dataIndex: "descricao",
        key: "descricao",
        render: (value: string | null) => value ?? "-",
      },
      {
        title: "Criado em",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (value: string) => formatIsoDateTime(value),
      },
    ],
    [],
  );

  const rangePresets = useMemo<Array<{ label: string; value: [Dayjs, Dayjs] }>>(
    () => [
      {
        label: "Últimos 7 dias",
        value: [
          dayjs().subtract(6, "day").startOf("day"),
          dayjs().endOf("day"),
        ],
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

  return (
    <DefaultLayout>
      <FardamentosShell
        title="Avarias"
        description="Acompanhe itens avariados e ajustes aplicados no estoque."
      >
        <SectionCard
          title="Registros de avarias"
          description="Consulte as avarias registradas em devoluções."
          actions={
            showPageSkeleton ? (
              <Space wrap className="w-full max-w-3xl">
                <Skeleton.Input active className="w-full md:min-w-70" />
                <Skeleton.Input active className="w-full md:min-w-45" />
                <Skeleton.Input active className="w-full md:min-w-45" />
                <Skeleton.Input active className="w-full md:min-w-45" />
                <Skeleton.Input active className="w-full md:min-w-50" />
              </Space>
            ) : (
              <Space wrap className="max-w-3xl w-full">
                <Input
                  placeholder="Buscar colaborador, unidade ou variação"
                  value={query}
                  onChange={(event) => {
                    const nextQuery = event.target.value;
                    handleFiltersStateChange({
                      query: nextQuery,
                      unidadeId,
                      tipoId,
                      colaboradorId,
                      periodo,
                    });
                    setQuery(nextQuery);
                  }}
                  allowClear
                  className="w-full sm:min-w-72"
                />
                <Select
                  placeholder="Colaborador"
                  allowClear
                  showSearch
                  onSearch={() => null}
                  onChange={(value) => {
                    handleFiltersStateChange({
                      query,
                      unidadeId,
                      tipoId,
                      colaboradorId: value,
                      periodo,
                    });
                    setColaboradorId(value);
                  }}
                  value={colaboradorId}
                  filterOption={(input, option) =>
                    String(option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={colaboradoresMock.map((colab) => ({
                    label: colab.nome,
                    value: colab.id,
                  }))}
                  className="w-full sm:min-w-50"
                />
                <Select
                  placeholder="Filtrar unidade"
                  value={unidadeId}
                  allowClear
                  showSearch
                  onSearch={(value) => {
                    setUnidadesQuery(value);
                    setUnidadesOffset(0);
                    setUnidadesHasMore(true);
                  }}
                  onChange={(value) => {
                    handleFiltersStateChange({
                      query,
                      unidadeId: value,
                      tipoId,
                      colaboradorId,
                      periodo,
                    });
                    setUnidadeId(value);
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
                  options={unidades.map((unidade) => ({
                    label: unidade.nome,
                    value: unidade.id,
                  }))}
                  className="w-full sm:min-w-50"
                />
                <Select
                  placeholder="Filtrar tipo"
                  value={tipoId}
                  allowClear
                  showSearch
                  onSearch={(value) => {
                    setTiposQuery(value);
                    setTiposOffset(0);
                    setTiposHasMore(true);
                  }}
                  onChange={(value) => {
                    handleFiltersStateChange({
                      query,
                      unidadeId,
                      tipoId: value,
                      colaboradorId,
                      periodo,
                    });
                    setTipoId(value);
                  }}
                  onPopupScroll={(event) => {
                    const target = event.target as HTMLDivElement;
                    if (
                      target.scrollTop + target.offsetHeight >=
                      target.scrollHeight - 16
                    ) {
                      void loadMoreTipos();
                    }
                  }}
                  loading={tiposLoading}
                  popupRender={(menu) => (
                    <>
                      {menu}
                      {tiposLoading ? (
                        <div className="px-3 py-2 text-center">
                          <Spin size="small" />
                        </div>
                      ) : null}
                    </>
                  )}
                  options={tipos.map((tipo) => ({
                    label: tipo.nome,
                    value: tipo.id,
                  }))}
                  className="w-full sm:min-w-50"
                />
                <RangePicker
                  format="DD/MM/YYYY"
                  placeholder={["Data inicial", "Data final"]}
                  presets={rangePresets}
                  onChange={(dates) => {
                    const start = dates?.[0]?.toISOString() || "";
                    const end = dates?.[1]?.toISOString() || "";
                    const nextPeriodo: [string, string] | null =
                      start && end ? [start, end] : null;
                    handleFiltersStateChange({
                      query,
                      unidadeId,
                      tipoId,
                      colaboradorId,
                      periodo: nextPeriodo,
                    });
                    setPeriodo(nextPeriodo);
                  }}
                  className="w-full max-w-60 sm:min-w-52"
                />
                <Button
                  onClick={() => {
                    handleFiltersStateChange({
                      query: "",
                      unidadeId: undefined,
                      tipoId: undefined,
                      colaboradorId: undefined,
                      periodo: null,
                    });
                    setQuery("");
                    setUnidadeId(undefined);
                    setTipoId(undefined);
                    setColaboradorId(undefined);
                    setPeriodo(null);
                  }}
                  className="w-full sm:w-auto"
                >
                  Limpar filtros
                </Button>
              </Space>
            )
          }
        >
          {showPageSkeleton ? (
            <div className="space-y-3 rounded-lg border border-neutral-200/70 p-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton
                  key={`avarias-skeleton-${index}`}
                  active
                  title={false}
                  paragraph={{ rows: 1, width: ["100%"] }}
                />
              ))}
            </div>
          ) : (
            <>
              <Space className="mb-3" wrap>
                <Tag color="blue">{total} avarias</Tag>
                <Tag color="purple">
                  {totalQuantidadePagina} itens nesta página
                </Tag>
                {filtrosAtivos ? <Tag>Filtros ativos</Tag> : null}
              </Space>
              <Table
                rowKey="id"
                loading={loading}
                dataSource={data}
                columns={columns}
                scroll={{ x: 920 }}
                locale={{
                  emptyText: (
                    <Empty
                      description={
                        filtrosAtivos
                          ? "Nenhuma avaria encontrada com os filtros atuais."
                          : "Nenhuma avaria registrada ainda."
                      }
                    />
                  ),
                }}
                pagination={{
                  current: page,
                  pageSize,
                  total,
                  onChange: (next) => setPage(next),
                  showTotal: (value) => `${value} avarias`,
                }}
              />
            </>
          )}
        </SectionCard>
      </FardamentosShell>
    </DefaultLayout>
  );
}
