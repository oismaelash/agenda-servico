/**
 * Converte data (YYYY-MM-DD) + hora (HH:mm) no fuso de Brasília (-03:00)
 * para um instante UTC (Date). Adequado para lembretes no Brasil (sem horário de verão atual).
 */
export function parseAgendamentoParaDateUtc(data: string, hora: string): Date {
  const [y, mo, d] = data.split("-").map(Number);
  const [h, mi] = hora.split(":").map(Number);
  const iso = `${String(y).padStart(4, "0")}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}T${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}:00-03:00`;
  return new Date(iso);
}

export function formatarDataBr(dataIso: string): string {
  const [y, mo, d] = dataIso.split("-");
  return `${d}/${mo}/${y}`;
}

/** Data local de hoje em YYYY-MM-DD (America/Sao_Paulo). */
export function dataHojeBrasilIso(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });
}

/** Minutos desde meia-noite no fuso de Brasília. */
export function minutosAgoraBrasil(): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const minute = parseInt(
    parts.find((p) => p.type === "minute")?.value ?? "0",
    10
  );
  return hour * 60 + minute;
}

export function isDataHojeBrasil(dataIso: string): boolean {
  return dataIso === dataHojeBrasilIso();
}
