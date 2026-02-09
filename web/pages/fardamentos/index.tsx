import Link from "next/link";
import { Alert, Button, Card, Input, Space, Typography } from "antd";
import { useEffect, useState } from "react";
import { FardamentosShell } from "@/modules/fardamentos/components/fardamentos-shell";
import { KpiCard } from "@/modules/fardamentos/components/kpi-card";
import { SectionCard } from "@/modules/fardamentos/components/section-card";
import { LOW_STOCK_THRESHOLD } from "@/modules/fardamentos/fardamentos.constants";
import type { EstoqueItem, TipoFardamento, Unidade, Variacao } from "@/modules/fardamentos/fardamentos.types";
import { apiFetch } from "@/lib/api-client";

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
            apiFetch<Unidade[]>("/fardamentos/unidades"),
            apiFetch<
              { id: string; nome: string; unidades: { id: string; nome: string }[] }[]
            >("/fardamentos/tipos"),
            apiFetch<
              {
                id: string;
                tamanho: string;
                genero: string;
                tipo: { id: string; nome: string };
              }[]
            >("/fardamentos/variacoes"),
            apiFetch<
              {
                id: string;
                total: number;
                reservado: number;
                unidade: { id: string; nome: string };
                variacao: {
                  id: string;
                  tamanho: string;
                  genero: string;
                  tipo: { nome: string };
                };
              }[]
            >("/fardamentos/estoque"),
          ]);

        if (!active) return;

        setUnidades(unidadesResult);
        setTipos(
          tiposResult.map((tipo) => ({
            id: tipo.id,
            nome: tipo.nome,
            unidades: (tipo.unidades ?? []).map((u) => u.nome),
            variacoesCount: 0,
          })),
        );
        setVariacoes(
          variacoesResult.map((item) => ({
            id: item.id,
            tipoId: item.tipo?.id ?? "",
            tipoNome: item.tipo?.nome ?? "-",
            tamanho: item.tamanho,
            genero: item.genero,
          })),
        );
        setEstoque(
          estoqueResult.map((item) => ({
            id: item.id,
            variacaoId: item.variacao?.id ?? "",
            tipoNome: item.variacao?.tipo?.nome ?? "-",
            variacaoLabel: `${item.variacao?.tamanho ?? "-"} - ${
              item.variacao?.genero ?? "-"
            }`,
            unidade: item.unidade?.nome ?? "-",
            total: item.total ?? 0,
            reservado: item.reservado ?? 0,
          })),
        );
      } catch (err) {
        if (active) setError((err as Error).message);
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
          actions={
            <Link href="/fardamentos/estoque" className="inline-flex">
              <Button type="primary">Ver estoque</Button>
            </Link>
          }
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
              { href: "/fardamentos/unidades", label: "Cadastro de unidades" },
              { href: "/fardamentos/tipos", label: "Cadastro de tipos" },
              { href: "/fardamentos/variacoes", label: "Variacoes e tamanhos" },
              { href: "/fardamentos/estoque", label: "Controle de estoque" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 hover:border-neutral-300"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </SectionCard>
      </section>
    </FardamentosShell>
  );
}
