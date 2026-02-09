"use client";

import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Variacao } from "../fardamentos.types";

type VariacaoTableProps = {
  data: Variacao[];
  loading?: boolean;
};

export function VariacaoTable({ data, loading }: VariacaoTableProps) {
  const columns: ColumnsType<Variacao> = [
    {
      title: "Tipo",
      dataIndex: "tipoNome",
      key: "tipoNome",
      render: (value: string) => (
        <div className="font-medium text-neutral-900">{value}</div>
      ),
    },
    {
      title: "Tamanho",
      dataIndex: "tamanho",
      key: "tamanho",
    },
    {
      title: "Genero",
      dataIndex: "genero",
      key: "genero",
    },
    {
      title: "Identificador",
      dataIndex: "id",
      key: "id",
      render: (value: string) => (
        <span className="text-xs text-neutral-500">{value}</span>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={false}
      className="border border-neutral-200/70"
    />
  );
}
