import { Button, Card, Input, Space, Typography } from "antd";
import { useEffect, useState } from "react";
import { FardamentosShell } from "@/modules/fardamentos/components/fardamentos-shell";
import { KpiCard } from "@/modules/fardamentos/components/kpi-card";
import { SectionCard } from "@/modules/fardamentos/components/section-card";
import { LOW_STOCK_THRESHOLD } from "@/modules/fardamentos/types/fardamentos.constants";
import type { EstoqueItem } from "@/modules/fardamentos/types/fardamentos.types";
import {
  fetchEstoque,
  fetchMetrics,
  mapEstoqueToUi,
} from "@/modules/fardamentos/services/fardamentos.service";
import { toaster } from "@/components/toaster";

export default function FardamentosOverview() {
  const [estoque, setEstoque] = useState<EstoqueItem[]>([]);
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
        const [metricsResult, estoqueResult] = await Promise.all([
          fetchMetrics(),
          fetchEstoque({ baixoEstoque: true, offset: 0, limit: 10 }),
        ]);

        if (!active) return;

        setMetrics(metricsResult);
        setEstoque(mapEstoqueToUi(estoqueResult.data));
      } catch (err) {
        if (active) toaster.erro("Erro ao carregar dados do painel", err);
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
    <FardamentosShell
      title="Visao geral"
      description="Visao geral do catalogo e estoque do modulo de fardamentos."
      actions={
        <Space>
          <Button type="primary">Novo tipo</Button>
          <Button>Nova unidade</Button>
        </Space>
      }
    >
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Estoque disponivel"
          value={loading ? "--" : disponivel}
          helper={`${totalReservado} itens reservados`}
        />
        <KpiCard
          title="Alertas de baixo estoque"
          value={loading ? "--" : (metrics?.lowStockCount ?? 0)}
          helper={`Limite: < ${LOW_STOCK_THRESHOLD}`}
          tag={(metrics?.lowStockCount ?? 0) ? "Atencao" : "OK"}
          tagColor={(metrics?.lowStockCount ?? 0) ? "red" : "green"}
        />
        <KpiCard
          title="Unidades ativas"
          value={loading ? "--" : (metrics?.unidades ?? 0)}
          helper="Unidades cadastradas"
        />
        <KpiCard
          title="Tipos e variacoes"
          value={loading ? "--" : `${metrics?.tipos ?? 0} tipos`}
          helper={`${metrics?.variacoes ?? 0} variacoes cadastradas`}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <SectionCard
          title="Alertas de estoque"
          description="Itens abaixo do limite minimo configurado."
          actions={<Button type="primary">Ver estoque</Button>}
        >
          <div className="space-y-3">
            {lowStockItems.length === 0 ? (
              <Typography.Text className="text-sm text-neutral-500">
                Nenhum item abaixo do estoque minimo no momento.
              </Typography.Text>
            ) : (
              lowStockItems.map((item) => (
                <Card
                  key={item.id}
                  className="border border-neutral-200/70"
                  size="small"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Typography.Text className="text-sm font-medium text-neutral-900">
                        {item.tipoNome}
                      </Typography.Text>
                      <Typography.Text className="text-xs text-neutral-500">
                        {item.variacaoLabel} - {item.unidade}
                      </Typography.Text>
                    </div>
                    <div className="text-right">
                      <Typography.Text className="text-sm font-semibold text-red-600">
                        {item.total - item.reservado} disponiveis
                      </Typography.Text>
                      <Typography.Text className="text-xs text-neutral-500">
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
          title="Atalhos rapidos"
          description="Navegue para as telas principais do catalogo."
          actions={<Input placeholder="Buscar unidade" />}
        >
          <div className="flex flex-col gap-2">
            {[
              { label: "Cadastro de unidades" },
              { label: "Cadastro de tipos" },
              { label: "Variacoes e tamanhos" },
              { label: "Controle de estoque" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700"
              >
                {item.label}
              </div>
            ))}
          </div>
        </SectionCard>
      </section>
    </FardamentosShell>
  );
}
