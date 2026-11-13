import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  MapPin,
  MessageSquare,
  Navigation,
  Send,
} from 'lucide-react';
import {
  Initiative,
  SgdPledgeRecord,
  VolunteerBooking,
  formatSgReadableDate,
  formatSgd,
} from '../data/singaporeData';

interface CommitmentsScreenProps {
  bookings: VolunteerBooking[];
  pledges: SgdPledgeRecord[];
  initiatives: Initiative[];
  onSendWhatsAppReminder: (
    bookingId: string,
    recipientPhone: string,
    templateName: string
  ) => Promise<{ ok: boolean; message: string; messageId?: string | null }>;
  onOpenRouteToInitiativeId: (initiativeId: string) => void;
}

export default function CommitmentsScreen({
  bookings,
  pledges,
  onSendWhatsAppReminder,
  onOpenRouteToInitiativeId,
}: CommitmentsScreenProps) {
  const [selectedBookingId, setSelectedBookingId] = useState<string>(bookings[0]?.id ?? '');
  const [phoneInput, setPhoneInput] = useState<string>(
    bookings[0]?.volunteerPhone ?? '6591234567'
  );
  const [templateName, setTemplateName] = useState<string>('hello_world');
  const [waConfigured, setWaConfigured] = useState<boolean | null>(null);
  const [sending, setSending] = useState(false);
  const [waStatus, setWaStatus] = useState<{
    ok: boolean;
    message: string;
    messageId?: string | null;
  } | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => {
        setWaConfigured(Boolean(data?.integrations?.whatsapp?.configured));
      })
      .catch(() => {
        setWaConfigured(false);
      });
  }, []);

  useEffect(() => {
    const found = bookings.find((b) => b.id === selectedBookingId);
    if (found) {
      setPhoneInput(found.volunteerPhone);
    } else if (bookings[0]) {
      setSelectedBookingId(bookings[0].id);
      setPhoneInput(bookings[0].volunteerPhone);
    }
  }, [selectedBookingId, bookings]);

  async function handleDispatchReminder(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBookingId) return;
    setSending(true);
    setWaStatus(null);
    try {
      const result = await onSendWhatsAppReminder(
        selectedBookingId,
        phoneInput.trim(),
        templateName.trim() || 'hello_world'
      );
      setWaStatus(result);
    } finally {
      setSending(false);
    }
  }

  const totalBookedHours = bookings.reduce((sum, b) => sum + b.durationHours, 0);
  const totalShiftMatchSgd = bookings.reduce((sum, b) => sum + b.matchedImpactSgd, 0);
  const totalPledgeImpactSgd = pledges.reduce((sum, p) => sum + p.totalImpactSgd, 0);

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold text-[#047857]">
          Personal Civic Ledger · WhatsApp Cloud API v23.0
        </p>
        <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
          My Commitments &amp; Shift Reminders
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Review your confirmed Singapore volunteer shifts, SGD matched contributions, and trigger
          WhatsApp shift reminders.
        </p>
      </div>

      {/* Personal Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-semibold text-slate-500">Booked Volunteer Hours</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-[#0F172A] tabular-nums">
            {totalBookedHours.toFixed(1)} hrs
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-semibold text-slate-500">Corporate Match from Shifts</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-[#047857] tabular-nums">
            {formatSgd(totalShiftMatchSgd)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-semibold text-slate-500">Total Pledged SGD Impact</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-[#92400E] tabular-nums">
            {formatSgd(totalPledgeImpactSgd)}
          </p>
        </div>
      </div>

      {/* 12-Col Split: Bookings List + WhatsApp Reminder Dispatch */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Booked Volunteer Shifts */}
        <section className="lg:col-span-7 space-y-4">
          <h2 className="font-display text-xl font-bold text-[#0F172A]">
            Upcoming Singapore Shifts ({bookings.length})
          </h2>

          {bookings.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
              <p className="text-sm font-medium text-slate-700">
                No volunteer shifts booked yet.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Visit the Volunteer Calendar to reserve an upcoming slot in Singapore Time.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((bk) => {
                const isSelected = bk.id === selectedBookingId;
                return (
                  <div
                    key={bk.id}
                    className={`bg-white border rounded-2xl p-5 space-y-3 transition-colors ${
                      isSelected ? 'border-[#047857]' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          {formatSgReadableDate(bk.date)} · {bk.startTimeSgt}–{bk.endTimeSgt} SGT ·{' '}
                          {bk.charityName}
                        </p>
                        <h3 className="mt-1 font-display text-lg font-semibold text-[#0F172A]">
                          {bk.initiativeTitle}
                        </h3>
                      </div>

                      <span
                        className={`text-xs font-semibold tabular-nums ${
                          bk.status === 'Reminder Sent' ? 'text-[#047857]' : 'text-[#92400E]'
                        }`}
                      >
                        {bk.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#047857]" />
                        {bk.venueName}, {bk.postalCode}
                      </span>
                      <span>Role: {bk.roleTitle}</span>
                      <span className="font-mono font-semibold text-[#047857] tabular-nums">
                        +{formatSgd(bk.matchedImpactSgd)} matched
                      </span>
                    </div>

                    {bk.whatsappMessageId && (
                      <p className="text-[11px] font-mono text-slate-500">
                        WhatsApp Message ID: {bk.whatsappMessageId}
                      </p>
                    )}

                    <div className="pt-2 flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setSelectedBookingId(bk.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#047857] hover:bg-[#064E3B] rounded-lg cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Prepare WhatsApp Reminder
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenRouteToInitiativeId(bk.initiativeId)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0F172A] bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        OneMap Route
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* WhatsApp Cloud API Dispatch Panel */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div>
            <p className="text-xs font-semibold text-[#047857]">
              Serverless Endpoint · POST /api/whatsapp
            </p>
            <h2 className="mt-1 font-display text-lg font-bold text-[#0F172A]">
              WhatsApp Volunteer Reminder
            </h2>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              Dispatches a Meta Graph API v23.0 template notification to remind volunteers of
              their upcoming Singapore shift.
            </p>
          </div>

          {waConfigured === false && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-[#92400E]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">WhatsApp credentials pending in server environment</p>
                <p className="mt-1">
                  Set{' '}
                  <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">
                    WHATSAPP_PHONE_NUMBER_ID
                  </code>{' '}
                  and{' '}
                  <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">
                    WHATSAPP_ACCESS_TOKEN
                  </code>{' '}
                  in your server environment to send live messages.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleDispatchReminder} className="space-y-4">
            <div>
              <label
                htmlFor="wa-shift-select"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Booked Volunteer Shift
              </label>
              <select
                id="wa-shift-select"
                value={selectedBookingId}
                onChange={(e) => setSelectedBookingId(e.target.value)}
                disabled={bookings.length === 0}
                className="w-full h-11 px-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#047857]"
              >
                {bookings.map((bk) => (
                  <option key={bk.id} value={bk.id}>
                    {bk.date} · {bk.initiativeTitle}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="wa-recipient-phone"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Recipient Singapore Phone (with 65 country code)
              </label>
              <input
                id="wa-recipient-phone"
                type="tel"
                required
                placeholder="6591234567"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full h-11 px-3.5 font-mono text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#047857]"
              />
            </div>

            <div>
              <label
                htmlFor="wa-template-name"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                WhatsApp Template Name
              </label>
              <input
                id="wa-template-name"
                type="text"
                required
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full h-11 px-3.5 font-mono text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#047857]"
              />
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] font-mono text-slate-700 overflow-x-auto">
              <pre>{JSON.stringify(
                {
                  messaging_product: 'whatsapp',
                  to: phoneInput || '<RECIPIENT_PHONE>',
                  type: 'template',
                  template: {
                    name: templateName || 'hello_world',
                    language: { code: 'en_US' },
                  },
                },
                null,
                2
              )}</pre>
            </div>

            <button
              type="submit"
              disabled={sending || bookings.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold text-white bg-[#047857] hover:bg-[#064E3B] disabled:opacity-60 rounded-lg cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Sending via WhatsApp API...' : 'Send WhatsApp Reminder'}
            </button>
          </form>

          {waStatus && (
            <div
              role="status"
              className={`border rounded-xl p-4 text-xs ${
                waStatus.ok
                  ? 'bg-[#ECFDF5] border-[#047857]/30 text-[#064E3B]'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              <div className="flex items-start gap-2">
                {waStatus.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{waStatus.message}</p>
                  {waStatus.messageId && (
                    <p className="font-mono mt-1">Message ID: {waStatus.messageId}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Verified SGD Contributions Ledger */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-[#0F172A]">
          Verified SGD Contribution Ledger
        </h2>
        <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
              <tr>
                <th className="py-3 px-5 font-semibold">Date (SGT)</th>
                <th className="py-3 px-5 font-semibold">Initiative</th>
                <th className="py-3 px-5 font-semibold">Contributor</th>
                <th className="py-3 px-5 font-semibold text-right">Citizen (SGD)</th>
                <th className="py-3 px-5 font-semibold text-right">Enterprise Match (SGD)</th>
                <th className="py-3 px-5 font-semibold text-right">Total Impact (SGD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular-nums">
              {pledges.map((pl) => (
                <tr key={pl.id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-5 font-mono text-xs text-slate-600 whitespace-nowrap">
                    {pl.createdAt.slice(0, 10)}
                  </td>
                  <td className="py-3.5 px-5 font-medium text-[#0F172A]">{pl.initiativeTitle}</td>
                  <td className="py-3.5 px-5 text-slate-600">{pl.donorName}</td>
                  <td className="py-3.5 px-5 font-mono text-right text-[#0F172A]">
                    {formatSgd(pl.citizenAmountSgd)}
                  </td>
                  <td className="py-3.5 px-5 font-mono text-right text-[#92400E]">
                    {formatSgd(pl.enterpriseMatchedSgd)}
                  </td>
                  <td className="py-3.5 px-5 font-mono font-semibold text-right text-[#047857]">
                    {formatSgd(pl.totalImpactSgd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
