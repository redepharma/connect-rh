"use client";

import { useCallback, useState } from "react";
import { Button, Popconfirm, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Unidade } from "../types/fardamentos.types";
import type { UnidadeDeleteImpact } from "../services/fardamentos.service";

type UnitTableProps = {
  data: Unidade[];
  loading?: boolean;
  actionsDisabled?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  onEdit?: (unidade: Unidade) => void;
  onDelete?: (unidade: Unidade) => void;
  onFetchDeleteImpact?: (unidadeId: string) => Promise<UnidadeDeleteImpact>;
};

export function UnitTable({
  data,
  loading,
  actionsDisabled = false,
  pagination,
  onEdit,
  onDelete,
  onFetchDeleteImpact,
}: UnitTableProps) {
  const [impactByUnidadeId, setImpactByUnidadeId] = useState<
    Record<string, UnidadeDeleteImpact>
  >({});
  const [impactLoadingId, setImpactLoadingId] = useState<string | null>(null);

  const loadImpactIfNeeded = useCallback(async (unidadeId: string) => {
    if (!onFetchDeleteImpact) return;
    if (impactByUnidadeId[unidadeId]) return;

    try {
      setImpactLoadingId(unidadeId);
      const impact = await onFetchDeleteImpact(unidadeId);
      setImpactByUnidadeId((prev) => ({ ...prev, [unidadeId]: impact }));
    } finally {
      setImpactLoadingId((current) => (current === unidadeId ? null : current));
    }
  }, [impactByUnidadeId, onFetchDeleteImpact]);

  const getDeleteDescription = (record: Unidade) => {
    if (impactLoadingId === record.id) {
      return "Carregando impacto da exclusao...";
    }

    const impact = impactByUnidadeId[record.id];
    if (!impact) {
      return "Esta acao remove a unidade. Verificando vinculos...";
    }

    const message = `Vínculos: ${impact.tiposVinculados} tipos, ${impact.estoquesVinculados} estoques e ${impact.movimentacoesVinculadas} movimentações.`;
    if (impact.bloqueiaExclusao) {
      return `${message} A exclusão sera bloqueada porque existem movimentações vinculadas.`;
    }

    return `${message} A exclusão é permitida.`;
  };

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
      title: "Descrição",
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
      title: "Ações",
      key: "acoes",
      render: (_: unknown, record: Unidade) => (
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
              title="Remover unidade?"
              description={getDeleteDescription(record)}
              okText="Sim"
              cancelText="Não"
              onConfirm={() => onDelete(record)}
              onOpenChange={(open) => {
                if (open) {
                  void loadImpactIfNeeded(record.id);
                }
              }}
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

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      scroll={{ x: 720 }}
      size="middle"
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
