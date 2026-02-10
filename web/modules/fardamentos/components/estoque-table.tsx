"use client";

import { Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { LOW_STOCK_THRESHOLD } from "../types/fardamentos.constants";
import type { EstoqueItem } from "../types/fardamentos.types";

type EstoqueTableProps = {
  data: EstoqueItem[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
};

export function EstoqueTable({ data, loading, pagination }: EstoqueTableProps) {
  const columns: ColumnsType<EstoqueItem> = [
    {
      title: "Tipo",
      dataIndex: "tipoNome",
      key: "tipoNome",
      render: (value: string) => (
        <div className="font-medium text-neutral-900">{value}</div>
      ),
    },
    {
      title: "Variacao",
      dataIndex: "variacaoLabel",
      key: "variacaoLabel",
    },
    {
      title: "Unidade",
      dataIndex: "unidade",
      key: "unidade",
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
    },
    {
      title: "Reservado",
      dataIndex: "reservado",
      key: "reservado",
    },
    {
      title: "Disponivel",
      key: "disponivel",
      render: (_, record) => {
        const disponivel = record.total - record.reservado;
        const lowStock = disponivel < LOW_STOCK_THRESHOLD;
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium text-neutral-900">{disponivel}</span>
            {lowStock ? <Tag color="red">Baixo estoque</Tag> : null}
          </div>
        );
      },
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={
        pagination
          ? {
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              onChange: pagination.onChange,
              showSizeChanger: false,
              showTotal: (value) => `Total: ${value}`,
            }
          : false
      }
      className="border border-neutral-200/70"
    />
  );
}
