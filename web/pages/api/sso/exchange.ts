import type { NextApiRequest, NextApiResponse } from "next";

type ExchangeBody = { ticket?: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { ticket } = (req.body ?? {}) as ExchangeBody;

  if (!ticket) {
    return res.status(400).json({ message: "ticket é obrigatório" });
  }

  const connectApiBase = process.env.NEXT_PUBLIC_CONNECT_API_BASE;
  const clientId = process.env.NEXT_PUBLIC_CONNECT_CLIENT_ID;
  const clientSecret = process.env.CONNECT_SSO_CLIENT_SECRET;

  if (!connectApiBase || !clientId || !clientSecret) {
    return res.status(500).json({
      message: "Configuração de SSO incompleta no servidor.",
    });
  }

  const url = `${connectApiBase.replace(/\/$/, "")}/auth/sso/exchange`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticket,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({
      message: "Falha ao trocar ticket no Connect.",
    });
  }
}
