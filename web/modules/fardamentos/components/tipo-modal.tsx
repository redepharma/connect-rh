"use client";

import { Checkbox, Form, Input, Modal, Select, Spin } from "antd";
import type { FormInstance } from "antd/es/form";
import type { Unidade } from "../types/fardamentos.types";
import type { TipoFardamento } from "../types/fardamentos.types";

type TipoModalProps = {
  open: boolean;
  editing: TipoFardamento | null;
  form: FormInstance;
  saving: boolean;
  unidades: Unidade[];
  extraUnidades?: Array<{ id: string; nome: string }>;
  unidadesLoading?: boolean;
  onUnidadesSearch?: (value: string) => void;
  onUnidadesScroll?: () => void;
  saveAndCreateAnother?: boolean;
  onSaveAndCreateAnotherChange?: (checked: boolean) => void;
  onCancel: () => void;
  onOk: () => void;
};

export function TipoModal({
  open,
  editing,
  form,
  saving,
  unidades,
  extraUnidades = [],
  unidadesLoading = false,
  onUnidadesSearch,
  onUnidadesScroll,
  saveAndCreateAnother = false,
  onSaveAndCreateAnotherChange,
  onCancel,
  onOk,
}: TipoModalProps) {
  const watchedNome = Form.useWatch("nome", form);
  const watchedUnidadesIds = Form.useWatch("unidadesIds", form) as
    | string[]
    | undefined;

  const isRequiredFilled =
    String(watchedNome ?? "").trim().length > 0 &&
    (watchedUnidadesIds?.length ?? 0) > 0;

  const unidadesMap = new Map<string, { id: string; nome: string }>();
  for (const unidade of unidades) {
    unidadesMap.set(unidade.id, { id: unidade.id, nome: unidade.nome });
  }
  for (const unidade of extraUnidades) {
    if (!unidadesMap.has(unidade.id)) {
      unidadesMap.set(unidade.id, unidade);
    }
  }

  const unidadeOptions = Array.from(unidadesMap.values()).map((unit) => ({
    label: unit.nome,
    value: unit.id,
  }));

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      confirmLoading={saving}
      okButtonProps={{
        disabled: !isRequiredFilled,
      }}
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
            showSearch
            filterOption={false}
            onSearch={onUnidadesSearch}
            onPopupScroll={(event) => {
              if (!onUnidadesScroll) return;
              const target = event.target as HTMLDivElement;
              if (target.scrollTop + target.offsetHeight >= target.scrollHeight - 16) {
                onUnidadesScroll();
              }
            }}
            loading={unidadesLoading}
            dropdownRender={(menu) => (
              <>
                {menu}
                {unidadesLoading ? (
                  <div className="px-3 py-2 text-center text-xs text-neutral-500">
                    <Spin size="small" />
                    <span className="ml-2">Carregando mais...</span>
                  </div>
                ) : null}
              </>
            )}
            options={unidadeOptions}
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
              Salvar e criar outro
            </Checkbox>
          </Form.Item>
        ) : null}
      </Form>
    </Modal>
  );
}
