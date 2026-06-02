import { NextResponse } from "next/server";
import { processarLembretesPendentes } from "@/lib/notificacoes-agendamento";

export const dynamic = "force-dynamic";

/**
 * Chame periodicamente (ex.: a cada 5 min) com header:
 * Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const ok =
    secret &&
    auth === `Bearer ${secret}`;

  if (!ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const resultado = await processarLembretesPendentes();
  return NextResponse.json(resultado);
}
