"use client";

import { Form, Input, Modal, Select } from "antd";
import type { FormInstance } from "antd/es/form";
import type { Unidade } from "../types/fardamentos.types";

type UnidadeModalProps = {
  open: boolean;
  editing: Unidade | null;
  form: FormInstance;
  saving: boolean;
  onCancel: () => void;
  onOk: () => void;
};

export function UnidadeModal({
  open,
  editing,
  form,
  saving,
  onCancel,
  onOk,
}: UnidadeModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={onOk}
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
  );
}
