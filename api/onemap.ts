import type { Request, Response } from 'express';

const ONEMAP_ROUTE_URL = 'https://www.onemap.gov.sg/api/public/routingsvc/route';

function isValidCoordPair(value: string): boolean {
  return /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(value.trim());
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

  const token = process.env.ONEMAPP_TOKEN?.trim();
  if (!token) {
    res.status(503).json({
      ok: false,
      configured: false,
      error:
        'OneMap credentials are not configured yet. Set ONEMAPP_TOKEN in server environment variables.',
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
