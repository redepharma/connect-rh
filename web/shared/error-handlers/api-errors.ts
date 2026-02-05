/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ApiClientErrorShape } from "@/shared/api-client.service";

import { AxiosError } from "axios";

export type ApiFieldErrors = Record<string, string[]>;

export type ApiErrorNormalized = {
  status: number | null;
  code:
    | "NETWORK"
    | "TIMEOUT"
    | "UNAUTHORIZED"
    | "FORBIDDEN"
    | "NOT_FOUND"
    | "CONFLICT"
    | "VALIDATION"
    | "SERVER"
    | "UNKNOWN";
  title: string;
  message: string;
  messages?: string[];
  fieldErrors?: ApiFieldErrors;
  raw?: unknown;
};

type NestErrorShape = {
  statusCode?: number;
  message?: string | string[];
  error?: string;
  errors?: ApiFieldErrors;
  details?: unknown;
};

function toMessages(msg: unknown): string[] {
  if (!msg) return [];
  if (Array.isArray(msg))
    return msg.filter((x) => typeof x === "string") as string[];
  if (typeof msg === "string") return [msg];

  return [];
}

function joinMessages(list: string[]): string {
  if (!list.length) return "";

  return list[0];
}

function isApiClientError(x: unknown): x is ApiClientErrorShape {
  return (
    typeof x === "object" &&
    x !== null &&
    (x as any).isApiClientError === true &&
    typeof (x as any).status === "number"
  );
}

function codeFromStatus(status: number): ApiErrorNormalized["code"] {
  return status === 401
    ? "UNAUTHORIZED"
    : status === 403
      ? "FORBIDDEN"
      : status === 404
        ? "NOT_FOUND"
        : status === 409
          ? "CONFLICT"
          : status === 400
            ? "VALIDATION"
            : status >= 500
              ? "SERVER"
              : "UNKNOWN";
}

function titleFromCode(code: ApiErrorNormalized["code"]): string {
  return code === "UNAUTHORIZED"
    ? "Credenciais inválidas"
    : code === "FORBIDDEN"
      ? "Acesso negado"
      : code === "NOT_FOUND"
        ? "Não encontrado"
        : code === "CONFLICT"
          ? "Conflito"
          : code === "VALIDATION"
            ? "Verifique os dados"
            : code === "SERVER"
              ? "Erro no servidor"
              : "Erro";
}

export function parseApiError(error: unknown): ApiErrorNormalized {
  if (isApiClientError(error)) {
    const status = error.status;
    const data = error.data as any;

    if (status === 0) {
      return {
        status: null,
        code: "NETWORK",
        title: "Falha de conexão",
        message: "Não foi possível conectar ao servidor. Verifique sua rede.",
        raw: error,
      };
    }

    const messages = toMessages(data?.message);
    const msg =
      joinMessages(messages) ||
      (typeof data === "string" ? data : "") ||
      "Erro na requisição";

    const code = codeFromStatus(status);

    return {
      status,
      code,
      title: titleFromCode(code),
      message: msg || "Erro inesperado",
      messages: messages.length ? messages : undefined,
      fieldErrors: data?.errors,
      raw: error,
    };
  }

  if (typeof error === "object" && error !== null && "isAxiosError" in error) {
    const axiosErr = error as AxiosError<NestErrorShape>;

    if (!axiosErr.response) {
      const msg = axiosErr.message?.toLowerCase() ?? "";
      const isTimeout = msg.includes("timeout");

      return {
        status: null,
        code: isTimeout ? "TIMEOUT" : "NETWORK",
        title: "Falha de conexão",
        message: isTimeout
          ? "A requisição demorou demais. Tente novamente."
          : "Não foi possível conectar ao servidor. Verifique sua rede.",
        raw: error,
      };
    }

    const status = axiosErr.response.status;
    const data = axiosErr.response.data;

    const messages = toMessages((data as any)?.message);
    const msg =
      joinMessages(messages) || axiosErr.message || "Erro na requisição";

    const code = codeFromStatus(status);

    return {
      status,
      code,
      title: titleFromCode(code),
      message: msg || "Erro inesperado",
      messages: messages.length ? messages : undefined,
      fieldErrors: (data as any)?.errors,
      raw: error,
    };
  }

  if (error instanceof TypeError) {
    const msg = (error.message ?? "").toLowerCase();

    if (msg.includes("failed to fetch") || msg.includes("network")) {
      return {
        status: null,
        code: "NETWORK",
        title: "Falha de conexão",
        message: "Não foi possível conectar ao servidor. Verifique sua rede.",
        raw: error,
      };
    }
  }

  if (typeof error === "string") {
    return {
      status: null,
      code: "UNKNOWN",
      title: "Erro",
      message: error,
      raw: error,
    };
  }

  if (error instanceof Error) {
    return {
      status: null,
      code: "UNKNOWN",
      title: "Erro",
      message: error.message,
      raw: error,
    };
  }

  return {
    status: null,
    code: "UNKNOWN",
    title: "Erro",
    message: "Erro inesperado",
    raw: error,
  };
}

export function extrairMensagemDeErro(error: unknown): string {
  return parseApiError(error).message;
}
