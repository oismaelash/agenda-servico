import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enviarConfirmacoesWhatsapp } from "@/lib/notificacoes-agendamento";

export async function POST(request: Request) {
  const body = await request.json();
  const { servicoId, funcionarioId, data, hora, nomeCliente, telefone } = body;

  if (!servicoId || !funcionarioId || !data || !hora || !nomeCliente || !telefone) {
    return NextResponse.json(
      { error: "Todos os campos são obrigatórios" },
      { status: 400 }
    );
  }

  // Check if telefone matches a cliente
  const cliente = await prisma.cliente.findUnique({
    where: { telefone },
  });

  const agendamento = await prisma.agendamento.create({
    data: {
      servicoId,
      funcionarioId,
      data,
      hora,
      nomeCliente,
      telefone,
      clienteId: cliente?.id || null,
    },
  });

  try {
    await enviarConfirmacoesWhatsapp(agendamento.id);
  } catch (e) {
    console.error("[agendamento] WhatsApp confirmação:", e);
  }

  return NextResponse.json(agendamento, { status: 201 });
}
