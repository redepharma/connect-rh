"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Space, Typography } from "antd";

const navItems = [
  { href: "/fardamentos", label: "Visao geral" },
  { href: "/fardamentos/unidades", label: "Unidades" },
  { href: "/fardamentos/tipos", label: "Tipos" },
  { href: "/fardamentos/variacoes", label: "Variacoes" },
  { href: "/fardamentos/estoque", label: "Estoque" },
  { href: "/fardamentos/movimentacoes", label: "Movimentacoes" },
  { href: "/fardamentos/historico", label: "Historico" },
];

type Props = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function FardamentosShell({
  title,
  description,
  actions,
  children,
}: Props) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <header className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <Typography.Text className="text-[11px] uppercase tracking-wide text-neutral-500">
                Connect RH - Fardamentos & EPIs
              </Typography.Text>
              <Typography.Title
                level={2}
                className="!mb-1 !mt-0 text-neutral-900"
              >
                {title}
              </Typography.Title>
              {description ? (
                <Typography.Text className="text-sm text-neutral-500">
                  {description}
                </Typography.Text>
              ) : null}
            </div>
            <Space wrap>{actions}</Space>
          </div>

          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const active = router.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    active
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="mt-6 space-y-6">{children}</main>
      </div>
    </div>
  );
}
