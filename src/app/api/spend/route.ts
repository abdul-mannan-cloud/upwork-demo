import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { addSpend, getSpend, resetSpend, SpendDelta } from "@/app/lib/spendStore";

export const runtime = 'nodejs';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const totals = getSpend(userId);
  return NextResponse.json({ totals });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = (await req.json()) as { delta?: SpendDelta; action?: 'ingest' | 'reset' };
    const action = body.action ?? 'ingest';

    if (action === 'reset') {
      const totals = resetSpend(userId);
      return NextResponse.json({ totals });
    }

    const delta = body.delta ?? {};
    const totals = addSpend(userId, delta);
    return NextResponse.json({ totals });
  } catch (err) {
    console.error('/api/spend error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
