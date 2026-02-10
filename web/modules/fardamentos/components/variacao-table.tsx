"use client";

import { Button, Popconfirm, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Variacao } from "../types/fardamentos.types";

type VariacaoTableProps = {
  data: Variacao[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  onEdit?: (variacao: Variacao) => void;
  onDelete?: (variacao: Variacao) => void;
};

export function VariacaoTable({
  data,
  loading,
  pagination,
  onEdit,
  onDelete,
}: VariacaoTableProps) {
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
    {
      title: "Acoes",
      key: "acoes",
      render: (_: unknown, record: Variacao) => (
        <Space>
          {onEdit ? (
            <Button size="small" onClick={() => onEdit(record)}>
              Editar
            </Button>
          ) : null}
          {onDelete ? (
            <Popconfirm
              title="Remover variacao?"
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
