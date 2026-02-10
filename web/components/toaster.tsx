"use client";

import { Button, notification } from "antd";
import type { NotificationInstance } from "antd/es/notification/interface";
import { parseApiError } from "@/shared/error-handlers/api-errors";
import type { ReactNode } from "react";
import { useEffect } from "react";

type ToastType = "success" | "error" | "warning" | "info";
type ToastAction = { label: string; onClick: () => void };
type ToastOptions = { action?: ToastAction; duration?: number };

let notificationApi: NotificationInstance | null = null;

export function ToasterProvider({ children }: { children: ReactNode }) {
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    notificationApi = api;
  }, [api]);

  return (
    <>
      {contextHolder}
      {children}
    </>
  );
}

function showToast(
  type: ToastType,
  title: string,
  description?: string,
  options?: ToastOptions,
) {
  if (!notificationApi) return;

  notificationApi.open({
    title,
    description,
    type,
    placement: "topRight",
    duration: options?.duration ?? 3,
    actions: options?.action
      ? [
          <Button
            key="action"
            type="link"
            size="small"
            onClick={options.action.onClick}
          >
            {options.action.label}
          </Button>,
        ]
      : undefined,
  });
}

export const toaster = {
  sucesso: (title: string, description?: string, options?: ToastOptions) =>
    showToast("success", title, description, options),

  erro: (title: string, error?: unknown, options?: ToastOptions) => {
    const e = parseApiError(error);

    showToast("error", title || e.title, e.message, options);
  },

  alerta: (title: string, description?: string, options?: ToastOptions) =>
    showToast("warning", title, description, options),

  info: (title: string, description?: string, options?: ToastOptions) =>
    showToast("info", title, description, options),
};
