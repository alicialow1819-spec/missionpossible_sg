import { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  MessageSquare,
  Users,
} from 'lucide-react';
import {
  Initiative,
  SINGAPORE_PUBLIC_HOLIDAYS,
  VolunteerBooking,
  VolunteerShiftSlot,
  formatSgReadableDate,
  formatSgd,
  getSingaporeTodayIso,
} from '../data/singaporeData';

interface SingaporeCalendarScreenProps {
  initiatives: Initiative[];
  shifts: VolunteerShiftSlot[];
  initialInitiativeFilter?: string;
  onBookShift: (params: {
    shift: VolunteerShiftSlot;
    volunteerName: string;
    volunteerEmail: string;
    volunteerPhone: string;
    sendWhatsAppNow: boolean;
  }) => Promise<{ booking: VolunteerBooking; whatsappNote?: string }>;
  onNavigateToCommitments: () => void;
}

const WEEKDAYS_SG = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export default function SingaporeCalendarScreen({
  initiatives,
  shifts,
  initialInitiativeFilter = 'all',
  onBookShift,
  onNavigateToCommitments,
}: SingaporeCalendarScreenProps) {
  const sgToday = getSingaporeTodayIso();
  // Default to Nov 2026 so seeded Singapore shifts & Deepavali PH are immediately visible
  const [viewYear, setViewYear] = useState<number>(2026);
  const [viewMonth, setViewMonth] = useState<number>(11); // 1-indexed (11 = November)
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-14');
  const [initiativeFilter, setInitiativeFilter] = useState<string>(initialInitiativeFilter);

  const [bookingShift, setBookingShift] = useState<VolunteerShiftSlot | null>(null);
  const [volunteerName, setVolunteerName] = useState('Alicia Low');
  const [volunteerEmail, setVolunteerEmail] = useState('alicialow1819@gmail.com');
  const [volunteerPhone, setVolunteerPhone] = useState('6591234567');
  const [sendWhatsAppNow, setSendWhatsAppNow] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    booking: VolunteerBooking;
    whatsappNote?: string;
  } | null>(null);

  const initiativeMap = useMemo(() => {
    const map = new Map<string, Initiative>();
    for (const item of initiatives) map.set(item.id, item);
    return map;
  }, [initiatives]);

  const holidayMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const h of SINGAPORE_PUBLIC_HOLIDAYS) {
      map.set(h.date, h.name);
    }
    return map;
  }, []);

  const filteredShifts = useMemo(() => {
    return initiativeFilter === 'all'
      ? shifts
      : shifts.filter((s) => s.initiativeId === initiativeFilter);
  }, [shifts, initiativeFilter]);

  const shiftsByDate = useMemo(() => {
    const map = new Map<string, VolunteerShiftSlot[]>();
    for (const slot of filteredShifts) {
      const existing = map.get(slot.date) ?? [];
      existing.push(slot);
      map.set(slot.date, existing);
    }
    return map;
  }, [filteredShifts]);

  const monthLabel = useMemo(() => {
    const dt = new Date(Date.UTC(viewYear, viewMonth - 1, 15));
    return new Intl.DateTimeFormat('en-SG', {
      timeZone: 'Asia/Singapore',
      month: 'long',
      year: 'numeric',
    }).format(dt);
  }, [viewYear, viewMonth]);

  const calendarCells = useMemo(() => {
    const firstDayWeekday = new Date(Date.UTC(viewYear, viewMonth - 1, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(viewYear, viewMonth, 0)).getUTCDate();
    const cells: Array<{ iso: string | null; day: number | null }> = [];

    for (let i = 0; i < firstDayWeekday; i += 1) {
      cells.push({ iso: null, day: null });
    }
    for (let d = 1; d <= daysInMonth; d += 1) {
      const iso = `${viewYear}-${pad2(viewMonth)}-${pad2(d)}`;
      cells.push({ iso, day: d });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const monthHolidays = useMemo(() => {
    const prefix = `${viewYear}-${pad2(viewMonth)}-`;
    return SINGAPORE_PUBLIC_HOLIDAYS.filter((h) => h.date.startsWith(prefix));
  }, [viewYear, viewMonth]);

  const upcomingShiftDates = useMemo(() => {
    const unique = Array.from(new Set(filteredShifts.map((s) => s.date))).sort();
    return unique.slice(0, 6);
  }, [filteredShifts]);

  const selectedDateShifts = shiftsByDate.get(selectedDate) ?? [];
  const selectedHoliday = holidayMap.get(selectedDate);

  function prevMonth() {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function jumpToDate(isoDate: string) {
    const [y, m] = isoDate.split('-').map(Number);
    if (y && m) {
      setViewYear(y);
      setViewMonth(m);
      setSelectedDate(isoDate);
      setBookingShift(null);
    }
  }

  async function handleConfirmBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!bookingShift) return;
    setSubmitting(true);
    try {
      const res = await onBookShift({
        shift: bookingShift,
        volunteerName: volunteerName.trim(),
        volunteerEmail: volunteerEmail.trim(),
        volunteerPhone: volunteerPhone.trim(),
        sendWhatsAppNow,
      });
      setBookingResult(res);
      setBookingShift(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Screen Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#047857]">
            Singapore Time (SGT · UTC+8) · Official MOM Public Holidays Loaded
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
            Singapore Volunteer Booking Calendar
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Select a date in Singapore Time to view shift slots, unlocked SGD corporate match value,
            and WhatsApp reminder scheduling.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="calendar-initiative-filter" className="sr-only">
            Filter shifts by initiative
          </label>
          <select
            id="calendar-initiative-filter"
            value={initiativeFilter}
            onChange={(e) => setInitiativeFilter(e.target.value)}
            className="h-11 px-3.5 text-sm font-medium text-[#0F172A] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#047857]"
          >
            <option value="all">All Singapore Initiatives</option>
            {initiatives.map((init) => (
              <option key={init.id} value={init.id}>
                {init.district} — {init.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {bookingResult && (
        <div
          role="status"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#ECFDF5] border border-[#047857]/30 rounded-xl p-5"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#047857] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#064E3B]">
                Shift Confirmed: {bookingResult.booking.initiativeTitle}
              </p>
              <p className="text-xs sm:text-sm text-[#047857] tabular-nums mt-0.5">
                {formatSgReadableDate(bookingResult.booking.date)} ·{' '}
                {bookingResult.booking.startTimeSgt}–{bookingResult.booking.endTimeSgt} SGT ·{' '}
                {formatSgd(bookingResult.booking.matchedImpactSgd)} SGD corporate match unlocked.
              </p>
              {bookingResult.whatsappNote && (
                <p className="text-xs text-slate-700 mt-1">{bookingResult.whatsappNote}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onNavigateToCommitments}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#047857] hover:bg-[#064E3B] rounded-lg cursor-pointer"
            >
              View Commitments
            </button>
            <button
              type="button"
              onClick={() => setBookingResult(null)}
              className="text-xs font-semibold text-[#064E3B] hover:underline cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Main 12-Col Split: 7-Col Singapore Calendar + 5-Col Day Shift Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Calendar Grid Card */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-[#047857]" />
              <h2 className="font-display text-lg font-bold text-[#0F172A]">{monthLabel}</h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => jumpToDate(sgToday)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                Today (SGT)
              </button>
              <button
                type="button"
                onClick={prevMonth}
                aria-label="Previous month"
                className="p-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                aria-label="Next month"
                className="p-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {WEEKDAYS_SG.map((dayName) => (
              <div
                key={dayName}
                className="py-2 text-xs font-semibold text-slate-500"
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((cell, idx) => {
              if (!cell.iso || cell.day === null) {
                return <div key={`empty-${idx}`} className="h-20 sm:h-24 rounded-lg bg-slate-50/50" />;
              }

              const dayShifts = shiftsByDate.get(cell.iso) ?? [];
              const holidayName = holidayMap.get(cell.iso);
              const isSelected = cell.iso === selectedDate;
              const isToday = cell.iso === sgToday;
              const hasShifts = dayShifts.length > 0;

              return (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => {
                    setSelectedDate(cell.iso!);
                    setBookingShift(null);
                  }}
                  className={`h-20 sm:h-24 p-2 rounded-xl border text-left flex flex-col justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#ECFDF5] border-[#047857] ring-1 ring-[#047857]'
                      : holidayName
                        ? 'bg-amber-50/60 border-amber-200 hover:border-amber-400'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`font-mono text-xs sm:text-sm font-semibold tabular-nums ${
                        isSelected
                          ? 'text-[#047857]'
                          : isToday
                            ? 'text-[#047857] underline underline-offset-4'
                            : 'text-[#0F172A]'
                      }`}
                    >
                      {cell.day}
                    </span>
                    {isToday && (
                      <span className="text-[10px] font-semibold text-[#047857]">SGT</span>
                    )}
                  </div>

                  <div className="space-y-0.5 overflow-hidden">
                    {holidayName && (
                      <p className="text-[10px] leading-tight font-semibold text-[#92400E] truncate">
                        PH: {holidayName}
                      </p>
                    )}
                    {hasShifts && (
                      <p className="text-[10px] sm:text-[11px] leading-tight font-semibold text-[#047857] tabular-nums truncate">
                        {dayShifts.length} {dayShifts.length === 1 ? 'shift' : 'shifts'}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Singapore Public Holidays & Quick Shift Dates Strip */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <span>
                <strong className="text-[#92400E]">PH</strong> = Singapore Gazetted Public Holiday (MOM)
              </span>
              {monthHolidays.length > 0 ? (
                <span className="font-medium text-[#92400E]">
                  This month: {monthHolidays.map((h) => `${h.date.slice(8)} (${h.name})`).join(' · ')}
                </span>
              ) : (
                <span>No gazetted public holidays in {monthLabel}.</span>
              )}
            </div>

            {upcomingShiftDates.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-semibold text-slate-600">Open Shift Dates:</span>
                {upcomingShiftDates.map((iso) => (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => jumpToDate(iso)}
                    className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md border transition-colors cursor-pointer tabular-nums ${
                      selectedDate === iso
                        ? 'bg-[#047857] text-white border-[#047857]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {iso}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Right Panel: Selected Date Schedule & Booking Form */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div className="pb-4 border-b border-slate-100">
            <p className="text-xs font-semibold text-[#047857]">Selected Date (SGT)</p>
            <h2 className="mt-1 font-display text-xl font-bold text-[#0F172A]">
              {formatSgReadableDate(selectedDate)}
            </h2>
            {selectedHoliday && (
              <p className="mt-1.5 text-xs font-semibold text-[#92400E]">
                Singapore Public Holiday: {selectedHoliday}
              </p>
            )}
          </div>

          {selectedDateShifts.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <p className="text-sm font-medium text-slate-700">
                No volunteer shifts scheduled on {formatSgReadableDate(selectedDate)}.
              </p>
              <p className="text-xs text-slate-500">
                Choose a highlighted date on the Singapore calendar or jump to the next open shift.
              </p>
              {upcomingShiftDates[0] && (
                <button
                  type="button"
                  onClick={() => jumpToDate(upcomingShiftDates[0])}
                  className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-[#047857] hover:bg-[#064E3B] rounded-lg cursor-pointer"
                >
                  Jump to {upcomingShiftDates[0]}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDateShifts.map((slot) => {
                const init = initiativeMap.get(slot.initiativeId);
                if (!init) return null;
                const spotsLeft = Math.max(0, slot.totalSpots - slot.spotsTaken);
                const matchValueSgd = slot.durationHours * init.volunteerHourlyMatchSgd;
                const isBookingThis = bookingShift?.id === slot.id;

                return (
                  <div
                    key={slot.id}
                    className={`border rounded-xl p-4 space-y-3 transition-colors ${
                      isBookingThis
                        ? 'border-[#047857] bg-[#ECFDF5]/40'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-[#047857]">{init.district}</p>
                        <h3 className="font-display text-base font-semibold text-[#0F172A]">
                          {init.title}
                        </h3>
                        <p className="text-xs text-slate-600 mt-0.5">Role: {slot.roleTitle}</p>
                      </div>
                      <span className="font-mono text-xs font-semibold text-[#92400E] tabular-nums shrink-0">
                        +{formatSgd(matchValueSgd, false)} match
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2 tabular-nums">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {slot.startTimeSgt} – {slot.endTimeSgt} SGT ({slot.durationHours} hrs)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {init.venueName}, {init.postalCode}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 tabular-nums">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {spotsLeft} of {slot.totalSpots} spots open · Lead: {slot.leadCoordinator}
                        </span>
                      </div>
                    </div>

                    {!isBookingThis && (
                      <button
                        type="button"
                        disabled={spotsLeft === 0}
                        onClick={() => {
                          setBookingShift(slot);
                          setBookingResult(null);
                        }}
                        className="w-full py-2.5 text-xs font-semibold text-white bg-[#047857] hover:bg-[#064E3B] disabled:bg-slate-300 rounded-lg transition-colors cursor-pointer"
                      >
                        {spotsLeft === 0 ? 'Shift Full' : 'Book Volunteer Slot'}
                      </button>
                    )}

                    {isBookingThis && (
                      <form onSubmit={handleConfirmBooking} className="pt-3 border-t border-slate-200 space-y-3">
                        <div>
                          <label
                            htmlFor="bk-name"
                            className="block text-xs font-semibold text-slate-700 mb-1"
                          >
                            Full Name
                          </label>
                          <input
                            id="bk-name"
                            type="text"
                            required
                            value={volunteerName}
                            onChange={(e) => setVolunteerName(e.target.value)}
                            className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#047857]"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label
                              htmlFor="bk-email"
                              className="block text-xs font-semibold text-slate-700 mb-1"
                            >
                              Email
                            </label>
                            <input
                              id="bk-email"
                              type="email"
                              required
                              value={volunteerEmail}
                              onChange={(e) => setVolunteerEmail(e.target.value)}
                              className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#047857]"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="bk-phone"
                              className="block text-xs font-semibold text-slate-700 mb-1"
                            >
                              Singapore Mobile (WhatsApp)
                            </label>
                            <input
                              id="bk-phone"
                              type="tel"
                              required
                              placeholder="6591234567"
                              value={volunteerPhone}
                              onChange={(e) => setVolunteerPhone(e.target.value)}
                              className="w-full h-10 px-3 font-mono text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#047857]"
                            />
                          </div>
                        </div>

                        <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={sendWhatsAppNow}
                            onChange={(e) => setSendWhatsAppNow(e.target.checked)}
                            className="mt-0.5 w-4 h-4 accent-[#047857] rounded"
                          />
                          <span className="flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-[#047857] shrink-0" />
                            Send WhatsApp Cloud API shift reminder upon confirmation
                          </span>
                        </label>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setBookingShift(null)}
                            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 text-xs font-semibold text-white bg-[#047857] hover:bg-[#064E3B] disabled:opacity-60 rounded-lg cursor-pointer"
                          >
                            {submitting ? 'Confirming...' : 'Confirm Shift Booking'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
