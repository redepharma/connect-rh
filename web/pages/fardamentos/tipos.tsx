import { Button, Form, Input, Select, Space } from "antd";
import { useEffect, useState } from "react";
import { FardamentosShell } from "@/modules/fardamentos/components/fardamentos-shell";
import { SectionCard } from "@/modules/fardamentos/components/section-card";
import { TipoTable } from "@/modules/fardamentos/components/tipo-table";
import { TipoModal } from "@/modules/fardamentos/components/tipo-modal";
import type { TipoFardamento } from "@/modules/fardamentos/types/fardamentos.types";
import {
  createTipo,
  deleteTipo,
  fetchTipos,
  fetchUnidades,
  mapTiposToUi,
  updateTipo,
} from "@/modules/fardamentos/services/fardamentos.service";
import type { Unidade } from "@/modules/fardamentos/types/fardamentos.types";
import { toaster } from "@/components/toaster";

export default function TiposPage() {
  const [data, setData] = useState<TipoFardamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [unidadeId, setUnidadeId] = useState<string | undefined>();
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TipoFardamento | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const [tiposResult, unidadesResult] = await Promise.all([
          fetchTipos(query, unidadeId),
          fetchUnidades(),
        ]);
        if (active) {
          setData(mapTiposToUi(tiposResult));
          setUnidades(unidadesResult);
        }
      } catch (err) {
        if (active) toaster.erro("Erro ao carregar tipos", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [query, unidadeId]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const openEdit = (tipo: TipoFardamento) => {
    setEditing(tipo);
    form.setFieldsValue({
      nome: tipo.nome,
      unidadesIds: unidades
        .filter((unit) => tipo.unidades.includes(unit.nome))
        .map((unit) => unit.id),
    });
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editing) {
        await updateTipo(editing.id, values);
        toaster.sucesso("Tipo atualizado", "Os dados foram salvos.");
      } else {
        await createTipo(values);
        toaster.sucesso("Tipo criado", "O tipo foi cadastrado.");
      }
      setOpen(false);
      setEditing(null);
      setQuery("");
    } catch (err) {
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
      toaster.sucesso("Tipo removido", "O tipo foi excluido.");
    } catch (err) {
      toaster.erro("Erro ao remover tipo", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <FardamentosShell
      title="Tipos de fardamentos"
      description="Gerencie os tipos e associacoes com unidades."
      actions={
        <Button type="primary" onClick={openCreate}>
          Novo tipo
        </Button>
      }
    >
      <SectionCard
        title="Catalogo de tipos"
        description="Cada tipo pode ser vinculado a uma ou mais unidades."
        actions={
          <Space>
            <Input
              placeholder="Buscar tipo"
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
          </Space>
        }
      >
        <TipoTable
          data={data}
          loading={loading}
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
        onCancel={() => setOpen(false)}
        onOk={handleSave}
      />
    </FardamentosShell>
  );
}
