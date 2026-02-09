import { Alert, Button, Input } from "antd";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FardamentosShell } from "@/modules/fardamentos/components/fardamentos-shell";
import { SectionCard } from "@/modules/fardamentos/components/section-card";
import { TipoTable } from "@/modules/fardamentos/components/tipo-table";
import type { TipoFardamento } from "@/modules/fardamentos/fardamentos.types";
import { apiFetch } from "@/lib/api-client";

export default function TiposPage() {
  const [data, setData] = useState<TipoFardamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFetch<
          { id: string; nome: string; unidades: { id: string; nome: string }[] }[]
        >("/fardamentos/tipos");
        const mapped = result.map((tipo) => ({
          id: tipo.id,
          nome: tipo.nome,
          unidades: (tipo.unidades ?? []).map((u) => u.nome),
          variacoesCount: 0,
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
      title="Tipos de fardamentos"
      description="Gerencie os tipos e associacoes com unidades."
      actions={
        <Link href="#" className="inline-flex">
          <Button type="primary">Novo tipo</Button>
        </Link>
      }
    >
      <SectionCard
        title="Catalogo de tipos"
        description="Cada tipo pode ser vinculado a uma ou mais unidades."
        actions={<Input placeholder="Buscar tipo" />}
      >
        {error ? (
          <Alert type="error" message="Falha ao carregar tipos" description={error} showIcon />
        ) : (
          <TipoTable data={data} loading={loading} />
        )}
      </SectionCard>
    </FardamentosShell>
  );
}
