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
        <div className="flex min-h-21 flex-1 flex-col justify-between">
          <Typography.Text className="leading-4! text-xs! uppercase tracking-wide text-neutral-500">
            {title}
          </Typography.Text>

          <Statistic
            value={value}
            styles={{ content: { color: "#404040", fontWeight: 600 } }}
          />

          {helper ? (
            <Typography.Text className="text-xs! text-neutral-500 ">
              {helper}
            </Typography.Text>
          ) : (
            <span />
          )}
        </div>

        {tag ? <Tag color={tagColor}>{tag}</Tag> : null}
      </div>
    </Card>
  );
}
