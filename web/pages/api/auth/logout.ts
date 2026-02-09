import type { NextApiRequest, NextApiResponse } from "next";

const cookieName = "connect_rh_token";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido" });
  }

  res.setHeader(
    "Set-Cookie",
    `${cookieName}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`,
  );

  return res.status(200).json({ ok: true });
}
