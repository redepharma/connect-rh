import {
  Alert,
  Button,
  Form,
  Input,
  Select,
  Skeleton,
  Space,
  Spin,
  Switch,
} from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { FardamentosShell } from "@/modules/fardamentos/components/fardamentos-shell";
import { SectionCard } from "@/modules/fardamentos/components/section-card";
import { EstoqueTable } from "@/modules/fardamentos/components/estoque-table";
import { EstoqueModal } from "@/modules/fardamentos/components/estoque-modal";
import type {
  EstoqueItem,
  TipoFardamento,
  Unidade,
  Variacao,
} from "@/modules/fardamentos/types/fardamentos.types";
import { Genero } from "@/modules/fardamentos/types/genero.enums";
import {
  createEstoque,
  createVariacao,
  fetchEstoque,
  fetchTipos,
  fetchUnidades,
  fetchVariacoes,
  mapEstoqueToUi,
  mapTiposToUi,
  mapVariacoesToUi,
} from "@/modules/fardamentos/services/fardamentos.service";
import { toaster } from "@/components/toaster";
import { useDebounce } from "@/hooks/useDebounce";
import DefaultLayout from "@/layouts/default";

export default function EstoquePage() {
  const [data, setData] = useState<EstoqueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query);
  const [unidadeId, setUnidadeId] = useState<string | undefined>();
  const [tipoId, setTipoId] = useState<string | undefined>();
  const [baixoEstoque, setBaixoEstoque] = useState(false);

  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [tipos, setTipos] = useState<TipoFardamento[]>([]);
  const [variacoes, setVariacoes] = useState<Variacao[]>([]);

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

  const [modalTipos, setModalTipos] = useState<TipoFardamento[]>([]);
  const [modalTiposQuery, setModalTiposQuery] = useState("");
  const debouncedModalTiposQuery = useDebounce(modalTiposQuery);
  const [modalTiposOffset, setModalTiposOffset] = useState(0);
  const [modalTiposHasMore, setModalTiposHasMore] = useState(true);
  const [modalTiposLoading, setModalTiposLoading] = useState(false);

  const [variacoesQuery, setVariacoesQuery] = useState("");
  const debouncedVariacoesQuery = useDebounce(variacoesQuery);
  const [variacoesOffset, setVariacoesOffset] = useState(0);
  const [variacoesHasMore, setVariacoesHasMore] = useState(true);
  const [variacoesLoading, setVariacoesLoading] = useState(false);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [saveAndCreateAnother, setSaveAndCreateAnother] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const showPageSkeleton = loading && data.length === 0;
  const pageBeforeFilterRef = useRef<number>(1);

  const selectedUnidadeId = Form.useWatch("unidadeId", form) as
    | string
    | undefined;
  const selectedTipoId = Form.useWatch("tipoId", form) as string | undefined;

  const handleFilterStateChange = (next: {
    query: string;
    unidadeId?: string;
    tipoId?: string;
    baixoEstoque: boolean;
  }) => {
    const currentFiltered = Boolean(
      query.trim() || unidadeId || tipoId || baixoEstoque,
    );
    const nextFiltered = Boolean(
      next.query.trim() || next.unidadeId || next.tipoId || next.baixoEstoque,
    );

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

  const loadEstoquePage = useCallback(
    async (params?: {
      query?: string;
      unidadeId?: string;
      tipoId?: string;
      currentPage?: number;
    }) => {
      const effectiveQuery = params?.query ?? debouncedQuery;
      const effectiveUnidadeId = params?.unidadeId ?? unidadeId;
      const effectiveTipoId = params?.tipoId ?? tipoId;
      const effectivePage = params?.currentPage ?? page;

      setLoading(true);
      setError(null);
      try {
        const estoqueResult = await fetchEstoque({
          q: effectiveQuery || undefined,
          unidadeId: effectiveUnidadeId,
          tipoId: effectiveTipoId,
          baixoEstoque,
          offset: (effectivePage - 1) * pageSize,
          limit: pageSize,
        });

        setData(mapEstoqueToUi(estoqueResult.data));
        setTotal(estoqueResult.total);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Nao foi possivel carregar o estoque.";
        setError(message);
        toaster.erro("Erro ao carregar estoque", err);
      } finally {
        setLoading(false);
      }
    },
    [
      debouncedQuery,
      unidadeId,
      tipoId,
      page,
      baixoEstoque,
    ],
  );

  useEffect(() => {
    void loadEstoquePage();
  }, [loadEstoquePage]);

  const loadFilterUnidades = useCallback(async () => {
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
    void loadFilterUnidades();
  }, [loadFilterUnidades]);

  useEffect(() => {
    void loadFilterTipos();
  }, [loadFilterTipos]);

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

  const loadVariacoes = useCallback(
    async (params?: {
      query?: string;
      tipoId?: string;
      offset?: number;
      append?: boolean;
    }) => {
      const effectiveTipoId = params?.tipoId ?? selectedTipoId;
      const effectiveOffset = params?.offset ?? 0;
      const shouldAppend = params?.append ?? false;
      const effectiveQuery = params?.query ?? debouncedVariacoesQuery;

      if (!effectiveTipoId) {
        setVariacoes([]);
        setVariacoesOffset(0);
        setVariacoesHasMore(false);
        return;
      }

      setVariacoesLoading(true);
      try {
        const result = await fetchVariacoes({
          q: effectiveQuery || undefined,
          tipoId: effectiveTipoId,
          offset: effectiveOffset,
          limit: 10,
        });
        const mapped = mapVariacoesToUi(result.data);
        setVariacoes((prev) => (shouldAppend ? [...prev, ...mapped] : mapped));
        if (!shouldAppend) {
          if (mapped.length === 1) {
            form.setFieldsValue({ variacaoId: mapped[0]?.id });
          } else {
            const currentVariacaoId = form.getFieldValue("variacaoId");
            const stillExists = mapped.some(
              (item) => item.id === currentVariacaoId,
            );
            if (!stillExists) {
              form.setFieldsValue({ variacaoId: undefined });
            }
          }
        }
        const nextOffset = effectiveOffset + mapped.length;
        setVariacoesOffset(nextOffset);
        setVariacoesHasMore(nextOffset < result.total);
      } catch (err) {
        toaster.erro("Erro ao carregar variações", err);
      } finally {
        setVariacoesLoading(false);
      }
    },
    [selectedTipoId, debouncedVariacoesQuery, form],
  );

  useEffect(() => {
    if (!openAddModal || !selectedTipoId) return;
    void loadVariacoes({ offset: 0, append: false, tipoId: selectedTipoId });
  }, [loadVariacoes, openAddModal, selectedTipoId]);

  const loadModalTipos = useCallback(
    async (params?: {
      query?: string;
      unidadeId?: string;
      offset?: number;
      append?: boolean;
    }) => {
      const effectiveUnidadeId = params?.unidadeId ?? selectedUnidadeId;
      const effectiveOffset = params?.offset ?? 0;
      const shouldAppend = params?.append ?? false;
      const effectiveQuery = params?.query ?? debouncedModalTiposQuery;

      if (!effectiveUnidadeId) {
        setModalTipos([]);
        setModalTiposOffset(0);
        setModalTiposHasMore(false);
        return;
      }

      setModalTiposLoading(true);
      try {
        const result = await fetchTipos({
          q: effectiveQuery || undefined,
          unidadeId: effectiveUnidadeId,
          offset: effectiveOffset,
          limit: 10,
        });
        const mapped = mapTiposToUi(result.data);
        setModalTipos((prev) => (shouldAppend ? [...prev, ...mapped] : mapped));
        const nextOffset = effectiveOffset + mapped.length;
        setModalTiposOffset(nextOffset);
        setModalTiposHasMore(nextOffset < result.total);
      } catch (err) {
        toaster.erro("Erro ao carregar tipos", err);
      } finally {
        setModalTiposLoading(false);
      }
    },
    [selectedUnidadeId, debouncedModalTiposQuery],
  );

  useEffect(() => {
    if (!openAddModal || !selectedUnidadeId) return;
    void loadModalTipos({
      offset: 0,
      append: false,
      unidadeId: selectedUnidadeId,
    });
  }, [openAddModal, selectedUnidadeId, loadModalTipos]);

  const loadMoreVariacoes = async () => {
    if (variacoesLoading || !variacoesHasMore) return;
    await loadVariacoes({
      offset: variacoesOffset,
      append: true,
    });
  };

  const loadMoreModalTipos = async () => {
    if (modalTiposLoading || !modalTiposHasMore) return;
    await loadModalTipos({
      offset: modalTiposOffset,
      append: true,
    });
  };

  const openAddEstoqueModal = () => {
    setSaveAndCreateAnother(false);
    form.resetFields();
    const initialValues: { unidadeId?: string; tipoId?: string } = {};
    if (unidadeId) {
      initialValues.unidadeId = unidadeId;
    }
    if (tipoId) {
      initialValues.tipoId = tipoId;
    }
    if (Object.keys(initialValues).length > 0) {
      form.setFieldsValue(initialValues);
    }
    setVariacoes([]);
    setVariacoesOffset(0);
    setVariacoesHasMore(false);
    setVariacoesQuery("");
    setModalTipos([]);
    setModalTiposQuery("");
    setModalTiposOffset(0);
    setModalTiposHasMore(false);
    setOpenAddModal(true);
  };

  const handleSaveEstoque = async () => {
    try {
      const values = await form.validateFields();
      let variacaoId = values.variacaoId as string | undefined;

      // Itens sem variação explícita usam variação técnica padrão.
      if (!variacaoId && values.tipoId) {
        try {
          const created = await createVariacao({
            tipoId: values.tipoId,
            tamanho: "UNICO",
            genero: Genero.UNISSEX,
          });
          variacaoId = created.id;
        } catch {
          const existing = await fetchVariacoes({
            tipoId: values.tipoId,
            q: "UNICO",
            offset: 0,
            limit: 50,
          });
          const mapped = mapVariacoesToUi(existing.data);
          const unica = mapped.find(
            (item) =>
              item.tamanho.toUpperCase() === "UNICO" &&
              item.genero === Genero.UNISSEX,
          );
          variacaoId = unica?.id;
        }
      }

      if (!variacaoId) {
        toaster.alerta(
          "Variação não encontrada",
          "Não foi possível resolver uma variação para este tipo. Cadastre uma variação e tente novamente.",
        );
        return;
      }
      const totalText = String(values.total ?? "").trim();
      const total = totalText.length > 0 ? Number(totalText) : 0;

      if (total === 0) {
        const existing = await fetchEstoque({
          unidadeId: values.unidadeId,
          variacaoId,
          offset: 0,
          limit: 1,
        });
        if (existing.total > 0) {
          setOpenAddModal(false);
          form.resetFields();
          return;
        }
      }

      setSaving(true);
      await createEstoque({
        variacaoId,
        unidadeId: values.unidadeId,
        total,
      });
      if (saveAndCreateAnother) {
        toaster.sucesso(
          "Item adicionado",
          "O item foi adicionado ao estoque. Você pode adicionar outro.",
        );
        form.setFieldsValue({
          unidadeId: values.unidadeId,
          tipoId: values.tipoId,
          variacaoId: undefined,
          total: undefined,
        });
      } else {
        toaster.sucesso("Item adicionado", "O item foi adicionado ao estoque.");
        setOpenAddModal(false);
        form.resetFields();
      }
      await loadEstoquePage();
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "errorFields" in err &&
        Array.isArray((err as { errorFields?: unknown[] }).errorFields)
      ) {
        return;
      }
      toaster.erro("Erro ao adicionar item ao estoque", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DefaultLayout>
      <FardamentosShell
        title="Estoque"
        description="Gerenciamento de quantidades disponíveis no estoque e visualização de reservas e alertas de baixo estoque."
        actions={
          <Space className="w-full sm:w-auto" wrap>
            <Button
              type="primary"
              onClick={openAddEstoqueModal}
              disabled={loading || saving}
              className="w-full sm:w-auto"
            >
              Adicionar item
            </Button>
          </Space>
        }
      >
        <SectionCard
          title="Resumo de estoque"
          description="Resumo da disponibilidade de itens no estoque de acordo com tipo, variações e unidades da empresa."
          actions={
            showPageSkeleton ? (
              <Space>
                <Skeleton.Input active size="small" style={{ width: 180 }} />
                <Skeleton.Input active size="small" style={{ width: 150 }} />
                <Skeleton.Input active size="small" style={{ width: 150 }} />
                <Skeleton.Button active size="small" />
              </Space>
            ) : (
              <Space className="w-full sm:w-auto" wrap>
                <div className="w-full sm:w-auto">
                  <Input
                    placeholder="Buscar item"
                    value={query}
                    onChange={(event) => {
                      const nextQuery = event.target.value;
                      setQuery(nextQuery);
                      handleFilterStateChange({
                        query: nextQuery,
                        unidadeId,
                        tipoId,
                        baixoEstoque,
                      });
                    }}
                    allowClear
                    className="w-full sm:min-w-64"
                  />
                </div>
                <div className="w-full sm:w-auto">
                  <Select
                    placeholder="Filtrar unidade"
                    value={unidadeId}
                    allowClear
                    onChange={(value) => {
                      setUnidadeId(value);
                      handleFilterStateChange({
                        query,
                        unidadeId: value,
                        tipoId,
                        baixoEstoque,
                      });
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
                    className="w-full sm:min-w-[150px]"
                  />
                </div>
                <div className="w-full sm:w-auto">
                  <Select
                    placeholder="Filtrar tipo"
                    value={tipoId}
                    allowClear
                    onChange={(value) => {
                      setTipoId(value);
                      handleFilterStateChange({
                        query,
                        unidadeId,
                        tipoId: value,
                        baixoEstoque,
                      });
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
                    className="w-full sm:min-w-[150px]"
                  />
                </div>
                <div className="w-full sm:w-auto">
                  <Switch
                    checked={baixoEstoque}
                    onChange={(checked) => {
                      setBaixoEstoque(checked);
                      handleFilterStateChange({
                        query,
                        unidadeId,
                        tipoId,
                        baixoEstoque: checked,
                      });
                    }}
                    checkedChildren="Baixo estoque"
                    unCheckedChildren="Todos"
                  />
                </div>
              </Space>
            )
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
            <EstoqueTable
              data={data}
              loading={loading || saving}
              pagination={{
                current: page,
                pageSize,
                total,
                onChange: (nextPage) => setPage(nextPage),
              }}
            />
          )}
        </SectionCard>
        <EstoqueModal
          open={openAddModal}
          form={form}
          saving={saving}
          tipos={modalTipos}
          tiposLoading={modalTiposLoading}
          unidades={unidades}
          unidadesLoading={unidadesLoading}
          variacoes={variacoes}
          variacoesLoading={variacoesLoading}
          selectedUnidadeId={selectedUnidadeId}
          selectedTipoId={selectedTipoId}
          saveAndCreateAnother={saveAndCreateAnother}
          onSaveAndCreateAnotherChange={setSaveAndCreateAnother}
          onUnidadeChange={(value) => {
            form.setFieldsValue({
              unidadeId: value,
              tipoId: undefined,
              variacaoId: undefined,
            });
            setModalTipos([]);
            setModalTiposOffset(0);
            setModalTiposHasMore(true);
            setModalTiposQuery("");
            setVariacoes([]);
            setVariacoesOffset(0);
            setVariacoesHasMore(false);
            setVariacoesQuery("");
          }}
          onTipoChange={(value) => {
            form.setFieldsValue({
              tipoId: value,
              variacaoId: undefined,
            });
            setVariacoes([]);
            setVariacoesOffset(0);
            setVariacoesHasMore(true);
            setVariacoesQuery("");
          }}
          onTiposSearch={(value) => {
            setModalTiposQuery(value);
            setModalTiposOffset(0);
            setModalTiposHasMore(true);
          }}
          onTiposScroll={() => {
            void loadMoreModalTipos();
          }}
          onUnidadesSearch={(value) => {
            setUnidadesQuery(value);
            setUnidadesOffset(0);
            setUnidadesHasMore(true);
          }}
          onUnidadesScroll={() => {
            void loadMoreUnidades();
          }}
          onVariacoesSearch={(value) => {
            setVariacoesQuery(value);
            setVariacoesOffset(0);
            setVariacoesHasMore(true);
          }}
          onVariacoesScroll={() => {
            void loadMoreVariacoes();
          }}
          onCancel={() => setOpenAddModal(false)}
          onOk={handleSaveEstoque}
        />
      </FardamentosShell>
    </DefaultLayout>
  );
}
