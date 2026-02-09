import { Alert, Button, Card, Input, Space, Typography } from "antd";
import { useEffect, useState } from "react";
import { FardamentosShell } from "@/modules/fardamentos/components/fardamentos-shell";
import { KpiCard } from "@/modules/fardamentos/components/kpi-card";
import { SectionCard } from "@/modules/fardamentos/components/section-card";
import { LOW_STOCK_THRESHOLD } from "@/modules/fardamentos/types/fardamentos.constants";
import type { EstoqueItem, TipoFardamento, Unidade, Variacao } from "@/modules/fardamentos/types/fardamentos.types";
import { fetchEstoque, fetchTipos, fetchUnidades, fetchVariacoes, mapEstoqueToUi, mapTiposToUi, mapVariacoesToUi } from "@/modules/fardamentos/services/fardamentos.service";
import { parseApiError } from "@/shared/error-handlers/api-errors";

export default function FardamentosOverview() {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [tipos, setTipos] = useState<TipoFardamento[]>([]);
  const [variacoes, setVariacoes] = useState<Variacao[]>([]);
  const [estoque, setEstoque] = useState<EstoqueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [unidadesResult, tiposResult, variacoesResult, estoqueResult] =
          await Promise.all([
            fetchUnidades(),
            fetchTipos(),
            fetchVariacoes(),
            fetchEstoque(),
          ]);

        if (!active) return;

        setUnidades(unidadesResult);
        setTipos(mapTiposToUi(tiposResult));
        setVariacoes(mapVariacoesToUi(variacoesResult));
        setEstoque(mapEstoqueToUi(estoqueResult));
      } catch (err) {
        if (active) setError(parseApiError(err).message);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const totalEstoque = estoque.reduce((acc, item) => acc + item.total, 0);
  const totalReservado = estoque.reduce((acc, item) => acc + item.reservado, 0);
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
      {error ? (
        <Alert
          type="error"
          message="Falha ao carregar dados do painel"
          description={error}
          showIcon
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Estoque disponivel"
          value={loading ? "--" : disponivel}
          helper={`${totalReservado} itens reservados`}
        />
        <KpiCard
          title="Alertas de baixo estoque"
          value={loading ? "--" : lowStockItems.length}
          helper={`Limite: < ${LOW_STOCK_THRESHOLD}`}
          tag={lowStockItems.length ? "Atencao" : "OK"}
          tagColor={lowStockItems.length ? "red" : "green"}
        />
        <KpiCard
          title="Unidades ativas"
          value={loading ? "--" : unidades.length}
          helper="Unidades cadastradas"
        />
        <KpiCard
          title="Tipos e variacoes"
          value={loading ? "--" : `${tipos.length} tipos`}
          helper={`${variacoes.length} variacoes cadastradas`}
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
                <Card key={item.id} className="border border-neutral-200/70" size="small">
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
