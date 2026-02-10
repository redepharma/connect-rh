"use client";

import {
  Alert,
  Button,
  Divider,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Steps,
  Table,
} from "antd";
import type { FormInstance } from "antd/es/form";
import type { Variacao, Unidade } from "../types/fardamentos.types";
import { Genero } from "../types/genero.enums";

type ColaboradorOption = { id: string; nome: string };

type EntregaWizardProps = {
  open: boolean;
  saving: boolean;
  step: number;
  setStep: (step: number) => void;
  form: FormInstance;
  colaboradores: ColaboradorOption[];
  unidades: Unidade[];
  variacoes: Variacao[];
  variacaoOptionsFiltradas: { label: string; value: string }[];
  tamanhosDisponiveis: string[];
  estoqueEntrega: { variacaoId: string; total: number; reservado: number }[];
  entregaUnidadeId: string | null;
  setEntregaUnidadeId: (value: string | null) => void | Promise<void>;
  entregaGenero: Genero | null;
  setEntregaGenero: (value: Genero | null) => void;
  entregaTamanho: string | null;
  setEntregaTamanho: (value: string | null) => void;
  onAdvance: () => Promise<void>;
  onConfirm: () => void;
  onCancel: () => void;
};

export function MovimentacaoEntregaWizard({
  open,
  saving,
  step,
  setStep,
  form,
  colaboradores,
  unidades,
  variacoes,
  variacaoOptionsFiltradas,
  tamanhosDisponiveis,
  estoqueEntrega,
  entregaUnidadeId,
  setEntregaUnidadeId,
  entregaGenero,
  setEntregaGenero,
  entregaTamanho,
  setEntregaTamanho,
  onAdvance,
  onConfirm,
  onCancel,
}: EntregaWizardProps) {
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title="Nova entrega"
      footer={
        <Space>
          <Button onClick={onCancel}>Cancelar</Button>
          {step > 0 ? (
            <Button onClick={() => setStep(step - 1)}>Voltar</Button>
          ) : null}
          {step < 1 ? (
            <Button type="primary" onClick={onAdvance}>
              Avancar
            </Button>
          ) : (
            <Button type="primary" loading={saving} onClick={onConfirm}>
              Confirmar entrega
            </Button>
          )}
        </Space>
      }
    >
      <Steps
        current={step}
        size="small"
        items={[{ title: "Colaborador" }, { title: "Itens e estoque" }]}
      />
      <Form layout="vertical" form={form} className="mt-4">
        {step === 0 ? (
          <>
            <Form.Item
              name="colaboradorId"
              label="Colaborador"
              rules={[{ required: true, message: "Selecione um colaborador" }]}
            >
              <Select
                showSearch
                placeholder="Selecione o colaborador"
                options={colaboradores.map((colab) => ({
                  label: colab.nome,
                  value: colab.id,
                }))}
                onChange={(value) => {
                  const selected = colaboradores.find(
                    (colab) => colab.id === value,
                  );
                  form.setFieldValue("colaboradorNome", selected?.nome ?? "");
                }}
                filterOption={(input, option) =>
                  String(option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>
            <Form.Item name="colaboradorNome" hidden>
              <Input />
            </Form.Item>
            <Form.Item name="unidadeId" hidden>
              <Input />
            </Form.Item>
          </>
        ) : (
          <>
            <Form.List
              name="itens"
              initialValue={[{ variacaoId: undefined, quantidade: 1 }]}
            >
              {(fields, { add, remove }) => (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Select
                      placeholder="Unidade"
                      value={entregaUnidadeId ?? undefined}
                      onChange={(value) => setEntregaUnidadeId(value ?? null)}
                      options={unidades.map((u) => ({
                        label: u.nome,
                        value: u.id,
                      }))}
                      style={{ minWidth: 180 }}
                    />
                    <Select
                      placeholder="Genero"
                      allowClear
                      value={entregaGenero ?? undefined}
                      onChange={(value) => setEntregaGenero(value ?? null)}
                      options={[
                        { label: "Masculino", value: Genero.MASCULINO },
                        { label: "Feminino", value: Genero.FEMININO },
                        { label: "Unissex", value: Genero.UNISSEX },
                      ]}
                      style={{ minWidth: 160 }}
                    />
                    <Select
                      placeholder="Tamanho"
                      allowClear
                      value={entregaTamanho ?? undefined}
                      onChange={(value) => setEntregaTamanho(value ?? null)}
                      options={tamanhosDisponiveis.map((tamanho) => ({
                        label: tamanho,
                        value: tamanho,
                      }))}
                      style={{ minWidth: 140 }}
                    />
                  </div>
                  <Divider className="my-4">Itens</Divider>
                  {fields.map((field) => (
                    <Space key={field.key} align="baseline">
                      <Form.Item
                        name={[field.name, "variacaoId"]}
                        rules={[{ required: true }]}
                      >
                        <Select
                          placeholder="Variacao"
                          options={variacaoOptionsFiltradas}
                          style={{ minWidth: 200 }}
                        />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, "quantidade"]}
                        rules={[{ required: true }]}
                      >
                        <Input type="number" min={1} />
                      </Form.Item>
                      <Button onClick={() => remove(field.name)}>
                        Remover
                      </Button>
                    </Space>
                  ))}
                  <Button onClick={() => add()}>Adicionar item</Button>
                </div>
              )}
            </Form.List>
            <div className="mt-4">
              <Divider className="my-4">Estoque</Divider>
              <div className="text-xs text-neutral-500">
                Estoque disponivel por variacao (total e reservado)
              </div>
              <div className="mt-2">
                {estoqueEntrega.length === 0 ? (
                  <Alert
                    type="info"
                    message={
                      entregaUnidadeId
                        ? "Nenhum estoque encontrado para a unidade selecionada."
                        : "Selecione a unidade para carregar o estoque."
                    }
                    showIcon
                  />
                ) : estoqueEntrega.filter((item) => {
                    const variacao = variacoes.find(
                      (v) => v.id === item.variacaoId,
                    );
                    if (!variacao) return false;
                    if (entregaGenero && variacao.genero !== entregaGenero)
                      return false;
                    if (entregaTamanho && variacao.tamanho !== entregaTamanho)
                      return false;
                    return true;
                  }).length === 0 ? (
                  <Alert
                    type="info"
                    message="Nenhum item encontrado para os filtros selecionados."
                    showIcon
                  />
                ) : (
                  <Table
                    size="small"
                    pagination={false}
                    rowKey="variacaoId"
                    dataSource={estoqueEntrega.filter((item) => {
                      const variacao = variacoes.find(
                        (v) => v.id === item.variacaoId,
                      );
                      if (!variacao) return false;
                      if (entregaGenero && variacao.genero !== entregaGenero)
                        return false;
                      if (entregaTamanho && variacao.tamanho !== entregaTamanho)
                        return false;
                      return true;
                    })}
                    columns={[
                      {
                        title: "Variacao",
                        dataIndex: "variacaoId",
                        key: "variacaoId",
                        render: (value: string) => {
                          const variacao = variacoes.find(
                            (item) => item.id === value,
                          );
                          return variacao
                            ? `${variacao.tipoNome} - ${variacao.tamanho} - ${variacao.genero}`
                            : value;
                        },
                      },
                      {
                        title: "Total",
                        dataIndex: "total",
                        key: "total",
                      },
                      {
                        title: "Reservado",
                        dataIndex: "reservado",
                        key: "reservado",
                      },
                      {
                        title: "Disponivel",
                        key: "disponivel",
                        render: (_: unknown, record: any) =>
                          record.total - record.reservado,
                      },
                    ]}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </Form>
    </Modal>
  );
}
