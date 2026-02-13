import Link from "next/link";
import {
  Alert,
  Button,
  Modal,
  Select,
  Skeleton,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FardamentosShell } from "@/modules/fardamentos/components/fardamentos-shell";
import { SectionCard } from "@/modules/fardamentos/components/section-card";
import type { ColaboradorSaldo } from "@/modules/fardamentos/types/saldos.types";
import {
  fetchColaboradorSaldosPaginado,
  fetchMovimentacoes,
  mapMovimentacoesToUi,
} from "@/modules/fardamentos/services/fardamentos.service";
import { colaboradoresMock } from "@/modules/fardamentos/types/fardamentos.mock";
import { MovimentacaoStatus } from "@/modules/fardamentos/types/movimentacoes.enums";
import { formatIsoDateTime } from "@/shared/formatters/date";
import { toaster } from "@/components/toaster";
import { useDebounce } from "@/hooks/useDebounce";
import DefaultLayout from "@/layouts/default";

export default function SaldosPage() {
  const [colaboradorId, setColaboradorId] = useState<string | undefined>();
  const [saldos, setSaldos] = useState<ColaboradorSaldo[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [total, setTotal] = useState(0);
  const [totalItens, setTotalItens] = useState(0);
  const [query, setQuery] = useState("");
  const [colaboradoresLoading, setColaboradoresLoading] = useState(false);
  const [colaboradoresOptions, setColaboradoresOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [historicoOpen, setHistoricoOpen] = useState(false);
  const [historicoLoading, setHistoricoLoading] = useState(false);
  const [saldoSelecionado, setSaldoSelecionado] = useState<ColaboradorSaldo | null>(
    null,
  );
  const [historicoItens, setHistoricoItens] = useState<
    Array<{
      id: string;
      tipo: string;
      createdAt: string;
      quantidade: number;
      unidadeNome: string;
    }>
  >([]);
  const debouncedQuery = useDebounce(query);

  useEffect(() => {
    setColaboradoresLoading(true);
    const timer = setTimeout(() => {
      const lowered = debouncedQuery.toLowerCase().trim();
      const filtered = !lowered
        ? colaboradoresMock
        : colaboradoresMock.filter((colab) =>
            colab.nome.toLowerCase().includes(lowered),
          );
      setColaboradoresOptions(
        filtered.map((colab) => ({
          label: colab.nome,
          value: colab.id,
        })),
      );
      setColaboradoresLoading(false);
    }, 250);

    return () => {
      clearTimeout(timer);
    };
  }, [debouncedQuery]);

  const loadSaldos = useCallback(
    async (targetColaboradorId: string) => {
      setLoading(true);
      try {
        const result = await fetchColaboradorSaldosPaginado(
          targetColaboradorId,
          {
            offset: (page - 1) * pageSize,
            limit: pageSize,
          },
        );
        setSaldos(result.data);
        setTotal(result.total);
        setTotalItens(result.totalQuantidade ?? 0);
      } catch (err) {
        toaster.erro("Erro ao carregar saldo", err);
      } finally {
        setLoading(false);
      }
    },
    [page, pageSize],
  );

  useEffect(() => {
    if (!colaboradorId) {
      setSaldos([]);
      setTotal(0);
      setTotalItens(0);
      return undefined;
    }
    void loadSaldos(colaboradorId);
  }, [colaboradorId, loadSaldos]);
  const colaboradorSelecionadoNome = useMemo(() => {
    if (!colaboradorId) return "";
    return (
      colaboradoresMock.find((colab) => colab.id === colaboradorId)?.nome ?? ""
    );
  }, [colaboradorId]);
  const showPageSkeleton =
    loading && Boolean(colaboradorId) && saldos.length === 0;

  const abrirHistoricoItem = useCallback(
    async (saldo: ColaboradorSaldo) => {
      if (!colaboradorId) return;
      setSaldoSelecionado(saldo);
      setHistoricoOpen(true);
      setHistoricoLoading(true);
      try {
        const movResult = await fetchMovimentacoes({
          q: colaboradorId,
          status: MovimentacaoStatus.CONCLUIDO,
          offset: 0,
          limit: 100,
        });
        const movs = mapMovimentacoesToUi(movResult.data).filter(
          (mov) => mov.colaboradorId === colaboradorId,
        );
        const itensHistorico = movs
          .map((mov) => {
            const quantidade = mov.itens
              .filter((item) => item.variacaoId === saldo.variacaoId)
              .reduce((acc, item) => acc + item.quantidade, 0);
            if (quantidade <= 0) return null;
            return {
              id: mov.id,
              tipo: mov.tipo,
              createdAt: mov.createdAt,
              quantidade,
              unidadeNome: mov.unidadeNome,
            };
          })
          .filter(
            (
              value,
            ): value is {
              id: string;
              tipo: string;
              createdAt: string;
              quantidade: number;
              unidadeNome: string;
            } => Boolean(value),
          );
        setHistoricoItens(itensHistorico);
      } catch (err) {
        toaster.erro("Erro ao carregar histórico do item", err);
        setHistoricoItens([]);
      } finally {
        setHistoricoLoading(false);
      }
    },
    [colaboradorId],
  );

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
            showPageSkeleton ? (
              <Space wrap className="w-full max-w-3xl">
                <Skeleton.Input active className="w-full md:min-w-60" />
              </Space>
            ) : (
              <Space className="w-full" wrap>
                <Select
                  showSearch
                  placeholder="Selecionar colaborador"
                  value={colaboradorId}
                  allowClear
                  onSearch={(value) => setQuery(value)}
                  onChange={(value) => {
                    setColaboradorId(value);
                    setPage(1);
                  }}
                  filterOption={false}
                  loading={colaboradoresLoading}
                  popupRender={(menu) => (
                    <>
                      {menu}
                      {colaboradoresLoading ? (
                        <div className="px-3 py-2 text-center">
                          <Spin size="small" />
                        </div>
                      ) : null}
                    </>
                  )}
                  options={colaboradoresOptions}
                  className="w-full md:min-w-60"
                />
              </Space>
            )
          }
        >
          {showPageSkeleton ? (
            <div className="space-y-3 rounded-lg border border-neutral-200/70 p-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton
                  key={`saldos-skeleton-${index}`}
                  active
                  title={false}
                  paragraph={{ rows: 1, width: ["100%"] }}
                />
              ))}
            </div>
          ) : !colaboradorId ? (
            <Alert
              type="info"
              showIcon
              title="Selecione um colaborador"
              description="Escolha um colaborador para visualizar o saldo de itens."
            />
          ) : (
            <>
              <Tag color="blue">Itens em posse: {totalItens}</Tag>
              <Table
                className="mt-3"
                rowKey={(record) =>
                  record.id ||
                  `${record.variacaoId}-${record.genero}-${record.tamanho}`
                }
                loading={loading}
                dataSource={saldos}
                scroll={{ x: 680 }}
                pagination={{
                  current: page,
                  pageSize,
                  total,
                  onChange: (nextPage) => setPage(nextPage),
                  showSizeChanger: false,
                  showTotal: (value) => `Total: ${value}`,
                }}
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
                    title: "Gênero",
                    dataIndex: "genero",
                    key: "genero",
                  },
                  {
                    title: "Quantidade",
                    dataIndex: "quantidade",
                    key: "quantidade",
                  },
                  {
                    title: "Ações sugeridas",
                    key: "acoes",
                    render: (_: unknown, record: ColaboradorSaldo) =>
                      colaboradorId ? (
                        <Space wrap>
                          <Button
                            size="small"
                            onClick={() => void abrirHistoricoItem(record)}
                          >
                            Histórico
                          </Button>
                          <Link
                            href={{
                              pathname: "/fardamentos/movimentacoes",
                              query: {
                                novaDevolucao: "1",
                                colaboradorId,
                                colaboradorNome: colaboradorSelecionadoNome,
                              },
                            }}
                          >
                            <Button size="small">Registrar devolução</Button>
                          </Link>
                        </Space>
                      ) : null,
                  },
                ]}
              />
            </>
          )}
        </SectionCard>

        <Modal
          open={historicoOpen}
          onCancel={() => {
            setHistoricoOpen(false);
            setSaldoSelecionado(null);
            setHistoricoItens([]);
          }}
          title="Histórico do saldo"
          width="min(96vw, 760px)"
          footer={
            <Button
              onClick={() => {
                setHistoricoOpen(false);
                setSaldoSelecionado(null);
                setHistoricoItens([]);
              }}
            >
              Fechar
            </Button>
          }
        >
          <Typography.Text type="secondary">
            {saldoSelecionado
              ? `${saldoSelecionado.tipoNome} - ${saldoSelecionado.tamanho} - ${saldoSelecionado.genero}`
              : "-"}
          </Typography.Text>
          <Table
            className="mt-4"
            rowKey={(record) => `${record.id}-${record.tipo}`}
            loading={historicoLoading}
            dataSource={historicoItens}
            pagination={false}
            scroll={{ x: 640 }}
            locale={{
              emptyText: "Nenhuma movimentação encontrada para este item.",
            }}
            columns={[
              { title: "Tipo", dataIndex: "tipo", key: "tipo" },
              { title: "Unidade", dataIndex: "unidadeNome", key: "unidadeNome" },
              {
                title: "Quantidade",
                dataIndex: "quantidade",
                key: "quantidade",
              },
              {
                title: "Criado em",
                dataIndex: "createdAt",
                key: "createdAt",
                render: (value: string) => formatIsoDateTime(value),
              },
            ]}
          />
        </Modal>
      </FardamentosShell>
    </DefaultLayout>
  );
}
