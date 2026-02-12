"use client";

import { Checkbox, Form, Input, Modal, Select, Spin } from "antd";
import type { FormInstance } from "antd/es/form";
import type {
  TipoFardamento,
  Unidade,
  Variacao,
} from "../types/fardamentos.types";

type EstoqueModalProps = {
  open: boolean;
  form: FormInstance;
  saving: boolean;
  tipos: TipoFardamento[];
  tiposLoading: boolean;
  unidades: Unidade[];
  unidadesLoading: boolean;
  variacoes: Variacao[];
  variacoesLoading: boolean;
  selectedUnidadeId?: string;
  selectedTipoId?: string;
  saveAndCreateAnother?: boolean;
  onSaveAndCreateAnotherChange?: (checked: boolean) => void;
  onUnidadeChange: (value?: string) => void;
  onTipoChange: (value?: string) => void;
  onTiposSearch: (value: string) => void;
  onTiposScroll: () => void;
  onUnidadesSearch: (value: string) => void;
  onUnidadesScroll: () => void;
  onVariacoesSearch: (value: string) => void;
  onVariacoesScroll: () => void;
  onCancel: () => void;
  onOk: () => void;
};

export function EstoqueModal({
  open,
  form,
  saving,
  tipos,
  tiposLoading,
  unidades,
  unidadesLoading,
  variacoes,
  variacoesLoading,
  selectedUnidadeId,
  selectedTipoId,
  saveAndCreateAnother = false,
  onSaveAndCreateAnotherChange,
  onUnidadeChange,
  onTipoChange,
  onTiposSearch,
  onTiposScroll,
  onUnidadesSearch,
  onUnidadesScroll,
  onVariacoesSearch,
  onVariacoesScroll,
  onCancel,
  onOk,
}: EstoqueModalProps) {
  const watchedTipoId = Form.useWatch("tipoId", form);
  const watchedVariacaoId = Form.useWatch("variacaoId", form);
  const watchedUnidadeId = Form.useWatch("unidadeId", form);
  const watchedTotal = Form.useWatch("total", form);

  const normalizeText = (value: unknown) => String(value ?? "").trim();
  const totalText = normalizeText(watchedTotal);
  const isTotalValid = totalText.length === 0 || /^\d+$/.test(totalText);
  const hasVariacaoOptions = variacoes.length > 0;
  const hasTipoSelected = normalizeText(watchedTipoId).length > 0;
  const isRequiredFilled =
    hasTipoSelected &&
    (!hasVariacaoOptions || normalizeText(watchedVariacaoId).length > 0) &&
    normalizeText(watchedUnidadeId).length > 0;

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      confirmLoading={saving}
      title="Adicionar item ao estoque"
      okText="Adicionar"
      okButtonProps={{
        disabled: !isRequiredFilled || !isTotalValid || variacoesLoading,
      }}
    >
      <Form form={form} layout="vertical" validateTrigger="onChange">
        <Form.Item
          name="unidadeId"
          label="Unidade"
          rules={[{ required: true, message: "Selecione a unidade" }]}
        >
          <Select
            placeholder="Selecione a unidade"
            showSearch
            filterOption={false}
            onChange={(value) => {
              onUnidadeChange(value);
            }}
            onSearch={onUnidadesSearch}
            onPopupScroll={(event) => {
              const target = event.target as HTMLDivElement;
              if (
                target.scrollTop + target.offsetHeight >=
                target.scrollHeight - 16
              ) {
                onUnidadesScroll();
              }
            }}
            loading={unidadesLoading}
            popupRender={(menu) => (
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
            options={unidades.map((unidade) => ({
              label: unidade.nome,
              value: unidade.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="tipoId"
          label="Tipo"
          rules={[{ required: true, message: "Selecione o tipo" }]}
        >
          <Select
            placeholder={
              selectedUnidadeId
                ? "Selecione o tipo"
                : "Selecione primeiro a unidade"
            }
            disabled={!selectedUnidadeId}
            showSearch
            filterOption={false}
            onChange={(value) => {
              onTipoChange(value);
            }}
            onSearch={onTiposSearch}
            onPopupScroll={(event) => {
              const target = event.target as HTMLDivElement;
              if (
                target.scrollTop + target.offsetHeight >=
                target.scrollHeight - 16
              ) {
                onTiposScroll();
              }
            }}
            loading={tiposLoading}
            popupRender={(menu) => (
              <>
                {menu}
                {tiposLoading ? (
                  <div className="px-3 py-2 text-center text-xs text-neutral-500">
                    <Spin size="small" />
                    <span className="ml-2">Carregando mais...</span>
                  </div>
                ) : null}
              </>
            )}
            options={tipos.map((tipo) => ({
              label: tipo.nome,
              value: tipo.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="variacaoId"
          label="Variação"
          rules={
            hasVariacaoOptions
              ? [{ required: true, message: "Selecione a variação" }]
              : []
          }
        >
          <Select
            placeholder={
              selectedTipoId
                ? hasVariacaoOptions
                  ? "Selecione a variação"
                  : "Nenhuma variação disponível para este tipo"
                : "Selecione primeiro o tipo"
            }
            disabled={!selectedTipoId}
            showSearch
            filterOption={false}
            onSearch={onVariacoesSearch}
            onPopupScroll={(event) => {
              const target = event.target as HTMLDivElement;
              if (
                target.scrollTop + target.offsetHeight >=
                target.scrollHeight - 16
              ) {
                onVariacoesScroll();
              }
            }}
            loading={variacoesLoading}
            popupRender={(menu) => (
              <>
                {menu}
                {variacoesLoading ? (
                  <div className="px-3 py-2 text-center text-xs text-neutral-500">
                    <Spin size="small" />
                    <span className="ml-2">Carregando mais...</span>
                  </div>
                ) : null}
              </>
            )}
            options={variacoes.map((variacao) => ({
              label: `${variacao.tamanho} - ${variacao.genero}`,
              value: variacao.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="total"
          label="Quantidade"
          extra="Se deixar vazio, será considerado 0."
          rules={[
            {
              validator: (_, value: unknown) => {
                const text = normalizeText(value);
                if (!text) return Promise.resolve();
                if (!/^\d+$/.test(text)) {
                  return Promise.reject(
                    new Error("A quantidade deve conter apenas números."),
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input inputMode="numeric" placeholder="Ex: 10" />
        </Form.Item>

        <Form.Item>
          <Checkbox
            checked={saveAndCreateAnother}
            onChange={(event) =>
              onSaveAndCreateAnotherChange?.(event.target.checked)
            }
            disabled={saving}
          >
            Salvar e adicionar outro
          </Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
}
