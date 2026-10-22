import React, { useState } from 'react';
import { 
  CloudRain, 
  UtensilsCrossed, 
  TrendingDown, 
  UserMinus, 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle2, 
  Compass, 
  PhoneCall, 
  Smile, 
  Clock, 
  Split, 
  X,
  RefreshCw,
  Send
} from 'lucide-react';
import type { EventPlan, PlanB, WhatIfScenarioKey } from '../types/plan';
import { formatINR } from '../utils/formatters';

interface WhatIfSectionProps {
  originalPlan: EventPlan;
  activePlanB: PlanB | null;
  onGeneratePlanB: (scenarioTitle: string, scenarioKey: WhatIfScenarioKey) => Promise<void>;
  onDismissPlanB: () => void;
  isLoadingPlanB: boolean;
  selectedScenarioKey: string | null;
}

const PRESET_SCENARIOS: {
  key: WhatIfScenarioKey;
  label: string;
  icon: React.ReactNode;
  description: string;
  badge: string;
}[] = [
  {
    key: 'rain',
    label: 'It rains on event day',
    icon: <CloudRain className="w-5 h-5 text-[#2563EB]" />,
    description: 'Sudden downpour shifts outdoor plans or needs waterproof shelter.',
    badge: 'Weather Pivot',
  },
  {
    key: 'caterer_cancels',
    label: 'Caterer cancels',
    icon: <UtensilsCrossed className="w-5 h-5 text-[#2563EB]" />,
    description: 'Food vendor backs out last minute; need fast, tasty backup.',
    badge: 'Food Emergency',
  },
  {
    key: 'budget_cut_20',
    label: 'Budget cut by 20%',
    icon: <TrendingDown className="w-5 h-5 text-[#2563EB]" />,
    description: 'Sponsorship or family funds drop by 20%; trim smartly without spoiling fun.',
    badge: '-20% Funds',
  },
  {
    key: 'half_guests',
    label: 'Half the guests cancel',
    icon: <UserMinus className="w-5 h-5 text-[#2563EB]" />,
    description: 'Exam week or last-minute dropouts; pivot into an intimate VIP celebration.',
    badge: 'Attendance Drop',
  },
];

export const WhatIfSection: React.FC<WhatIfSectionProps> = ({
  originalPlan,
  activePlanB,
  onGeneratePlanB,
  onDismissPlanB,
  isLoadingPlanB,
  selectedScenarioKey,
}) => {
  const [customInput, setCustomInput] = useState('');
  const [viewMode, setViewMode] = useState<'comparison' | 'planBonly'>('comparison');

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    onGeneratePlanB(customInput.trim(), 'custom');
    setCustomInput('');
  };

  return (
    <div className="space-y-6">
      {/* What-If Control Header */}
      <div className="bg-[#F5F7FA] text-[#111111] rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#0B1F4B] bg-white px-3 py-1 rounded-full border border-slate-200 inline-flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-[#2563EB]" />
                Contingency Simulator
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-[#111111] flex items-center gap-2">
                <span>The “What If?” Crisis Lab</span>
                <span className="text-[#2563EB] text-xl">⚡</span>
              </h3>
            </div>

            {activePlanB && (
              <button
                onClick={onDismissPlanB}
                className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-[#111111] transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <X className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Clear Plan B (Return to Plan A)</span>
              </button>
            )}
          </div>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            Every first-time organizer fears unexpected curveballs. Tap any scenario below — Gemini will calculate a concrete <strong>Plan B</strong> with a 100% reconciled budget, urgent timeline pivots, and your single next move, while keeping your original plan visible for comparison.
          </p>

          {/* Scenario Buttons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {PRESET_SCENARIOS.map((scenario) => {
              const isActive = activePlanB?.scenarioKey === scenario.key;
              const isSelectedLoading = isLoadingPlanB && selectedScenarioKey === scenario.key;

              return (
                <button
                  key={scenario.key}
                  disabled={isLoadingPlanB}
                  onClick={() => onGeneratePlanB(scenario.label, scenario.key)}
                  className={`text-left p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between group active:scale-98 cursor-pointer ${
                    isActive
                      ? 'bg-[#0B1F4B] text-white border-[#0B1F4B] ring-2 ring-blue-900/20 shadow-sm font-bold'
                      : 'bg-white hover:bg-slate-100/80 border-slate-200 text-[#111111] hover:border-slate-300 shadow-2xs'
                  } ${isLoadingPlanB ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isActive ? 'bg-white/15' : 'bg-[#F5F7FA] border border-slate-200'
                      }`}>
                        {scenario.icon}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#F5F7FA] text-slate-600 border border-slate-200'
                      }`}>
                        {scenario.badge}
                      </span>
                    </div>

                    <h4 className={`text-base font-extrabold leading-snug mb-1 ${
                      isActive ? 'text-white' : 'text-[#111111]'
                    }`}>
                      {scenario.label}
                    </h4>
                    <p className={`text-xs leading-relaxed ${
                      isActive ? 'text-slate-200 font-medium' : 'text-slate-500'
                    }`}>
                      {scenario.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold">
                    <span>
                      {isSelectedLoading ? (
                        <span className={`flex items-center gap-1.5 animate-pulse ${isActive ? 'text-white' : 'text-[#2563EB]'}`}>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Simulating...
                        </span>
                      ) : isActive ? (
                        <span className="flex items-center gap-1 text-white">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-300" />
                          Active Plan B
                        </span>
                      ) : (
                        <span className="text-[#2563EB] group-hover:underline">
                          Simulate Plan B &rarr;
                        </span>
                      )}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom What-If Input */}
          <form onSubmit={handleCustomSubmit} className="pt-2 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Or type custom crisis (e.g. 'Principal denied auditorium permission at 3 PM', 'Power outage')..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-[#111111] placeholder-slate-400 focus:outline-none focus:border-[#2563EB]"
            />
            <button
              type="submit"
              disabled={isLoadingPlanB || !customInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#0B1F4B] hover:bg-[#142a63] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5 text-white" />
              <span>Simulate Custom</span>
            </button>
          </form>
        </div>
      </div>

      {/* Plan B Results & Comparison View */}
      {activePlanB && (
        <div className="space-y-6">
          {/* Plan B Hero Callout with ONE CLEAR NEXT STEP */}
          <div className="bg-[#0B1F4B] text-white rounded-3xl p-6 sm:p-8 shadow-md border border-[#1E3A8A]">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-white/15 text-white text-xs font-black uppercase tracking-wider backdrop-blur-sm border border-white/20">
                    Plan B Activated
                  </span>
                  <span className="text-slate-200 text-xs font-bold">
                    Scenario: “{activePlanB.scenarioTitle}”
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white leading-tight">
                  {activePlanB.summary}
                </h3>

                {/* ONE CLEAR NEXT STEP */}
                <div className="mt-4 p-5 rounded-2xl bg-white text-[#111111] shadow-sm border-2 border-[#2563EB]">
                  <div className="flex items-center gap-2 mb-1 text-xs font-black uppercase tracking-wider text-[#2563EB]">
                    <Compass className="w-4 h-4 text-[#2563EB]" />
                    <span>Your Single Immediate Next Step:</span>
                  </div>
                  <p className="text-base sm:text-lg font-extrabold text-[#111111] leading-snug">
                    {activePlanB.immediateNextStep}
                  </p>
                </div>
              </div>

              {/* Budget Delta Badge */}
              <div className="bg-white/10 p-5 rounded-2xl border border-white/20 backdrop-blur-sm flex-shrink-0 min-w-[220px] text-center md:text-right">
                <span className="text-xs text-slate-200 font-bold block mb-1">
                  Reconciled Plan B Budget
                </span>
                <span className="text-3xl font-black text-white font-display block">
                  {formatINR(activePlanB.newTotalBudget)}
                </span>
                <div className="mt-2 text-xs font-bold">
                  {activePlanB.budgetDifference === 0 ? (
                    <span className="text-white bg-white/20 px-2.5 py-1 rounded-lg">
                      ₹0 Net Change (Reallocated)
                    </span>
                  ) : activePlanB.budgetDifference < 0 ? (
                    <span className="text-white bg-[#2563EB] px-2.5 py-1 rounded-lg">
                      Saved {formatINR(Math.abs(activePlanB.budgetDifference))} (-20%)
                    </span>
                  ) : (
                    <span className="text-white bg-slate-700 px-2.5 py-1 rounded-lg">
                      +{formatINR(activePlanB.budgetDifference)}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-200 block mt-2 opacity-90">
                  ✅ Mathematically adds up to exactly 100%
                </span>
              </div>
            </div>

            {/* Quick Vendor Action & Silver Lining Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6 pt-6 border-t border-white/15">
              <div className="p-3.5 rounded-xl bg-white/10 text-xs text-slate-100 flex items-start gap-2.5 border border-white/10">
                <PhoneCall className="w-4 h-4 text-blue-300 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Primary Vendor Instruction:</strong>
                  <span>{activePlanB.vendorAction}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/10 text-xs text-slate-100 flex items-start gap-2.5 border border-white/10">
                <Smile className="w-4 h-4 text-blue-300 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">The Silver Lining:</strong>
                  <span>{activePlanB.silverLining}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Mode Toggle */}
          <div className="flex items-center justify-between flex-wrap gap-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <Split className="w-4 h-4 text-[#2563EB]" />
              <span className="text-sm font-bold text-[#111111]">
                Plan Comparison:
              </span>
              <span className="text-xs text-slate-500">
                Compare original master plan against Plan B contingency
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-[#F5F7FA] p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('comparison')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'comparison' ? 'bg-[#0B1F4B] text-white shadow-xs' : 'text-slate-600 hover:text-[#111111]'
                }`}
              >
                Side-by-Side Comparison
              </button>
              <button
                onClick={() => setViewMode('planBonly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'planBonly' ? 'bg-[#0B1F4B] text-white shadow-xs' : 'text-slate-600 hover:text-[#111111]'
                }`}
              >
                Plan B Focus Only
              </button>
            </div>
          </div>

          {/* SIDE-BY-SIDE BUDGET COMPARISON */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-lg sm:text-xl font-bold text-[#111111] font-display flex items-center gap-2">
                  <span>Budget Comparison: Original Plan vs. Plan B</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F5F7FA] text-[#0B1F4B] border border-slate-200 font-bold">
                    Both Add Up Exactly
                  </span>
                </h4>
              </div>
              <p className="text-xs text-slate-500">
                {activePlanB.budgetRationale}
              </p>
            </div>

            {/* Visual Comparison Bars */}
            <div className="space-y-4">
              {/* Original Plan Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>Original Plan A ({formatINR(originalPlan.totalBudget)})</span>
                  <span className="text-slate-500">100% allocated</span>
                </div>
                <div className="h-7 w-full rounded-xl overflow-hidden flex bg-slate-100 p-0.5 gap-0.5 border border-slate-200">
                  {originalPlan.budgetCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="h-full rounded-lg transition-all"
                      style={{
                        width: `${Math.max(4, (cat.amount / originalPlan.totalBudget) * 100)}%`,
                        backgroundColor: cat.color,
                      }}
                      title={`Original ${cat.name}: ${formatINR(cat.amount)}`}
                    />
                  ))}
                </div>
              </div>

              {/* Plan B Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-[#111111]">
                  <span className="flex items-center gap-1.5 text-[#0B1F4B]">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Plan B Contingency ({formatINR(activePlanB.newTotalBudget)})</span>
                  </span>
                  <span className="text-[#2563EB] font-extrabold">
                    100% exact match ({formatINR(activePlanB.newTotalBudget)})
                  </span>
                </div>
                <div className="h-8 w-full rounded-xl overflow-hidden flex bg-[#F5F7FA] border border-slate-300 p-0.5 gap-0.5 shadow-inner">
                  {activePlanB.adjustedBudgetCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="h-full rounded-lg transition-all flex items-center justify-center"
                      style={{
                        width: `${Math.max(4, (cat.amount / activePlanB.newTotalBudget) * 100)}%`,
                        backgroundColor: cat.color,
                      }}
                      title={`Plan B ${cat.name}: ${formatINR(cat.amount)} (${cat.percentage}%)`}
                    >
                      <span className="text-[10px] text-white font-bold truncate px-1 drop-shadow-xs">
                        {cat.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Category Breakdown Table / Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {activePlanB.adjustedBudgetCategories.map((cat) => {
                const origAmount = typeof cat.originalAmount === 'number'
                  ? cat.originalAmount
                  : originalPlan.budgetCategories.find(
                      (oc) => oc.id === cat.id || oc.name.toLowerCase().trim() === cat.name.toLowerCase().trim()
                    )?.amount ?? null;
                const diff = origAmount !== null ? cat.amount - origAmount : null;

                return (
                  <div
                    key={cat.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-[#F5F7FA] hover:bg-white hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <h5 className="font-extrabold text-[#111111] text-sm">
                            {cat.name}
                          </h5>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-black text-[#111111] block font-display">
                            {formatINR(cat.amount)}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {cat.percentage}% of Plan B
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 mb-2 font-medium">
                        {cat.tips}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600 font-semibold">
                        Was {formatINR(origAmount ?? cat.amount)}
                      </span>
                      {diff !== null && (
                        <span className={diff > 0 ? 'text-[#0B1F4B]' : diff < 0 ? 'text-[#2563EB]' : 'text-slate-500'}>
                          {diff > 0 ? `+${formatINR(diff)}` : diff < 0 ? `-${formatINR(Math.abs(diff))}` : 'Unchanged'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TIMELINE PIVOTS & EMERGENCY ACTIONS */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-5 h-5 text-[#2563EB]" />
                <h4 className="text-lg sm:text-xl font-bold text-[#111111] font-display">
                  Urgent Timeline & Task Changes for Plan B
                </h4>
              </div>
              <p className="text-xs text-slate-500">
                Here are the immediate schedule pivots counted down to event kickoff.
              </p>
            </div>

            <div className="space-y-4">
              {activePlanB.timelineChanges.map((change, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-[#F5F7FA] border border-slate-200 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-[#0B1F4B] bg-white border border-slate-200 px-3 py-1 rounded-xl">
                      ⏱️ {change.timeframe}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      change.urgency === 'critical'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-blue-50 text-[#2563EB] border border-blue-200'
                    }`}>
                      {change.urgency} Urgency
                    </span>
                  </div>

                  <ul className="space-y-1.5 pl-2">
                    {change.tasks.map((task, tIdx) => (
                      <li key={tIdx} className="text-xs sm:text-sm text-[#111111] flex items-start gap-2 font-medium">
                        <ArrowRight className="w-4 h-4 text-[#2563EB] flex-shrink-0 mt-0.5" />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
