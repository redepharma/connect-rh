import { Button, Form, Input, Space } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { FardamentosShell } from "@/modules/fardamentos/components/fardamentos-shell";
import { SectionCard } from "@/modules/fardamentos/components/section-card";
import { UnitTable } from "@/modules/fardamentos/components/unit-table";
import { UnidadeModal } from "@/modules/fardamentos/components/unidade-modal";
import type { Unidade } from "@/modules/fardamentos/types/fardamentos.types";
import {
  createUnidade,
  deleteUnidade,
  fetchUnidadeDeleteImpact,
  fetchUnidades,
  updateUnidade,
} from "@/modules/fardamentos/services/fardamentos.service";
import { toaster } from "@/components/toaster";
import { useDebounce } from "@/hooks/useDebounce";
import DefaultLayout from "@/layouts/default";

export default function UnidadesPage() {
  const router = useRouter();
  const [data, setData] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query);
  const [page, setPage] = useState(1);
  const [urlReady, setUrlReady] = useState(false);
  const pageSize = 10;
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Unidade | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveAndCreateAnother, setSaveAndCreateAnother] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!router.isReady) return;

    const q = typeof router.query.q === "string" ? router.query.q : "";
    const parsedPage =
      typeof router.query.page === "string" ? Number(router.query.page) : 1;
    const nextPage =
      Number.isFinite(parsedPage) && parsedPage > 0
        ? Math.floor(parsedPage)
        : 1;

    setQuery(q);
    setPage(nextPage);
    setUrlReady(true);
  }, [router.isReady, router.query.q, router.query.page]);

  useEffect(() => {
    if (!router.isReady || !urlReady) return;

    const nextQuery: Record<string, string> = {};
    const normalizedQuery = debouncedQuery.trim();

    if (normalizedQuery) {
      nextQuery.q = normalizedQuery;
    }
    if (page > 1) {
      nextQuery.page = String(page);
    }

    const currentQ = typeof router.query.q === "string" ? router.query.q : "";
    const currentPage =
      typeof router.query.page === "string" ? router.query.page : "1";
    const nextPage = nextQuery.page ?? "1";

    if (currentQ === (nextQuery.q ?? "") && currentPage === nextPage) return;

    void router.push(
      {
        pathname: router.pathname,
        query: nextQuery,
      },
      undefined,
      { shallow: true, scroll: false },
    );
  }, [router, debouncedQuery, page, urlReady]);

  const loadUnidades = useCallback(
    async (params?: { query?: string; currentPage?: number }) => {
      const effectiveQuery = params?.query ?? debouncedQuery;
      const effectivePage = params?.currentPage ?? page;

      setLoading(true);
      try {
        const result = await fetchUnidades({
          q: effectiveQuery || undefined,
          offset: (effectivePage - 1) * pageSize,
          limit: pageSize,
        });
        setData(result.data);
        setTotal(result.total);
      } catch (err) {
        toaster.erro("Erro ao carregar unidades", err);
      } finally {
        setLoading(false);
      }
    },
    [debouncedQuery, page],
  );

  useEffect(() => {
    if (!urlReady) return;
    void loadUnidades();
  }, [loadUnidades, urlReady]);

  const openCreate = () => {
    setEditing(null);
    setSaveAndCreateAnother(false);
    form.resetFields();
    form.setFieldsValue({ ativo: true });
    setOpen(true);
  };

  const openEdit = (unit: Unidade) => {
    setEditing(unit);
    setSaveAndCreateAnother(false);
    form.setFieldsValue({
      nome: unit.nome,
      descricao: unit.descricao ?? "",
      ativo: unit.ativo,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editing) {
        await updateUnidade(editing.id, values);
        toaster.sucesso("Unidade atualizada", "Os dados foram salvos.");
        setOpen(false);
        setEditing(null);
      } else {
        await createUnidade(values);
        if (saveAndCreateAnother) {
          toaster.sucesso(
            "Unidade criada",
            "A unidade foi cadastrada. Você pode adicionar outra.",
          );
          form.resetFields();
          form.setFieldsValue({ ativo: true });
        } else {
          toaster.sucesso("Unidade criada", "A unidade foi cadastrada.");
          setOpen(false);
          setEditing(null);
        }
      }
      setQuery("");
      setPage(1);
      await loadUnidades({ query: "", currentPage: 1 });
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "errorFields" in err &&
        Array.isArray((err as { errorFields?: unknown[] }).errorFields)
      ) {
        return;
      }
      toaster.erro("Erro ao salvar unidade", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (unit: Unidade) => {
    try {
      setSaving(true);
      await deleteUnidade(unit.id);
      setQuery("");
      setPage(1);
      await loadUnidades({ query: "", currentPage: 1 });
      toaster.sucesso("Unidade removida", "A unidade foi excluída.");
    } catch (err) {
      toaster.erro("Erro ao remover unidade", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DefaultLayout>
      <FardamentosShell
        title="Unidades"
        description="Cadastre e gerencie as unidades responsáveis pelos fardamentos."
        actions={
          <Button type="primary" onClick={openCreate} className="w-full sm:w-auto">
            Nova unidade
          </Button>
        }
      >
        <SectionCard
          title="Lista de unidades"
          description="As unidades definem quais setores podem receber cada tipo de fardamento."
          actions={
            <Space className="w-full sm:w-auto">
              <Input
                placeholder="Buscar unidade"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                allowClear
                className="w-full sm:min-w-72"
              />
            </Space>
          }
        >
          <UnitTable
            data={data}
            loading={loading || saving}
            actionsDisabled={saving}
            onFetchDeleteImpact={fetchUnidadeDeleteImpact}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (nextPage) => setPage(nextPage),
            }}
            onEdit={openEdit}
            onDelete={(unit) => void handleDelete(unit)}
          />
        </SectionCard>
        <UnidadeModal
          open={open}
          editing={editing}
          form={form}
          saving={saving}
          saveAndCreateAnother={saveAndCreateAnother}
          onSaveAndCreateAnotherChange={setSaveAndCreateAnother}
          onCancel={() => setOpen(false)}
          onOk={handleSave}
        />
      </FardamentosShell>
    </DefaultLayout>
  );
}
