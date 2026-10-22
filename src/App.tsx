import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Calendar, 
  MapPin, 
  Users, 
  IndianRupee, 
  Sparkles, 
  Printer, 
  Share2, 
  ArrowLeft, 
  Check, 
  Lightbulb, 
  Layers, 
  Clock, 
  CheckSquare, 
  Flame,
  Download,
  PartyPopper,
  Receipt
} from 'lucide-react';

import type { EventInput, EventPlan, PaymentEntry, PlanB, WhatIfScenarioKey } from './types/plan';
import { compressTimeline, formatINR, formatReadableDate, getDaysRemaining } from './utils/formatters';
import { Header, PRESET_EVENTS } from './components/Header';
import { EventForm } from './components/EventForm';
import { BudgetSection } from './components/BudgetSection';
import { TrackSpendingSection } from './components/TrackSpendingSection';
import { TimelineSection } from './components/TimelineSection';
import { VendorSection } from './components/VendorSection';
import { IdeasSection } from './components/IdeasSection';
import { WhatIfSection } from './components/WhatIfSection';
import { LoadingView } from './components/LoadingView';
import { ErrorView } from './components/ErrorView';
import { ReadinessScore } from './components/ReadinessScore';

export default function App() {
  const [currentInput, setCurrentInput] = useState<EventInput>(PRESET_EVENTS[0].data);
  const [plan, setPlan] = useState<EventPlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'whatif' | 'budget' | 'spending' | 'quote' | 'timeline' | 'vendors' | 'ideas'>('all');
  const [copiedSummary, setCopiedSummary] = useState(false);

  // What If? Plan B State
  const [activePlanB, setActivePlanB] = useState<PlanB | null>(null);
  const [isLoadingPlanB, setIsLoadingPlanB] = useState<boolean>(false);
  const [selectedScenarioKey, setSelectedScenarioKey] = useState<string | null>(null);

  // Ticked tasks & vendor booking state (persisted to localStorage)
  const [completedTasks, setCompletedTasks] = useState<{ [id: string]: boolean }>({});
  const [completedVendors, setCompletedVendors] = useState<{ [id: string]: boolean }>({});

  // Payments / Real spending state (persisted to localStorage)
  const [payments, setPayments] = useState<PaymentEntry[]>([]);

  const getTaskStorageKey = (p: EventPlan) => `planpilot_tasks_${p.input.eventType}_${p.input.eventDate}`;
  const getVendorStorageKey = (p: EventPlan) => `planpilot_vendors_${p.input.eventType}_${p.input.eventDate}`;
  const getPaymentStorageKey = (p: EventPlan) => `planpilot_payments_${p.input.eventType}_${p.input.eventDate}`;

  // Restore last plan from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem('planpilot_saved_plan');
      if (saved) {
        const parsed: EventPlan = JSON.parse(saved);
        if (parsed.timeline && parsed.input?.eventDate) {
          parsed.timeline = compressTimeline(parsed.timeline, parsed.input.eventDate);
        }
        setPlan(parsed);
        if (parsed.input) {
          setCurrentInput(parsed.input);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Restore ticked tasks, vendors & payments whenever active plan changes
  useEffect(() => {
    if (plan) {
      try {
        const taskKey = getTaskStorageKey(plan);
        const savedTasks = localStorage.getItem(taskKey);
        if (savedTasks) {
          setCompletedTasks(JSON.parse(savedTasks));
        } else {
          setCompletedTasks({});
        }

        const vendorKey = getVendorStorageKey(plan);
        const savedVendors = localStorage.getItem(vendorKey);
        if (savedVendors) {
          setCompletedVendors(JSON.parse(savedVendors));
        } else {
          setCompletedVendors({});
        }

        const payKey = getPaymentStorageKey(plan);
        const savedPayments = localStorage.getItem(payKey);
        if (savedPayments) {
          setPayments(JSON.parse(savedPayments));
        } else {
          setPayments([]);
        }
      } catch {
        // ignore
      }
    }
  }, [plan?.id, plan?.input?.eventType, plan?.input?.eventDate]);

  const handleToggleTask = (taskId: string) => {
    if (!plan) return;
    setCompletedTasks((prev) => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      try {
        localStorage.setItem(getTaskStorageKey(plan), JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleToggleVendor = (vendorId: string) => {
    if (!plan) return;
    setCompletedVendors((prev) => {
      const next = { ...prev, [vendorId]: !prev[vendorId] };
      try {
        localStorage.setItem(getVendorStorageKey(plan), JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleResetReadiness = () => {
    if (!plan) return;
    try {
      localStorage.removeItem(getTaskStorageKey(plan));
      localStorage.removeItem(getVendorStorageKey(plan));
    } catch {
      // ignore
    }
    setCompletedTasks({});
    setCompletedVendors({});
  };

  const handleAddPayment = (newPayment: Omit<PaymentEntry, 'id' | 'createdAt'>) => {
    if (!plan) return;
    const entry: PaymentEntry = {
      ...newPayment,
      id: 'pay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString(),
    };
    setPayments((prev) => {
      const next = [entry, ...prev];
      try {
        localStorage.setItem(getPaymentStorageKey(plan), JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleDeletePayment = (paymentId: string) => {
    if (!plan) return;
    setPayments((prev) => {
      const next = prev.filter((p) => p.id !== paymentId);
      try {
        localStorage.setItem(getPaymentStorageKey(plan), JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleClearPayments = () => {
    if (!plan) return;
    try {
      localStorage.removeItem(getPaymentStorageKey(plan));
    } catch {
      // ignore
    }
    setPayments([]);
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0B1F4B', '#2563EB', '#0284c7', '#38bdf8', '#0d9488'],
      });
    } catch {
      // ignore
    }
  };

  const generatePlan = async (input: EventInput) => {
    setIsLoading(true);
    setError(null);
    setRetryMessage(null);
    setCurrentInput(input);

    const MAX_RETRIES = 3;
    let attempt = 0;
    let planData: EventPlan | null = null;

    while (attempt <= MAX_RETRIES) {
      try {
        const res = await fetch('/api/generate-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        if (!res.ok) {
          const status = res.status;
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error || `Server responded with status ${status}`;
          const isBusy =
            status === 503 ||
            status === 429 ||
            /503|429|high demand|busy|overloaded|resource exhausted/i.test(errMsg);

          if (isBusy && attempt < MAX_RETRIES) {
            attempt++;
            setRetryMessage('Gemini is busy, trying again...');
            await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
            continue;
          }
          throw new Error(errMsg);
        }

        planData = await res.json();
        break;
      } catch (err: any) {
        const errMsg = String(err?.message || '');
        const isBusy = /503|429|high demand|busy|overloaded|resource exhausted/i.test(errMsg);
        if (isBusy && attempt < MAX_RETRIES) {
          attempt++;
          setRetryMessage('Gemini is busy, trying again...');
          await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
          continue;
        }
        console.error('Plan generation failed:', err);
        setError(errMsg || 'Something went wrong while communicating with Gemini.');
        setIsLoading(false);
        setRetryMessage(null);
        return;
      }
    }

    if (!planData) {
      setError('Could not generate plan after retrying. Please try again in a few moments.');
      setIsLoading(false);
      setRetryMessage(null);
      return;
    }

    // Timeline compression and deduplication
    if (planData.timeline && planData.input?.eventDate) {
      planData.timeline = compressTimeline(planData.timeline, planData.input.eventDate);
    }

    // 1) When a new plan is generated, clear all saved ticks so the Readiness Score starts at 0.
    setCompletedTasks({});
    setCompletedVendors({});
    try {
      localStorage.removeItem(getTaskStorageKey(planData));
      localStorage.removeItem(getVendorStorageKey(planData));
    } catch {
      // ignore
    }

    setPlan(planData);
    setActiveTab('all');

    try {
      localStorage.setItem('planpilot_saved_plan', JSON.stringify(planData));
    } catch {
      // ignore
    }

    // Small celebratory confetti
    setTimeout(triggerConfetti, 400);

    // Scroll smoothly to top of plan
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsLoading(false);
    setRetryMessage(null);
  };

  const handleSelectPreset = (preset: EventInput) => {
    setCurrentInput(preset);
    setPlan(null);
    setActivePlanB(null);
    setError(null);
  };

  const handleResetToForm = () => {
    setPlan(null);
    setActivePlanB(null);
    setError(null);
  };

  const handleGeneratePlanB = async (scenarioTitle: string, scenarioKey: WhatIfScenarioKey) => {
    if (!plan) return;
    setIsLoadingPlanB(true);
    setSelectedScenarioKey(scenarioKey);
    const MAX_RETRIES = 3;
    let attempt = 0;

    while (attempt <= MAX_RETRIES) {
      try {
        const res = await fetch('/api/generate-plan-b', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originalPlan: plan,
            scenarioTitle,
            scenarioKey,
          }),
        });

        if (!res.ok) {
          const status = res.status;
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error || `Server responded with ${status}`;
          const isBusy =
            status === 503 ||
            status === 429 ||
            /503|429|high demand|busy|overloaded/i.test(errMsg);

          if (isBusy && attempt < MAX_RETRIES) {
            attempt++;
            await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
            continue;
          }
          throw new Error(errMsg);
        }

        const planBData: PlanB = await res.json();
        setActivePlanB(planBData);

        // Trigger celebration confetti for successful Plan B generation
        setTimeout(triggerConfetti, 350);

        // Smooth scroll to What-If section
        const el = document.getElementById('whatif-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        break;
      } catch (err: any) {
        const errMsg = String(err?.message || '');
        const isBusy = /503|429|high demand|busy|overloaded/i.test(errMsg);
        if (isBusy && attempt < MAX_RETRIES) {
          attempt++;
          await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
          continue;
        }
        console.error('Plan B generation failed:', err);
        alert(err?.message || 'Could not simulate Plan B right now. Please try again.');
        break;
      }
    }
    setIsLoadingPlanB(false);
    setSelectedScenarioKey(null);
  };

  const handleDismissPlanB = () => {
    setActivePlanB(null);
  };

  const handleCopyFullPlan = () => {
    if (!plan) return;
    let text = `🎉 *${plan.title}* - PlanPilot Master Plan\n`;
    text += `"${plan.tagline}"\n\n`;
    text += `📍 Location: ${plan.input.city}, India\n`;
    text += `📅 Date: ${formatReadableDate(plan.input.eventDate)}\n`;
    text += `👥 Guests: ${plan.input.guests} | 💰 Budget: ${formatINR(plan.totalBudget)}\n`;
    text += `✨ Vibe: ${plan.input.vibe}\n\n`;
    text += `💡 *Mentor's Golden Rule:*\n${plan.topOrganizerTip}\n\n`;

    text += `📊 *1. BUDGET BREAKDOWN (Exact Sum: ${formatINR(plan.totalBudget)}):*\n`;
    plan.budgetCategories.forEach((c) => {
      text += `• ${c.name}: ${formatINR(c.amount)} (${c.percentage}%)\n  Tip: ${c.tips}\n`;
    });
    text += `\n`;

    text += `⏳ *2. BACKWARD COUNTDOWN TIMELINE:*\n`;
    plan.timeline.forEach((m) => {
      text += `• ${m.label} (${m.targetDate}): ${m.stage}\n`;
      m.tasks.forEach((t) => {
        text += `   - [ ] ${t.title}: ${t.description}\n`;
      });
    });
    text += `\n`;

    text += `📋 *3. VENDOR CHECKLIST & 3 QUESTIONS:*\n`;
    plan.vendorChecklist.forEach((v) => {
      text += `• ${v.vendorType} (Benchmark: ${v.benchmarkCost})\n`;
      v.questions.forEach((q, idx) => {
        text += `   Q${idx + 1}: ${q}\n`;
      });
      text += `   Pro-Tip: ${v.organizerTip}\n`;
    });
    text += `\n`;

    text += `💡 *4. 5 PERSONALIZED CREATIVE IDEAS:*\n`;
    plan.ideas.forEach((idea, idx) => {
      text += `${idx + 1}. [${idea.category}] ${idea.title}\n   ${idea.description}\n   Budget DIY Hack: ${idea.budgetFriendlyHack}\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const daysRemaining = plan ? getDaysRemaining(plan.input.eventDate) : 0;

  const hasSpendingWarning = plan ? plan.budgetCategories.some((cat) => {
    const spent = payments
      .filter((p) => p.categoryId === cat.id)
      .reduce((sum, p) => sum + p.amount, 0);
    return cat.amount > 0 && spent / cat.amount >= 0.8;
  }) : false;

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFFFF] text-[#111111]">
      {/* Top Header */}
      <Header
        onSelectPreset={handleSelectPreset}
        onReset={handleResetToForm}
        hasPlan={Boolean(plan)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {isLoading ? (
          <LoadingView
            eventType={currentInput.eventType}
            city={currentInput.city}
            retryMessage={retryMessage}
          />
        ) : error ? (
          <ErrorView
            message={error}
            onRetry={() => generatePlan(currentInput)}
            onBack={() => setError(null)}
          />
        ) : !plan ? (
          /* Event Form View */
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#0B1F4B] bg-[#F5F7FA] px-3.5 py-1 rounded-full border border-slate-200 inline-flex items-center gap-1.5 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                Effortless Event Planning in India
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111111] tracking-tight font-display">
                Plan Your Event Without the Chaos
              </h2>
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Whether organizing your college cultural fest, a 50th birthday dinner, or a startup offsite, PlanPilot crafts your balanced rupee budget, backward timeline, and vendor questions in seconds.
              </p>
            </div>

            <EventForm
              initialValues={currentInput}
              onSubmit={generatePlan}
              isLoading={isLoading}
            />
          </div>
        ) : (
          /* Plan Display View */
          <div className="space-y-8">
            {/* Plan Header Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="space-y-2 max-w-3xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-full bg-[#F5F7FA] text-[#0B1F4B] text-xs font-extrabold uppercase tracking-wider border border-slate-200">
                      Master Plan Ready
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[#F5F7FA] text-slate-700 text-xs font-bold capitalize border border-slate-200">
                      {plan.input.vibe} Vibe
                    </span>
                    {daysRemaining >= 0 && (
                      <span className="px-3 py-1 rounded-full bg-[#F5F7FA] text-[#2563EB] text-xs font-bold flex items-center gap-1 border border-slate-200">
                        <Clock className="w-3 h-3 text-[#2563EB]" />
                        {daysRemaining === 0 ? 'Happening Today!' : `${daysRemaining} days to go`}
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111111] font-display tracking-tight leading-tight">
                    {plan.title}
                  </h2>
                  <p className="text-base sm:text-lg font-medium text-slate-700 italic">
                    "{plan.tagline}"
                  </p>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal pt-1">
                    {plan.overview}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-row lg:flex-col gap-2.5 flex-wrap flex-shrink-0 no-print">
                  <button
                    onClick={handleCopyFullPlan}
                    className="flex-1 lg:flex-initial px-4 py-2.5 rounded-2xl bg-[#0B1F4B] hover:bg-[#142a63] text-white text-xs sm:text-sm font-bold transition shadow-xs flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    {copiedSummary ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Copied Summary!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 text-white" />
                        <span>Copy to WhatsApp</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handlePrint}
                    className="flex-1 lg:flex-initial px-4 py-2.5 rounded-2xl bg-[#F5F7FA] hover:bg-slate-200 border border-slate-200 text-[#111111] text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <Printer className="w-4 h-4 text-slate-600" />
                    <span>Print / Save PDF</span>
                  </button>

                  <button
                    onClick={handleResetToForm}
                    className="flex-1 lg:flex-initial px-4 py-2 rounded-2xl text-xs font-semibold text-slate-500 hover:text-[#111111] hover:bg-[#F5F7FA] transition text-center cursor-pointer"
                  >
                    ← Edit Inputs
                  </button>
                </div>
              </div>

              {/* Quick Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-6">
                <div className="p-4 rounded-2xl bg-[#F5F7FA] border border-slate-200">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-1">
                    <Calendar className="w-4 h-4 text-[#2563EB]" />
                    <span>Target Date</span>
                  </div>
                  <span className="text-sm sm:text-base font-extrabold text-[#111111] block leading-tight">
                    {formatReadableDate(plan.input.eventDate)}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#F5F7FA] border border-slate-200">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-1">
                    <Users className="w-4 h-4 text-[#2563EB]" />
                    <span>Expected Guests</span>
                  </div>
                  <span className="text-sm sm:text-base font-extrabold text-[#111111] block leading-tight">
                    {plan.input.guests} People
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#F5F7FA] border border-slate-200">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-1">
                    <IndianRupee className="w-4 h-4 text-[#2563EB]" />
                    <span>Total Budget</span>
                  </div>
                  <span className="text-sm sm:text-base font-extrabold text-[#111111] block leading-tight">
                    {formatINR(plan.totalBudget)}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#F5F7FA] border border-slate-200">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-1">
                    <MapPin className="w-4 h-4 text-[#2563EB]" />
                    <span>Host City</span>
                  </div>
                  <span className="text-sm sm:text-base font-extrabold text-[#111111] block leading-tight">
                    {plan.input.city}, India
                  </span>
                </div>
              </div>

              {/* Mentor Golden Rule Callout */}
              <div className="mt-6 p-4 rounded-2xl bg-[#F5F7FA] border border-slate-200 text-[#111111] flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-[#0B1F4B] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Lightbulb className="w-4 h-4 text-[#2563EB]" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0B1F4B] block mb-0.5">
                    PlanPilot Mentor Golden Rule:
                  </span>
                  <p className="text-xs sm:text-sm font-medium leading-relaxed">
                    {plan.topOrganizerTip}
                  </p>
                </div>
              </div>
            </div>

            {/* Readiness Score Progress Ring & Top 3 Bottlenecks */}
            <div id="readiness-section">
              <ReadinessScore
                plan={plan}
                completedTasks={completedTasks}
                onToggleTask={handleToggleTask}
                completedVendors={completedVendors}
                onToggleVendor={handleToggleVendor}
                onResetReadiness={handleResetReadiness}
              />
            </div>

            {/* Navigation Section Tabs (Sticky on scroll) */}
            <div className="sticky top-2 z-20 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1 overflow-x-auto no-print">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-[#0B1F4B] text-white shadow-xs'
                    : 'bg-[#F5F7FA] text-[#111111] hover:bg-slate-200/80'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>All Sections</span>
              </button>

              <button
                onClick={() => setActiveTab('whatif')}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'whatif'
                    ? 'bg-[#0B1F4B] text-white shadow-xs'
                    : activePlanB
                    ? 'bg-blue-50 text-[#0B1F4B] border border-blue-200'
                    : 'bg-[#F5F7FA] text-[#111111] hover:bg-slate-200/80'
                }`}
              >
                <span className="text-base">⚡</span>
                <span>“What If?” Plan B</span>
                {activePlanB && (
                  <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-ping" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('budget')}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'budget'
                    ? 'bg-[#0B1F4B] text-white shadow-xs'
                    : 'bg-[#F5F7FA] text-[#111111] hover:bg-slate-200/80'
                }`}
              >
                <IndianRupee className="w-4 h-4" />
                <span>1. Budget Split & Chart</span>
              </button>

              <button
                onClick={() => setActiveTab('spending')}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'spending'
                    ? 'bg-[#0B1F4B] text-white shadow-xs'
                    : 'bg-[#F5F7FA] text-[#111111] hover:bg-slate-200/80'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Track Spending</span>
                {hasSpendingWarning && (
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" title="Budget Alert: category > 80% used" />
                )}
                {payments.length > 0 && !hasSpendingWarning && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 text-[#111111] font-bold">
                    {payments.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'timeline'
                    ? 'bg-[#0B1F4B] text-white shadow-xs'
                    : 'bg-[#F5F7FA] text-[#111111] hover:bg-slate-200/80'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>2. Backward Timeline</span>
              </button>

              <button
                onClick={() => setActiveTab('vendors')}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'vendors'
                    ? 'bg-[#0B1F4B] text-white shadow-xs'
                    : 'bg-[#F5F7FA] text-[#111111] hover:bg-slate-200/80'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span>3. Vendor Checklist</span>
              </button>

              <button
                onClick={() => setActiveTab('ideas')}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'ideas'
                    ? 'bg-[#0B1F4B] text-white shadow-xs'
                    : 'bg-[#F5F7FA] text-[#111111] hover:bg-slate-200/80'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>4. 5 Creative Ideas</span>
              </button>
            </div>

            {/* Render Sections Based on Tab */}
            <div className="space-y-10">
              {/* "What If?" Plan B Section */}
              {(activeTab === 'all' || activeTab === 'whatif') && (
                <section id="whatif-section">
                  <WhatIfSection
                    originalPlan={plan}
                    activePlanB={activePlanB}
                    onGeneratePlanB={handleGeneratePlanB}
                    onDismissPlanB={handleDismissPlanB}
                    isLoadingPlanB={isLoadingPlanB}
                    selectedScenarioKey={selectedScenarioKey}
                  />
                </section>
              )}
              {/* Section 1: Budget */}
              {(activeTab === 'all' || activeTab === 'budget') && (
                <section id="budget-section">
                  <BudgetSection
                    categories={plan.budgetCategories}
                    totalBudget={plan.totalBudget}
                    perGuestCost={plan.perGuestCost}
                    guests={plan.input.guests}
                    onOpenSpending={() => setActiveTab('spending')}
                  />
                </section>
              )}

              {/* Track Spending Section */}
              {(activeTab === 'all' || activeTab === 'spending') && (
                <section id="spending-section">
                  <TrackSpendingSection
                    categories={plan.budgetCategories}
                    totalBudget={plan.totalBudget}
                    payments={payments}
                    onAddPayment={handleAddPayment}
                    onDeletePayment={handleDeletePayment}
                    onClearPayments={handleClearPayments}
                  />
                </section>
              )}

              {/* Section 2: Timeline */}
              {(activeTab === 'all' || activeTab === 'timeline') && (
                <section id="timeline-section" className={activeTab === 'all' ? 'print-page-break' : ''}>
                  <TimelineSection
                    timeline={plan.timeline}
                    eventDate={plan.input.eventDate}
                    eventType={plan.input.eventType}
                    completedTasks={completedTasks}
                    onToggleTask={handleToggleTask}
                  />
                </section>
              )}

              {/* Section 3: Vendor Checklist */}
              {(activeTab === 'all' || activeTab === 'vendors') && (
                <section id="vendor-section" className={activeTab === 'all' ? 'print-page-break' : ''}>
                  <VendorSection
                    vendors={plan.vendorChecklist}
                    city={plan.input.city}
                    completedVendors={completedVendors}
                    onToggleVendor={handleToggleVendor}
                  />
                </section>
              )}

              {/* Section 4: 5 Personalized Ideas */}
              {(activeTab === 'all' || activeTab === 'ideas') && (
                <section id="ideas-section">
                  <IdeasSection
                    ideas={plan.ideas}
                    vibe={plan.input.vibe}
                    eventType={plan.input.eventType}
                  />
                </section>
              )}
            </div>

            {/* Bottom Floating Summary / Back to Top */}
            <div className="pt-8 pb-12 text-center text-xs text-slate-500 border-t border-slate-200">
              <p>PlanPilot · Event Planning Assistant for First-Time Organizers in India</p>
              <p className="mt-1">Budget estimates are approximate. Confirm prices with real quotes.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
