import React from 'react';
import { Calendar, Sparkles, Compass, IndianRupee, Users, PartyPopper } from 'lucide-react';
import type { EventInput } from '../types/plan';

interface HeaderProps {
  onSelectPreset?: (preset: EventInput) => void;
  onReset?: () => void;
  hasPlan?: boolean;
}

export const PRESET_EVENTS: { label: string; icon: string; data: EventInput }[] = [
  {
    label: "🎓 College Fresher's Party (Pune)",
    icon: '🎓',
    data: {
      eventType: "College Fresher's Welcome Party",
      eventDate: new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0],
      guests: 120,
      budget: 45000,
      city: 'Pune',
      vibe: 'fun',
      notes: 'Held in college auditorium. Needs lively music, fun icebreaker games, and budget samosa + cold drink snacks.',
    },
  },
  {
    label: '🎂 60th Birthday Celebration (Bengaluru)',
    icon: '🎂',
    data: {
      eventType: '60th Birthday Milestone Celebration',
      eventDate: new Date(Date.now() + 35 * 86400000).toISOString().split('T')[0],
      guests: 70,
      budget: 125000,
      city: 'Bengaluru',
      vibe: 'formal',
      notes: 'Banquet hall dinner with family & close friends. South Indian + North Indian buffet, memory photo wall, and acoustic background music.',
    },
  },
  {
    label: '💻 Tech Club 24h Hackathon (Delhi NCR)',
    icon: '💻',
    data: {
      eventType: 'Student Tech Hackathon & Demo Day',
      eventDate: new Date(Date.now() + 28 * 86400000).toISOString().split('T')[0],
      guests: 80,
      budget: 65000,
      city: 'Delhi NCR',
      vibe: 'budget-friendly',
      notes: 'Campus computer lab space. Midnight pizza/chai, mentor swags, certificates, projector AV setup.',
    },
  },
  {
    label: '👥 Startup Team Dinner & Awards (Mumbai)',
    icon: '👥',
    data: {
      eventType: 'Startup Annual Team Dinner & Fun Awards',
      eventDate: new Date(Date.now() + 18 * 86400000).toISOString().split('T')[0],
      guests: 35,
      budget: 85000,
      city: 'Mumbai',
      vibe: 'fun',
      notes: 'Rooftop cafe or private dining space. Fun customized superlative awards, buffet dinner, team bonding games.',
    },
  },
];

export const Header: React.FC<HeaderProps> = ({ onSelectPreset, onReset, hasPlan }) => {
  return (
    <header className="bg-[#0B1F4B] text-white shadow-md border-b border-[#1E3A8A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div 
            onClick={onReset} 
            className="flex items-center gap-3 cursor-pointer group transition-transform active:scale-95"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onReset?.(); }}
          >
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner group-hover:bg-white/20 transition-all">
              <Compass className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-white">
                  PlanPilot
                </h1>
              </div>
              <p className="text-slate-200 text-xs sm:text-sm font-medium">
                Smart event planner for first-time organizers (clubs, families, teams)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {hasPlan && (
              <button
                onClick={onReset}
                className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-sm font-semibold transition flex items-center gap-1.5 backdrop-blur-sm cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-white" />
                <span>Plan New Event</span>
              </button>
            )}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-200 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
              <IndianRupee className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>100% Exact Rupee Balance Guaranteed</span>
            </div>
          </div>
        </div>

        {/* Quick Demo Previews */}
        {!hasPlan && onSelectPreset && (
          <div className="mt-5 pt-4 border-t border-white/15">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-200 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>Or try an instant real-world example:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {PRESET_EVENTS.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSelectPreset(preset.data)}
                  className="text-left px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-medium text-white transition backdrop-blur-sm flex items-center justify-between group active:scale-98 cursor-pointer"
                >
                  <span className="truncate">{preset.label}</span>
                  <span className="text-blue-200 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                    Try &rarr;
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
