import { Button, Form, Input, Select, Skeleton, Space, Spin } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import type { UIEvent } from "react";
import { FardamentosShell } from "@/modules/fardamentos/components/fardamentos-shell";
import { SectionCard } from "@/modules/fardamentos/components/section-card";
import { TipoTable } from "@/modules/fardamentos/components/tipo-table";
import { TipoModal } from "@/modules/fardamentos/components/tipo-modal";
import type {
  TipoFardamento,
  Unidade,
} from "@/modules/fardamentos/types/fardamentos.types";
import {
  createTipo,
  deleteTipo,
  fetchTipos,
  fetchUnidades,
  mapTiposToUi,
  updateTipo,
} from "@/modules/fardamentos/services/fardamentos.service";
import { toaster } from "@/components/toaster";
import { useDebounce } from "@/hooks/useDebounce";
import DefaultLayout from "@/layouts/default";

export default function TiposPage() {
  const [data, setData] = useState<TipoFardamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query);
  const [unidadeId, setUnidadeId] = useState<string | undefined>();
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [total, setTotal] = useState(0);
  const [unidadesQuery, setUnidadesQuery] = useState("");
  const debouncedUnidadesQuery = useDebounce(unidadesQuery);
  const [unidadesOffset, setUnidadesOffset] = useState(0);
  const [unidadesHasMore, setUnidadesHasMore] = useState(true);
  const [unidadesLoading, setUnidadesLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TipoFardamento | null>(null);
  const [editingExtraUnidades, setEditingExtraUnidades] = useState<
    Array<{ id: string; nome: string }>
  >([]);
  const [saveAndCreateAnother, setSaveAndCreateAnother] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const showPageSkeleton = loading && data.length === 0;
  const pageBeforeFilterRef = useRef<number>(1);

  const loadTipos = useCallback(
    async (params?: { query?: string; unidadeId?: string; currentPage?: number }) => {
      const effectiveQuery = params?.query ?? debouncedQuery;
      const effectiveUnidadeId = params?.unidadeId ?? unidadeId;
      const effectivePage = params?.currentPage ?? page;

      setLoading(true);
      try {
        const [tiposResult, unidadesResult] = await Promise.all([
          fetchTipos({
            q: effectiveQuery || undefined,
            unidadeId: effectiveUnidadeId,
            offset: (effectivePage - 1) * pageSize,
            limit: pageSize,
          }),
          fetchUnidades({
            q: debouncedUnidadesQuery || undefined,
            offset: 0,
            limit: 10,
          }),
        ]);

        setData(mapTiposToUi(tiposResult.data));
        setTotal(tiposResult.total);
        setUnidades(unidadesResult.data);
        setUnidadesOffset(unidadesResult.data.length);
        setUnidadesHasMore(unidadesResult.data.length < unidadesResult.total);
      } catch (err) {
        toaster.erro("Erro ao carregar tipos", err);
      } finally {
        setLoading(false);
      }
    },
    [debouncedQuery, unidadeId, page, debouncedUnidadesQuery],
  );

  useEffect(() => {
    void loadTipos();
  }, [loadTipos]);

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

  const handleUnidadesSearch = (value: string) => {
    setUnidadesQuery(value);
    setUnidadesOffset(0);
    setUnidadesHasMore(true);
  };

  const handleFilterStateChange = (
    nextQuery: string,
    nextUnidadeId: string | undefined,
  ) => {
    const currentFiltered = Boolean(query.trim() || unidadeId);
    const nextFiltered = Boolean(nextQuery.trim() || nextUnidadeId);

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

  const handleUnidadesPopupScroll = (event: UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    if (target.scrollTop + target.offsetHeight >= target.scrollHeight - 16) {
      void loadMoreUnidades();
    }
  };

  const openCreate = () => {
    setEditing(null);
    setEditingExtraUnidades([]);
    setSaveAndCreateAnother(false);
    form.resetFields();
    setOpen(true);
  };

  const openEdit = (tipo: TipoFardamento) => {
    setEditing(tipo);
    setSaveAndCreateAnother(false);
    setEditingExtraUnidades(tipo.unidadesDetalhes ?? []);
    form.setFieldsValue({
      nome: tipo.nome,
      unidadesIds: tipo.unidadesIds,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        const normalizeText = (value: unknown) => String(value ?? "").trim();
        const sameIdSet = (a: string[], b: string[]) => {
          if (a.length !== b.length) return false;
          const aSorted = [...a].sort();
          const bSorted = [...b].sort();
          return aSorted.every((value, index) => value === bSorted[index]);
        };

        const isUnchanged =
          normalizeText(values.nome) === normalizeText(editing.nome) &&
          sameIdSet(values.unidadesIds ?? [], editing.unidadesIds ?? []);

        if (isUnchanged) {
          setOpen(false);
          setEditing(null);
          return;
        }
      }
      setSaving(true);
      if (editing) {
        await updateTipo(editing.id, values);
        toaster.sucesso("Tipo atualizado", "Os dados foram salvos.");
        setOpen(false);
        setEditing(null);
      } else {
        await createTipo(values);
        if (saveAndCreateAnother) {
          toaster.sucesso(
            "Tipo criado",
            "O tipo foi cadastrado. Você pode adicionar outro.",
          );
          form.resetFields();
        } else {
          toaster.sucesso("Tipo criado", "O tipo foi cadastrado.");
          setOpen(false);
          setEditing(null);
        }
      }
      setQuery("");
      setPage(1);
      await loadTipos({ query: "", unidadeId, currentPage: 1 });
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "errorFields" in err &&
        Array.isArray((err as { errorFields?: unknown[] }).errorFields)
      ) {
        return;
      }
      toaster.erro("Erro ao salvar tipo", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tipo: TipoFardamento) => {
    try {
      setSaving(true);
      await deleteTipo(tipo.id);
      setQuery("");
      setPage(1);
      await loadTipos({ query: "", unidadeId, currentPage: 1 });
      toaster.sucesso("Tipo removido", "O tipo foi excluído.");
    } catch (err) {
      toaster.erro("Erro ao remover tipo", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DefaultLayout>
      <FardamentosShell
        title="Tipos de fardamentos"
        description="Gerencie os tipos e associações com unidades."
        actions={
          <Button
            type="primary"
            onClick={openCreate}
            disabled={loading || saving}
            className="w-full sm:w-auto"
          >
            Novo tipo
          </Button>
        }
      >
        <SectionCard
          title="Catálogo de tipos"
          description="Cada tipo pode ser vinculado a uma ou mais unidades."
          actions={
            showPageSkeleton ? (
              <Space className="w-full sm:w-auto">
                <Skeleton.Input
                  active
                  size="small"
                  style={{ width: 200, maxWidth: "100%" }}
                />
                <Skeleton.Input
                  active
                  size="small"
                  style={{ width: 180, maxWidth: "100%" }}
                />
              </Space>
            ) : (
              <Space className="w-full sm:w-auto" wrap>
                <div className="w-full sm:w-auto">
                  <Input
                    placeholder="Buscar tipo"
                    value={query}
                    onChange={(event) => {
                      const nextQuery = event.target.value;
                      setQuery(nextQuery);
                      handleFilterStateChange(nextQuery, unidadeId);
                    }}
                    allowClear
                    disabled={loading || saving}
                    className="w-full sm:min-w-72"
                  />
                </div>
                <div className="w-full sm:w-auto">
                  <Select
                    placeholder="Filtrar unidade"
                    value={unidadeId}
                    allowClear
                    onChange={(value) => {
                      const nextUnidadeId = value;
                      setUnidadeId(nextUnidadeId);
                      handleFilterStateChange(query, nextUnidadeId);
                    }}
                    showSearch
                    onSearch={handleUnidadesSearch}
                    onPopupScroll={handleUnidadesPopupScroll}
                    filterOption={false}
                    loading={unidadesLoading}
                    disabled={loading || saving}
                    dropdownRender={(menu) => (
                      <>
                        {menu}
                        {unidadesLoading ? (
                          <div className="px-3 py-2 text-center text-xs text-neutral-500">
                            <Spin size="small" />{" "}
                            <span className="ml-2">Carregando mais...</span>
                          </div>
                        ) : null}
                      </>
                    )}
                    options={unidades.map((unit) => ({
                      label: unit.nome,
                      value: unit.id,
                    }))}
                    className="w-full sm:min-w-[180px]"
                  />
                </div>
              </Space>
            )
          }
        >
          <TipoTable
            data={data}
            loading={loading || saving}
            actionsDisabled={saving || loading}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (nextPage) => setPage(nextPage),
            }}
            onEdit={openEdit}
            onDelete={(tipo) => void handleDelete(tipo)}
          />
        </SectionCard>
        <TipoModal
          open={open}
          editing={editing}
          form={form}
          saving={saving}
          unidades={unidades}
          extraUnidades={editingExtraUnidades}
          unidadesLoading={unidadesLoading}
          onUnidadesSearch={handleUnidadesSearch}
          onUnidadesScroll={loadMoreUnidades}
          saveAndCreateAnother={saveAndCreateAnother}
          onSaveAndCreateAnotherChange={setSaveAndCreateAnother}
          onCancel={() => setOpen(false)}
          onOk={handleSave}
        />
      </FardamentosShell>
    </DefaultLayout>
  );
}
