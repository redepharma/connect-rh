import { Alert, Button, Input } from "antd";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FardamentosShell } from "@/modules/fardamentos/components/fardamentos-shell";
import { SectionCard } from "@/modules/fardamentos/components/section-card";
import { EstoqueTable } from "@/modules/fardamentos/components/estoque-table";
import type { EstoqueItem } from "@/modules/fardamentos/fardamentos.types";
import { apiFetch } from "@/lib/api-client";

export default function EstoquePage() {
  const [data, setData] = useState<EstoqueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFetch<
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
        >("/fardamentos/estoque");
        const mapped = result.map((item) => ({
          id: item.id,
          variacaoId: item.variacao?.id ?? "",
          tipoNome: item.variacao?.tipo?.nome ?? "-",
          variacaoLabel: `${item.variacao?.tamanho ?? "-"} - ${
            item.variacao?.genero ?? "-"
          }`,
          unidade: item.unidade?.nome ?? "-",
          total: item.total ?? 0,
          reservado: item.reservado ?? 0,
        }));
        if (active) setData(mapped);
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

  return (
    <FardamentosShell
      title="Estoque"
      description="Controle disponivel, reservas e alertas de baixo estoque."
      actions={
        <Link href="#" className="inline-flex">
          <Button>Atualizar estoque</Button>
        </Link>
      }
    >
      <SectionCard
        title="Resumo de estoque"
        description="Disponivel = total - reservado. Alerta itens abaixo do minimo."
        actions={<Input placeholder="Buscar item" />}
      >
        {error ? (
          <Alert type="error" message="Falha ao carregar estoque" description={error} showIcon />
        ) : (
          <EstoqueTable data={data} loading={loading} />
        )}
      </SectionCard>
    </FardamentosShell>
  );
}
