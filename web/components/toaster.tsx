"use client";

import { Button, notification } from "antd";
import { parseApiError } from "@/shared/error-handlers/api-errors";

type ToastType = "success" | "error" | "warning" | "info";
type ToastAction = { label: string; onClick: () => void };
type ToastOptions = { action?: ToastAction; duration?: number };

function showToast(
  type: ToastType,
  title: string,
  description?: string,
  options?: ToastOptions,
) {
  notification.open({
    message: title,
    description,
    type,
    placement: "topRight",
    duration: options?.duration ?? 3,
    btn: options?.action ? (
      <Button type="link" size="small" onClick={options.action.onClick}>
        {options.action.label}
      </Button>
    ) : undefined,
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
