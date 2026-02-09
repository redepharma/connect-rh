"use client";

import { Button, Popconfirm, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Unidade } from "../types/fardamentos.types";

type UnitTableProps = {
  data: Unidade[];
  loading?: boolean;
  onEdit?: (unidade: Unidade) => void;
  onDelete?: (unidade: Unidade) => void;
};

export function UnitTable({
  data,
  loading,
  onEdit,
  onDelete,
}: UnitTableProps) {
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
    {
      title: "Acoes",
      key: "acoes",
      render: (_: unknown, record: Unidade) => (
        <Space>
          {onEdit ? (
            <Button size="small" onClick={() => onEdit(record)}>
              Editar
            </Button>
          ) : null}
          {onDelete ? (
            <Popconfirm
              title="Remover unidade?"
              okText="Sim"
              cancelText="Nao"
              onConfirm={() => onDelete(record)}
            >
              <Button size="small" danger>
                Remover
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
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
