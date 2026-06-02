import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { empresa: string } }
) {
  const { empresa } = params;

  const empresaRecord = await prisma.empresa.findUnique({
    where: { slug: empresa },
    include: { unidades: true },
  });

  if (!empresaRecord) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
  }

  return NextResponse.json(empresaRecord.unidades);
}
