import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// The desktop stage is a fixed cinematic canvas (min-width 1280px) and doesn't
// reflow. Rather than squeeze it onto a phone, mobile traffic is handed a
// purpose-built page — same approach as Tsukibase.
export function proxy(request: NextRequest) {
  const ua = request.headers.get("user-agent") ?? "";
  if (/Mobile|Android|iPhone|iPad/i.test(ua)) {
    return NextResponse.redirect(new URL("/mobile", request.url));
  }
}

export const config = {
  matcher: "/",
};
