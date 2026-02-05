import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";

type ExchangeResponse = {
  access_token?: string;
  token?: string;
  message?: string;
};

export default function SsoCallbackPage() {
  const router = useRouter();
  const { setSessionFromSso } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    const ticket = router.query.ticket;
    const next = (router.query.next as string | undefined) ?? "/";

    if (!ticket || typeof ticket !== "string") {
      setError("Ticket inválido ou ausente.");
      return;
    }

    const run = async () => {
      try {
        const res = await fetch("/api/sso/exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticket }),
        });

        const data = (await res.json()) as ExchangeResponse;

        if (!res.ok) {
          setError(data?.message ?? "Falha ao trocar ticket.");
          return;
        }

        const token = data.access_token ?? data.token;

        if (!token) {
          setError("SSO concluiu, mas o Connect não retornou token.");
          return;
        }

        setSessionFromSso(token, (data as any).user);
        await router.replace(next);
      } catch (_err) {
        setError("Erro inesperado ao processar o SSO.");
      }
    };

    void run();
  }, [router]);

  return (
    <div style={{ padding: 24 }}>
      <h1>Conectando...</h1>
      {error ? (
        <p style={{ color: "#b91c1c" }}>{error}</p>
      ) : (
        <p>Finalizando autenticação SSO.</p>
      )}
    </div>
  );
}
