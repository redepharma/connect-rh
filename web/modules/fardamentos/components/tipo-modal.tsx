"use client";

import { Form, Input, Modal, Select } from "antd";
import type { FormInstance } from "antd/es/form";
import type { Unidade } from "../types/fardamentos.types";
import type { TipoFardamento } from "../types/fardamentos.types";

type TipoModalProps = {
  open: boolean;
  editing: TipoFardamento | null;
  form: FormInstance;
  saving: boolean;
  unidades: Unidade[];
  onCancel: () => void;
  onOk: () => void;
};

export function TipoModal({
  open,
  editing,
  form,
  saving,
  unidades,
  onCancel,
  onOk,
}: TipoModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={onOk}
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
          rules={[
            { required: true, message: "Selecione ao menos uma unidade" },
          ]}
        >
          <Select
            mode="multiple"
            placeholder="Selecione unidades"
            options={unidades.map((unit) => ({
              label: unit.nome,
              value: unit.id,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
