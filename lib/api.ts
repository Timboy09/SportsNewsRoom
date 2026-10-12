import { NextResponse } from "next/server";

export const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=900, stale-while-revalidate=300",
  "Access-Control-Allow-Origin": "*",
};

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, { ...init, headers: { ...CACHE_HEADERS, ...init?.headers } });
}

export function text(body: string, type = "text/plain") {
  return new NextResponse(body, { headers: { ...CACHE_HEADERS, "Content-Type": `${type}; charset=utf-8` } });
}
