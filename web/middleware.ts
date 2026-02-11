import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const cookieName = "connect_rh_token";
const publicFile = /\.(.*)$/;
const allowedRoles = new Set(["ADMIN", "TI", "PADRAO"]);

const getApiBase = () =>
  process.env.CONNECT_RH_API_BASE ??
  process.env.NEXT_PUBLIC_CONNECT_RH_API_BASE ??
  "";

async function validateSession(token: string) {
  const apiBase = getApiBase();
  if (!apiBase) {
    return { ok: false as const, reason: "missing_api_config" };
  }

  try {
    const response = await fetch(`${apiBase.replace(/\/$/, "")}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      return { ok: false as const, reason: "invalid_session" };
    }

    const payload = (await response.json()) as {
      papelConnectRh?: string | null;
    };
    const role = String(payload?.papelConnectRh ?? "").toUpperCase();

    if (!allowedRoles.has(role)) {
      return { ok: false as const, reason: "invalid_role" };
    }

    return { ok: true as const };
  } catch {
    return { ok: false as const, reason: "session_check_failed" };
  }
}

function redirectToHome(req: NextRequest, reason: string) {
  const url = req.nextUrl.clone();
  url.pathname = "/";
  url.searchParams.set("auth_error", reason);
  return NextResponse.redirect(url);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/auth/sso/callback") ||
    pathname.startsWith("/favicon.ico") ||
    publicFile.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.next();
  }

  const isProtectedRoute = pathname.startsWith("/fardamentos");
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const token = req.cookies.get(cookieName)?.value;

  if (!token) {
    return redirectToHome(req, "missing_token");
  }

  const validation = await validateSession(token);
  if (!validation.ok) {
    return redirectToHome(req, validation.reason);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
