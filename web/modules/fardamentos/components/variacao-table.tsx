"use client";

import { Button, Popconfirm, Skeleton, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Variacao } from "../types/fardamentos.types";
import { Genero } from "../types/genero.enums";

type VariacaoTableProps = {
  data: Variacao[];
  loading?: boolean;
  actionsDisabled?: boolean;
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
  actionsDisabled = false,
  pagination,
  onEdit,
  onDelete,
}: VariacaoTableProps) {
  const showSkeleton = Boolean(loading && data.length === 0);
  const getGeneroColor = (genero: Variacao["genero"]) => {
    if (genero === Genero.MASCULINO) return "blue";
    if (genero === Genero.FEMININO) return "magenta";
    return "purple";
  };

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
      render: (value: string) => <Tag>{value}</Tag>,
    },
    {
      title: "Gênero",
      dataIndex: "genero",
      key: "genero",
      render: (value: Variacao["genero"]) => (
        <Tag color={getGeneroColor(value)}>{value}</Tag>
      ),
    },
    {
      title: "Ações",
      key: "acoes",
      render: (_: unknown, record: Variacao) => (
        <Space>
          {onEdit ? (
            <Button
              size="small"
              onClick={() => onEdit(record)}
              disabled={actionsDisabled}
            >
              Editar
            </Button>
          ) : null}
          {onDelete ? (
            <Popconfirm
              title="Remover variação?"
              okText="Sim"
              cancelText="Não"
              onConfirm={() => onDelete(record)}
              disabled={actionsDisabled}
            >
              <Button size="small" danger disabled={actionsDisabled}>
                Remover
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ];

  if (showSkeleton) {
    return (
      <div className="space-y-3 rounded-lg border border-neutral-200/70 p-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton
            key={index}
            active
            title={false}
            paragraph={{ rows: 1, width: ["100%"] }}
          />
        ))}
      </div>
    );
  }

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      scroll={{ x: "max-content" }}
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
