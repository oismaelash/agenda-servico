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

  const body = await request.json();
  const { data, hora } = body;

  if (!data || !hora) {
    return NextResponse.json(
      { error: "data e hora são obrigatórios" },
      { status: 400 }
    );
  }

  const agendamento = await prisma.agendamento.update({
    where: { id },
    data: { data, hora },
  });

  return NextResponse.json(agendamento);
}
