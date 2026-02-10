import { Button, Form, Input, Modal, Popconfirm, Select, Space } from "antd";
import { useEffect, useState } from "react";
import { FardamentosShell } from "@/modules/fardamentos/components/fardamentos-shell";
import { SectionCard } from "@/modules/fardamentos/components/section-card";
import { UnitTable } from "@/modules/fardamentos/components/unit-table";
import type { Unidade } from "@/modules/fardamentos/types/fardamentos.types";
import { createUnidade, deleteUnidade, fetchUnidades, updateUnidade } from "@/modules/fardamentos/services/fardamentos.service";
import { toaster } from "@/components/toaster";

export default function UnidadesPage() {
  const [data, setData] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Unidade | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const result = await fetchUnidades(query);
        if (active) setData(result);
      } catch (err) {
        if (active) toaster.erro("Erro ao carregar unidades", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [query]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ ativo: true });
    setOpen(true);
  };

  const openEdit = (unit: Unidade) => {
    setEditing(unit);
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
      } else {
        await createUnidade(values);
        toaster.sucesso("Unidade criada", "A unidade foi cadastrada.");
      }
      setOpen(false);
      setEditing(null);
      setQuery("");
    } catch (err) {
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
      toaster.sucesso("Unidade removida", "A unidade foi excluida.");
    } catch (err) {
      toaster.erro("Erro ao remover unidade", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <FardamentosShell
      title="Unidades"
      description="Cadastre e gerencie as unidades responsaveis pelos fardamentos."
      actions={
        <Button type="primary" onClick={openCreate}>
          Nova unidade
        </Button>
      }
    >
      <SectionCard
        title="Lista de unidades"
        description="As unidades definem quais setores podem receber cada tipo de fardamento."
        actions={
          <Space>
            <Input
              placeholder="Buscar unidade"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              allowClear
            />
          </Space>
        }
      >
        <UnitTable
          data={data}
          loading={loading}
          onEdit={openEdit}
          onDelete={(unit) => void handleDelete(unit)}
        />
      </SectionCard>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSave}
        confirmLoading={saving}
        title={editing ? "Editar unidade" : "Nova unidade"}
      >
        <Form layout="vertical" form={form}>
          <Form.Item name="nome" label="Nome" rules={[{ required: true }]}>
            <Input placeholder="Ex: Loja Centro" />
          </Form.Item>
          <Form.Item name="descricao" label="Descricao">
            <Input placeholder="Descricao opcional" />
          </Form.Item>
          <Form.Item name="ativo" label="Status" initialValue={true}>
            <Select
              options={[
                { label: "Ativa", value: true },
                { label: "Inativa", value: false },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </FardamentosShell>
  );
}
