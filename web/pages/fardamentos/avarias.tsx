import {
  Button,
  DatePicker,
  Empty,
  Input,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import { useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    let active = true;

    const load = async () => {
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

        if (active) {
          setData(avariasResult.data);
          setTotal(avariasResult.total);
          setUnidades(unidadesResult.data);
          setUnidadesOffset(unidadesResult.data.length);
          setUnidadesHasMore(unidadesResult.data.length < unidadesResult.total);
          setTipos(mapTiposToUi(tiposResult.data));
          setTiposOffset(tiposResult.data.length);
          setTiposHasMore(tiposResult.data.length < tiposResult.total);
        }
      } catch (err) {
        if (active) toaster.erro("Erro ao carregar avarias", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [
    debouncedQuery,
    unidadeId,
    tipoId,
    colaboradorId,
    periodo,
    page,
    debouncedUnidadesQuery,
    debouncedTiposQuery,
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

  const loadMoreTipos = async () => {
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
  };

  const totalQuantidadePagina = useMemo(
    () => data.reduce((acc, item) => acc + item.quantidade, 0),
    [data],
  );

  const filtrosAtivos = Boolean(
    debouncedQuery ||
    unidadeId ||
    tipoId ||
    colaboradorId ||
    periodo?.[0] ||
    periodo?.[1],
  );

  const columns = [
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
      title: "Variacao",
      dataIndex: "variacaoLabel",
      key: "variacaoLabel",
    },
    {
      title: "Qtd",
      dataIndex: "quantidade",
      key: "quantidade",
    },
    {
      title: "Descricao",
      dataIndex: "descricao",
      key: "descricao",
      render: (value: string | null) => value ?? "-",
    },
    {
      title: "Criado em",
      dataIndex: "createdAt",
      key: "createdAt",
    },
  ];

  return (
    <DefaultLayout>
      <FardamentosShell
        title="Avarias"
        description="Acompanhe itens avariados e ajustes aplicados no estoque."
      >
        <SectionCard
          title="Registros de avarias"
          description="Consulte as avarias registradas em devolucoes."
          actions={
            <Space wrap>
              <Input
                placeholder="Buscar colaborador, unidade ou variacao"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                allowClear
              />
              <Select
                placeholder="Colaborador"
                allowClear
                showSearch
                onSearch={() => null}
                onChange={(value) => {
                  setColaboradorId(value);
                  setPage(1);
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
                style={{ minWidth: 200 }}
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
                  setUnidadeId(value);
                  setPage(1);
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
                options={unidades.map((unidade) => ({
                  label: unidade.nome,
                  value: unidade.id,
                }))}
                style={{ minWidth: 200 }}
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
                  setTipoId(value);
                  setPage(1);
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
                options={tipos.map((tipo) => ({
                  label: tipo.nome,
                  value: tipo.id,
                }))}
                style={{ minWidth: 200 }}
              />
              <RangePicker
                onChange={(dates, dateStrings) => {
                  const start = dateStrings[0] || "";
                  const end = dateStrings[1] || "";
                  setPeriodo(start && end ? [start, end] : null);
                  setPage(1);
                }}
              />
              <Button
                onClick={() => {
                  setQuery("");
                  setUnidadeId(undefined);
                  setTipoId(undefined);
                  setColaboradorId(undefined);
                  setPeriodo(null);
                  setPage(1);
                }}
              >
                Limpar filtros
              </Button>
            </Space>
          }
        >
          <Space className="mb-3" wrap>
            <Tag color="blue">{total} avarias</Tag>
            <Tag color="purple">{totalQuantidadePagina} itens nesta pagina</Tag>
            {filtrosAtivos ? <Tag>Filtros ativos</Tag> : null}
          </Space>
          <Table
            rowKey="id"
            loading={loading}
            dataSource={data}
            columns={columns}
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
        </SectionCard>
      </FardamentosShell>
    </DefaultLayout>
  );
}
