import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  if (!API_BASE) return NextResponse.json({ error: "API_URL not configured" }, { status: 500 });
  const url = new URL(req.url);
  const resolvedParams = await params;
  const target = `${API_BASE}/${resolvedParams.path.join("/")}${url.search}`;
  const resp = await fetch(target, { headers: { Authorization: req.headers.get("authorization") || "" }, cache: "no-store" });
  const data = await resp.arrayBuffer();
  return new NextResponse(data, { status: resp.status, headers: resp.headers });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  if (!API_BASE) return NextResponse.json({ error: "API_URL not configured" }, { status: 500 });
  const url = new URL(req.url);
  const resolvedParams = await params;
  const target = `${API_BASE}/${resolvedParams.path.join("/")}${url.search}`;
  const body = await req.arrayBuffer();
  const resp = await fetch(target, { method: "POST", body, headers: { Authorization: req.headers.get("authorization") || "", "content-type": req.headers.get("content-type") || "application/json" } });
  const data = await resp.arrayBuffer();
  return new NextResponse(data, { status: resp.status, headers: resp.headers });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) { return POST(req, ctx); }
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  if (!API_BASE) return NextResponse.json({ error: "API_URL not configured" }, { status: 500 });
  const url = new URL(req.url);
  const resolvedParams = await params;
  const target = `${API_BASE}/${resolvedParams.path.join("/")}${url.search}`;
  const resp = await fetch(target, { method: "DELETE", headers: { Authorization: req.headers.get("authorization") || "" } });
  const data = await resp.arrayBuffer();
  return new NextResponse(data, { status: resp.status, headers: resp.headers });
}


