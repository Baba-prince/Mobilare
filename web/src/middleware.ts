import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "mobilare_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/auth/sign-in";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/admin-crm",
    "/admin-crm/:path*",
    "/account",
    "/account/:path*",
    "/driver",
    "/driver/:path*",
  ],
};
