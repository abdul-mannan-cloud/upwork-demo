import { NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";
import {WebSocketServer} from "ws";

export const runtime = 'nodejs';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("/api/session: OPENAI_API_KEY is not set");
    return NextResponse.json({ error: "Server misconfiguration: missing OPENAI_API_KEY" }, { status: 500 });
  }

  try {

    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2025-06-03",
          voice: "verse",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("/api/session upstream error", response.status, data);
      return NextResponse.json({ error: "Upstream error", details: data }, { status: response.status });
    }

    // Basic safeguard: ensure client_secret is present
    if (!data?.client_secret?.value) {
      console.error("/api/session: missing client_secret in upstream response", data);
      return NextResponse.json({ error: "No ephemeral key from upstream", details: data }, { status: 502 });
    }


    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in /session:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
