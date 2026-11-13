import type { Request, Response } from 'express';

const ONEMAP_TOKEN_URL = 'https://www.onemap.gov.sg/api/auth/post/getToken';
const ONEMAP_ROUTE_URL = 'https://www.onemap.gov.sg/api/public/routingsvc/route';

interface CachedToken {
  accessToken: string;
  expiresAtMs: number;
}

let cachedToken: CachedToken | null = null;

function isValidCoordPair(value: string): boolean {
  return /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(value.trim());
}

async function resolveOneMapToken(): Promise<string> {
  const directToken = process.env.ONEMAP_TOKEN?.trim();
  if (directToken) {
    return directToken;
  }

  const now = Date.now();
  // Refresh 1 hour prior to 3-day expiry
  if (cachedToken && cachedToken.expiresAtMs - 3600_000 > now) {
    return cachedToken.accessToken;
  }

  const email = process.env.ONEMAP_EMAIL?.trim();
  const password = process.env.ONEMAP_PASSWORD;

  if (!email || !password) {
    throw new Error('MISSING_CREDENTIALS');
  }

  const tokenResp = await fetch(ONEMAP_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const tokenData = (await tokenResp.json().catch(() => ({}))) as {
    access_token?: string;
    expiry_timestamp?: string | number;
    error?: string;
    message?: string;
  };

  if (!tokenResp.ok || !tokenData.access_token) {
    throw new Error(
      tokenData.error ||
        tokenData.message ||
        `OneMap auth failed with HTTP ${tokenResp.status}`
    );
  }

  // OneMap expiry_timestamp is Unix seconds (3 days)
  const expirySeconds = Number(tokenData.expiry_timestamp);
  const expiresAtMs =
    Number.isFinite(expirySeconds) && expirySeconds > 0
      ? expirySeconds * 1000
      : now + 3 * 24 * 60 * 60 * 1000;

  cachedToken = {
    accessToken: tokenData.access_token,
    expiresAtMs,
  };

  return cachedToken.accessToken;
}

function formatSgDateForTransit(): string {
  const now = new Date();
  const sgParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const year = sgParts.find((p) => p.type === 'year')?.value ?? '2026';
  const month = sgParts.find((p) => p.type === 'month')?.value ?? '11';
  const day = sgParts.find((p) => p.type === 'day')?.value ?? '13';
  return `${month}-${day}-${year}`;
}

function formatSgTimeForTransit(): string {
  const now = new Date();
  const sgParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Singapore',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const hour = sgParts.find((p) => p.type === 'hour')?.value ?? '09';
  const minute = sgParts.find((p) => p.type === 'minute')?.value ?? '00';
  const second = sgParts.find((p) => p.type === 'second')?.value ?? '00';
  return `${hour}:${minute}:${second}`;
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed. Use GET or POST.' });
    return;
  }

  const input = req.method === 'POST' ? req.body ?? {} : req.query;
  const start = String(input.start ?? '1.320981,103.844150').trim();
  const end = String(input.end ?? '1.326762,103.8559').trim();
  const routeType = String(input.routeType ?? 'walk').trim().toLowerCase();

  const allowedTypes = new Set(['walk', 'drive', 'cycle', 'pt']);
  if (!allowedTypes.has(routeType)) {
    res.status(400).json({
      ok: false,
      error: 'Invalid routeType. Must be one of: walk, drive, cycle, pt.',
    });
    return;
  }

  if (!isValidCoordPair(start) || !isValidCoordPair(end)) {
    res.status(400).json({
      ok: false,
      error: 'Invalid start or end coordinates. Expected "lat,lng" format.',
    });
    return;
  }

  let token: string;
  try {
    token = await resolveOneMapToken();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to resolve OneMap token.';
    if (message === 'MISSING_CREDENTIALS') {
      res.status(503).json({
        ok: false,
        configured: false,
        error:
          'OneMap credentials are not configured yet. Set ONEMAP_TOKEN or ONEMAP_EMAIL + ONEMAP_PASSWORD in server environment variables.',
      });
      return;
    }
    res.status(502).json({
      ok: false,
      configured: true,
      error: `OneMap authentication error: ${message}`,
    });
    return;
  }

  const params = new URLSearchParams({
    start,
    end,
    routeType,
  });

  if (routeType === 'pt') {
    params.set('date', String(input.date ?? formatSgDateForTransit()));
    params.set('time', String(input.time ?? formatSgTimeForTransit()));
    params.set('mode', String(input.mode ?? 'TRANSIT'));
  }

  const targetUrl = `${ONEMAP_ROUTE_URL}?${params.toString()}`;

  try {
    const routeResp = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Authorization: token,
      },
    });

    const payload = await routeResp.json().catch(() => ({}));

    if (!routeResp.ok) {
      // Clear cached token if unauthorized so next request refreshes
      if (routeResp.status === 401 || routeResp.status === 403) {
        cachedToken = null;
      }
      res.status(routeResp.status).json({
        ok: false,
        configured: true,
        error:
          (payload as { error?: string }).error ||
          `OneMap routing failed with HTTP ${routeResp.status}`,
        details: payload,
      });
      return;
    }

    res.status(200).json({
      ok: true,
      configured: true,
      request: { start, end, routeType },
      data: payload,
    });
  } catch (err) {
    res.status(502).json({
      ok: false,
      configured: true,
      error:
        err instanceof Error
          ? `Failed to reach OneMap routing service: ${err.message}`
          : 'Failed to reach OneMap routing service.',
    });
  }
}
