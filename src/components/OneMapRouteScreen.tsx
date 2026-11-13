import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Bike,
  Car,
  Footprints,
  MapPin,
  Navigation,
  TrainFront,
} from 'lucide-react';
import {
  Initiative,
  ONEMAP_SAMPLE_DESTINATIONS,
  SINGAPORE_PRESET_ORIGINS,
} from '../data/singaporeData';

interface OneMapRouteScreenProps {
  initiatives: Initiative[];
  preselectedDestinationCoords?: string;
}

type RouteType = 'walk' | 'drive' | 'cycle' | 'pt';

interface OneMapInstruction {
  text: string;
  distanceMeters?: number;
  timeSeconds?: number;
  street?: string;
}

interface OneMapResponseData {
  route_summary?: {
    total_distance?: number;
    total_time?: number;
    start_point?: string;
    end_point?: string;
  };
  route_geometry?: string;
  route_instructions?: Array<[string, string, number, string, number, ...unknown[]]>;
  plan?: {
    itineraries?: Array<{
      duration?: number;
      walkDistance?: number;
      transfers?: number;
      legs?: Array<{
        mode?: string;
        route?: string;
        from?: { name?: string };
        to?: { name?: string };
        duration?: number;
        distance?: number;
      }>;
    }>;
  };
}

// Decode Google/OneMap encoded polyline (precision 1e5)
function decodePolyline(encoded: string): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let b: number;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

const TRAVEL_MODES: Array<{
  id: RouteType;
  label: string;
  icon: typeof Footprints;
}> = [
  { id: 'walk', label: 'Walk', icon: Footprints },
  { id: 'pt', label: 'Public Transport', icon: TrainFront },
  { id: 'cycle', label: 'Cycle', icon: Bike },
  { id: 'drive', label: 'Drive', icon: Car },
];

export default function OneMapRouteScreen({
  initiatives,
  preselectedDestinationCoords,
}: OneMapRouteScreenProps) {
  const [startCoords, setStartCoords] = useState<string>('1.320981,103.844150');
  const [endCoords, setEndCoords] = useState<string>(
    preselectedDestinationCoords || '1.326762,103.8559'
  );
  const [routeType, setRouteType] = useState<RouteType>('walk');

  const [healthConfigured, setHealthConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<OneMapResponseData | null>(null);

  useEffect(() => {
    if (preselectedDestinationCoords) {
      setEndCoords(preselectedDestinationCoords);
    }
  }, [preselectedDestinationCoords]);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => {
        setHealthConfigured(Boolean(data?.integrations?.onemap?.configured));
      })
      .catch(() => {
        setHealthConfigured(false);
      });
  }, []);

  async function handleFetchRoute(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setRouteData(null);

    try {
      const qs = new URLSearchParams({
        start: startCoords.trim(),
        end: endCoords.trim(),
        routeType,
      });
      const resp = await fetch(`/api/onemap?${qs.toString()}`);
      const json = (await resp.json()) as {
        ok?: boolean;
        configured?: boolean;
        error?: string;
        data?: OneMapResponseData;
      };

      if (typeof json.configured === 'boolean') {
        setHealthConfigured(json.configured);
      }

      if (!resp.ok || !json.ok || !json.data) {
        setErrorMsg(json.error || `Unable to retrieve OneMap route (HTTP ${resp.status}).`);
        return;
      }

      setRouteData(json.data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Network error calling /api/onemap.');
    } finally {
      setLoading(false);
    }
  }

  const instructions: OneMapInstruction[] = useMemo(() => {
    if (!routeData) return [];

    if (routeType === 'pt' && routeData.plan?.itineraries?.[0]?.legs) {
      return routeData.plan.itineraries[0].legs.map((leg) => ({
        text: `${leg.mode ?? 'TRANSIT'}${leg.route ? ` (${leg.route})` : ''}: ${
          leg.from?.name ?? 'Origin'
        } → ${leg.to?.name ?? 'Destination'}`,
        distanceMeters: leg.distance,
        timeSeconds: leg.duration,
      }));
    }

    if (Array.isArray(routeData.route_instructions)) {
      return routeData.route_instructions.map((step) => ({
        text: String(step[9] ?? `${step[0] ?? ''} ${step[1] ?? ''}`).trim(),
        street: step[1] ? String(step[1]) : undefined,
        distanceMeters: typeof step[2] === 'number' ? step[2] : undefined,
        timeSeconds: typeof step[4] === 'number' ? step[4] : undefined,
      }));
    }

    return [];
  }, [routeData, routeType]);

  const svgPolylinePath = useMemo(() => {
    if (!routeData?.route_geometry) return null;
    const coords = decodePolyline(routeData.route_geometry);
    if (coords.length < 2) return null;

    const lats = coords.map((c) => c[0]);
    const lngs = coords.map((c) => c[1]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const width = 440;
    const height = 220;
    const pad = 24;
    const spanLng = Math.max(maxLng - minLng, 0.0005);
    const spanLat = Math.max(maxLat - minLat, 0.0005);

    const pts = coords.map(([lat, lng]) => {
      const x = pad + ((lng - minLng) / spanLng) * (width - pad * 2);
      const y = height - pad - ((lat - minLat) / spanLat) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return {
      pointsAttr: pts.join(' '),
      startPt: pts[0].split(',').map(Number),
      endPt: pts[pts.length - 1].split(',').map(Number),
    };
  }, [routeData]);

  const summaryDistanceKm = useMemo(() => {
    if (routeData?.route_summary?.total_distance != null) {
      return (routeData.route_summary.total_distance / 1000).toFixed(2);
    }
    const ptDist = routeData?.plan?.itineraries?.[0]?.walkDistance;
    return ptDist != null ? (ptDist / 1000).toFixed(2) : null;
  }, [routeData]);

  const summaryDurationMin = useMemo(() => {
    if (routeData?.route_summary?.total_time != null) {
      return Math.max(1, Math.round(routeData.route_summary.total_time / 60));
    }
    const ptDur = routeData?.plan?.itineraries?.[0]?.duration;
    return ptDur != null ? Math.max(1, Math.round(ptDur / 60)) : null;
  }, [routeData]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold text-[#047857]">
          OneMap Singapore Routing API · Serverless /api/onemap
        </p>
        <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
          Volunteer Hub Route Planner
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Pull live walking, cycling, driving, or public transport directions across Singapore via
          OneMap SLA routing.
        </p>
      </div>

      {healthConfigured === false && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-[#92400E]">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">OneMap server credentials not yet configured</p>
            <p className="text-xs mt-1 leading-relaxed">
              Add <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">ONEMAPP_TOKEN</code>{' '}
              to your server environment variables to activate live routing responses from{' '}
              <code className="font-mono">/api/onemap</code>. No keys are stored in source code.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Route Configuration Form */}
        <form
          onSubmit={handleFetchRoute}
          className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-5"
        >
          <div>
            <label
              htmlFor="origin-preset"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Quick Select Origin (Singapore MRT)
            </label>
            <select
              id="origin-preset"
              value={
                SINGAPORE_PRESET_ORIGINS.some((o) => o.coords === startCoords)
                  ? startCoords
                  : ''
              }
              onChange={(e) => {
                if (e.target.value) setStartCoords(e.target.value);
              }}
              className="w-full h-11 px-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#047857]"
            >
              <option value="">Custom coordinates...</option>
              {SINGAPORE_PRESET_ORIGINS.map((origin) => (
                <option key={origin.coords} value={origin.coords}>
                  {origin.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="start-coords"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Start Coordinates (lat,lng)
            </label>
            <input
              id="start-coords"
              type="text"
              required
              value={startCoords}
              onChange={(e) => setStartCoords(e.target.value)}
              className="w-full h-11 px-3.5 font-mono text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#047857]"
            />
          </div>

          <div>
            <label
              htmlFor="dest-preset"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Quick Select Volunteer Hub Destination
            </label>
            <select
              id="dest-preset"
              value={
                ONEMAP_SAMPLE_DESTINATIONS.some((d) => d.coords === endCoords)
                  ? endCoords
                  : ''
              }
              onChange={(e) => {
                if (e.target.value) setEndCoords(e.target.value);
              }}
              className="w-full h-11 px-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#047857]"
            >
              <option value="">Custom coordinates...</option>
              {ONEMAP_SAMPLE_DESTINATIONS.map((dest) => (
                <option key={dest.coords} value={dest.coords}>
                  {dest.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="end-coords"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Destination Coordinates (lat,lng)
            </label>
            <input
              id="end-coords"
              type="text"
              required
              value={endCoords}
              onChange={(e) => setEndCoords(e.target.value)}
              className="w-full h-11 px-3.5 font-mono text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#047857]"
            />
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-700 mb-2">
              Travel Mode
            </span>
            <div className="grid grid-cols-2 gap-2">
              {TRAVEL_MODES.map((mode) => {
                const Icon = mode.icon;
                const active = routeType === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setRouteType(mode.id)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#047857] text-white border-[#047857]'
                        : 'bg-white text-[#0F172A] border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold text-white bg-[#047857] hover:bg-[#064E3B] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
          >
            <Navigation className="w-4 h-4" />
            {loading ? 'Querying OneMap...' : 'Get Live OneMap Route'}
          </button>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <p className="text-xs font-semibold text-slate-700">Volunteer Hubs Directory</p>
            <div className="space-y-1.5">
              {initiatives.map((init) => (
                <button
                  key={init.id}
                  type="button"
                  onClick={() => {
                    setStartCoords(`${init.nearestMrtCoords.lat},${init.nearestMrtCoords.lng}`);
                    setEndCoords(`${init.coordinates.lat},${init.coordinates.lng}`);
                  }}
                  className="w-full flex items-center justify-between text-left px-3 py-2 text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                >
                  <span className="font-medium text-[#0F172A] truncate pr-2">
                    {init.nearestMrtCoords.label} → {init.venueName}
                  </span>
                  <span className="font-mono text-[11px] text-[#047857] shrink-0">Load</span>
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Route Output Panel */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="font-display text-lg font-bold text-[#0F172A]">
                Route Telemetry &amp; Directions
              </h2>
              <p className="text-xs font-mono text-slate-500 mt-0.5 tabular-nums">
                {startCoords} → {endCoords} ({routeType})
              </p>
            </div>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900"
            >
              <p className="font-semibold">OneMap Request Notice</p>
              <p className="mt-1 text-xs leading-relaxed">{errorMsg}</p>
            </div>
          )}

          {!routeData && !errorMsg && (
            <div className="py-12 text-center space-y-2">
              <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-medium text-slate-700">
                Select your Singapore origin, volunteer hub, and travel mode.
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Click &ldquo;Get Live OneMap Route&rdquo; to request real-time token exchange and
                turn-by-turn routing from <code className="font-mono">/api/onemap</code>.
              </p>
            </div>
          )}

          {routeData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500">Total Distance</p>
                  <p className="mt-1 font-mono text-xl font-bold text-[#0F172A] tabular-nums">
                    {summaryDistanceKm ? `${summaryDistanceKm} km` : '—'}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500">Est. Duration</p>
                  <p className="mt-1 font-mono text-xl font-bold text-[#047857] tabular-nums">
                    {summaryDurationMin ? `${summaryDurationMin} min` : '—'}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1 bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500">Travel Mode</p>
                  <p className="mt-1 font-display text-lg font-bold text-[#0F172A] uppercase">
                    {routeType}
                  </p>
                </div>
              </div>

              {svgPolylinePath && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-600 mb-2">
                    OneMap Geometry Trace
                  </p>
                  <svg
                    viewBox="0 0 440 220"
                    className="w-full h-48 bg-white border border-slate-200 rounded-lg"
                    role="img"
                    aria-label="OneMap decoded route polyline"
                  >
                    <polyline
                      fill="none"
                      stroke="#047857"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={svgPolylinePath.pointsAttr}
                    />
                    <circle
                      cx={svgPolylinePath.startPt[0]}
                      cy={svgPolylinePath.startPt[1]}
                      r="6"
                      fill="#0F172A"
                    />
                    <circle
                      cx={svgPolylinePath.endPt[0]}
                      cy={svgPolylinePath.endPt[1]}
                      r="6"
                      fill="#F59E0B"
                    />
                  </svg>
                </div>
              )}

              {instructions.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">Step</th>
                        <th className="py-2.5 px-4 font-semibold">Instruction</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Distance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {instructions.map((step, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-4 font-mono text-slate-500 tabular-nums">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-4 text-[#0F172A]">{step.text}</td>
                          <td className="py-2.5 px-4 font-mono text-right text-slate-600 tabular-nums whitespace-nowrap">
                            {step.distanceMeters != null ? `${Math.round(step.distanceMeters)} m` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
