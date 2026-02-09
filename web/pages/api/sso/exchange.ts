import type { NextApiRequest, NextApiResponse } from "next";

const cookieName = "connect_rh_token";

const getEnv = (name: string, fallback?: string) =>
  process.env[name] ?? fallback ?? "";

const CONNECT_API_BASE = getEnv(
  "CONNECT_API_BASE",
  process.env.NEXT_PUBLIC_CONNECT_API_BASE,
);
const CONNECT_CLIENT_ID = getEnv(
  "CONNECT_CLIENT_ID",
  process.env.NEXT_PUBLIC_CONNECT_CLIENT_ID,
);
const CONNECT_CLIENT_SECRET = getEnv("CONNECT_SSO_CLIENT_SECRET");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido" });
  }

  if (!CONNECT_API_BASE || !CONNECT_CLIENT_ID || !CONNECT_CLIENT_SECRET) {
    return res.status(500).json({ error: "Configuração de SSO ausente" });
  }

  const { ticket } = req.body as { ticket?: string };

  if (!ticket) {
    return res.status(400).json({ error: "Ticket ausente" });
  }

  try {
    const response = await fetch(`${CONNECT_API_BASE}/auth/sso/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticket,
        client_id: CONNECT_CLIENT_ID,
        client_secret: CONNECT_CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const payload = (await response.json()) as Record<string, unknown>;
    const token =
      (payload.token as string | undefined) ||
      (payload.access_token as string | undefined) ||
      (payload.accessToken as string | undefined) ||
      (payload.jwt as string | undefined);

    if (!token) {
      return res.status(502).json({
        error: "SSO concluiu, mas o Connect não retornou token.",
        payload,
      });
    }

    const secure = process.env.NODE_ENV === "production";
    res.setHeader(
      "Set-Cookie",
      `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600${
        secure ? "; Secure" : ""
      }`,
    );

    return res.status(200).json({
      token,
      user: payload.user ?? null,
    });
  } catch (error) {
    return res.status(500).json({ error: "Falha ao trocar ticket SSO" });
  }
}
