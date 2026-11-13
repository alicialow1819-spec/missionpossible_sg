import { useState } from 'react';
import { ArrowRight, CheckCircle2, MapPin, Navigation, X } from 'lucide-react';
import {
  HERO_IMAGE,
  Initiative,
  formatSgd,
} from '../data/singaporeData';

interface InitiativesScreenProps {
  initiatives: Initiative[];
  totalVerifiedHours: number;
  onPledgeSgd: (initiativeId: string, donorName: string, amountSgd: number) => void;
  onOpenCalendarForInitiative: (initiativeId: string) => void;
  onOpenRouteToInitiative: (initiative: Initiative) => void;
}

const CATEGORIES: Array<'All' | Initiative['category']> = [
  'All',
  'Food Security',
  'Elder Care',
  'Coastal Ecology',
  'Youth Education',
];

const PRESET_SGD_AMOUNTS = [25, 50, 100, 250];

export default function InitiativesScreen({
  initiatives,
  totalVerifiedHours,
  onPledgeSgd,
  onOpenCalendarForInitiative,
  onOpenRouteToInitiative,
}: InitiativesScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<'All' | Initiative['category']>('All');
  const [pledgeTarget, setPledgeTarget] = useState<Initiative | null>(null);
  const [pledgeAmount, setPledgeAmount] = useState<string>('50');
  const [donorName, setDonorName] = useState<string>('Alicia Low');
  const [pledgeConfirmed, setPledgeConfirmed] = useState<{
    title: string;
    citizenSgd: number;
    matchedSgd: number;
  } | null>(null);

  const filteredInitiatives =
    selectedCategory === 'All'
      ? initiatives
      : initiatives.filter((item) => item.category === selectedCategory);

  const totalCitizenSgd = initiatives.reduce((sum, i) => sum + i.citizenRaisedSgd, 0);
  const totalEnterpriseSgd = initiatives.reduce((sum, i) => sum + i.enterpriseMatchedSgd, 0);

  const parsedPledgeAmount = Math.max(0, Number(pledgeAmount) || 0);
  const previewMatchedSgd = pledgeTarget
    ? Math.round(parsedPledgeAmount * pledgeTarget.matchRatio * 100) / 100
    : 0;

  function handleConfirmPledge(e: React.FormEvent) {
    e.preventDefault();
    if (!pledgeTarget || parsedPledgeAmount <= 0 || !donorName.trim()) return;
    onPledgeSgd(pledgeTarget.id, donorName.trim(), parsedPledgeAmount);
    setPledgeConfirmed({
      title: pledgeTarget.title,
      citizenSgd: parsedPledgeAmount,
      matchedSgd: previewMatchedSgd,
    });
    setPledgeTarget(null);
  }

  return (
    <div className="space-y-12">
      {/* Hero Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-6 flex flex-col justify-between bg-white border border-slate-200 rounded-2xl p-8 lg:p-10">
          <div className="space-y-6">
            <p className="text-xs font-semibold tracking-wide text-[#047857]">
              Singapore Civic Impact Registry · SGD Mode
            </p>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight leading-[1.12] text-[#0F172A] [text-wrap:balance]">
              Turn neighbourhood hours and SGD pledges into matched civic impact.
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              Mission Possible! connects Singapore residents with IPC-screened grassroots charities.
              Every citizen dollar and verified volunteer shift unlocks transparent enterprise
              matching in Singapore Dollars.
            </p>
          </div>

          <div className="pt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => onOpenCalendarForInitiative(initiatives[0].id)}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#047857] hover:bg-[#064E3B] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Explore Volunteer Calendar
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#initiatives-grid"
              className="inline-flex items-center px-5 py-3 text-sm font-semibold text-[#0F172A] bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Browse Verified Causes
            </a>
          </div>
        </div>

        <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-slate-200 bg-emerald-950 min-h-[300px] lg:min-h-[420px]">
          <img
            src={HERO_IMAGE}
            alt="Singapore community volunteers packing fresh produce and care boxes at a sunlit pavilion"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 text-white">
            <p className="text-xs font-medium text-emerald-200">
              Our Tampines Hub · Heartland Harvest Singapore
            </p>
            <p className="mt-1 font-display text-lg font-semibold">
              Weekend food rescue packs matched 1:1 in SGD by DBS Foundation.
            </p>
          </div>
        </div>
      </section>

      {/* Full-Width 4-Column Civic KPI Strip */}
      <section
        aria-label="Singapore Impact Summary"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <p className="text-xs font-semibold text-slate-500">Citizen Contributions (SGD)</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-[#0F172A] tabular-nums">
            {formatSgd(totalCitizenSgd, false)}
          </p>
          <p className="mt-1 text-xs text-[#047857]">Verified citizen pledges deployed</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <p className="text-xs font-semibold text-slate-500">Enterprise Match Pledged</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-[#0F172A] tabular-nums">
            {formatSgd(totalEnterpriseSgd, false)}
          </p>
          <p className="mt-1 text-xs text-[#92400E]">Corporate SGD match active</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <p className="text-xs font-semibold text-slate-500">Scheduled Singapore Shifts</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-[#0F172A] tabular-nums">
            {totalVerifiedHours.toFixed(1)} hrs
          </p>
          <p className="mt-1 text-xs text-slate-600">Across Tampines, Kallang &amp; West</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <p className="text-xs font-semibold text-slate-500">Screened Charity Partners</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-[#0F172A] tabular-nums">
            {initiatives.length} Active
          </p>
          <p className="mt-1 text-xs text-slate-600">IPC &amp; NCSS governance verified</p>
        </div>
      </section>

      {pledgeConfirmed && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-4 bg-[#ECFDF5] border border-[#047857]/30 rounded-xl p-5"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#047857] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#064E3B]">
                SGD Pledge Recorded for {pledgeConfirmed.title}
              </p>
              <p className="text-sm text-[#047857] tabular-nums mt-0.5">
                {formatSgd(pledgeConfirmed.citizenSgd)} citizen pledge +{' '}
                {formatSgd(pledgeConfirmed.matchedSgd)} enterprise match ={' '}
                {formatSgd(pledgeConfirmed.citizenSgd + pledgeConfirmed.matchedSgd)} total impact.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPledgeConfirmed(null)}
            className="text-xs font-semibold text-[#064E3B] hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Initiatives Section */}
      <section id="initiatives-grid" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
              Verified Singapore Initiatives
            </h2>
            <p className="mt-1 text-sm sm:text-base text-slate-600">
              Pledge directly in SGD or reserve a volunteer slot on the Singapore calendar.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Filter initiatives by cause"
            className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg"
          >
            {CATEGORIES.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-white text-[#0F172A] shadow-xs'
                      : 'text-slate-600 hover:text-[#0F172A]'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredInitiatives.map((item) => {
            const totalRaised = item.citizenRaisedSgd + item.enterpriseMatchedSgd;
            const citizenPct = Math.min(100, (item.citizenRaisedSgd / item.goalSgd) * 100);
            const matchPct = Math.min(
              100 - citizenPct,
              (item.enterpriseMatchedSgd / item.goalSgd) * 100
            );
            const fundedPercent = Math.min(100, Math.round((totalRaised / item.goalSgd) * 100));

            return (
              <article
                key={item.id}
                className="flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden"
              >
                <div className="aspect-[4/3] w-full bg-slate-100 overflow-hidden relative">
                  <img
                    src={item.imagePath}
                    alt={item.imageAlt}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between p-6 space-y-5">
                  <div className="space-y-3">
                    {/* Unboxed 1-line metadata with typographic separators */}
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
                      <span
                        className="inline-block w-2 h-2 rounded-[2px] shrink-0"
                        style={{ backgroundColor: item.sdgColor }}
                        aria-hidden="true"
                      />
                      <span>{item.sdgLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.district}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-[#047857]">{item.matchMultiplierLabel}</span>
                    </div>

                    <div>
                      <h3 className="font-display text-xl font-semibold text-[#0F172A] leading-snug">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        {item.charityName} · {item.ipcRef} · Partner: {item.enterprisePartner}
                      </p>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed">{item.summary}</p>

                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-[#047857] shrink-0" />
                      <span>
                        {item.venueName}, {item.postalCode} · {item.mrtStation}
                      </span>
                    </div>
                  </div>

                  {/* Verified Impact Meter (Emerald citizen + Amber enterprise match in SGD) */}
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="font-semibold text-[#0F172A] tabular-nums">
                        {formatSgd(totalRaised, false)}{' '}
                        <span className="font-normal text-slate-500">
                          of {formatSgd(item.goalSgd, false)} SGD goal
                        </span>
                      </span>
                      <span className="font-mono font-semibold text-[#047857] tabular-nums">
                        {fundedPercent}% funded
                      </span>
                    </div>

                    <div
                      className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex"
                      aria-label={`Verified Impact Meter: ${fundedPercent}% funded`}
                    >
                      <div
                        className="h-full bg-[#047857]"
                        style={{ width: `${citizenPct}%` }}
                        title={`Citizen SGD: ${formatSgd(item.citizenRaisedSgd, false)}`}
                      />
                      <div
                        className="h-full bg-[#F59E0B]"
                        style={{ width: `${matchPct}%` }}
                        title={`Enterprise Match SGD: ${formatSgd(item.enterpriseMatchedSgd, false)}`}
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 tabular-nums">
                      <span>
                        <strong className="font-semibold text-[#047857]">Citizen:</strong>{' '}
                        {formatSgd(item.citizenRaisedSgd, false)}
                      </span>
                      <span>
                        <strong className="font-semibold text-[#92400E]">Matched:</strong>{' '}
                        {formatSgd(item.enterpriseMatchedSgd, false)}
                      </span>
                      <span>
                        <strong className="font-semibold text-[#0F172A]">Shift Bonus:</strong>{' '}
                        {formatSgd(item.volunteerHourlyMatchSgd)}/hr
                      </span>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setPledgeTarget(item);
                          setPledgeAmount('50');
                        }}
                        className="px-4 py-2 text-xs font-semibold text-white bg-[#047857] hover:bg-[#064E3B] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Pledge SGD
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenCalendarForInitiative(item.id)}
                        className="px-4 py-2 text-xs font-semibold text-[#0F172A] bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Book Shift
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenRouteToInitiative(item)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#047857] hover:bg-[#ECFDF5] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ml-auto"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        OneMap Route
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* SGD Pledge Modal */}
      {pledgeTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pledge-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45"
        >
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-200">
              <div>
                <p className="text-xs font-semibold text-[#047857]">
                  SGD Contribution · {pledgeTarget.matchMultiplierLabel}
                </p>
                <h3
                  id="pledge-modal-title"
                  className="mt-1 font-display text-xl font-bold text-[#0F172A]"
                >
                  {pledgeTarget.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPledgeTarget(null)}
                aria-label="Close pledge dialog"
                className="p-2 text-slate-500 hover:text-[#0F172A] rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPledge} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Select SGD Amount
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_SGD_AMOUNTS.map((amt) => {
                    const selected = Number(pledgeAmount) === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setPledgeAmount(String(amt))}
                        className={`py-2.5 text-sm font-mono font-semibold rounded-lg border transition-colors cursor-pointer ${
                          selected
                            ? 'bg-[#047857] text-white border-[#047857]'
                            : 'bg-white text-[#0F172A] border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        S${amt}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="custom-sgd-amount"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Or Enter Custom Amount (SGD)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-mono font-semibold text-slate-500">
                    S$
                  </span>
                  <input
                    id="custom-sgd-amount"
                    type="number"
                    min={1}
                    step="1"
                    required
                    value={pledgeAmount}
                    onChange={(e) => setPledgeAmount(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 font-mono text-sm text-[#0F172A] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#047857]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="donor-name"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Contributor Name (for Tax-Deductible IPC Receipt)
                </label>
                <input
                  id="donor-name"
                  type="text"
                  required
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full h-11 px-3.5 text-sm text-[#0F172A] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#047857]"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between tabular-nums">
                  <span className="text-slate-600">Your Citizen Pledge</span>
                  <span className="font-mono font-semibold text-[#0F172A]">
                    {formatSgd(parsedPledgeAmount)}
                  </span>
                </div>
                <div className="flex justify-between tabular-nums">
                  <span className="text-slate-600">
                    {pledgeTarget.enterprisePartner} Match ({pledgeTarget.matchMultiplierLabel})
                  </span>
                  <span className="font-mono font-semibold text-[#92400E]">
                    + {formatSgd(previewMatchedSgd)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between tabular-nums">
                  <span className="font-semibold text-[#0F172A]">Total SGD Deployed</span>
                  <span className="font-mono font-bold text-[#047857]">
                    {formatSgd(parsedPledgeAmount + previewMatchedSgd)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setPledgeTarget(null)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-[#047857] hover:bg-[#064E3B] rounded-lg cursor-pointer"
                >
                  Confirm SGD Pledge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
