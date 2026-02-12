"use client";

import { Button, Popconfirm, Skeleton, Space, Table, Tag } from "antd";
import { AppTooltip } from "@/components/tooltip";
import type { ColumnsType } from "antd/es/table";
import type { TipoFardamento } from "../types/fardamentos.types";

type TipoTableProps = {
  data: TipoFardamento[];
  loading?: boolean;
  actionsDisabled?: boolean;
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
  actionsDisabled = false,
  pagination,
  onEdit,
  onDelete,
}: TipoTableProps) {
  const MAX_VISIBLE_UNIDADES = 3;
  const showSkeleton = Boolean(loading && data.length === 0);
  const disableActions = actionsDisabled || Boolean(loading);

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
      render: (values: string[]) => {
        if (!values?.length) {
          return <span className="text-neutral-500">-</span>;
        }

        const visible = values.slice(0, MAX_VISIBLE_UNIDADES);
        const hidden = values.slice(MAX_VISIBLE_UNIDADES);

        return (
          <div className="flex flex-wrap items-center gap-1">
            {visible.map((unidade) => (
              <Tag key={unidade}>{unidade}</Tag>
            ))}
            {hidden.length > 0 ? (
              <AppTooltip title={hidden.join(", ")}>
                <Tag className="cursor-help">+{hidden.length}</Tag>
              </AppTooltip>
            ) : null}
          </div>
        );
      },
    },
    {
      title: "Variações",
      dataIndex: "variacoesCount",
      key: "variacoesCount",
      render: (value: number) => (
        <span className="font-medium text-neutral-900">{value}</span>
      ),
    },
    {
      title: "Ações",
      key: "acoes",
      render: (_: unknown, record: TipoFardamento) => (
        <Space>
          {onEdit ? (
            <Button
              size="small"
              onClick={() => onEdit(record)}
              disabled={disableActions}
            >
              Editar
            </Button>
          ) : null}
          {onDelete ? (
            <Popconfirm
              title="Remover tipo?"
              okText="Sim"
              cancelText="Nao"
              onConfirm={() => onDelete(record)}
              disabled={disableActions}
            >
              <Button size="small" danger disabled={disableActions}>
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
      scroll={{ x: 760 }}
      size="middle"
      pagination={
        pagination
          ? {
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              onChange: pagination.onChange,
              showSizeChanger: false,
              disabled: Boolean(loading),
              showTotal: (value) => `Total: ${value}`,
            }
          : false
      }
      className="border border-neutral-200/70"
    />
  );
}
