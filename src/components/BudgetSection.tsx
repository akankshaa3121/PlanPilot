import React, { useState } from 'react';
import { 
  IndianRupee, 
  Utensils, 
  Building2, 
  Music, 
  Sparkles, 
  Camera, 
  Gift, 
  ShieldAlert, 
  CheckCircle, 
  CheckSquare,
  Square,
  X
} from 'lucide-react';
import type { BudgetCategory } from '../types/plan';
import { formatINR } from '../utils/formatters';

interface BudgetSectionProps {
  categories: BudgetCategory[];
  totalBudget: number;
  perGuestCost: number;
  guests: number;
  onOpenSpending?: () => void;
}

// Icon mapper for budget categories
function getCategoryIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('food') || lower.includes('beverage') || lower.includes('refresh') || lower.includes('cater') || lower.includes('meal')) {
    return <Utensils className="w-5 h-5 text-white" />;
  }
  if (lower.includes('venue') || lower.includes('hall') || lower.includes('rent') || lower.includes('space') || lower.includes('logistic')) {
    return <Building2 className="w-5 h-5 text-white" />;
  }
  if (lower.includes('sound') || lower.includes('music') || lower.includes('dj') || lower.includes('audio') || lower.includes('av')) {
    return <Music className="w-5 h-5 text-white" />;
  }
  if (lower.includes('decor') || lower.includes('light') || lower.includes('stage') || lower.includes('theme') || lower.includes('flower')) {
    return <Sparkles className="w-5 h-5 text-white" />;
  }
  if (lower.includes('photo') || lower.includes('video') || lower.includes('camera') || lower.includes('film') || lower.includes('media')) {
    return <Camera className="w-5 h-5 text-white" />;
  }
  if (lower.includes('gift') || lower.includes('prize') || lower.includes('favor') || lower.includes('invite') || lower.includes('print')) {
    return <Gift className="w-5 h-5 text-white" />;
  }
  return <ShieldAlert className="w-5 h-5 text-white" />;
}

export const BudgetSection: React.FC<BudgetSectionProps> = ({
  categories,
  totalBudget,
  perGuestCost,
  guests,
  onOpenSpending,
}) => {
  // Multiple category selection list (array of category IDs)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // Toggle category on or off. Selecting one NEVER unselects another.
  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((catId) => catId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedCategoryIds(categories.map((c) => c.id));
  };

  const handleClearSelection = () => {
    setSelectedCategoryIds([]);
  };

  const isAnySelected = selectedCategoryIds.length > 0;
  const isAllSelected = selectedCategoryIds.length === categories.length && categories.length > 0;

  // Selected categories list
  const selectedCategories = isAnySelected
    ? categories.filter((c) => selectedCategoryIds.includes(c.id))
    : categories;

  // Combined calculations for the selected categories
  const combinedAmount = isAnySelected
    ? selectedCategories.reduce((sum, c) => sum + c.amount, 0)
    : 0;

  const combinedPercentage = isAnySelected && totalBudget > 0
    ? Math.round((combinedAmount / totalBudget) * 100)
    : 0;

  const combinedPerGuest = isAnySelected
    ? Math.round(combinedAmount / Math.max(1, guests))
    : 0;

  const remainingAmount = Math.max(0, totalBudget - combinedAmount);
  const remainingPercentage = Math.max(0, 100 - combinedPercentage);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#0B1F4B] text-white flex items-center justify-center font-bold text-sm">
              1
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-[#111111] font-display">
              Budget Split & Category Allocation
            </h3>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Every single rupee is allocated across estimated event essentials with zero missing math.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-4 py-2 rounded-2xl bg-[#F5F7FA] border border-slate-200">
            <span className="text-xs text-slate-500 font-medium block">Total Event Budget</span>
            <span className="text-lg font-extrabold text-[#111111]">{formatINR(totalBudget)}</span>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-[#F5F7FA] border border-slate-200">
            <span className="text-xs text-slate-500 font-medium block">Per Guest ({guests} guests)</span>
            <span className="text-lg font-bold text-[#111111]">{formatINR(perGuestCost)}</span>
          </div>
        </div>
      </div>

      {/* Visual Bar Chart */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-[#111111] text-base sm:text-lg">
              Visual Budget Breakdown
            </h4>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F5F7FA] text-[#0B1F4B] border border-slate-200 font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-[#2563EB]" />
              Adds up exactly to 100% ({formatINR(totalBudget)})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                isAllSelected
                  ? 'bg-[#0B1F4B] text-white border-[#0B1F4B]'
                  : 'bg-[#F5F7FA] hover:bg-slate-200/80 text-[#111111] border-slate-200'
              }`}
            >
              Select all
            </button>
            {isAnySelected && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F5F7FA] hover:bg-rose-50 text-rose-700 border border-slate-200 transition cursor-pointer flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear selection</span>
              </button>
            )}
          </div>
        </div>

        {/* Stacked Proportional Bar Chart */}
        <div className="h-11 w-full rounded-2xl overflow-hidden flex bg-slate-100 p-1 gap-1 border border-slate-200">
          {categories.map((cat) => {
            const widthPct = Math.max(3, (cat.amount / totalBudget) * 100);
            const isSelected = selectedCategoryIds.includes(cat.id);

            return (
              <div
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`h-full rounded-xl transition-all duration-300 relative group cursor-pointer flex items-center justify-center ${
                  isAnySelected
                    ? isSelected
                      ? 'ring-2 ring-[#0B1F4B] shadow-md scale-[1.02] z-10 opacity-100'
                      : 'opacity-35 hover:opacity-75'
                    : 'opacity-100 hover:opacity-90 active:scale-95'
                }`}
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: cat.color,
                }}
                title={`${cat.name}: ${formatINR(cat.amount)} (${cat.percentage}%) - Click to toggle selection`}
              >
                {widthPct > 7 && (
                  <span className="text-white text-[11px] font-bold truncate px-1 drop-shadow-sm select-none">
                    {cat.percentage}%
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Chart Legend Chips (Clicking toggles category in list) */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {categories.map((cat) => {
            const isSelected = selectedCategoryIds.includes(cat.id);

            return (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#0B1F4B] text-white border-[#0B1F4B] shadow-sm ring-1 ring-[#0B1F4B]'
                    : 'bg-[#F5F7FA] text-[#111111] border-slate-200 hover:bg-slate-200/70'
                }`}
              >
                {isSelected ? (
                  <CheckSquare className="w-3.5 h-3.5 text-blue-300 flex-shrink-0" />
                ) : (
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                )}
                <span className="truncate max-w-[150px]">{cat.name}</span>
                <span className="font-bold opacity-80">{formatINR(cat.amount)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* COMBINED SUMMARY BANNER (Shown when one or more categories are selected) */}
      {isAnySelected && (
        <div className="bg-[#0B1F4B] text-white p-6 sm:p-7 rounded-3xl shadow-md space-y-4 animate-fade-in border border-blue-900/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/15 pb-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-blue-300 block mb-1">
                Combined Summary ({selectedCategories.length} Categories Selected)
              </span>
              <h4 className="text-lg sm:text-xl font-bold text-white leading-tight">
                Selected: {selectedCategories.map((c) => c.name).join(' + ')}
              </h4>
            </div>

            <button
              onClick={handleClearSelection}
              className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition cursor-pointer flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5 text-blue-300" />
              <span>Clear Selection</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10">
              <span className="text-xs text-blue-200 block font-medium">Combined Amount:</span>
              <span className="text-xl sm:text-2xl font-black text-white block mt-0.5 font-display">
                {formatINR(combinedAmount)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10">
              <span className="text-xs text-blue-200 block font-medium">Share of Total:</span>
              <span className="text-xl sm:text-2xl font-black text-blue-300 block mt-0.5 font-display">
                {combinedPercentage}%
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10">
              <span className="text-xs text-blue-200 block font-medium">Combined Per Guest:</span>
              <span className="text-xl sm:text-2xl font-black text-white block mt-0.5 font-display">
                {formatINR(combinedPerGuest)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10">
              <span className="text-xs text-blue-200 block font-medium">Left for Other Categories:</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-300 block mt-0.5 font-display">
                {formatINR(remainingAmount)}
              </span>
              <span className="text-[10px] text-blue-200 font-semibold block mt-0.5">
                {remainingPercentage}% of total budget remaining
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Category Detail Cards (One below the other if categories selected, or 2-column grid if none selected) */}
      <div className={isAnySelected ? "flex flex-col gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
        {selectedCategories.map((cat) => {
          const isSelected = selectedCategoryIds.includes(cat.id);

          return (
            <div
              key={cat.id}
              onClick={() => toggleCategory(cat.id)}
              className={`bg-white rounded-3xl p-6 border transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#0B1F4B] ring-2 ring-blue-900/10 shadow-md'
                  : 'border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  >
                    {getCategoryIcon(cat.name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-[#111111] text-base leading-tight">
                        {cat.name}
                      </h5>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-md bg-[#0B1F4B] text-white text-[10px] font-bold">
                          Selected
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {cat.percentage}% of total budget
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xl font-extrabold text-[#111111] block font-display">
                    {formatINR(cat.amount)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    ≈ {formatINR(Math.round(cat.amount / Math.max(1, guests)))} / guest
                  </span>
                </div>
              </div>

              {/* Items included */}
              <div className="mb-3.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Typical Expense Breakdown:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {cat.items.map((item, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-[#F5F7FA] text-[#111111] text-xs font-medium border border-slate-200/80"
                    >
                      • {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Smart Tip */}
              <div className="p-3 rounded-2xl bg-[#F5F7FA] border border-slate-200 text-xs text-[#111111] flex items-start gap-2">
                <span className="text-[#2563EB] font-bold flex-shrink-0">💡 Tip:</span>
                <p className="leading-relaxed font-medium">{cat.tips}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Track Spending Callout */}
      <div className="bg-[#F5F7FA] p-5 sm:p-6 rounded-3xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#0B1F4B] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
            ₹
          </div>
          <div>
            <span className="text-sm font-bold text-[#111111] block">
              Want to log real vendor payments & avoid going over budget?
            </span>
            <p className="text-xs text-slate-600 mt-0.5">
              Record advances, check progress bars against planned budgets, and get 80% usage alerts in the Track Spending section.
            </p>
          </div>
        </div>

        {onOpenSpending && (
          <button
            onClick={onOpenSpending}
            className="px-4 py-2.5 rounded-xl bg-[#0B1F4B] text-white hover:bg-[#142a63] text-xs font-bold transition shadow-xs cursor-pointer whitespace-nowrap flex items-center gap-1.5 flex-shrink-0"
          >
            <span>Go to Track Spending</span>
            <span>→</span>
          </button>
        )}
      </div>
    </div>
  );
};
