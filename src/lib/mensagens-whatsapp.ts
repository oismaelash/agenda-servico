import { formatarDataBr } from "@/lib/agendamento-datetime";

export type DetalhesAgendamentoMsg = {
  empresaNome: string;
  unidadeNome: string;
  servicoNome: string;
  profissionalNome: string;
  dataIso: string;
  hora: string;
  nomeCliente: string;
  telefoneCliente: string;
};

function blocoDetalhes(d: DetalhesAgendamentoMsg): string {
  return [
    `*Estabelecimento:* ${d.empresaNome}`,
    `*Unidade:* ${d.unidadeNome}`,
    `*Serviço:* ${d.servicoNome}`,
    `*Profissional:* ${d.profissionalNome}`,
    `*Data:* ${formatarDataBr(d.dataIso)}`,
    `*Horário:* ${d.hora}`,
    `*Cliente:* ${d.nomeCliente}`,
    `*Telefone cliente:* ${d.telefoneCliente}`,
  ].join("\n");
}

export function mensagemConfirmacaoCliente(d: DetalhesAgendamentoMsg): string {
  return (
    `✅ *Agendamento confirmado*\n\n` +
    blocoDetalhes(d) +
    `\n\nObrigado por escolher a gente!`
  );
}

export function mensagemConfirmacaoBarbeiro(d: DetalhesAgendamentoMsg): string {
  return `🔔 *Novo agendamento*\n\n` + blocoDetalhes(d);
}

export function mensagemLembreteCliente(
  d: DetalhesAgendamentoMsg,
  tipo: "1h" | "30m"
): string {
  const quando = tipo === "1h" ? "1 hora" : "30 minutos";
  return (
    `⏰ *Lembrete:* seu horário é em *${quando}*.\n\n` +
    blocoDetalhes(d)
  );
}

export function mensagemLembreteBarbeiro(
  d: DetalhesAgendamentoMsg,
  tipo: "1h" | "30m"
): string {
  const quando = tipo === "1h" ? "1 hora" : "30 minutos";
  return (
    `📋 *Lembrete (${quando}):* compromisso na agenda.\n\n` +
    blocoDetalhes(d)
  );
}
