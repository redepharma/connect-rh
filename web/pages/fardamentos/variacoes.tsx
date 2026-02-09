import { Alert, Button, Input } from "antd";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FardamentosShell } from "@/modules/fardamentos/components/fardamentos-shell";
import { SectionCard } from "@/modules/fardamentos/components/section-card";
import { VariacaoTable } from "@/modules/fardamentos/components/variacao-table";
import type { Variacao } from "@/modules/fardamentos/fardamentos.types";
import { apiFetch } from "@/lib/api-client";

export default function VariacoesPage() {
  const [data, setData] = useState<Variacao[]>([]);
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
            tamanho: string;
            genero: string;
            tipo: { id: string; nome: string };
          }[]
        >("/fardamentos/variacoes");
        const mapped = result.map((item) => ({
          id: item.id,
          tipoId: item.tipo?.id ?? "",
          tipoNome: item.tipo?.nome ?? "-",
          tamanho: item.tamanho,
          genero: item.genero,
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
      title="Variacoes"
      description="Configure tamanhos e generos para cada tipo de fardamento."
      actions={
        <Link href="#" className="inline-flex">
          <Button type="primary">Nova variacao</Button>
        </Link>
      }
    >
      <SectionCard
        title="Variacoes cadastradas"
        description="As variacoes definem o estoque controlado e disponibilidade."
        actions={<Input placeholder="Buscar variacao" />}
      >
        {error ? (
          <Alert
            type="error"
            message="Falha ao carregar variacoes"
            description={error}
            showIcon
          />
        ) : (
          <VariacaoTable data={data} loading={loading} />
        )}
      </SectionCard>
    </FardamentosShell>
  );
}
