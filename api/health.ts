import type { Request, Response } from 'express';

export default function handler(_req: Request, res: Response) {
  const hasOneMapToken = Boolean(process.env.ONEMAP_TOKEN);
  const hasOneMapCredentials = Boolean(
    process.env.ONEMAP_EMAIL && process.env.ONEMAP_PASSWORD
  );
  const hasWhatsApp = Boolean(
    process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN
  );

  res.status(200).json({
    status: 'ok',
    service: 'mission-possible-api',
    timestamp: new Date().toISOString(),
    timezone: 'Asia/Singapore',
    currency: 'SGD',
    integrations: {
      onemap: {
        configured: hasOneMapToken || hasOneMapCredentials,
        authMode: hasOneMapToken
          ? 'static_token'
          : hasOneMapCredentials
            ? 'email_password_token_exchange'
            : 'unconfigured',
      },
      whatsapp: {
        configured: hasWhatsApp,
        apiVersion: 'v23.0',
      },
    },
  });
}
