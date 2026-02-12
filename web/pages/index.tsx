import { Button, Result, Spin, Typography } from "antd";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/auth-context";
import { clearAccessToken } from "@/context/auth-storage";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
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
  const connectBaseUrl = useMemo(() => {
    const base =
      process.env.NEXT_PUBLIC_CONNECT_BASE_URL ??
      process.env.NEXT_PUBLIC_CONNECT_API_BASE ??
      "";
    return base ? base.replace(/\/$/, "") : null;
  }, []);

  const role = (user?.papelConnectRh ?? "").toUpperCase();
  const hasValidRole = useMemo(() => {
    if (!role) return false;
    return ["ADMIN", "TI", "PADRAO"].includes(role);
  }, [role]);
  const authError =
    typeof router.query.auth_error === "string"
      ? router.query.auth_error
      : null;

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && hasValidRole) {
      void router.replace("/fardamentos");
    }
  }, [isLoading, isAuthenticated, hasValidRole, ssoUrl, router]);

  const handleReturnToConnect = () => {
    clearAccessToken();
    if (connectBaseUrl) {
      window.location.href = connectBaseUrl;
    }
  };

  if (!isLoading && !isAuthenticated && !ssoUrl) {
    return (
      <div className="page-container">
        <Result
          status="warning"
          title="Configuração de SSO ausente"
          subTitle="Defina NEXT_PUBLIC_CONNECT_BASE_URL e NEXT_PUBLIC_CONNECT_CLIENT_ID."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page-container">
        <Result
          icon={<Spin size="large" />}
          title="Validando sessão"
          subTitle="Aguarde enquanto verificamos sua autenticação."
        />
      </div>
    );
  }

  if (!isAuthenticated && authError) {
    const errorConfig: Record<
      string,
      { status: "warning" | "error" | "403"; title: string; subTitle: string }
    > = {
      missing_token: {
        status: "warning",
        title: "Sessão não encontrada",
        subTitle: "Faça login novamente para acessar o Connect RH.",
      },
      invalid_session: {
        status: "error",
        title: "Sessão inválida",
        subTitle: "Seu token expirou ou é inválido. Faça login novamente.",
      },
      invalid_role: {
        status: "403",
        title: "Sem permissão para acessar o Connect RH",
        subTitle:
          "Seu usuário está autenticado, mas sem papel válido para este sistema.",
      },
      session_check_failed: {
        status: "error",
        title: "Falha ao validar sessão",
        subTitle: "Não foi possível validar sua sessão agora. Tente novamente.",
      },
      missing_api_config: {
        status: "error",
        title: "Configuração da API ausente",
        subTitle: "Defina CONNECT_RH_API_BASE para validar a sessão no proxy.",
      },
    };
    const current = errorConfig[authError] ?? {
      status: "warning" as const,
      title: "Autenticação necessária",
      subTitle: "Faça login para continuar.",
    };

    return (
      <div className="page-container">
        <Result
          status={current.status}
          title={current.title}
          subTitle={current.subTitle}
          extra={[
            <Button
              key="connect"
              type="primary"
              onClick={handleReturnToConnect}
              disabled={!connectBaseUrl}
            >
              Retornar ao Connect
            </Button>,
          ]}
        />
      </div>
    );
  }

  if (isAuthenticated && !hasValidRole) {
    return (
      <div className="page-container">
        <Result
          status="403"
          title="Sem permissão para acessar o Connect RH"
          subTitle="Seu usuário está autenticado, mas sem papel válido para este sistema."
          extra={[
            <Button
              key="connect"
              type="primary"
              onClick={handleReturnToConnect}
              disabled={!connectBaseUrl}
            >
              Retornar ao Connect
            </Button>,
          ]}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      {isAuthenticated ? (
        <Result
          status="success"
          title="Sessão validada"
          subTitle="Redirecionando para o módulo de fardamentos."
        />
      ) : (
        <Result
          status="info"
          title="Autenticação necessária"
          subTitle="Faça login pelo Connect para concluir o SSO."
          extra={[
            <Button key="login" type="primary" onClick={handleReturnToConnect}>
              Retornar ao Connect
            </Button>,
          ]}
        />
      )}
    </div>
  );
}
