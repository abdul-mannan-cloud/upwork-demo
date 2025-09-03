import { NextRequest, NextResponse } from "next/server";
import { encoding_for_model, get_encoding } from "tiktoken";
import { auth } from "@clerk/nextjs/server";

export const runtime = 'nodejs';

// Helper: choose encoding; fallback to o200k_base if model not recognized
function getEncoder(model?: string) {
  try {
    if (model) {
      return encoding_for_model(model as any);
    }
  } catch {
    // fall through to default
  }
  try {
    return get_encoding("o200k_base");
  } catch {
    // Last resort
    return get_encoding("cl100k_base");
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { text, model } = await req.json();

    if (typeof text !== "string") {
      return NextResponse.json({ error: "text must be a string" }, { status: 400 });
    }

    const enc = getEncoder(model);
    const tokens = enc.encode(text);
    const count = tokens.length;
    enc.free();

    return NextResponse.json({ tokens: count });
  } catch (error: any) {
    console.error("/api/tokens error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
