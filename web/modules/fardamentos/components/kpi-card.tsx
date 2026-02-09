"use client";

import { Card, Statistic, Tag, Typography } from "antd";

type KpiCardProps = {
  title: string;
  value: string | number;
  helper?: string;
  tag?: string;
  tagColor?: string;
};

export function KpiCard({ title, value, helper, tag, tagColor }: KpiCardProps) {
  return (
    <Card className="border border-neutral-200/70 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Typography.Text className="text-xs uppercase tracking-wide text-neutral-500">
            {title}
          </Typography.Text>
          <Statistic value={value} valueStyle={{ color: "#111827" }} />
          {helper ? (
            <Typography.Text className="text-sm text-neutral-500">
              {helper}
            </Typography.Text>
          ) : null}
        </div>
        {tag ? <Tag color={tagColor}>{tag}</Tag> : null}
      </div>
    </Card>
  );
}
