"use client";

import { Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Unidade } from "../types/fardamentos.types";

type UnitTableProps = {
  data: Unidade[];
  loading?: boolean;
};

export function UnitTable({ data, loading }: UnitTableProps) {
  const columns: ColumnsType<Unidade> = [
    {
      title: "Unidade",
      dataIndex: "nome",
      key: "nome",
      render: (value: string) => (
        <div className="font-medium text-neutral-900">{value}</div>
      ),
    },
    {
      title: "Descricao",
      dataIndex: "descricao",
      key: "descricao",
      render: (value?: string | null) => (
        <span className="text-neutral-500">{value || "-"}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "ativo",
      key: "ativo",
      render: (value: boolean) => (
        <Tag color={value ? "green" : "red"}>{value ? "Ativa" : "Inativa"}</Tag>
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
