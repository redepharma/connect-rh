"use client";

import {
  Button,
  Divider,
  Form,
  Input,
  Modal,
  Select,
  Skeleton,
  Typography,
} from "antd";
import type { FormInstance } from "antd/es/form";
import type { Avaria } from "@/modules/fardamentos/types/avarias.types";
import type { Movimentacao } from "@/modules/fardamentos/types/movimentacoes.types";

type AvariaOption = {
  value: string;
  label: string;
  quantidade: number;
};

type HistoricoAvariaModalProps = {
  open: boolean;
  saving: boolean;
  movimentacao: Movimentacao | null;
  form: FormInstance;
  options: AvariaOption[];
  maxByVariacao: Record<string, number>;
  avariasRegistradas: Avaria[];
  avariasLoading: boolean;
  onCancel: () => void;
  onSubmit: () => void;
};

export function HistoricoAvariaModal({
  open,
  saving,
  movimentacao,
  form,
  options,
  maxByVariacao,
  avariasRegistradas,
  avariasLoading,
  onCancel,
  onSubmit,
}: HistoricoAvariaModalProps) {
  const maxItens = options.filter(
    (option) => (maxByVariacao[option.value] ?? 0) > 0,
  ).length;

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title="Registrar avaria"
      width="min(96vw, 540px)"
      styles={{ body: { maxHeight: "75vh", overflowY: "auto" } }}
      onOk={onSubmit}
      okText="Registrar"
      confirmLoading={saving}
      okButtonProps={{ disabled: avariasLoading }}
      destroyOnHidden
    >
      <Typography.Text type="secondary">
        {movimentacao
          ? `${movimentacao.colaboradorNome} - ${movimentacao.unidadeNome}`
          : "-"}
      </Typography.Text>
      <Form
        form={form}
        layout="vertical"
        className="mt-4!"
        initialValues={{
          itens: [{ variacaoId: undefined, quantidade: 1 }],
        }}
      >
        <Form.List name="itens">
          {(fields, { add, remove }) => (
            <div className="space-y-4!">
              <div className="max-h-72 overflow-y-auto pr-1">
                {fields.map((field, index) => {
                  const itensAtuais = (form.getFieldValue("itens") ??
                    []) as Array<{
                    variacaoId?: string;
                  }>;
                  const variacaoAtual = itensAtuais[field.name]?.variacaoId;
                  const variacoesJaSelecionadas = new Set(
                    itensAtuais
                      .map((item, index) =>
                        index !== field.name ? item?.variacaoId : undefined,
                      )
                      .filter((value): value is string => Boolean(value)),
                  );
                  const optionsDisponiveis = options.filter(
                    (option) =>
                      (option.value === variacaoAtual ||
                        !variacoesJaSelecionadas.has(option.value)) &&
                      ((maxByVariacao[option.value] ?? 0) > 0 ||
                        option.value === variacaoAtual),
                  );

                  return (
                    <div
                      key={field.key}
                      className="rounded-lg border border-neutral-200/80 bg-neutral-100/40 p-3 mb-4!"
                    >
                      <div className="grid grid-cols-[1fr_112px] gap-2">
                        <Form.Item
                          label="Variação"
                          name={[field.name, "variacaoId"]}
                          className="mb-2!"
                          rules={[
                            {
                              required: true,
                              message: "Selecione uma variação",
                            },
                          ]}
                        >
                          <Select
                            placeholder="Selecione a variação"
                            options={optionsDisponiveis}
                          />
                        </Form.Item>
                        <Form.Item
                          label="Quantidade"
                          name={[field.name, "quantidade"]}
                          className="mb-2!"
                          rules={[
                            {
                              required: true,
                              message: "Informe a quantidade",
                            },
                            {
                              validator: async (_, value) => {
                                const quantidade = Number(value ?? 0);
                                if (
                                  !Number.isFinite(quantidade) ||
                                  quantidade <= 0
                                ) {
                                  throw new Error(
                                    "Quantidade deve ser maior que zero",
                                  );
                                }
                                const variacaoId = form.getFieldValue([
                                  "itens",
                                  field.name,
                                  "variacaoId",
                                ]) as string | undefined;
                                if (!variacaoId) return;
                                const maxQuantidade =
                                  maxByVariacao[variacaoId] ?? 0;
                                if (maxQuantidade <= 0) {
                                  throw new Error(
                                    "Não há saldo restante de avaria para esta variação",
                                  );
                                }
                                if (quantidade > maxQuantidade) {
                                  throw new Error(
                                    `Limite restante para a variação: ${maxQuantidade}`,
                                  );
                                }
                              },
                            },
                          ]}
                        >
                          <Input type="number" min={1} />
                        </Form.Item>
                      </div>
                      <Form.Item
                        label="Descrição (opcional)"
                        name={[field.name, "descricao"]}
                        className="mb-2!"
                      >
                        <Input placeholder="Ex: rasgo, desgaste, mancha..." />
                      </Form.Item>
                      <div className="flex justify-end">
                        <Button
                          onClick={() => remove(field.name)}
                          disabled={fields.length === 1}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button
                disabled={fields.length >= maxItens || maxItens === 0}
                onClick={() =>
                  add({
                    variacaoId: undefined,
                    quantidade: 1,
                    descricao: "",
                  })
                }
                className="w-full sm:w-auto"
              >
                Adicionar item
              </Button>
            </div>
          )}
        </Form.List>
      </Form>
      <Divider className="my-4">Avarias registradas</Divider>
      {avariasLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton
              key={`avaria-registrada-skeleton-${index}`}
              active
              title={false}
              paragraph={{ rows: 1, width: ["100%"] }}
            />
          ))}
        </div>
      ) : avariasRegistradas.length ? (
        <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
          {avariasRegistradas.map((avaria) => (
            <div
              key={avaria.id}
              className="rounded border border-neutral-200 px-3 py-2 text-xs text-neutral-700"
            >
              <div>
                {avaria.quantidade}x {avaria.tipoNome} - {avaria.variacaoLabel}
              </div>
              <div className="text-neutral-500">
                {avaria.descricao?.trim() ? avaria.descricao : "Sem descrição"}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Typography.Text className="text-xs text-neutral-500">
          Nenhuma avaria registrada para esta movimentação.
        </Typography.Text>
      )}
    </Modal>
  );
}
