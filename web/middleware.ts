import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const cookieName = "connect_rh_token";
const publicFile = /\.(.*)$/;

export function middleware(req: NextRequest) {
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

  const token = req.cookies.get(cookieName)?.value;

  if (!token) {
    const base =
      process.env.NEXT_PUBLIC_CONNECT_BASE_URL ??
      process.env.NEXT_PUBLIC_CONNECT_API_BASE ??
      "";
    const clientId = process.env.NEXT_PUBLIC_CONNECT_CLIENT_ID ?? "";

    if (base && clientId) {
      const connectUrl = `${base.replace(/\/$/, "")}/apps/open/${clientId}`;
      return NextResponse.redirect(connectUrl);
    }

    const url = req.nextUrl.clone();
    url.pathname = "/auth/sso/callback";
    url.searchParams.set("error", "missing_sso_config");
    return NextResponse.redirect(url);
  }

  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/fardamentos";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
