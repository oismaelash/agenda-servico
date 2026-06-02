import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);

  if (isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const agendamento = await prisma.agendamento.update({
    where: { id },
    data: { status: "cancelado", canceladoAt: new Date() },
  });

  return NextResponse.json(agendamento);
}
