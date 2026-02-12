"use client";

import type { ReactNode } from "react";
import { Card, Space, Typography } from "antd";

type SectionCardProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function SectionCard({
  title,
  description,
  actions,
  children,
}: SectionCardProps) {
  return (
    <Card className="border border-neutral-200/70 shadow-sm">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <Typography.Title level={4} className="mb-1! mt-0! text-neutral-700!">
            {title}
          </Typography.Title>
          {description ? (
            <Typography.Text className="block max-w-md text-sm text-neutral-500!">
              {description}
            </Typography.Text>
          ) : null}
        </div>
        {actions ? <Space wrap>{actions}</Space> : null}
      </div>
      {children}
    </Card>
  );
}
