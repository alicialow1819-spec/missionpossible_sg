import { useEffect, useState } from 'react';
import CommitmentsScreen from './components/CommitmentsScreen';
import InitiativesScreen from './components/InitiativesScreen';
import OneMapRouteScreen from './components/OneMapRouteScreen';
import SingaporeCalendarScreen from './components/SingaporeCalendarScreen';
import {
  INITIAL_BOOKINGS,
  INITIAL_INITIATIVES,
  INITIAL_PLEDGES,
  INITIAL_SHIFT_SLOTS,
  Initiative,
  SgdPledgeRecord,
  VolunteerBooking,
  VolunteerShiftSlot,
} from './data/singaporeData';

type ActiveScreen = 'initiatives' | 'calendar' | 'routes' | 'commitments';

const STORAGE_KEYS = {
  initiatives: 'kindred_sg_initiatives_v1',
  shifts: 'kindred_sg_shifts_v1',
  bookings: 'kindred_sg_bookings_v1',
  pledges: 'kindred_sg_pledges_v1',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('initiatives');
  const [calendarInitiativeFilter, setCalendarInitiativeFilter] = useState<string>('all');
  const [routeDestinationCoords, setRouteDestinationCoords] = useState<string | undefined>(
    undefined
  );

  const [initiatives, setInitiatives] = useState<Initiative[]>(() =>
    loadFromStorage(STORAGE_KEYS.initiatives, INITIAL_INITIATIVES)
  );
  const [shifts, setShifts] = useState<VolunteerShiftSlot[]>(() =>
    loadFromStorage(STORAGE_KEYS.shifts, INITIAL_SHIFT_SLOTS)
  );
  const [bookings, setBookings] = useState<VolunteerBooking[]>(() =>
    loadFromStorage(STORAGE_KEYS.bookings, INITIAL_BOOKINGS)
  );
  const [pledges, setPledges] = useState<SgdPledgeRecord[]>(() =>
    loadFromStorage(STORAGE_KEYS.pledges, INITIAL_PLEDGES)
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.initiatives, JSON.stringify(initiatives));
    } catch {
      // ignore quota errors
    }
  }, [initiatives]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.shifts, JSON.stringify(shifts));
    } catch {
      // ignore quota errors
    }
  }, [shifts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(bookings));
    } catch {
      // ignore quota errors
    }
  }, [bookings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.pledges, JSON.stringify(pledges));
    } catch {
      // ignore quota errors
    }
  }, [pledges]);

  function handlePledgeSgd(initiativeId: string, donorName: string, amountSgd: number) {
    const target = initiatives.find((i) => i.id === initiativeId);
    if (!target) return;

    const matchedSgd = Math.round(amountSgd * target.matchRatio * 100) / 100;
    const totalSgd = Math.round((amountSgd + matchedSgd) * 100) / 100;

    setInitiatives((prev) =>
      prev.map((item) =>
        item.id === initiativeId
          ? {
              ...item,
              citizenRaisedSgd: item.citizenRaisedSgd + amountSgd,
              enterpriseMatchedSgd: item.enterpriseMatchedSgd + matchedSgd,
            }
          : item
      )
    );

    const record: SgdPledgeRecord = {
      id: `pl-${Date.now()}`,
      initiativeId: target.id,
      initiativeTitle: target.title,
      donorName,
      citizenAmountSgd: amountSgd,
      enterpriseMatchedSgd: matchedSgd,
      totalImpactSgd: totalSgd,
      enterprisePartner: target.enterprisePartner,
      createdAt: new Date().toISOString(),
    };
    setPledges((prev) => [record, ...prev]);
  }

  async function handleSendWhatsAppReminder(
    bookingId: string,
    recipientPhone: string,
    templateName: string
  ): Promise<{ ok: boolean; message: string; messageId?: string | null }> {
    try {
      const resp = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: recipientPhone,
          templateName,
          languageCode: 'en_US',
        }),
      });
      const json = (await resp.json()) as {
        ok?: boolean;
        messageId?: string | null;
        error?: string;
        recipient?: string;
      };

      if (!resp.ok || !json.ok) {
        return {
          ok: false,
          message: json.error || `WhatsApp API request returned HTTP ${resp.status}.`,
        };
      }

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                status: 'Reminder Sent',
                whatsappMessageId: json.messageId ?? undefined,
              }
            : b
        )
      );

      return {
        ok: true,
        message: `WhatsApp reminder sent to +${json.recipient ?? recipientPhone}.`,
        messageId: json.messageId ?? null,
      };
    } catch (err) {
      return {
        ok: false,
        message:
          err instanceof Error
            ? `Failed to call /api/whatsapp: ${err.message}`
            : 'Failed to call /api/whatsapp.',
      };
    }
  }

  async function handleBookShift(params: {
    shift: VolunteerShiftSlot;
    volunteerName: string;
    volunteerEmail: string;
    volunteerPhone: string;
    sendWhatsAppNow: boolean;
  }): Promise<{ booking: VolunteerBooking; whatsappNote?: string }> {
    const init = initiatives.find((i) => i.id === params.shift.initiativeId)!;
    const matchedImpactSgd =
      Math.round(params.shift.durationHours * init.volunteerHourlyMatchSgd * 100) / 100;

    const newBooking: VolunteerBooking = {
      id: `bk-sg-${Date.now()}`,
      shiftId: params.shift.id,
      initiativeId: init.id,
      initiativeTitle: init.title,
      charityName: init.charityName,
      venueName: init.venueName,
      postalCode: init.postalCode,
      date: params.shift.date,
      startTimeSgt: params.shift.startTimeSgt,
      endTimeSgt: params.shift.endTimeSgt,
      durationHours: params.shift.durationHours,
      roleTitle: params.shift.roleTitle,
      volunteerName: params.volunteerName,
      volunteerEmail: params.volunteerEmail,
      volunteerPhone: params.volunteerPhone,
      matchedImpactSgd,
      status: 'Confirmed',
      createdAt: new Date().toISOString(),
    };

    setShifts((prev) =>
      prev.map((slot) =>
        slot.id === params.shift.id
          ? { ...slot, spotsTaken: Math.min(slot.totalSpots, slot.spotsTaken + 1) }
          : slot
      )
    );

    setInitiatives((prev) =>
      prev.map((item) =>
        item.id === init.id
          ? {
              ...item,
              enterpriseMatchedSgd: item.enterpriseMatchedSgd + matchedImpactSgd,
            }
          : item
      )
    );

    setBookings((prev) => [newBooking, ...prev]);

    let whatsappNote: string | undefined;
    if (params.sendWhatsAppNow) {
      const waRes = await handleSendWhatsAppReminder(
        newBooking.id,
        params.volunteerPhone,
        'hello_world'
      );
      whatsappNote = waRes.message;
    }

    return { booking: newBooking, whatsappNote };
  }

  function openRouteToInitiative(init: Initiative) {
    setRouteDestinationCoords(`${init.coordinates.lat},${init.coordinates.lng}`);
    setActiveScreen('routes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openRouteToInitiativeId(initiativeId: string) {
    const init = initiatives.find((i) => i.id === initiativeId);
    if (init) openRouteToInitiative(init);
  }

  const totalVerifiedHours = bookings.reduce((sum, b) => sum + b.durationHours, 0) + 1414;

  const navItems: Array<{ id: ActiveScreen; label: string }> = [
    { id: 'initiatives', label: 'Initiatives' },
    { id: 'calendar', label: 'Volunteer Calendar' },
    { id: 'routes', label: 'Route Planner' },
    { id: 'commitments', label: 'My Commitments' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Wordmark */}
          <button
            type="button"
            onClick={() => setActiveScreen('initiatives')}
            className="font-display text-lg font-bold tracking-tight text-[#064E3B] whitespace-nowrap shrink-0 cursor-pointer"
          >
            Mission Possible!
          </button>

          {/* Zone 2: 4 Single-line Nav Links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium"
          >
            {navItems.map((item) => {
              const active = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id === 'calendar') setCalendarInitiativeFilter('all');
                    setActiveScreen(item.id);
                  }}
                  className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'text-[#047857] border-[#047857] font-semibold'
                      : 'text-slate-600 border-transparent hover:text-[#0F172A]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary CTA */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => {
                setCalendarInitiativeFilter('all');
                setActiveScreen('calendar');
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#047857] hover:bg-[#064E3B] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Book a Shift
            </button>
          </div>
        </div>

        {/* Mobile Nav Strip */}
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden border-t border-slate-100 px-4 py-2 flex items-center gap-4 overflow-x-auto text-xs font-medium"
        >
          {navItems.map((item) => {
            const active = activeScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveScreen(item.id)}
                className={`py-1 whitespace-nowrap shrink-0 cursor-pointer ${
                  active ? 'text-[#047857] font-semibold' : 'text-slate-600'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-10">
        {activeScreen === 'initiatives' && (
          <InitiativesScreen
            initiatives={initiatives}
            totalVerifiedHours={totalVerifiedHours}
            onPledgeSgd={handlePledgeSgd}
            onOpenCalendarForInitiative={(initiativeId) => {
              setCalendarInitiativeFilter(initiativeId);
              setActiveScreen('calendar');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenRouteToInitiative={openRouteToInitiative}
          />
        )}

        {activeScreen === 'calendar' && (
          <SingaporeCalendarScreen
            initiatives={initiatives}
            shifts={shifts}
            initialInitiativeFilter={calendarInitiativeFilter}
            onBookShift={handleBookShift}
            onNavigateToCommitments={() => {
              setActiveScreen('commitments');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeScreen === 'routes' && (
          <OneMapRouteScreen
            initiatives={initiatives}
            preselectedDestinationCoords={routeDestinationCoords}
          />
        )}

        {activeScreen === 'commitments' && (
          <CommitmentsScreen
            bookings={bookings}
            pledges={pledges}
            initiatives={initiatives}
            onSendWhatsAppReminder={handleSendWhatsAppReminder}
            onOpenRouteToInitiativeId={openRouteToInitiativeId}
          />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display font-semibold text-[#0F172A]">Mission Possible!</span>
            <span aria-hidden="true">·</span>
            <span>Singapore Civic Engagement &amp; SGD Matching Registry</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span>Currency: SGD (S$)</span>
            <span aria-hidden="true">·</span>
            <span>Timezone: Asia/Singapore (SGT)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
