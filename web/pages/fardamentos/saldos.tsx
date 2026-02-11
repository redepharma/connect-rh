import { Alert, Input, Select, Space, Table, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import { FardamentosShell } from "@/modules/fardamentos/components/fardamentos-shell";
import { SectionCard } from "@/modules/fardamentos/components/section-card";
import type { ColaboradorSaldo } from "@/modules/fardamentos/types/saldos.types";
import { fetchColaboradorSaldos } from "@/modules/fardamentos/services/fardamentos.service";
import { colaboradoresMock } from "@/modules/fardamentos/types/fardamentos.mock";
import { toaster } from "@/components/toaster";
import DefaultLayout from "@/layouts/default";

export default function SaldosPage() {
  const [colaboradorId, setColaboradorId] = useState<string | undefined>();
  const [saldos, setSaldos] = useState<ColaboradorSaldo[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const colaboradoresFiltrados = useMemo(() => {
    if (!query) return colaboradoresMock;
    const lowered = query.toLowerCase();
    return colaboradoresMock.filter((colab) =>
      colab.nome.toLowerCase().includes(lowered),
    );
  }, [query]);

  useEffect(() => {
    let active = true;
    if (!colaboradorId) {
      setSaldos([]);
      return undefined;
    }

    const load = async () => {
      setLoading(true);
      try {
        const result = await fetchColaboradorSaldos(colaboradorId);
        if (active) setSaldos(result);
      } catch (err) {
        if (active) toaster.erro("Erro ao carregar saldo", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [colaboradorId]);

  const totalItens = saldos.reduce((acc, item) => acc + item.quantidade, 0);

  return (
    <DefaultLayout>
      <FardamentosShell
        title="Saldos"
        description="Visualize os itens em posse de cada colaborador."
      >
        <SectionCard
          title="Saldo por colaborador"
          description="Selecione um colaborador para consultar os itens em posse."
          actions={
            <Space>
              <Select
                showSearch
                placeholder="Selecionar colaborador"
                value={colaboradorId}
                allowClear
                onSearch={(value) => setQuery(value)}
                onChange={(value) => setColaboradorId(value)}
                filterOption={false}
                options={colaboradoresFiltrados.map((colab) => ({
                  label: colab.nome,
                  value: colab.id,
                }))}
                style={{ minWidth: 240 }}
              />
              <Input
                placeholder="Buscar colaborador"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                allowClear
              />
            </Space>
          }
        >
          {!colaboradorId ? (
            <Alert
              type="info"
              showIcon
              message="Selecione um colaborador"
              description="Escolha um colaborador para visualizar o saldo de itens."
            />
          ) : (
            <>
              <Typography.Text className="text-sm text-neutral-500">
                Total de itens em posse: {totalItens}
              </Typography.Text>
              <Table
                className="mt-3"
                rowKey="id"
                loading={loading}
                dataSource={saldos}
                pagination={false}
                columns={[
                  {
                    title: "Tipo",
                    dataIndex: "tipoNome",
                    key: "tipoNome",
                  },
                  {
                    title: "Tamanho",
                    dataIndex: "tamanho",
                    key: "tamanho",
                  },
                  {
                    title: "Genero",
                    dataIndex: "genero",
                    key: "genero",
                  },
                  {
                    title: "Quantidade",
                    dataIndex: "quantidade",
                    key: "quantidade",
                  },
                ]}
              />
            </>
          )}
        </SectionCard>
      </FardamentosShell>
    </DefaultLayout>
  );
}
