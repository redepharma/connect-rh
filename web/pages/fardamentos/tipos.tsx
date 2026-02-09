import { Alert, Button, Form, Input, Modal, Popconfirm, Select, Space } from "antd";
import { useEffect, useState } from "react";
import { FardamentosShell } from "@/modules/fardamentos/components/fardamentos-shell";
import { SectionCard } from "@/modules/fardamentos/components/section-card";
import { TipoTable } from "@/modules/fardamentos/components/tipo-table";
import type { TipoFardamento } from "@/modules/fardamentos/types/fardamentos.types";
import { createTipo, deleteTipo, fetchTipos, fetchUnidades, mapTiposToUi, updateTipo } from "@/modules/fardamentos/services/fardamentos.service";
import type { Unidade } from "@/modules/fardamentos/types/fardamentos.types";
import { parseApiError } from "@/shared/error-handlers/api-errors";

export default function TiposPage() {
  const [data, setData] = useState<TipoFardamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      setError(null);
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
        if (active) setError(parseApiError(err).message);
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
      } else {
        await createTipo(values);
      }
      setOpen(false);
      setEditing(null);
      setQuery("");
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tipo: TipoFardamento) => {
    try {
      setSaving(true);
      await deleteTipo(tipo.id);
      setQuery("");
    } catch (err) {
      setError(parseApiError(err).message);
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
              options={unidades.map((unit) => ({ label: unit.nome, value: unit.id }))}
              style={{ minWidth: 180 }}
            />
          </Space>
        }
      >
        {error ? (
          <Alert type="error" message="Falha ao carregar tipos" description={error} showIcon />
        ) : (
          <TipoTable data={data} loading={loading} />
        )}
        {!error ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {data.map((tipo) => (
              <div
                key={tipo.id}
                className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-600"
              >
                <span>{tipo.nome}</span>
                <Button size="small" onClick={() => openEdit(tipo)}>
                  Editar
                </Button>
                <Popconfirm
                  title="Remover tipo?"
                  okText="Sim"
                  cancelText="Nao"
                  onConfirm={() => void handleDelete(tipo)}
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
        title={editing ? "Editar tipo" : "Novo tipo"}
      >
        <Form layout="vertical" form={form}>
          <Form.Item name="nome" label="Nome" rules={[{ required: true }]}>
            <Input placeholder="Ex: Camisa Polo" />
          </Form.Item>
          <Form.Item
            name="unidadesIds"
            label="Unidades"
            rules={[{ required: true, message: "Selecione ao menos uma unidade" }]}
          >
            <Select
              mode="multiple"
              placeholder="Selecione unidades"
              options={unidades.map((unit) => ({ label: unit.nome, value: unit.id }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </FardamentosShell>
  );
}
