import { Button, Form, Input, Select, Skeleton, Space, Spin } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { FardamentosShell } from "@/modules/fardamentos/components/fardamentos-shell";
import { SectionCard } from "@/modules/fardamentos/components/section-card";
import { VariacaoTable } from "@/modules/fardamentos/components/variacao-table";
import { VariacaoModal } from "@/modules/fardamentos/components/variacao-modal";
import type {
  TipoFardamento,
  Variacao,
} from "@/modules/fardamentos/types/fardamentos.types";
import {
  createVariacao,
  deleteVariacao,
  fetchTipos,
  fetchVariacoes,
  mapTiposToUi,
  mapVariacoesToUi,
  updateVariacao,
} from "@/modules/fardamentos/services/fardamentos.service";
import { toaster } from "@/components/toaster";
import { useDebounce } from "@/hooks/useDebounce";
import DefaultLayout from "@/layouts/default";

export default function VariacoesPage() {
  const [data, setData] = useState<Variacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query);
  const [tipoId, setTipoId] = useState<string | undefined>();
  const [tipos, setTipos] = useState<TipoFardamento[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [total, setTotal] = useState(0);
  const [tiposQuery, setTiposQuery] = useState("");
  const debouncedTiposQuery = useDebounce(tiposQuery);
  const [tiposOffset, setTiposOffset] = useState(0);
  const [tiposHasMore, setTiposHasMore] = useState(true);
  const [tiposLoading, setTiposLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Variacao | null>(null);
  const [saveAndCreateAnother, setSaveAndCreateAnother] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const showPageSkeleton = loading && data.length === 0;
  const pageBeforeFilterRef = useRef<number>(1);
  const normalizeText = (value: unknown) => String(value ?? "").trim();
  const parseTamanhos = (value: unknown) =>
    normalizeText(value)
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

  const handleFilterStateChange = (
    nextQuery: string,
    nextTipoId: string | undefined,
  ) => {
    const currentFiltered = Boolean(query.trim() || tipoId);
    const nextFiltered = Boolean(nextQuery.trim() || nextTipoId);

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

  const loadVariacoes = useCallback(
    async (params?: { query?: string; tipoId?: string; currentPage?: number }) => {
      const effectiveQuery = params?.query ?? debouncedQuery;
      const effectiveTipoId = params?.tipoId ?? tipoId;
      const effectivePage = params?.currentPage ?? page;

      setLoading(true);
      try {
        const variacoesResult = await fetchVariacoes({
          q: effectiveQuery || undefined,
          tipoId: effectiveTipoId,
          offset: (effectivePage - 1) * pageSize,
          limit: pageSize,
        });

        setData(mapVariacoesToUi(variacoesResult.data));
        setTotal(variacoesResult.total);
      } catch (err) {
        toaster.erro("Erro ao carregar variações", err);
      } finally {
        setLoading(false);
      }
    },
    [debouncedQuery, tipoId, page],
  );

  useEffect(() => {
    void loadVariacoes();
  }, [loadVariacoes]);

  const loadFilterTipos = useCallback(async () => {
    setTiposLoading(true);
    try {
      const tiposResult = await fetchTipos({
        q: debouncedTiposQuery || undefined,
        offset: 0,
        limit: 10,
      });
      const mapped = mapTiposToUi(tiposResult.data);
      setTipos(mapped);
      setTiposOffset(mapped.length);
      setTiposHasMore(mapped.length < tiposResult.total);
    } catch (err) {
      toaster.erro("Erro ao carregar tipos", err);
    } finally {
      setTiposLoading(false);
    }
  }, [debouncedTiposQuery]);

  useEffect(() => {
    void loadFilterTipos();
  }, [loadFilterTipos]);

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

  const openCreate = () => {
    setEditing(null);
    setSaveAndCreateAnother(false);
    form.resetFields();
    if (tipoId) {
      form.setFieldsValue({ tipoId });
    }
    setOpen(true);
  };

  const openEdit = (variacao: Variacao) => {
    setEditing(variacao);
    setSaveAndCreateAnother(false);
    form.setFieldsValue({
      tipoId: variacao.tipoId,
      tamanho: variacao.tamanho,
      genero: variacao.genero,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    let createdCount = 0;
    try {
      const values = await form.validateFields();
      if (editing) {
        const isUnchanged =
          normalizeText(values.tipoId) === normalizeText(editing.tipoId) &&
          normalizeText(values.tamanho) === normalizeText(editing.tamanho) &&
          normalizeText(values.genero) === normalizeText(editing.genero);

        if (isUnchanged) {
          setOpen(false);
          setEditing(null);
          return;
        }
      }
      setSaving(true);
      if (editing) {
        await updateVariacao(editing.id, values);
        toaster.sucesso("Variação atualizada", "Os dados foram salvos.");
      } else {
        const tamanhos = Array.from(new Set(parseTamanhos(values.tamanho)));

        for (const tamanho of tamanhos) {
          await createVariacao({
            ...values,
            tamanho,
          });
          createdCount += 1;
        }

        toaster.sucesso(
          createdCount > 1 ? "Variações criadas" : "Variação criada",
          createdCount > 1
            ? `${createdCount} variações foram cadastradas.`
            : "A variação foi cadastrada.",
        );
      }
      setQuery("");
      setPage(1);
      await loadVariacoes({ query: "", tipoId, currentPage: 1 });

      if (editing || !saveAndCreateAnother) {
        setOpen(false);
        setEditing(null);
      } else {
        form.resetFields();
        form.setFieldsValue({
          tipoId: values.tipoId,
          genero: values.genero,
        });
      }
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "errorFields" in err &&
        Array.isArray((err as { errorFields?: unknown[] }).errorFields)
      ) {
        return;
      }
      if (!editing && createdCount > 0) {
        toaster.alerta(
          "Cadastro parcial",
          `${createdCount} variação(ões) foram criadas antes do erro.`,
        );
      }
      toaster.erro("Erro ao salvar variação", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (variacao: Variacao) => {
    try {
      setSaving(true);
      await deleteVariacao(variacao.id);
      setQuery("");
      setPage(1);
      await loadVariacoes({ query: "", tipoId, currentPage: 1 });
      toaster.sucesso("Variação removida", "A variação foi excluída.");
    } catch (err) {
      toaster.erro("Erro ao remover variação", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DefaultLayout>
      <FardamentosShell
        title="Variações"
        description="Configure tamanhos e gêneros para cada tipo de fardamento."
        actions={
          <Button
            type="primary"
            onClick={openCreate}
            disabled={loading || saving}
            className="w-full sm:w-auto"
          >
            Nova variação
          </Button>
        }
      >
        <SectionCard
          title="Variações cadastradas"
          description="As variações definem o estoque controlado e disponibilidade."
          actions={
            showPageSkeleton ? (
              <Space className="w-full sm:w-auto">
                <Skeleton.Input
                  active
                  size="small"
                  style={{ width: 280, maxWidth: "100%" }}
                />
                <Skeleton.Input
                  active
                  size="small"
                  style={{ width: 200, maxWidth: "100%" }}
                />
              </Space>
            ) : (
              <Space className="w-full sm:w-auto" wrap>
                <div className="w-full sm:w-auto">
                  <Input
                    placeholder="Buscar variação"
                    value={query}
                    onChange={(event) => {
                      const nextQuery = event.target.value;
                      setQuery(nextQuery);
                      handleFilterStateChange(nextQuery, tipoId);
                    }}
                    allowClear
                    disabled={loading || saving}
                    className="w-full sm:min-w-72"
                  />
                </div>
                <div className="w-full sm:w-auto">
                  <Select
                    placeholder="Filtrar tipo"
                    value={tipoId}
                    allowClear
                    onChange={(value) => {
                      const nextTipoId = value;
                      setTipoId(nextTipoId);
                      handleFilterStateChange(query, nextTipoId);
                    }}
                    showSearch
                    onSearch={(value) => {
                      setTiposQuery(value);
                      setTiposOffset(0);
                      setTiposHasMore(true);
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
                    filterOption={false}
                    loading={tiposLoading}
                    disabled={loading || saving}
                    popupRender={(menu) => (
                      <>
                        {menu}
                        {tiposLoading ? (
                          <div className="px-3 py-2 text-center text-xs text-neutral-500">
                            <Spin size="small" />{" "}
                            <span className="ml-2">Carregando mais...</span>
                          </div>
                        ) : null}
                      </>
                    )}
                    options={tipos.map((tipo) => ({
                      label: tipo.nome,
                      value: tipo.id,
                    }))}
                    className="w-full sm:min-w-[200px]"
                  />
                </div>
              </Space>
            )
          }
        >
          <VariacaoTable
            data={data}
            loading={loading || saving}
            actionsDisabled={loading || saving}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (nextPage) => setPage(nextPage),
            }}
            onEdit={openEdit}
            onDelete={(variacao) => void handleDelete(variacao)}
          />
        </SectionCard>
        <VariacaoModal
          open={open}
          editing={editing}
          form={form}
          saving={saving}
          tipos={tipos}
          saveAndCreateAnother={saveAndCreateAnother}
          onSaveAndCreateAnotherChange={setSaveAndCreateAnother}
          onCancel={() => setOpen(false)}
          onOk={handleSave}
        />
      </FardamentosShell>
    </DefaultLayout>
  );
}
