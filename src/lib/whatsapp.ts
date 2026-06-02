import axios from "axios";

/**
 * Normaliza para envio via APIs BR: apenas dígitos, com DDI 55 quando for celular BR (10/11 dígitos).
 */
export function normalizarTelefoneBrParaEnvio(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.startsWith("55") && d.length >= 12) return d;
  if (d.length === 10 || d.length === 11) return `55${d}`;
  return d;
}

export type EnviarWhatsAppResultado =
  | { ok: true }
  | { ok: false; motivo: string };

/**
 * Evolution API v2 (comum no Brasil): POST /message/sendText/{instance}
 * Variáveis: WHATSAPP_EVOLUTION_BASE_URL (ex: https://host:8080), WHATSAPP_EVOLUTION_INSTANCE, WHATSAPP_EVOLUTION_API_KEY
 *
 * Se não estiver configurado, não envia e retorna ok:false (o agendamento continua válido).
 */
export async function enviarWhatsAppTexto(
  telefoneDestino: string,
  texto: string
): Promise<EnviarWhatsAppResultado> {
  const base = process.env.WHATSAPP_EVOLUTION_BASE_URL?.replace(/\/$/, "");
  const instance = process.env.WHATSAPP_EVOLUTION_INSTANCE;
  const apiKey = process.env.WHATSAPP_EVOLUTION_API_KEY;

  if (!base || !instance || !apiKey) {
    console.warn(
      "[whatsapp] Evolution não configurada (WHATSAPP_EVOLUTION_*). Mensagem não enviada."
    );
    return { ok: false, motivo: "whatsapp_nao_configurado" };
  }

  const numero = normalizarTelefoneBrParaEnvio(telefoneDestino);
  const url = `${base}/message/sendText/${encodeURIComponent(instance)}`;

  try {
    await axios.post(
      url,
      { number: numero, text: texto },
      {
        headers: {
          apikey: apiKey,
          "Content-Type": "application/json",
        },
        timeout: 20_000,
      }
    );
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[whatsapp] Falha ao enviar:", msg);
    return { ok: false, motivo: msg };
  }
}
