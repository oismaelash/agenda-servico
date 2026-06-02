/**
 * Horário de funcionamento fixo da barbearia (minutos desde meia-noite).
 * Manhã: 08:30–12:30 | Tarde: 13:30–20:00 (intervalo de almoço indisponível).
 */
export const SHOP_AM_START = 8 * 60 + 30;
export const SHOP_AM_END = 12 * 60 + 30;
export const SHOP_PM_START = 13 * 60 + 30;
export const SHOP_PM_END = 20 * 60;

export function parseHoraToMinutes(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function formatMinutesToHora(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/**
 * Intercala a disponibilidade do funcionário com os dois turnos da loja.
 */
export function clipDisponibilidadeToTurnos(
  dispStartMin: number,
  dispEndMin: number
): [number, number][] {
  const out: [number, number][] = [];

  const amLo = Math.max(dispStartMin, SHOP_AM_START);
  const amHi = Math.min(dispEndMin, SHOP_AM_END);
  if (amLo < amHi) out.push([amLo, amHi]);

  const pmLo = Math.max(dispStartMin, SHOP_PM_START);
  const pmHi = Math.min(dispEndMin, SHOP_PM_END);
  if (pmLo < pmHi) out.push([pmLo, pmHi]);

  return out;
}

export function gerarSlotsNoIntervalo(
  startMin: number,
  endMin: number,
  duracaoMin: number
): string[] {
  const slots: string[] = [];
  for (let m = startMin; m + duracaoMin <= endMin; m += duracaoMin) {
    slots.push(formatMinutesToHora(m));
  }
  return slots;
}

export function unificarEOrdenarHorarios(slots: string[]): string[] {
  const uniq = Array.from(new Set(slots));
  uniq.sort((a, b) => parseHoraToMinutes(a) - parseHoraToMinutes(b));
  return uniq;
}
