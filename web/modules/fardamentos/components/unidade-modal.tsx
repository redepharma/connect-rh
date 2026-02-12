"use client";

import { Checkbox, Form, Input, Modal, Select } from "antd";
import type { FormInstance } from "antd/es/form";
import type { Unidade } from "../types/fardamentos.types";

type UnidadeModalProps = {
  open: boolean;
  editing: Unidade | null;
  form: FormInstance;
  saving: boolean;
  saveAndCreateAnother: boolean;
  onSaveAndCreateAnotherChange: (checked: boolean) => void;
  onCancel: () => void;
  onOk: () => void;
};

export function UnidadeModal({
  open,
  editing,
  form,
  saving,
  saveAndCreateAnother,
  onSaveAndCreateAnotherChange,
  onCancel,
  onOk,
}: UnidadeModalProps) {
  const watchedNome = Form.useWatch("nome", form);

  const normalizeText = (value: unknown) => String(value ?? "").trim();
  const isRequiredFilled = normalizeText(watchedNome).length > 0;

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      confirmLoading={saving}
      okButtonProps={{
        disabled: !isRequiredFilled,
      }}
      title={editing ? "Editar unidade" : "Nova unidade"}
    >
      <Form layout="vertical" form={form} validateTrigger="onChange">
        <Form.Item
          name="nome"
          label="Nome"
          rules={[{ required: true, message: "Informe o nome da unidade" }]}
        >
          <Input placeholder="Ex: Loja Centro" />
        </Form.Item>
        <Form.Item name="descricao" label="Descrição">
          <Input placeholder="Descrição opcional" />
        </Form.Item>
        <Form.Item name="ativo" label="Status" initialValue={true}>
          <Select
            options={[
              { label: "Ativa", value: true },
              { label: "Inativa", value: false },
            ]}
          />
        </Form.Item>
        {!editing ? (
          <Form.Item>
            <Checkbox
              checked={saveAndCreateAnother}
              onChange={(event) =>
                onSaveAndCreateAnotherChange(event.target.checked)
              }
              disabled={saving}
            >
              Salvar e criar outra
            </Checkbox>
          </Form.Item>
        ) : null}
      </Form>
    </Modal>
  );
}
