"use client";

import { Tooltip } from "antd";
import type { TooltipProps } from "antd";
import type { ReactNode } from "react";

type AppTooltipProps = Omit<TooltipProps, "title" | "children"> & {
  title?: ReactNode;
  children: ReactNode;
  disabled?: boolean;
};

export function AppTooltip({
  title,
  children,
  disabled = false,
  placement = "top",
  mouseEnterDelay = 0.2,
  ...props
}: AppTooltipProps) {
  if (disabled || !title) {
    return <>{children}</>;
  }

  return (
    <Tooltip
      title={title}
      placement={placement}
      mouseEnterDelay={mouseEnterDelay}
      {...props}
    >
      {children}
    </Tooltip>
  );
}
