import type { NextApiRequest, NextApiResponse } from "next";

const cookieName = "connect_rh_token";

const getEnv = (name: string, fallback?: string) =>
  process.env[name] ?? fallback ?? "";

const CONNECT_RH_API_BASE = getEnv(
  "CONNECT_RH_API_BASE",
  process.env.NEXT_PUBLIC_CONNECT_RH_API_BASE,
);

const extractToken = (cookieHeader: string | undefined) => {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(`${cookieName}=`));
  return match ? match.split("=")[1] : null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido" });
  }

  if (!CONNECT_RH_API_BASE) {
    return res.status(500).json({ error: "Configuração da API ausente" });
  }

  const token = extractToken(req.headers.cookie);

  if (!token) {
    return res.status(401).json({ error: "Token ausente" });
  }

  try {
    const response = await fetch(`${CONNECT_RH_API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const payload = await response.json();
    return res.status(200).json(payload);
  } catch (error) {
    return res.status(500).json({ error: "Falha ao consultar usuário" });
  }
}
