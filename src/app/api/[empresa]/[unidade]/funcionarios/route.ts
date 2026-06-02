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

  const { searchParams } = new URL(request.url);
  const data = searchParams.get("data");

  if (data) {
    const date = new Date(data + "T00:00:00");
    const diaSemana = date.getDay();

    const funcionarios = await prisma.funcionario.findMany({
      where: {
        unidadeId,
        disponibilidades: {
          some: { diaSemana },
        },
      },
    });

    return NextResponse.json(funcionarios);
  }

  const funcionarios = await prisma.funcionario.findMany({
    where: { unidadeId },
  });

  return NextResponse.json(funcionarios);
}
