import type { Request, Response } from 'express';

const GRAPH_API_BASE = 'https://graph.facebook.com/v23.0';

function sanitizeSingaporePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  // If user enters an 8-digit SG mobile number starting with 8 or 9, prefix 65
  if (digits.length === 8 && (digits.startsWith('8') || digits.startsWith('9'))) {
    return `65${digits}`;
  }
  return digits;
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed. Use POST.' });
    return;
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();

  if (!phoneNumberId || !accessToken) {
    res.status(503).json({
      ok: false,
      configured: false,
      error:
        'WhatsApp Cloud API credentials are not configured yet. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in server environment variables.',
    });
    return;
  }

  const body = (req.body ?? {}) as {
    to?: string;
    templateName?: string;
    languageCode?: string;
  };

  const rawPhone = String(body.to ?? '').trim();
  const recipientPhone = sanitizeSingaporePhone(rawPhone);

  if (!recipientPhone || recipientPhone.length < 8 || recipientPhone.length > 15) {
    res.status(400).json({
      ok: false,
      configured: true,
      error: 'Valid recipient phone number is required (e.g., 6591234567).',
    });
    return;
  }

  const templateName =
    String(body.templateName ?? process.env.WHATSAPP_TEMPLATE_NAME ?? 'hello_world').trim() ||
    'hello_world';
  const languageCode = String(body.languageCode ?? 'en_US').trim() || 'en_US';

  const whatsappPayload = {
    messaging_product: 'whatsapp',
    to: recipientPhone,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
    },
  };

  const endpoint = `${GRAPH_API_BASE}/${encodeURIComponent(phoneNumberId)}/messages`;

  try {
    const waResp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(whatsappPayload),
    });

    const data = (await waResp.json().catch(() => ({}))) as {
      messages?: Array<{ id?: string; message_status?: string }>;
      error?: { message?: string; code?: number; type?: string };
    };

    if (!waResp.ok) {
      res.status(waResp.status).json({
        ok: false,
        configured: true,
        error:
          data.error?.message ||
          `WhatsApp Cloud API returned HTTP ${waResp.status}`,
        details: data,
      });
      return;
    }

    res.status(200).json({
      ok: true,
      configured: true,
      recipient: recipientPhone,
      template: templateName,
      messageId: data.messages?.[0]?.id ?? null,
      data,
    });
  } catch (err) {
    res.status(502).json({
      ok: false,
      configured: true,
      error:
        err instanceof Error
          ? `Failed to reach WhatsApp Cloud API: ${err.message}`
          : 'Failed to reach WhatsApp Cloud API.',
    });
  }
}
