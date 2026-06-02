import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

/** Cancelamentos ficam visíveis no histórico só por esse intervalo após cancelar */
const CANCELADO_VISIVEL_MS = 5 * 60 * 1000;

function visivelNoHistorico(status: string, canceladoAt: Date | null): boolean {
  if (status.toLowerCase() !== "cancelado") return true;
  if (!canceladoAt) return false;
  return canceladoAt.getTime() >= Date.now() - CANCELADO_VISIVEL_MS;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Token não fornecido" },
      { status: 401 }
    );
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      clienteId: number;
      role?: string;
    };

    if (decoded.role === "barbeiro") {
      const agendamentos = await prisma.agendamento.findMany({
        include: {
          servico: true,
          funcionario: true,
        },
        orderBy: { createdAt: "desc" },
      });

      const historicoBarbeiro = agendamentos
        .filter((ag) => visivelNoHistorico(ag.status, ag.canceladoAt))
        .map((ag) => ({
          id: ag.id,
          nomeCliente: ag.nomeCliente,
          telefone: ag.telefone,
          servicoNome: ag.servico.nome,
          funcionarioNome: ag.funcionario.nome,
          data: ag.data,
          horario: ag.hora,
          status: ag.status,
          createdAt: ag.createdAt,
        }));

      return NextResponse.json(historicoBarbeiro);
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: decoded.clienteId },
      select: { id: true, telefone: true },
    });

    if (!cliente) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    // Vincula agendamentos antigos feitos com o mesmo telefone.
    await prisma.agendamento.updateMany({
      where: {
        clienteId: null,
        telefone: cliente.telefone,
      },
      data: {
        clienteId: cliente.id,
      },
    });

    const agendamentos = await prisma.agendamento.findMany({
      where: {
        OR: [{ clienteId: cliente.id }, { telefone: cliente.telefone }],
      },
      include: {
        servico: true,
        funcionario: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const historico = agendamentos
      .filter((ag) => visivelNoHistorico(ag.status, ag.canceladoAt))
      .map((ag) => ({
        id: ag.id,
        nomeCliente: ag.nomeCliente,
        telefone: ag.telefone,
        servicoNome: ag.servico.nome,
        funcionarioNome: ag.funcionario.nome,
        data: ag.data,
        horario: ag.hora,
        status: ag.status,
        createdAt: ag.createdAt,
      }));

    return NextResponse.json(historico);
  } catch {
    return NextResponse.json(
      { error: "Token inválido" },
      { status: 401 }
    );
  }
}
