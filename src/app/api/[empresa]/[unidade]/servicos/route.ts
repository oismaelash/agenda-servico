import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { empresa: string; unidade: string } }
) {
  const unidadeId = parseInt(params.unidade);

  if (isNaN(unidadeId)) {
    return NextResponse.json({ error: "ID de unidade inválido" }, { status: 400 });
  }

  const servicos = await prisma.servico.findMany({
    where: { unidadeId },
  });

  return NextResponse.json(servicos);
}
