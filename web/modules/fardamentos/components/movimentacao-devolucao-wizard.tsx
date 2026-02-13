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
  Spin,
  Steps,
  Table,
  Typography,
} from "antd";
import type { FormInstance } from "antd/es/form";
import { formatIsoDateTime } from "@/shared/formatters/date";
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
  devolucaoTipoId: string | null;
  setDevolucaoTipoId: (value: string | null) => void;
  tiposDisponiveis: { label: string; value: string }[];
  devolucaoGenero: Genero | null;
  setDevolucaoGenero: (value: Genero | null) => void;
  devolucaoTamanho: string | null;
  setDevolucaoTamanho: (value: string | null) => void;
  devolucaoEstoqueIds: string[];
  variacoesDevolucaoFiltradas: Variacao[];
  saldos: ColaboradorSaldo[];
  saldosTotais: ColaboradorSaldo[];
  saldosLoading: boolean;
  unidadesLoading?: boolean;
  onUnidadesScroll?: () => void;
  variacoesLoading?: boolean;
  onVariacoesScroll?: () => void;
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
  devolucaoTipoId,
  setDevolucaoTipoId,
  tiposDisponiveis,
  devolucaoGenero,
  setDevolucaoGenero,
  devolucaoTamanho,
  setDevolucaoTamanho,
  devolucaoEstoqueIds,
  variacoesDevolucaoFiltradas,
  saldos,
  saldosTotais,
  saldosLoading,
  unidadesLoading,
  onUnidadesScroll,
  variacoesLoading,
  onVariacoesScroll,
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
  const handleDevolverTudo = () => {
    const itens = saldosTotais
      .filter((saldo) => saldo.quantidade > 0)
      .map((saldo) => ({
        variacaoId: saldo.variacaoId,
        quantidade: saldo.quantidade,
      }));

    form.setFieldValue(
      "itens",
      itens.length ? itens : [{ variacaoId: undefined, quantidade: 1 }],
    );
  };

  const termoColumns = [
    { title: "Versão", dataIndex: "versao", key: "versao" },
    { title: "Tipo", dataIndex: "tipo", key: "tipo" },
    { title: "Gerado por", dataIndex: "usuarioNome", key: "usuarioNome" },
    {
      title: "Criado em",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value: string) => formatIsoDateTime(value),
    },
    {
      title: "Ações",
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
      title="Nova devolução"
      width={700}
      styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
      footer={
        <Space wrap>
          <Button onClick={onCancel}>Cancelar</Button>
          {step > 0 && step < 2 ? (
            <Button onClick={() => setStep(step - 1)}>Voltar</Button>
          ) : null}
          {step < 1 ? (
            <Button type="primary" onClick={onAdvance}>
              Avançar
            </Button>
          ) : step === 1 ? (
            <>
              <Button type="primary" loading={saving} onClick={onConfirm}>
                Confirmar devolução
              </Button>
              <Popconfirm
                title="Forcar devolução?"
                description="Ignora o saldo em posse do colaborador."
                okText="Forçar"
                cancelText="Cancelar"
                onConfirm={onForceConfirm}
              >
                <Button danger>Forçar devolução</Button>
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
      <Form layout="vertical" form={form} className="mt-4!">
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
                onPopupScroll={(event) => {
                  if (!onUnidadesScroll) return;
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
                      <div className="px-3 py-2 text-center">
                        <Spin size="small" />
                      </div>
                    ) : null}
                  </>
                )}
                options={unidades.map((u) => ({
                  label: u.nome,
                  value: u.id,
                }))}
                className="w-full sm:min-w-[180px] sm:w-auto"
              />
              <Select
                placeholder="Tipo"
                allowClear
                value={devolucaoTipoId ?? undefined}
                onChange={(value) => setDevolucaoTipoId(value ?? null)}
                options={tiposDisponiveis}
                className="w-full sm:min-w-[180px] sm:w-auto"
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
                className="w-full sm:min-w-[160px] sm:w-auto"
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
                className="w-full sm:min-w-35 sm:w-auto"
              />
            </div>
            <Divider className="my-4">Itens</Divider>
            <div className="max-h-56 overflow-y-auto pr-1">
              <Form.List
                name="itens"
                initialValue={[{ variacaoId: undefined, quantidade: 1 }]}
              >
                {(fields, { add, remove }) => (
                  <div className="space-y-2">
                    {fields.map((field) => (
                      <div
                        key={field.key}
                        className="flex flex-col gap-2 sm:flex-row sm:items-baseline"
                      >
                        <Form.Item
                          name={[field.name, "variacaoId"]}
                          rules={[{ required: true }]}
                        >
                          <Select
                            placeholder="Variação"
                            options={variacaoOptionsDevolucao}
                            onPopupScroll={(event) => {
                              if (!onVariacoesScroll) return;
                              const target = event.target as HTMLDivElement;
                              if (
                                target.scrollTop + target.offsetHeight >=
                                target.scrollHeight - 16
                              ) {
                                onVariacoesScroll();
                              }
                            }}
                            popupRender={(menu) => (
                              <>
                                {menu}
                                {variacoesLoading ? (
                                  <div className="px-3 py-2 text-center">
                                    <Spin size="small" />
                                  </div>
                                ) : null}
                              </>
                            )}
                            className="w-full sm:min-w-60"
                          />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, "quantidade"]}
                          rules={[{ required: true }]}
                        >
                          <Input type="number" min={1} className="w-full" />
                        </Form.Item>
                        <Button onClick={() => remove(field.name)}>
                          Remover
                        </Button>
                      </div>
                    ))}
                    <Space wrap>
                      <Button onClick={() => add()}>Adicionar item</Button>
                      <Button
                        onClick={handleDevolverTudo}
                        disabled={
                          saldosTotais.filter((saldo) => saldo.quantidade > 0)
                            .length === 0
                        }
                      >
                        Devolver tudo em posse
                      </Button>
                    </Space>
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
            </div>
            <Divider className="my-4">Em posse</Divider>
            <div className="max-h-44 overflow-y-auto pr-1">
              <Table
                size="small"
                pagination={false}
                scroll={{ x: 640 }}
                rowKey="id"
                loading={saldosLoading}
                dataSource={saldos}
                columns={[
                  {
                    title: "Variação",
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
            </div>
          </>
        ) : (
          <>
            <Typography.Text className="text-sm text-neutral-600">
              Registro criado. Gere um termo para esta devolucao.
            </Typography.Text>
            <div className="mt-4 space-x-4!">
              <Button
                type="primary"
                loading={termosLoading}
                onClick={onGerarTermo}
                disabled={termos.length > 0}
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
                Abrir último termo
              </Button>
            </div>
            <Table
              className="mt-4"
              rowKey="id"
              columns={termoColumns}
              dataSource={termos}
              loading={termosLoading}
              pagination={false}
              scroll={{ x: 720 }}
            />
          </>
        )}
      </Form>
    </Modal>
  );
}
