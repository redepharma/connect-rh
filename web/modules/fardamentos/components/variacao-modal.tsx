"use client";

import { Checkbox, Form, Input, Modal, Select } from "antd";
import type { FormInstance } from "antd/es/form";
import { Genero } from "../types/genero.enums";
import type { TipoFardamento, Variacao } from "../types/fardamentos.types";

type VariacaoModalProps = {
  open: boolean;
  editing: Variacao | null;
  form: FormInstance;
  saving: boolean;
  tipos: TipoFardamento[];
  saveAndCreateAnother?: boolean;
  onSaveAndCreateAnotherChange?: (checked: boolean) => void;
  onCancel: () => void;
  onOk: () => void;
};

export function VariacaoModal({
  open,
  editing,
  form,
  saving,
  tipos,
  saveAndCreateAnother = false,
  onSaveAndCreateAnotherChange,
  onCancel,
  onOk,
}: VariacaoModalProps) {
  const watchedTipoId = Form.useWatch("tipoId", form) as string | undefined;
  const watchedTamanho = Form.useWatch("tamanho", form) as string | undefined;
  const watchedGenero = Form.useWatch("genero", form) as Genero | undefined;

  const normalizeText = (value: unknown) => String(value ?? "").trim();
  const parseTamanhos = (value: unknown) =>
    normalizeText(value)
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  const tamanhoPattern = /^(?:[A-Za-zÀ-ÿ]+|\d+)$/;
  const tamanhos = parseTamanhos(watchedTamanho);
  const isTamanhoValid =
    tamanhos.length > 0 &&
    tamanhos.every((item) => tamanhoPattern.test(item)) &&
    (!editing || tamanhos.length === 1);
  const isRequiredFilled =
    normalizeText(watchedTipoId).length > 0 &&
    normalizeText(watchedTamanho).length > 0 &&
    normalizeText(watchedGenero).length > 0;

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      confirmLoading={saving}
      okButtonProps={{
        disabled: !isRequiredFilled || !isTamanhoValid,
      }}
      title={editing ? "Editar variação" : "Nova variação"}
    >
      <Form layout="vertical" form={form} validateTrigger="onChange">
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
          extra={
            editing
              ? "Na edição, informe somente um tamanho."
              : "Você pode informar vários tamanhos separados por vírgula (ex: P, M, G, GG)."
          }
          rules={[
            { required: true, message: "Informe o tamanho" },
            {
              validator: (_, value: unknown) => {
                const parsedTamanhos = parseTamanhos(value);
                if (parsedTamanhos.length === 0) return Promise.resolve();
                if (editing && parsedTamanhos.length > 1) {
                  return Promise.reject(
                    new Error("Na edição, informe somente um tamanho."),
                  );
                }
                if (
                  !parsedTamanhos.every((item) => tamanhoPattern.test(item))
                ) {
                  return Promise.reject(
                    new Error(
                      "Use apenas letras ou apenas números, sem misturar.",
                    ),
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input placeholder="Ex: P, M, G, 40" />
        </Form.Item>
        <Form.Item name="genero" label="Gênero" rules={[{ required: true }]}>
          <Select
            placeholder="Selecione o gênero"
            options={[
              { label: "Masculino", value: Genero.MASCULINO },
              { label: "Feminino", value: Genero.FEMININO },
              { label: "Unissex", value: Genero.UNISSEX },
            ]}
          />
        </Form.Item>
        {!editing ? (
          <Form.Item>
            <Checkbox
              checked={saveAndCreateAnother}
              onChange={(event) =>
                onSaveAndCreateAnotherChange?.(event.target.checked)
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
