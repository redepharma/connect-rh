"use client";

import { Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { TipoFardamento } from "../types/fardamentos.types";

type TipoTableProps = {
  data: TipoFardamento[];
  loading?: boolean;
};

export function TipoTable({ data, loading }: TipoTableProps) {
  const columns: ColumnsType<TipoFardamento> = [
    {
      title: "Tipo",
      dataIndex: "nome",
      key: "nome",
      render: (value: string) => (
        <div className="font-medium text-neutral-900">{value}</div>
      ),
    },
    {
      title: "Unidades",
      dataIndex: "unidades",
      key: "unidades",
      render: (values: string[]) => (
        <div className="flex flex-wrap gap-1">
          {values.map((unidade) => (
            <Tag key={unidade}>{unidade}</Tag>
          ))}
        </div>
      ),
    },
    {
      title: "Variacoes",
      dataIndex: "variacoesCount",
      key: "variacoesCount",
      render: (value: number) => (
        <span className="font-medium text-neutral-900">{value}</span>
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
