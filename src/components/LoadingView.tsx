import React, { useEffect, useState } from 'react';
import { Compass, CheckCircle } from 'lucide-react';

interface LoadingViewProps {
  eventType: string;
  city: string;
  retryMessage?: string | null;
}

const LOADING_STEPS = [
  "Connecting with Gemini AI event engine...",
  "Analyzing local Indian vendor rate benchmarks...",
  "Calculating exact rupee budget allocation across categories...",
  "Mapping backward countdown schedule to your event date...",
  "Curating 3 critical interview questions for each vendor type...",
  "Designing 5 personalized themes, decor hacks & activities...",
];

export const LoadingView: React.FC<LoadingViewProps> = ({ eventType, city, retryMessage }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm max-w-2xl mx-auto text-center space-y-6">
      {/* Icon */}
      <div className="relative w-20 h-20 mx-auto">
        <div className="w-20 h-20 rounded-3xl bg-[#0B1F4B] flex items-center justify-center text-white shadow-md">
          <Compass className="w-10 h-10 animate-pulse text-[#2563EB]" />
        </div>
      </div>

      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-[#0B1F4B] bg-[#F5F7FA] px-3 py-1 rounded-full border border-slate-200 inline-block mb-2">
          Gemini AI at Work
        </span>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-[#111111] font-display">
          Building Your PlanPilot Master Plan
        </h3>
        <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-md mx-auto">
          Customizing budget, countdown tasks, and vendor checklists for your <strong>{eventType}</strong> in <strong>{city}</strong>.
        </p>

        {retryMessage && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-bold inline-flex items-center gap-2 animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            <span>{retryMessage}</span>
          </div>
        )}
      </div>

      {/* Dynamic Progress Steps */}
      <div className="bg-[#F5F7FA] rounded-2xl p-5 border border-slate-200 text-left space-y-3 max-w-md mx-auto">
        {LOADING_STEPS.map((step, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div
              key={idx}
              className={`flex items-center gap-3 text-xs sm:text-sm font-medium transition-all ${
                isDone
                  ? 'text-[#2563EB] font-semibold'
                  : isCurrent
                  ? 'text-[#111111] font-bold scale-[1.01]'
                  : 'text-slate-400 opacity-60'
              }`}
            >
              {isDone ? (
                <CheckCircle className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
              ) : isCurrent ? (
                <div className="w-4 h-4 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0" />
              )}
              <span className="truncate">{step}</span>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-500 font-medium">
        First-time organizer tip: Preparing in advance saves up to 35% on emergency vendor bookings!
      </p>
    </div>
  );
};
