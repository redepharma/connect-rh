import { useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/auth-context";
import { clearAccessToken } from "@/context/auth-storage";

export default function Home() {
  const { isAuthenticated, isLoading, reloadUser } = useAuth();
  const router = useRouter();

  const ssoUrl = useMemo(() => {
    const base =
      process.env.NEXT_PUBLIC_CONNECT_BASE_URL ??
      process.env.NEXT_PUBLIC_CONNECT_API_BASE ??
      "";
    const clientId = process.env.NEXT_PUBLIC_CONNECT_CLIENT_ID ?? "";
    if (!base || !clientId) return null;
    return `${base.replace(/\/$/, "")}/apps/open/${clientId}`;
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && ssoUrl) {
      window.location.href = ssoUrl;
      return;
    }

    if (isAuthenticated) {
      void reloadUser().finally(() => {
        void router.replace("/fardamentos");
      });
    }
  }, [isLoading, isAuthenticated, ssoUrl, reloadUser, router]);

  if (!isLoading && !isAuthenticated && !ssoUrl) {
    return (
      <div className="page-container">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Configuração de SSO ausente
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Defina NEXT_PUBLIC_CONNECT_BASE_URL e NEXT_PUBLIC_CONNECT_CLIENT_ID.
        </p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="text-2xl font-semibold text-neutral-900">Connect RH</h1>
      {isLoading ? (
        <p className="mt-2 text-sm text-neutral-500">Carregando...</p>
      ) : isAuthenticated ? (
        <p className="mt-2 text-sm text-neutral-500">SSO ok. Sessão ativa.</p>
      ) : (
        <p className="mt-2 text-sm text-neutral-500">
          Redirecionando para o Connect...
        </p>
      )}
      <button
        onClick={() => {
          clearAccessToken();
          if (ssoUrl) window.location.href = ssoUrl;
        }}
        className="mt-4 inline-flex items-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
      >
        Reautenticar
      </button>
    </div>
  );
}
