"use client";

import { Form, Input, Modal, Select } from "antd";
import type { FormInstance } from "antd/es/form";
import { Genero } from "../types/genero.enums";
import type { TipoFardamento, Variacao } from "../types/fardamentos.types";

type VariacaoModalProps = {
  open: boolean;
  editing: Variacao | null;
  form: FormInstance;
  saving: boolean;
  tipos: TipoFardamento[];
  onCancel: () => void;
  onOk: () => void;
};

export function VariacaoModal({
  open,
  editing,
  form,
  saving,
  tipos,
  onCancel,
  onOk,
}: VariacaoModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={onOk}
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
        <Form.Item name="tamanho" label="Tamanho" rules={[{ required: true }]}>
          <Input placeholder="Ex: P, M, G, 40" />
        </Form.Item>
        <Form.Item name="genero" label="Genero" rules={[{ required: true }]}>
          <Select
            placeholder="Selecione o genero"
            options={[
              { label: "Masculino", value: Genero.MASCULINO },
              { label: "Feminino", value: Genero.FEMININO },
              { label: "Unissex", value: Genero.UNISSEX },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
