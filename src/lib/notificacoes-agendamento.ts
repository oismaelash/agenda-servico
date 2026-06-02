import { prisma } from "@/lib/prisma";
import { parseAgendamentoParaDateUtc } from "@/lib/agendamento-datetime";
import type { DetalhesAgendamentoMsg } from "@/lib/mensagens-whatsapp";
import {
  mensagemConfirmacaoBarbeiro,
  mensagemConfirmacaoCliente,
  mensagemLembreteBarbeiro,
  mensagemLembreteCliente,
} from "@/lib/mensagens-whatsapp";
import { enviarWhatsAppTexto } from "@/lib/whatsapp";

type AgendamentoCompletos = {
  id: number;
  data: string;
  hora: string;
  nomeCliente: string;
  telefone: string;
  status: string;
  servico: {
    nome: string;
    unidade: {
      nome: string;
      empresa: {
        nome: string;
        whatsappNotificacoes: string | null;
      };
    };
  };
  funcionario: { nome: string };
};

function paraDetalhes(a: AgendamentoCompletos): DetalhesAgendamentoMsg {
  const telClienteFmt = a.telefone.replace(/\D/g, "");
  return {
    empresaNome: a.servico.unidade.empresa.nome,
    unidadeNome: a.servico.unidade.nome,
    servicoNome: a.servico.nome,
    profissionalNome: a.funcionario.nome,
    dataIso: a.data,
    hora: a.hora,
    nomeCliente: a.nomeCliente,
    telefoneCliente: telClienteFmt,
  };
}

const includeAgendamento = {
  servico: {
    include: {
      unidade: {
        include: { empresa: true },
      },
    },
  },
  funcionario: true,
} as const;

export async function enviarConfirmacoesWhatsapp(agendamentoId: number): Promise<void> {
  const a = await prisma.agendamento.findUnique({
    where: { id: agendamentoId },
    include: includeAgendamento,
  });

  if (!a || a.status !== "confirmado") return;

  const detalhes = paraDetalhes(a as AgendamentoCompletos);
  const textoCliente = mensagemConfirmacaoCliente(detalhes);
  const textoBarbeiro = mensagemConfirmacaoBarbeiro(detalhes);

  const whatsBarbearia = a.servico.unidade.empresa.whatsappNotificacoes;

  const [rCliente, rBarbeiro] = await Promise.all([
    enviarWhatsAppTexto(a.telefone, textoCliente),
    whatsBarbearia
      ? enviarWhatsAppTexto(whatsBarbearia, textoBarbeiro)
      : Promise.resolve({ ok: false as const, motivo: "sem_whatsapp_empresa" }),
  ]);

  if (rCliente.ok || rBarbeiro.ok) {
    await prisma.agendamento.update({
      where: { id: a.id },
      data: {
        confirmacaoWhatsappEnviadaAt: new Date(),
      },
    });
  }
}

export async function processarLembretesPendentes(): Promise<{
  enviados1h: number;
  enviados30m: number;
}> {
  const agendamentos = await prisma.agendamento.findMany({
    where: { status: "confirmado" },
    include: includeAgendamento,
  });

  let enviados1h = 0;
  let enviados30m = 0;
  const agora = Date.now();

  for (const a of agendamentos) {
    const inicio = parseAgendamentoParaDateUtc(a.data, a.hora).getTime();
    const minutesUntil = (inicio - agora) / 60_000;

    if (minutesUntil <= 0) continue;

    const detalhes = paraDetalhes(a as AgendamentoCompletos);
    const whatsBarbearia = a.servico.unidade.empresa.whatsappNotificacoes;

    const naJanela1h = minutesUntil >= 55 && minutesUntil <= 70;
    const naJanela30m = minutesUntil >= 25 && minutesUntil <= 40;

    if (naJanela1h && !a.lembrete1hEnviadoAt) {
      const [c, b] = await Promise.all([
        enviarWhatsAppTexto(a.telefone, mensagemLembreteCliente(detalhes, "1h")),
        whatsBarbearia
          ? enviarWhatsAppTexto(
              whatsBarbearia,
              mensagemLembreteBarbeiro(detalhes, "1h")
            )
          : Promise.resolve({ ok: false as const, motivo: "sem_whatsapp" }),
      ]);
      if (c.ok || b.ok) {
        await prisma.agendamento.update({
          where: { id: a.id },
          data: { lembrete1hEnviadoAt: new Date() },
        });
        enviados1h++;
      }
    } else if (naJanela30m && !a.lembrete30mEnviadoAt) {
      const [c, b] = await Promise.all([
        enviarWhatsAppTexto(a.telefone, mensagemLembreteCliente(detalhes, "30m")),
        whatsBarbearia
          ? enviarWhatsAppTexto(
              whatsBarbearia,
              mensagemLembreteBarbeiro(detalhes, "30m")
            )
          : Promise.resolve({ ok: false as const, motivo: "sem_whatsapp" }),
      ]);
      if (c.ok || b.ok) {
        await prisma.agendamento.update({
          where: { id: a.id },
          data: { lembrete30mEnviadoAt: new Date() },
        });
        enviados30m++;
      }
    }
  }

  return { enviados1h, enviados30m };
}
