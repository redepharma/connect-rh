"use client";

import { Skeleton, Table, Tag } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { AppTooltip } from "@/components/tooltip";
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
  const showSkeleton = Boolean(loading && data.length === 0);
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
      title: "Variação",
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
      title: (
        <div className="inline-flex items-center gap-1">
          <span>Reservado</span>
          <AppTooltip title="Quantidade de itens que estão em movimentação não concluída. Caso a movimentação seja cancelada, a quantidade retornará ao estoque.">
            <QuestionCircleOutlined className="text-neutral-500!" />
          </AppTooltip>
        </div>
      ),
      dataIndex: "reservado",
      key: "reservado",
    },
    {
      title: (
        <div className="inline-flex items-center gap-1">
          <span>Disponível</span>
          <AppTooltip title="Cálculo: total - reservado = disponível.">
            <QuestionCircleOutlined className="text-neutral-500!" />
          </AppTooltip>
        </div>
      ),
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
