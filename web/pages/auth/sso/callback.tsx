"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { setAccessToken } from "@/context/auth-storage";
import { Button } from "antd";

type ExchangeResponse = {
  token?: string;
  user?: unknown;
  error?: string;
};

export default function SsoCallbackPage() {
  const router = useRouter();
  const ticket = String(router.query.ticket ?? "");
  const [status, setStatus] = useState(
    !router.isReady
      ? "Conectando..."
      : !ticket
        ? "Ticket inválido ou ausente."
        : "Conectando...",
  );

  useEffect(() => {
    if (!router.isReady) return;

    if (!ticket) {
      return;
    }

    const exchange = async () => {
      setStatus("Trocando ticket de SSO...");
      const response = await fetch("/api/sso/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket }),
      });

      const payload = (await response.json()) as ExchangeResponse;

      if (!response.ok || payload.error) {
        setStatus(payload.error ?? "Falha ao autenticar.");
        return;
      }

      if (payload.token) {
        setAccessToken(payload.token);
        setStatus("SSO ok. Token armazenado.");
        void router.replace("/fardamentos");
      } else {
        setStatus("SSO concluiu, mas o Connect não retornou token.");
      }
    };

    void exchange();
  }, [router, ticket]);

  return (
    <div className="page-container flex min-h-[70vh] flex-col items-start justify-center">
      <h1 className="text-2xl font-semibold text-neutral-900">Connect RH</h1>
      <p className="mt-2 text-sm text-neutral-500">{status}</p>
      <Button className="mt-4" onClick={() => void router.replace("/")}>
        Reautenticar
      </Button>
    </div>
  );
}
