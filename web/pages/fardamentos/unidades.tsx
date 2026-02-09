import { Alert, Button, Input } from "antd";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FardamentosShell } from "@/modules/fardamentos/components/fardamentos-shell";
import { SectionCard } from "@/modules/fardamentos/components/section-card";
import { UnitTable } from "@/modules/fardamentos/components/unit-table";
import type { Unidade } from "@/modules/fardamentos/fardamentos.types";
import { apiFetch } from "@/lib/api-client";

export default function UnidadesPage() {
  const [data, setData] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFetch<Unidade[]>("/fardamentos/unidades");
        if (active) setData(result);
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
      title="Unidades"
      description="Cadastre e gerencie as unidades responsaveis pelos fardamentos."
      actions={
        <Link href="#" className="inline-flex">
          <Button type="primary">Nova unidade</Button>
        </Link>
      }
    >
      <SectionCard
        title="Lista de unidades"
        description="As unidades definem quais setores podem receber cada tipo de fardamento."
        actions={<Input placeholder="Buscar unidade" />}
      >
        {error ? (
          <Alert type="error" message="Falha ao carregar unidades" description={error} showIcon />
        ) : (
          <UnitTable data={data} loading={loading} />
        )}
      </SectionCard>
    </FardamentosShell>
  );
}
