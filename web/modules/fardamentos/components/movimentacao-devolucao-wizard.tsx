"use client";

import {
  Alert,
  Button,
  Divider,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Steps,
  Table,
  Typography,
} from "antd";
import type { FormInstance } from "antd/es/form";
import type { Unidade, Variacao } from "../types/fardamentos.types";
import { Genero } from "../types/genero.enums";
import type { TermoInfo } from "../types/termos.types";
import type { ColaboradorSaldo } from "../types/saldos.types";

type ColaboradorOption = { id: string; nome: string };

type DevolucaoWizardProps = {
  open: boolean;
  saving: boolean;
  step: number;
  setStep: (step: number) => void;
  form: FormInstance;
  colaboradores: ColaboradorOption[];
  unidades: Unidade[];
  variacoes: Variacao[];
  variacaoOptionsDevolucao: { label: string; value: string }[];
  tamanhosDisponiveis: string[];
  devolucaoUnidadeId: string | null;
  setDevolucaoUnidadeId: (value: string | null) => void | Promise<void>;
  devolucaoGenero: Genero | null;
  setDevolucaoGenero: (value: Genero | null) => void;
  devolucaoTamanho: string | null;
  setDevolucaoTamanho: (value: string | null) => void;
  devolucaoEstoqueIds: string[];
  variacoesDevolucaoFiltradas: Variacao[];
  saldos: ColaboradorSaldo[];
  saldosLoading: boolean;
  termos: TermoInfo[];
  termosLoading: boolean;
  onGerarTermo: () => void;
  onAbrirTermo: (id: string) => void;
  onBaixarTermo: (id: string) => void;
  onAdvance: () => Promise<void>;
  onConfirm: () => void;
  onForceConfirm: () => void;
  onCancel: () => void;
  onColaboradorSelect: (colaborador: ColaboradorOption | null) => void;
};

export function MovimentacaoDevolucaoWizard({
  open,
  saving,
  step,
  setStep,
  form,
  colaboradores,
  unidades,
  variacaoOptionsDevolucao,
  tamanhosDisponiveis,
  devolucaoUnidadeId,
  setDevolucaoUnidadeId,
  devolucaoGenero,
  setDevolucaoGenero,
  devolucaoTamanho,
  setDevolucaoTamanho,
  devolucaoEstoqueIds,
  variacoesDevolucaoFiltradas,
  saldos,
  saldosLoading,
  termos,
  termosLoading,
  onGerarTermo,
  onAbrirTermo,
  onBaixarTermo,
  onAdvance,
  onConfirm,
  onForceConfirm,
  onCancel,
  onColaboradorSelect,
}: DevolucaoWizardProps) {
  const termoColumns = [
    { title: "Versao", dataIndex: "versao", key: "versao" },
    { title: "Tipo", dataIndex: "tipo", key: "tipo" },
    { title: "Gerado por", dataIndex: "usuarioNome", key: "usuarioNome" },
    { title: "Criado em", dataIndex: "createdAt", key: "createdAt" },
    {
      title: "Acoes",
      key: "acoes",
      render: (_: unknown, record: TermoInfo) => (
        <Space>
          <Button size="small" onClick={() => onAbrirTermo(record.id)}>
            Abrir
          </Button>
          <Button size="small" onClick={() => onBaixarTermo(record.id)}>
            Baixar
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title="Nova devolucao"
      footer={
        <Space>
          <Button onClick={onCancel}>Cancelar</Button>
          {step > 0 && step < 2 ? (
            <Button onClick={() => setStep(step - 1)}>Voltar</Button>
          ) : null}
          {step < 1 ? (
            <Button type="primary" onClick={onAdvance}>
              Avancar
            </Button>
          ) : step === 1 ? (
            <>
              <Button type="primary" loading={saving} onClick={onConfirm}>
                Confirmar devolucao
              </Button>
              <Popconfirm
                title="Forcar devolucao?"
                description="Ignora o saldo em posse do colaborador."
                okText="Forcar"
                cancelText="Cancelar"
                onConfirm={onForceConfirm}
              >
                <Button danger>Forcar devolucao</Button>
              </Popconfirm>
            </>
          ) : (
            <Button onClick={onCancel}>Fechar</Button>
          )}
        </Space>
      }
    >
      <Steps
        current={step}
        size="small"
        items={[
          { title: "Colaborador" },
          { title: "Itens" },
          { title: "Termo" },
        ]}
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
                  onColaboradorSelect(selected ?? null);
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
        ) : step === 1 ? (
          <>
            <div className="flex flex-wrap gap-2">
              <Select
                placeholder="Unidade"
                allowClear
                value={devolucaoUnidadeId ?? undefined}
                onChange={(value) => setDevolucaoUnidadeId(value ?? null)}
                options={unidades.map((u) => ({
                  label: u.nome,
                  value: u.id,
                }))}
                style={{ minWidth: 180 }}
              />
              <Select
                placeholder="Genero"
                allowClear
                value={devolucaoGenero ?? undefined}
                onChange={(value) => setDevolucaoGenero(value ?? null)}
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
                value={devolucaoTamanho ?? undefined}
                onChange={(value) => setDevolucaoTamanho(value ?? null)}
                options={tamanhosDisponiveis.map((tamanho) => ({
                  label: tamanho,
                  value: tamanho,
                }))}
                style={{ minWidth: 140 }}
              />
            </div>
            <Divider className="my-4">Em posse</Divider>
            <Table
              size="small"
              pagination={false}
              rowKey="id"
              loading={saldosLoading}
              dataSource={saldos}
              columns={[
                {
                  title: "Variacao",
                  dataIndex: "variacaoId",
                  key: "variacaoId",
                  render: (_: string, record: ColaboradorSaldo) =>
                    `${record.tipoNome} - ${record.tamanho} - ${record.genero}`,
                },
                {
                  title: "Quantidade",
                  dataIndex: "quantidade",
                  key: "quantidade",
                },
              ]}
            />
            <Divider className="my-4">Itens</Divider>
            <Form.List
              name="itens"
              initialValue={[{ variacaoId: undefined, quantidade: 1 }]}
            >
              {(fields, { add, remove }) => (
                <div className="space-y-2">
                  {fields.map((field) => (
                    <Space key={field.key} align="baseline">
                      <Form.Item
                        name={[field.name, "variacaoId"]}
                        rules={[{ required: true }]}
                      >
                        <Select
                          placeholder="Variacao"
                          options={variacaoOptionsDevolucao}
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
                  {devolucaoUnidadeId && devolucaoEstoqueIds.length === 0 ? (
                    <Alert
                      className="mt-2"
                      type="info"
                      message="Nenhum estoque encontrado para a unidade selecionada."
                      showIcon
                    />
                  ) : variacoesDevolucaoFiltradas.length === 0 ? (
                    <Alert
                      className="mt-2"
                      type="info"
                      message="Nenhum item encontrado para os filtros selecionados."
                      showIcon
                    />
                  ) : null}
                </div>
              )}
            </Form.List>
          </>
        ) : (
          <>
            <Typography.Text className="text-sm text-neutral-600">
              Registro criado. Gere um termo para esta devolucao.
            </Typography.Text>
            <div className="mt-4">
              <Button
                type="primary"
                loading={termosLoading}
                onClick={onGerarTermo}
              >
                Gerar termo
              </Button>
              <Button
                className="ml-2"
                onClick={() => {
                  const ultimo = termos[0];
                  if (ultimo) onAbrirTermo(ultimo.id);
                }}
                disabled={!termos.length}
              >
                Abrir ultimo termo
              </Button>
            </div>
            <Table
              className="mt-4"
              rowKey="id"
              columns={termoColumns}
              dataSource={termos}
              loading={termosLoading}
              pagination={false}
            />
          </>
        )}
      </Form>
    </Modal>
  );
}
