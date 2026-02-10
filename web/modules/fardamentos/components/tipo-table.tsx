"use client";

import { Button, Popconfirm, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { TipoFardamento } from "../types/fardamentos.types";

type TipoTableProps = {
  data: TipoFardamento[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  onEdit?: (tipo: TipoFardamento) => void;
  onDelete?: (tipo: TipoFardamento) => void;
};

export function TipoTable({
  data,
  loading,
  pagination,
  onEdit,
  onDelete,
}: TipoTableProps) {
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
    {
      title: "Acoes",
      key: "acoes",
      render: (_: unknown, record: TipoFardamento) => (
        <Space>
          {onEdit ? (
            <Button size="small" onClick={() => onEdit(record)}>
              Editar
            </Button>
          ) : null}
          {onDelete ? (
            <Popconfirm
              title="Remover tipo?"
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
