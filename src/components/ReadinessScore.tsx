import React from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  Building2, 
  Utensils, 
  Music, 
  ShieldCheck, 
  CheckSquare,
  Clock,
  RotateCcw
} from 'lucide-react';
import type { EventPlan } from '../types/plan';
import { calculateReadinessScore, type HurtingItem } from '../utils/readiness';

interface ReadinessScoreProps {
  plan: EventPlan;
  completedTasks: { [id: string]: boolean };
  onToggleTask: (taskId: string) => void;
  completedVendors: { [id: string]: boolean };
  onToggleVendor: (vendorId: string) => void;
  onResetReadiness?: () => void;
  onScrollToSection?: (sectionId: string) => void;
}

export const ReadinessScore: React.FC<ReadinessScoreProps> = ({
  plan,
  completedTasks,
  onToggleTask,
  completedVendors,
  onToggleVendor,
  onResetReadiness,
  onScrollToSection,
}) => {
  const calculation = calculateReadinessScore(plan, completedTasks, completedVendors);
  const { score, message, statusBadge, hurtingItems, completedTaskCount, totalTaskCount, completedVendorCount, totalVendorCount } = calculation;

  // SVG Progress Ring calculations
  const size = 110;
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const handleToggleHurtingItem = (item: HurtingItem) => {
    if (item.type === 'vendor') {
      onToggleVendor(item.id);
    } else {
      onToggleTask(item.id);
    }
  };

  const getItemIcon = (category: HurtingItem['category']) => {
    switch (category) {
      case 'venue':
        return <Building2 className="w-4 h-4 text-[#2563EB]" />;
      case 'food':
        return <Utensils className="w-4 h-4 text-[#2563EB]" />;
      case 'sound':
        return <Music className="w-4 h-4 text-[#2563EB]" />;
      case 'permission':
        return <ShieldCheck className="w-4 h-4 text-[#2563EB]" />;
      default:
        return <AlertCircle className="w-4 h-4 text-[#2563EB]" />;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
      {/* Top Banner: Score Progress Ring & Core Status */}
      <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8 pb-6 border-b border-slate-100">
        {/* Circular Progress Ring */}
        <div className="relative flex-shrink-0 flex items-center justify-center">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#E2E8F0"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Active Progress Ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#2563EB"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Centered Score Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-black text-[#111111] leading-none tracking-tight font-display">
              {score}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mt-0.5">
              out of 100
            </span>
          </div>
        </div>

        {/* Score Context & Message */}
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
            <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#0B1F4B] text-white">
              Event Readiness Score
            </span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#F5F7FA] text-[#0B1F4B] border border-slate-200">
              {statusBadge}
            </span>
            {score === 100 && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                100% Prepared!
              </span>
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-[#111111] font-display leading-snug">
            {message}
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
            This score recalculates live as you tick items below. High-stakes milestones like <strong>booking the venue</strong> and <strong>finalizing the food menu</strong> carry the highest weight.
          </p>

          {/* Mini Completion Counters */}
          <div className="flex items-center justify-center md:justify-start gap-4 pt-1 text-xs font-bold text-slate-600">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Timeline: {completedTaskCount}/{totalTaskCount} tasks done</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Vendors: {completedVendorCount}/{totalVendorCount} booked</span>
            </div>
          </div>
        </div>

        {/* Reset / Clear Progress Option */}
        {(completedTaskCount > 0 || completedVendorCount > 0) && onResetReadiness && (
          <button
            type="button"
            onClick={onResetReadiness}
            className="self-center md:self-start text-[11px] font-semibold text-slate-500 hover:text-[#111111] hover:bg-[#F5F7FA] px-2.5 py-1.5 rounded-xl border border-transparent hover:border-slate-200 transition flex items-center gap-1 cursor-pointer"
            title="Reset ticked tasks to start fresh"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset ticks</span>
          </button>
        )}
      </div>

      {/* Bottom Section: Top 3 Things Hurting It */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#F5F7FA] border border-slate-200 text-[#0B1F4B] text-xs font-bold flex items-center justify-center">
              ⚠️
            </span>
            <h4 className="font-extrabold text-[#111111] text-sm sm:text-base uppercase tracking-wide">
              Top 3 Things Hurting Your Score:
            </h4>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Tick to complete and instantly boost your score
          </span>
        </div>

        {hurtingItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {hurtingItems.map((item, idx) => (
              <div
                key={item.id}
                className="bg-[#F5F7FA] hover:bg-white rounded-2xl p-4 border border-slate-200 hover:border-slate-300 transition-all shadow-2xs flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#0B1F4B] text-white text-[11px] font-bold flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                        {getItemIcon(item.category)}
                        <span>{item.actionText}</span>
                      </span>
                    </div>

                    <span className="text-xs font-extrabold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                      +{item.points} pts
                    </span>
                  </div>

                  <h5 className="font-bold text-[#111111] text-sm leading-snug mb-1">
                    {item.title}
                  </h5>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.subtitle}
                  </p>
                </div>

                {/* Direct Action Toggle */}
                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleToggleHurtingItem(item)}
                    className="w-full py-2 px-3 rounded-xl bg-[#0B1F4B] hover:bg-[#142a63] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-white" />
                    <span>Mark as Done (+{item.points} pts)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#F5F7FA] rounded-2xl p-5 border border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B1F4B] text-white flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-[#2563EB]" />
            </div>
            <div>
              <h5 className="font-extrabold text-[#111111] text-sm">
                🎉 No Bottlenecks Remaining!
              </h5>
              <p className="text-xs text-slate-600 mt-0.5">
                Every high-weight anchor and timeline milestone is completed. Your event is fully prepared!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
