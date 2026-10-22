export type EventVibe = 'fun' | 'formal' | 'budget-friendly';

export interface EventInput {
  eventType: string;
  eventDate: string; // YYYY-MM-DD
  guests: number;
  budget: number; // in INR
  city: string;
  vibe: EventVibe;
  notes?: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  amount: number; // in INR, exactly sums up to total budget
  originalAmount?: number; // Previous amount in original plan ("Was ₹X")
  percentage: number;
  color: string;
  tips: string;
  items: string[];
}

export interface TimelineTask {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface TimelineMilestone {
  id: string;
  daysBefore: number;
  label: string;
  targetDate: string;
  stage: string;
  tasks: TimelineTask[];
}

export interface VendorChecklistItem {
  id: string;
  vendorType: string;
  benchmarkCost: string;
  whyNeeded: string;
  questions: [string, string, string]; // exactly 3 questions
  organizerTip: string;
}

export interface PersonalizedIdea {
  id: number;
  title: string;
  category: 'Theme' | 'Decor' | 'Activity' | 'Food Experience' | 'Memorable Moment';
  description: string;
  budgetFriendlyHack: string;
  vibeFit: string;
}

export interface EventPlan {
  id: string;
  title: string;
  tagline: string;
  overview: string;
  input: EventInput;
  totalBudget: number;
  perGuestCost: number;
  topOrganizerTip: string;
  budgetCategories: BudgetCategory[];
  timeline: TimelineMilestone[];
  vendorChecklist: VendorChecklistItem[];
  ideas: PersonalizedIdea[]; // exactly 5 ideas
  generatedAt: string;
  activePlanB?: PlanB | null;
}

export type WhatIfScenarioKey = 'rain' | 'caterer_cancels' | 'budget_cut_20' | 'half_guests' | 'custom';

export interface PlanBTimelineChange {
  timeframe: string;
  tasks: string[];
  urgency: 'critical' | 'high' | 'medium';
}

export interface PlanB {
  id: string;
  scenarioKey: string;
  scenarioTitle: string;
  summary: string;
  immediateNextStep: string; // one clear next step
  newTotalBudget: number;
  originalTotalBudget: number;
  budgetDifference: number;
  budgetRationale: string;
  adjustedBudgetCategories: BudgetCategory[];
  timelineChanges: PlanBTimelineChange[];
  vendorAction: string;
  silverLining: string;
  generatedAt: string;
}

export interface PaymentEntry {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number; // in INR
  note: string; // vendor name or payment purpose
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export interface QuoteItem {
  name: string;
  price: number;
  note?: string;
}

export type QuoteBudgetStatus = 'fits' | 'slightly high' | 'too high';

export interface QuoteAnalysisResult {
  isQuotation: boolean;
  rejectionReason?: string;
  extractedVendorName?: string | null;
  items: QuoteItem[];
  totalAmount: number;
  plannedBudget: number;
  categoryName: string;
  vendorType: string;
  status: QuoteBudgetStatus;
  differenceAmount: number; // rupee difference
  differenceDescription: string;
  unnecessaryOrUnclearItems: string[];
  negotiationPoints: [string, string, string]; // exactly 3 simple points to negotiate
  disclaimer: string; // "This is an estimate. Confirm prices with the vendor."
  analyzedAt: string;
}
