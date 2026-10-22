import React, { useState } from 'react';
import { 
  Sparkles, 
  Users, 
  IndianRupee, 
  MapPin, 
  Calendar as CalendarIcon, 
  CheckCircle2,
  FileText
} from 'lucide-react';
import type { EventInput, EventVibe } from '../types/plan';
import { formatINR } from '../utils/formatters';

interface EventFormProps {
  initialValues?: EventInput;
  onSubmit: (values: EventInput) => void;
  isLoading: boolean;
}

const COMMON_EVENT_TYPES = [
  "College Farewell Party",
  "College Fresher's Welcome",
  "Birthday Celebration",
  "Family Anniversary / Reunion",
  "Tech Hackathon / Demo Day",
  "Startup Team Dinner & Offsite",
  "Society Diwali / Holi Fest",
  "Engagement & Sangeet Gathering",
];

const POPULAR_CITIES = [
  "Bengaluru",
  "Mumbai",
  "Delhi NCR",
  "Pune",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Jaipur",
  "Ahmedabad",
  "Lucknow",
  "Chandigarh",
  "Kochi",
];

const BUDGET_PRESETS = [
  25000,
  50000,
  100000,
  200000,
  500000,
];

const GUEST_PRESETS = [
  25,
  50,
  100,
  200,
  350,
];

function numberToIndianWords(num: number): string {
  if (!num || isNaN(num)) return '';
  if (num >= 10000000) {
    const cr = (num / 10000000).toFixed(1);
    return `${cr.endsWith('.0') ? cr.slice(0, -2) : cr} Crore Rupees`;
  }
  if (num >= 100000) {
    const lakh = (num / 100000).toFixed(1);
    return `${lakh.endsWith('.0') ? lakh.slice(0, -2) : lakh} Lakh Rupees`;
  }
  if (num >= 1000) {
    const thousand = (num / 1000).toFixed(0);
    return `${thousand} Thousand Rupees`;
  }
  return `${num} Rupees`;
}

export const EventForm: React.FC<EventFormProps> = ({ initialValues, onSubmit, isLoading }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultDateStr = new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0];

  const [eventType, setEventType] = useState(initialValues?.eventType || "College Farewell Party");
  const [eventDate, setEventDate] = useState(initialValues?.eventDate || defaultDateStr);
  const [guests, setGuests] = useState<number>(initialValues?.guests || 80);
  const [budget, setBudget] = useState<number>(initialValues?.budget || 60000);
  const [city, setCity] = useState(initialValues?.city || 'Pune');
  const [vibe, setVibe] = useState<EventVibe>(initialValues?.vibe || 'fun');
  const [notes, setNotes] = useState(initialValues?.notes || '');
  const [customCity, setCustomCity] = useState(false);

  React.useEffect(() => {
    if (initialValues) {
      setEventType(initialValues.eventType);
      setEventDate(initialValues.eventDate);
      setGuests(initialValues.guests);
      setBudget(initialValues.budget);
      setCity(initialValues.city);
      setVibe(initialValues.vibe);
      setNotes(initialValues.notes || '');
      if (!POPULAR_CITIES.includes(initialValues.city)) {
        setCustomCity(true);
      }
    }
  }, [initialValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventType.trim() || !eventDate || !guests || !budget || !city.trim()) {
      return;
    }
    onSubmit({
      eventType: eventType.trim(),
      eventDate,
      guests: Number(guests),
      budget: Number(budget),
      city: city.trim(),
      vibe,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 bg-[#F5F7FA] border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#111111] font-display flex items-center gap-2">
            <span>Tell PlanPilot About Your Event</span>
            <span className="text-[#2563EB]">✨</span>
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Takes less than 1 minute. We will create your rupee budget, countdown timeline, vendor checklist, and creative ideas.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-7">
        {/* Event Type */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-bold text-[#111111] uppercase tracking-wide">
              1. Event Type <span className="text-[#2563EB]">*</span>
            </label>
            <span className="text-xs text-slate-500 font-medium">Select or type custom</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {COMMON_EVENT_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setEventType(type)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition border cursor-pointer ${
                  eventType === type
                    ? 'bg-[#0B1F4B] border-[#0B1F4B] text-white shadow-sm'
                    : 'bg-[#F5F7FA] border-slate-200 text-[#111111] hover:bg-slate-200/70 hover:border-slate-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <input
            type="text"
            required
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            placeholder="e.g. Mechanical Dept Annual Dinner, Rooftop Holi Party..."
            className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white text-[#111111] font-medium text-base focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/10 transition"
          />
        </div>

        {/* Date and Guests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Event Date */}
          <div>
            <label className="block text-sm font-bold text-[#111111] uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-[#2563EB]" />
              <span>2. Event Date <span className="text-[#2563EB]">*</span></span>
            </label>
            <input
              type="date"
              required
              min={todayStr}
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white text-[#111111] font-medium text-base focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/10 transition"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              PlanPilot will build a backward countdown milestone plan from this date.
            </p>
          </div>

          {/* Number of Guests */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-[#111111] uppercase tracking-wide flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#2563EB]" />
                <span>3. Number of Guests <span className="text-[#2563EB]">*</span></span>
              </label>
              <span className="text-xs font-bold text-[#0B1F4B] bg-[#F5F7FA] px-2.5 py-0.5 rounded-full border border-slate-200">
                {guests} people
              </span>
            </div>

            <div className="flex items-center gap-2 mb-2.5">
              {GUEST_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setGuests(preset)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    guests === preset
                      ? 'bg-[#0B1F4B] border-[#0B1F4B] text-white shadow-sm'
                      : 'bg-[#F5F7FA] border-slate-200 text-[#111111] hover:bg-slate-200/70'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <input
              type="number"
              required
              min={5}
              max={5000}
              value={guests}
              onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white text-[#111111] font-medium text-base focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/10 transition"
              placeholder="Enter exact count"
            />
          </div>
        </div>

        {/* Budget in Rupees & City */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Budget */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-[#111111] uppercase tracking-wide flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-[#2563EB]" />
                <span>4. Total Budget (₹ INR) <span className="text-[#2563EB]">*</span></span>
              </label>
              <span className="text-xs font-bold text-[#0B1F4B] bg-[#F5F7FA] px-2.5 py-0.5 rounded-full border border-slate-200">
                {formatINR(budget)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
              {BUDGET_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setBudget(preset)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    budget === preset
                      ? 'bg-[#0B1F4B] border-[#0B1F4B] text-white shadow-sm'
                      : 'bg-[#F5F7FA] border-slate-200 text-[#111111] hover:bg-slate-200/70'
                  }`}
                >
                  {formatINR(preset)}
                </button>
              ))}
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">
                ₹
              </span>
              <input
                type="number"
                required
                min={2000}
                step={500}
                value={budget}
                onChange={(e) => setBudget(Math.max(1000, parseInt(e.target.value) || 0))}
                className="w-full pl-9 pr-4 py-3 rounded-2xl border border-slate-300 bg-white text-[#111111] font-bold text-lg focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/10 transition"
                placeholder="50000"
              />
            </div>
            {budget > 0 && (
              <p className="text-xs text-[#0B1F4B] font-semibold mt-1.5 flex items-center gap-1">
                <span>≈ {numberToIndianWords(budget)}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-600">(≈ {formatINR(Math.round(budget / Math.max(1, guests)))} per guest)</span>
              </p>
            )}
          </div>

          {/* City */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-[#111111] uppercase tracking-wide flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#2563EB]" />
                <span>5. Host City in India <span className="text-[#2563EB]">*</span></span>
              </label>
              <button
                type="button"
                onClick={() => setCustomCity(!customCity)}
                className="text-xs text-[#2563EB] hover:underline font-semibold cursor-pointer"
              >
                {customCity ? 'Choose from list' : 'Other city?'}
              </button>
            </div>

            {!customCity ? (
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white text-[#111111] font-semibold text-base focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/10 transition"
              >
                {POPULAR_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city name (e.g. Indore, Nagpur, Coimbatore)..."
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white text-[#111111] font-medium text-base focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/10 transition"
              />
            )}
            <p className="text-xs text-slate-500 mt-1.5">
              Rates and vendor availability are calibrated specifically for {city}.
            </p>
          </div>
        </div>

        {/* Vibe Selection */}
        <div>
          <label className="block text-sm font-bold text-[#111111] uppercase tracking-wide mb-2.5">
            6. What's The Vibe? <span className="text-[#2563EB]">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Fun */}
            <div
              onClick={() => setVibe('fun')}
              className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col justify-between ${
                vibe === 'fun'
                  ? 'border-[#0B1F4B] bg-[#F5F7FA] shadow-sm ring-2 ring-blue-900/10'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-[#F5F7FA]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">🎉</span>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                  vibe === 'fun' ? 'border-[#0B1F4B] bg-[#0B1F4B] text-white' : 'border-slate-300'
                }`}>
                  {vibe === 'fun' && <CheckCircle2 className="w-4 h-4" />}
                </span>
              </div>
              <div>
                <h4 className="font-bold text-[#111111] text-base">Fun & Lively</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  High energy, upbeat music, icebreakers, party food & photo moments.
                </p>
              </div>
            </div>

            {/* Formal */}
            <div
              onClick={() => setVibe('formal')}
              className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col justify-between ${
                vibe === 'formal'
                  ? 'border-[#0B1F4B] bg-[#F5F7FA] shadow-sm ring-2 ring-blue-900/10'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-[#F5F7FA]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">👔</span>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                  vibe === 'formal' ? 'border-[#0B1F4B] bg-[#0B1F4B] text-white' : 'border-slate-300'
                }`}>
                  {vibe === 'formal' && <CheckCircle2 className="w-4 h-4" />}
                </span>
              </div>
              <div>
                <h4 className="font-bold text-[#111111] text-base">Formal & Elegant</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Polished decor, structured agenda, seated dinner & speeches.
                </p>
              </div>
            </div>

            {/* Budget-Friendly */}
            <div
              onClick={() => setVibe('budget-friendly')}
              className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col justify-between ${
                vibe === 'budget-friendly'
                  ? 'border-[#0B1F4B] bg-[#F5F7FA] shadow-sm ring-2 ring-blue-900/10'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-[#F5F7FA]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">💡</span>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                  vibe === 'budget-friendly' ? 'border-[#0B1F4B] bg-[#0B1F4B] text-white' : 'border-slate-300'
                }`}>
                  {vibe === 'budget-friendly' && <CheckCircle2 className="w-4 h-4" />}
                </span>
              </div>
              <div>
                <h4 className="font-bold text-[#111111] text-base">Budget-Friendly</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Smart DIY hacks, high-value menu, zero wastage & maximum warmth.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Optional Notes */}
        <div>
          <label className="block text-sm font-bold text-[#111111] uppercase tracking-wide mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>7. Any Specific Requirements or Venue Constraints? (Optional)</span>
            </span>
            <span className="text-xs text-slate-400 font-normal">Optional</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Vegetarian only, event ends at 10 PM sharp, college campus venue, need projector for presentations..."
            className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white text-[#111111] font-medium text-sm focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/10 transition"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-2xl bg-[#0B1F4B] hover:bg-[#142a63] text-white font-extrabold text-lg sm:text-xl shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-60 cursor-pointer"
          >
            <Sparkles className="w-6 h-6 text-[#2563EB] animate-pulse" />
            <span>{isLoading ? 'Crafting Your Event Plan...' : 'Generate My Event Master Plan'}</span>
          </button>
          <p className="text-center text-xs text-slate-500 mt-2.5">
            Powered by Gemini AI · Tailored for first-time organizers in India with exact rupee balance
          </p>
        </div>
      </form>
    </div>
  );
};
