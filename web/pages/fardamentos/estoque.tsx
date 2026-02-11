import { Alert, Button, Input, Select, Space, Switch } from "antd";
import { useEffect, useState } from "react";
import { FardamentosShell } from "@/modules/fardamentos/components/fardamentos-shell";
import { SectionCard } from "@/modules/fardamentos/components/section-card";
import { EstoqueTable } from "@/modules/fardamentos/components/estoque-table";
import type { EstoqueItem } from "@/modules/fardamentos/types/fardamentos.types";
import {
  fetchEstoque,
  fetchTipos,
  fetchUnidades,
  mapEstoqueToUi,
} from "@/modules/fardamentos/services/fardamentos.service";
import type {
  Unidade,
  TipoFardamento,
} from "@/modules/fardamentos/types/fardamentos.types";
import { mapTiposToUi } from "@/modules/fardamentos/services/fardamentos.service";
import { toaster } from "@/components/toaster";
import { useDebounce } from "@/hooks/useDebounce";
import DefaultLayout from "@/layouts/default";

export default function EstoquePage() {
  const [data, setData] = useState<EstoqueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query);
  const [unidadeId, setUnidadeId] = useState<string | undefined>();
  const [tipoId, setTipoId] = useState<string | undefined>();
  const [baixoEstoque, setBaixoEstoque] = useState(false);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [tipos, setTipos] = useState<TipoFardamento[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [total, setTotal] = useState(0);
  const [unidadesQuery, setUnidadesQuery] = useState("");
  const debouncedUnidadesQuery = useDebounce(unidadesQuery);
  const [unidadesOffset, setUnidadesOffset] = useState(0);
  const [unidadesHasMore, setUnidadesHasMore] = useState(true);
  const [unidadesLoading, setUnidadesLoading] = useState(false);
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
        const [estoqueResult, unidadesResult, tiposResult] = await Promise.all([
          fetchEstoque({
            q: debouncedQuery || undefined,
            unidadeId,
            tipoId,
            baixoEstoque,
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
          setData(mapEstoqueToUi(estoqueResult.data));
          setTotal(estoqueResult.total);
          setUnidades(unidadesResult.data);
          setUnidadesOffset(unidadesResult.data.length);
          setUnidadesHasMore(unidadesResult.data.length < unidadesResult.total);
          setTipos(mapTiposToUi(tiposResult.data));
          setTiposOffset(tiposResult.data.length);
          setTiposHasMore(tiposResult.data.length < tiposResult.total);
        }
      } catch (err) {
        if (active) toaster.erro("Erro ao carregar estoque", err);
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
    baixoEstoque,
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

  return (
    <DefaultLayout>
      <FardamentosShell
        title="Estoque"
        description="Controle disponivel, reservas e alertas de baixo estoque."
        actions={<Button>Atualizar estoque</Button>}
      >
        <SectionCard
          title="Resumo de estoque"
          description="Disponivel = total - reservado. Alerta itens abaixo do minimo."
          actions={
            <Space>
              <Input
                placeholder="Buscar item"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                allowClear
              />
              <Select
                placeholder="Filtrar unidade"
                value={unidadeId}
                allowClear
                onChange={(value) => setUnidadeId(value)}
                options={unidades.map((unit) => ({
                  label: unit.nome,
                  value: unit.id,
                }))}
                style={{ minWidth: 180 }}
              />
              <Select
                placeholder="Filtrar tipo"
                value={tipoId}
                allowClear
                onChange={(value) => setTipoId(value)}
                options={tipos.map((tipo) => ({
                  label: tipo.nome,
                  value: tipo.id,
                }))}
                style={{ minWidth: 180 }}
              />
              <Switch
                checked={baixoEstoque}
                onChange={(checked) => setBaixoEstoque(checked)}
                checkedChildren="Baixo estoque"
                unCheckedChildren="Todos"
              />
            </Space>
          }
        >
          {error ? (
            <Alert
              type="error"
              message="Falha ao carregar estoque"
              description={error}
              showIcon
            />
          ) : (
            <EstoqueTable data={data} loading={loading} />
          )}
        </SectionCard>
      </FardamentosShell>
    </DefaultLayout>
  );
}
