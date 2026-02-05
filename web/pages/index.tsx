import { useEffect, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { clearAccessToken } from "@/context/auth-storage";

const CONNECT_BASE = process.env.NEXT_PUBLIC_CONNECT_BASE_URL ?? "";
const CLIENT_ID = process.env.NEXT_PUBLIC_CONNECT_CLIENT_ID ?? "";

export default function Home() {
  const { isAuthenticated, isLoading, reloadUser } = useAuth();

  const ssoUrl = useMemo(() => {
    if (!CONNECT_BASE || !CLIENT_ID) return null;
    const base = CONNECT_BASE.replace(/\/$/, "");
    return `${base}/apps/open/${CLIENT_ID}`;
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated && ssoUrl) {
      window.location.href = ssoUrl;
      return;
    }
    if (isAuthenticated) {
      void reloadUser();
    }
  }, [isLoading, isAuthenticated, ssoUrl, reloadUser]);

  if (!isLoading && !isAuthenticated && !ssoUrl) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Configuração de SSO ausente</h1>
        <p>
          Defina NEXT_PUBLIC_CONNECT_BASE_URL e NEXT_PUBLIC_CONNECT_CLIENT_ID.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Connect RH</h1>
      {isLoading ? (
        <p>Carregando...</p>
      ) : isAuthenticated ? (
        <p>SSO ok. Sessão ativa.</p>
      ) : (
        <p>Redirecionando para o Connect...</p>
      )}
      <button
        onClick={() => {
          clearAccessToken();
          if (ssoUrl) window.location.href = ssoUrl;
        }}
        style={{ marginTop: 16 }}
      >
        Reautenticar
      </button>
    </div>
  );
}
