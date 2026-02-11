import Link from "next/link";
import { Button, Card, Divider, Typography } from "antd";
import { useEffect, useState } from "react";
import { FardamentosShell } from "@/modules/fardamentos/components/fardamentos-shell";
import { KpiCard } from "@/modules/fardamentos/components/kpi-card";
import { SectionCard } from "@/modules/fardamentos/components/section-card";
import { LOW_STOCK_THRESHOLD } from "@/modules/fardamentos/types/fardamentos.constants";
import DefaultLayout from "@/layouts/default";
import type { EstoqueItem } from "@/modules/fardamentos/types/fardamentos.types";
import {
  fetchAvarias,
  fetchEstoque,
  fetchMetrics,
  mapEstoqueToUi,
} from "@/modules/fardamentos/services/fardamentos.service";
import { toaster } from "@/components/toaster";
import type { Avaria } from "@/modules/fardamentos/types/avarias.types";

export default function FardamentosOverview() {
  const [estoque, setEstoque] = useState<EstoqueItem[]>([]);
  const [avarias, setAvarias] = useState<Avaria[]>([]);
  const [totalAvarias, setTotalAvarias] = useState(0);
  const [metrics, setMetrics] = useState<{
    unidades: number;
    tipos: number;
    variacoes: number;
    estoqueTotal: number;
    estoqueReservado: number;
    lowStockCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const [metricsResult, estoqueResult, avariasResult] = await Promise.all(
          [
            fetchMetrics(),
            fetchEstoque({ baixoEstoque: true, offset: 0, limit: 10 }),
            fetchAvarias({ offset: 0, limit: 5 }),
          ],
        );

        if (!active) return;

        setMetrics(metricsResult);
        setEstoque(mapEstoqueToUi(estoqueResult.data));
        setAvarias(avariasResult.data);
        setTotalAvarias(avariasResult.total);
      } catch (err) {
        if (active) {
          toaster.erro("Erro ao carregar dados do painel", err);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const totalEstoque = metrics?.estoqueTotal ?? 0;
  const totalReservado = metrics?.estoqueReservado ?? 0;
  const disponivel = totalEstoque - totalReservado;
  const lowStockItems = estoque.filter(
    (item) => item.total - item.reservado < LOW_STOCK_THRESHOLD,
  );

  return (
    <DefaultLayout>
      <FardamentosShell
        title="VISÃO GERAL"
        description="Visao geral do catalogo e estoque do modulo de fardamentos."
      >
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Estoque disponível"
            value={loading ? "--" : disponivel}
            helper={`${totalReservado} itens reservados`}
          />
          <KpiCard
            title="Alertas de baixo estoque"
            value={loading ? "--" : (metrics?.lowStockCount ?? 0)}
            helper={`Itens com quantidade abaixo de ${LOW_STOCK_THRESHOLD}`}
            tag={(metrics?.lowStockCount ?? 0) ? "Atenção" : "OK"}
            tagColor={(metrics?.lowStockCount ?? 0) ? "red" : "green"}
          />
          <KpiCard
            title="Unidades ativas"
            value={loading ? "--" : (metrics?.unidades ?? 0)}
            helper="Unidades cadastradas"
          />
          <KpiCard
            title="Tipos e variações"
            value={loading ? "--" : `${metrics?.tipos ?? 0} tipos`}
            helper={`${metrics?.variacoes ?? 0} variações cadastradas`}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <SectionCard
            title="Alertas de estoque"
            description="Itens abaixo do limite mínimo configurado."
            actions={
              <Link href="/fardamentos/estoque">
                <Button type="primary">Ver estoque</Button>
              </Link>
            }
          >
            <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
              {lowStockItems.length === 0 ? (
                <Typography.Text className="text-sm text-neutral-500">
                  Nenhum item abaixo do estoque mínimo no momento.
                </Typography.Text>
              ) : (
                lowStockItems.slice(0, 4).map((item) => (
                  <Card
                    key={item.id}
                    className="border border-neutral-200/70"
                    size="small"
                  >
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:gap-4">
                      <div>
                        <Typography.Text className="block text-sm font-bold! text-neutral-900">
                          {item.tipoNome}
                        </Typography.Text>
                        <div className="flex flex-wrap items-center gap-2">
                          <Typography.Text className="block text-xs! text-neutral-500!">
                            {item.variacaoLabel}
                          </Typography.Text>
                          <Divider
                            vertical={true}
                            plain={true}
                            className="hidden sm:inline-block"
                          />
                          <Typography.Text className="block text-xs! text-neutral-500!">
                            Unidade: {item.unidade}
                          </Typography.Text>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <Typography.Text className="block text-sm font-semibold text-red-600">
                          {item.total - item.reservado} disponiveis
                        </Typography.Text>
                        <Typography.Text className="block text-xs! text-neutral-500!">
                          {item.reservado} reservados
                        </Typography.Text>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Atalhos rápidos"
            description="Navegue para as telas principais do catálogo."
          >
            <div className="flex flex-col gap-2">
              {[
                {
                  label: "Cadastro de unidades",
                  href: "/fardamentos/unidades",
                },
                { label: "Cadastro de tipos", href: "/fardamentos/tipos" },
                {
                  label: "Variações e tamanhos",
                  href: "/fardamentos/variacoes",
                },
                { label: "Controle de estoque", href: "/fardamentos/estoque" },
                { label: "Movimentações", href: "/fardamentos/movimentacoes" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:text-neutral-900"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </SectionCard>
        </section>

        <SectionCard
          title="Avarias recentes"
          description="Últimos registros de avarias e ajustes realizados."
          actions={
            <Link href="/fardamentos/avarias">
              <Button type="primary">Ver avarias</Button>
            </Link>
          }
        >
          <div className="flex flex-wrap gap-3">
            <Card className="border border-neutral-200/70" size="small">
              <Typography.Text className="block text-xs text-neutral-500">
                Total de avarias
              </Typography.Text>
              <Typography.Text className="text-lg font-semibold text-neutral-900">
                {loading ? "--" : totalAvarias}
              </Typography.Text>
            </Card>
          </div>
          <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
            {avarias.length === 0 ? (
              <Typography.Text className="text-sm text-neutral-500">
                Nenhuma avaria registrada ainda.
              </Typography.Text>
            ) : (
              avarias.slice(0, 4).map((avaria) => (
                <Card
                  key={avaria.id}
                  className="border border-neutral-200/70"
                  size="small"
                >
                  <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:gap-4">
                    <div>
                      <Typography.Text className="block text-sm font-medium text-neutral-900">
                        {avaria.colaboradorNome}
                      </Typography.Text>
                      <Typography.Text className="block text-xs text-neutral-500">
                        {avaria.tipoNome} - {avaria.variacaoLabel}
                      </Typography.Text>
                      <Typography.Text className="block text-xs text-neutral-500">
                        Unidade: {avaria.unidadeNome}
                      </Typography.Text>
                    </div>
                    <div className="text-left sm:text-right">
                      <Typography.Text className="block text-sm font-semibold text-neutral-900">
                        {avaria.quantidade} itens
                      </Typography.Text>
                      <Typography.Text className="block text-xs text-neutral-500">
                        {avaria.createdAt}
                      </Typography.Text>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </SectionCard>
      </FardamentosShell>
    </DefaultLayout>
  );
}
