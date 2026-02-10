import { Button, Form, Input, Select, Space } from "antd";
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

export default function VariacoesPage() {
  const [data, setData] = useState<Variacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [tipoId, setTipoId] = useState<string | undefined>();
  const [tipos, setTipos] = useState<TipoFardamento[]>([]);
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
          fetchVariacoes(query, tipoId),
          fetchTipos(),
        ]);
        if (active) {
          setData(mapVariacoesToUi(variacoesResult));
          setTipos(mapTiposToUi(tiposResult));
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
  }, [query, tipoId]);

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
      toaster.sucesso("Variacao removida", "A variacao foi excluida.");
    } catch (err) {
      toaster.erro("Erro ao remover variacao", err);
    } finally {
      setSaving(false);
    }
  };

  return (
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
        <VariacaoTable
          data={data}
          loading={loading}
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
        onCancel={() => setOpen(false)}
        onOk={handleSave}
      />
    </FardamentosShell>
  );
}
