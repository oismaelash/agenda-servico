import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  clipDisponibilidadeToTurnos,
  gerarSlotsNoIntervalo,
  parseHoraToMinutes,
  unificarEOrdenarHorarios,
} from "@/lib/barbearia-horarios";
import {
  isDataHojeBrasil,
  minutosAgoraBrasil,
} from "@/lib/agendamento-datetime";

export async function GET(
  request: Request,
  { params: _params }: { params: { empresa: string; unidade: string } }
) {
  const { searchParams } = new URL(request.url);
  const funcionarioId = searchParams.get("funcionario_id");
  const data = searchParams.get("data");
  const servicoId = searchParams.get("servico_id");

  if (!funcionarioId || !data) {
    return NextResponse.json(
      { error: "funcionario_id e data são obrigatórios" },
      { status: 400 }
    );
  }

  const funcId = parseInt(funcionarioId);
  const date = new Date(data + "T00:00:00");
  const diaSemana = date.getDay();

  // Get service duration if provided
  let duracaoMin = 30;
  if (servicoId) {
    const servico = await prisma.servico.findUnique({
      where: { id: parseInt(servicoId) },
    });
    if (servico?.duracaoMin != null && servico.duracaoMin > 0) {
      duracaoMin = servico.duracaoMin;
    }
  }

  // Get disponibilidade for that funcionario on that day of week
  const disponibilidades = await prisma.disponibilidade.findMany({
    where: {
      funcionarioId: funcId,
      diaSemana,
    },
  });

  if (disponibilidades.length === 0) {
    return NextResponse.json([]);
  }

  // Generate slots dentro dos turnos (08:30–12:30 e 13:30–20:00), respeitando duração do serviço
  const allSlots: string[] = [];

  for (const disp of disponibilidades) {
    const dispStart = parseHoraToMinutes(disp.horaInicio);
    const dispEnd = parseHoraToMinutes(disp.horaFim);

    for (const [segLo, segHi] of clipDisponibilidadeToTurnos(
      dispStart,
      dispEnd
    )) {
      allSlots.push(
        ...gerarSlotsNoIntervalo(segLo, segHi, duracaoMin)
      );
    }
  }

  const slotList = unificarEOrdenarHorarios(allSlots);

  // Find existing agendamentos for that funcionario on that date (not cancelled)
  const agendamentos = await prisma.agendamento.findMany({
    where: {
      funcionarioId: funcId,
      data,
      status: { not: "cancelado" },
    },
    include: { servico: true },
  });

  // Remove conflicting slots
  const bookedSlots = new Set<string>();
  for (const ag of agendamentos) {
    const agDuracao = ag.servico.duracaoMin ?? 30;
    const agStart = parseHoraToMinutes(ag.hora);
    const agEnd = agStart + agDuracao;

    for (const slot of slotList) {
      const slotStart = parseHoraToMinutes(slot);
      const slotEnd = slotStart + duracaoMin;

      if (slotStart < agEnd && slotEnd > agStart) {
        bookedSlots.add(slot);
      }
    }
  }

  let available = slotList.filter((slot) => !bookedSlots.has(slot));

  // Remove horários já passados quando o dia selecionado é hoje (fuso de Brasília)
  if (isDataHojeBrasil(data)) {
    const agora = minutosAgoraBrasil();
    available = available.filter(
      (slot) => parseHoraToMinutes(slot) >= agora
    );
  }

  return NextResponse.json(available);
}
