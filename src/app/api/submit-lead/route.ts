import { NextRequest, NextResponse } from "next/server";

/* Proxy lead ve Google Apps Script (server-to-server, khong lo CORS).
   URL script nam o bien moi truong LEAD_SCRIPT_URL — KHONG dua len client.
   Cung kien truc voi /api/submit-lead cua ERA_Website_FE. */

const APPS_SCRIPT_URL = process.env.LEAD_SCRIPT_URL || "";

export async function POST(req: NextRequest) {
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json(
      { success: false, error: "Server not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();

    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    return NextResponse.json({ success: res.ok, data });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
