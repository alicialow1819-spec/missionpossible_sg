import type { Request, Response } from 'express';

export default function handler(_req: Request, res: Response) {
  const hasOneMapToken = Boolean(process.env.ONEMAPP_TOKEN?.trim());
  const hasWhatsApp = Boolean(process.env.WHATSAPP_PHONE_NUMBERID?.trim());

  res.status(200).json({
    status: 'ok',
    service: 'mission-possible-api',
    timestamp: new Date().toISOString(),
    timezone: 'Asia/Singapore',
    currency: 'SGD',
    integrations: {
      onemap: {
        configured: hasOneMapToken,
        authMode: hasOneMapToken ? 'token' : 'unconfigured',
      },
      whatsapp: {
        configured: hasWhatsApp,
        apiVersion: 'v23.0',
      },
    },
  });
}
