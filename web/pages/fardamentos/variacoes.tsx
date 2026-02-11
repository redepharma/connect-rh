import {
  Alert,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
} from "antd";
import { useEffect, useState } from "react";
import { FardamentosShell } from "@/modules/fardamentos/components/fardamentos-shell";
import { SectionCard } from "@/modules/fardamentos/components/section-card";
import { VariacaoTable } from "@/modules/fardamentos/components/variacao-table";
import { VariacaoModal } from "@/modules/fardamentos/components/variacao-modal";
import type { Variacao } from "@/modules/fardamentos/types/fardamentos.types";
import {
  createVariacao,
  deleteVariacao,
  fetchTipos,
  fetchVariacoes,
  mapTiposToUi,
  mapVariacoesToUi,
  updateVariacao,
} from "@/modules/fardamentos/services/fardamentos.service";
import type { TipoFardamento } from "@/modules/fardamentos/types/fardamentos.types";
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
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const [variacoesResult, tiposResult] = await Promise.all([
          fetchVariacoes({
            q: debouncedQuery || undefined,
            tipoId,
            offset: (page - 1) * pageSize,
            limit: pageSize,
          }),
          fetchTipos({
            q: debouncedTiposQuery || undefined,
            offset: 0,
            limit: 10,
          }),
        ]);
        if (active) {
          setData(mapVariacoesToUi(variacoesResult.data));
          setTotal(variacoesResult.total);
          setTipos(mapTiposToUi(tiposResult.data));
          setTiposOffset(tiposResult.data.length);
          setTiposHasMore(tiposResult.data.length < tiposResult.total);
        }
      } catch (err) {
        if (active) toaster.erro("Erro ao carregar variacoes", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [debouncedQuery, tipoId, page, debouncedTiposQuery]);

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

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const openEdit = (variacao: Variacao) => {
    setEditing(variacao);
    const tipo = tipos.find((item) => item.nome === variacao.tipoNome);
    form.setFieldsValue({
      tipoId: tipo?.id,
      tamanho: variacao.tamanho,
      genero: variacao.genero,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editing) {
        await updateVariacao(editing.id, values);
        toaster.sucesso("Variacao atualizada", "Os dados foram salvos.");
      } else {
        await createVariacao(values);
        toaster.sucesso("Variacao criada", "A variacao foi cadastrada.");
      }
      setOpen(false);
      setEditing(null);
      setQuery("");
      setPage(1);
    } catch (err) {
      toaster.erro("Erro ao salvar variacao", err);
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
      toaster.sucesso("Variacao removida", "A variacao foi excluida.");
    } catch (err) {
      toaster.erro("Erro ao remover variacao", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DefaultLayout>
      <FardamentosShell
        title="Variacoes"
        description="Configure tamanhos e generos para cada tipo de fardamento."
        actions={
          <Button type="primary" onClick={openCreate}>
            Nova variacao
          </Button>
        }
      >
        <SectionCard
          title="Variacoes cadastradas"
          description="As variacoes definem o estoque controlado e disponibilidade."
          actions={
            <Space>
              <Input
                placeholder="Buscar variacao"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                allowClear
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
                style={{ minWidth: 200 }}
              />
            </Space>
          }
        >
          {error ? (
            <Alert
              type="error"
              message="Falha ao carregar variacoes"
              description={error}
              showIcon
            />
          ) : (
            <VariacaoTable data={data} loading={loading} />
          )}
          {!error ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {data.map((variacao) => (
                <div
                  key={variacao.id}
                  className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-600"
                >
                  <span>{variacao.tipoNome}</span>
                  <Button size="small" onClick={() => openEdit(variacao)}>
                    Editar
                  </Button>
                  <Popconfirm
                    title="Remover variacao?"
                    okText="Sim"
                    cancelText="Nao"
                    onConfirm={() => void handleDelete(variacao)}
                  >
                    <Button size="small" danger>
                      Remover
                    </Button>
                  </Popconfirm>
                </div>
              ))}
            </div>
          ) : null}
        </SectionCard>
        <Modal
          open={open}
          onCancel={() => setOpen(false)}
          onOk={handleSave}
          confirmLoading={saving}
          title={editing ? "Editar variacao" : "Nova variacao"}
        >
          <Form layout="vertical" form={form}>
            <Form.Item name="tipoId" label="Tipo" rules={[{ required: true }]}>
              <Select
                placeholder="Selecione o tipo"
                options={tipos.map((tipo) => ({
                  label: tipo.nome,
                  value: tipo.id,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="tamanho"
              label="Tamanho"
              rules={[{ required: true }]}
            >
              <Input placeholder="Ex: P, M, G, 40" />
            </Form.Item>
            <Form.Item
              name="genero"
              label="Genero"
              rules={[{ required: true }]}
            >
              <Input placeholder="Ex: Masculino, Feminino, Unissex" />
            </Form.Item>
          </Form>
        </Modal>
      </FardamentosShell>
    </DefaultLayout>
  );
}
