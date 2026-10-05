import { NextResponse, type NextRequest } from "next/server";
export function proxy(request: NextRequest) { const { pathname } = request.nextUrl; if (pathname === "/" || (!pathname.startsWith("/en/") && !pathname.startsWith("/es/") && pathname !== "/en" && pathname !== "/es")) { const url = request.nextUrl.clone(); url.pathname = `/en${pathname === "/" ? "" : pathname}`; return NextResponse.redirect(url); } return NextResponse.next(); }
export const config = { matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"] };
