import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE = "connect_rh_auth";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/auth/sso/callback")) {
    return NextResponse.next();
  }

  const hasAuth = req.cookies.get(AUTH_COOKIE)?.value === "1";

  if (hasAuth) {
    return NextResponse.next();
  }

  const base = process.env.NEXT_PUBLIC_CONNECT_BASE_URL ?? "";
  const clientId = process.env.NEXT_PUBLIC_CONNECT_CLIENT_ID ?? "";

  if (base && clientId) {
    const url = `${base.replace(/$/, "")}/apps/open/${clientId}`;
    return NextResponse.redirect(url);
  }

  const fallback = req.nextUrl.clone();
  fallback.pathname = "/";
  return NextResponse.redirect(fallback);
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico).*)"],
};
