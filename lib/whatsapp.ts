export type WaConfig = { phoneNumberId: string; token: string; template?: string | null; lang?: string | null };
export type WaResult = { ok: true; id: string } | { ok: false; error: string };

/**
 * Sends a WhatsApp Cloud API message.
 * - If a template name is configured, an approved template is used (works any time). Body variables, in order:
 *   {{1}} customer name, {{2}} restaurant, {{3}} bill number, {{4}} amount, {{5}} bill link
 * - Otherwise a plain text message is sent (WhatsApp only delivers it if the customer messaged you in the last 24 hours).
 */
export async function sendWhatsApp(cfg: WaConfig, to: string, content: { text: string; params: string[] }): Promise<WaResult> {
  const payload = cfg.template
    ? {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: cfg.template,
          language: { code: cfg.lang || 'en' },
          components: [{ type: 'body', parameters: content.params.map((text) => ({ type: 'text', text })) }],
        },
      }
    : { messaging_product: 'whatsapp', to, type: 'text', text: { preview_url: true, body: content.text } };

  const res = await fetch(`https://graph.facebook.com/v21.0/${cfg.phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: json?.error?.message || `WhatsApp error ${res.status}` };
  return { ok: true, id: json?.messages?.[0]?.id ?? '' };
}
