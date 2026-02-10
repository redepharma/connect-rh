import { Button, Input, Select, Space, Switch } from "antd";
import { useEffect, useState } from "react";
import { FardamentosShell } from "@/modules/fardamentos/components/fardamentos-shell";
import { SectionCard } from "@/modules/fardamentos/components/section-card";
import { EstoqueTable } from "@/modules/fardamentos/components/estoque-table";
import type { EstoqueItem } from "@/modules/fardamentos/types/fardamentos.types";
import {
  fetchEstoque,
  fetchTipos,
  fetchUnidades,
  mapEstoqueToUi,
} from "@/modules/fardamentos/services/fardamentos.service";
import type {
  Unidade,
  TipoFardamento,
} from "@/modules/fardamentos/types/fardamentos.types";
import { mapTiposToUi } from "@/modules/fardamentos/services/fardamentos.service";
import { toaster } from "@/components/toaster";

export default function EstoquePage() {
  const [data, setData] = useState<EstoqueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [unidadeId, setUnidadeId] = useState<string | undefined>();
  const [tipoId, setTipoId] = useState<string | undefined>();
  const [baixoEstoque, setBaixoEstoque] = useState(false);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [tipos, setTipos] = useState<TipoFardamento[]>([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const [estoqueResult, unidadesResult, tiposResult] = await Promise.all([
          fetchEstoque({ q: query, unidadeId, tipoId, baixoEstoque }),
          fetchUnidades(),
          fetchTipos(),
        ]);
        if (active) {
          setData(mapEstoqueToUi(estoqueResult));
          setUnidades(unidadesResult);
          setTipos(mapTiposToUi(tiposResult));
        }
      } catch (err) {
        if (active) toaster.erro("Erro ao carregar estoque", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [query, unidadeId, tipoId, baixoEstoque]);

  return (
    <FardamentosShell
      title="Estoque"
      description="Controle disponivel, reservas e alertas de baixo estoque."
      actions={<Button>Atualizar estoque</Button>}
    >
      <SectionCard
        title="Resumo de estoque"
        description="Disponivel = total - reservado. Alerta itens abaixo do minimo."
        actions={
          <Space>
            <Input
              placeholder="Buscar item"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              allowClear
            />
            <Select
              placeholder="Filtrar unidade"
              value={unidadeId}
              allowClear
              onChange={(value) => setUnidadeId(value)}
              options={unidades.map((unit) => ({
                label: unit.nome,
                value: unit.id,
              }))}
              style={{ minWidth: 180 }}
            />
            <Select
              placeholder="Filtrar tipo"
              value={tipoId}
              allowClear
              onChange={(value) => setTipoId(value)}
              options={tipos.map((tipo) => ({
                label: tipo.nome,
                value: tipo.id,
              }))}
              style={{ minWidth: 180 }}
            />
            <Switch
              checked={baixoEstoque}
              onChange={(checked) => setBaixoEstoque(checked)}
              checkedChildren="Baixo estoque"
              unCheckedChildren="Todos"
            />
          </Space>
        }
      >
        <EstoqueTable data={data} loading={loading} />
      </SectionCard>
    </FardamentosShell>
  );
}
