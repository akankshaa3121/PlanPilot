/**
 * Format a number into Indian Rupee currency format (e.g. ₹1,50,000)
 */
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date string (YYYY-MM-DD) into readable Indian date
 */
export function formatReadableDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Calculate days remaining until event date from today
 */
export function getDaysRemaining(eventDateStr: string): number {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [year, month, day] = eventDateStr.split('-').map(Number);
    const eventDate = new Date(year, month - 1, day);
    const diffTime = eventDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

/**
 * Merge milestones with the exact same date or daysBefore so milestone dates never repeat.
 * Specifically merges multiple D-Day (T-0) entries into a single milestone with all combined tasks.
 */
export function mergeDuplicateMilestones<T extends { id?: string; daysBefore: number; label: string; targetDate: string; stage?: string; tasks?: any[] }>(
  timeline: T[]
): T[] {
  if (!Array.isArray(timeline) || timeline.length === 0) return timeline;

  const mergedMap = new Map<string, T>();
  const order: string[] = [];

  for (const item of timeline) {
    const isDDay = Number(item.daysBefore) === 0 || /day of event|d-day|t-0/i.test(item.label || '');
    // Key by normalized date and whether it is D-Day
    const key = isDDay ? 'dday_0' : `${Number(item.daysBefore)}_${item.targetDate.trim()}`;

    if (!mergedMap.has(key)) {
      mergedMap.set(key, {
        ...item,
        daysBefore: isDDay ? 0 : Number(item.daysBefore),
        label: isDDay ? 'Day of Event (T-0)' : item.label,
        stage: isDDay ? (item.stage || 'Event Day Execution & Celebration') : item.stage,
        tasks: Array.isArray(item.tasks) ? [...item.tasks] : [],
      });
      order.push(key);
    } else {
      const existing = mergedMap.get(key)!;
      // Merge tasks and prevent exact duplicate task titles
      const existingTitles = new Set((existing.tasks || []).map((t: any) => String(t.title || '').toLowerCase().trim()));
      if (Array.isArray(item.tasks)) {
        for (const t of item.tasks) {
          const titleKey = String(t.title || '').toLowerCase().trim();
          if (!existingTitles.has(titleKey)) {
            existing.tasks = existing.tasks || [];
            existing.tasks.push({
              ...t,
              id: `${existing.id || 'm'}-task-${existing.tasks.length + 1}`,
            });
            existingTitles.add(titleKey);
          }
        }
      }

      if (isDDay) {
        existing.label = 'Day of Event (T-0)';
        if (!existing.stage || existing.stage.toLowerCase().includes('action')) {
          existing.stage = 'Event Day Execution & Celebration';
        }
      }
    }
  }

  // Return merged milestones in order (ensuring descending order by daysBefore)
  const result = order.map((k) => mergedMap.get(k)!);
  return result.sort((a, b) => (Number(b.daysBefore) || 0) - (Number(a.daysBefore) || 0));
}

/**
 * If the event date is closer than the plan's normal timeline (for example 28 days away but
 * the plan starts at T-30), compress the timeline so that no task has a date in the past.
 * The first task should be dated today or later.
 * Guarantees no milestone dates are ever repeated, and merges any duplicate D-Day entries into one.
 */
export function compressTimeline<T extends { id?: string; daysBefore: number; label: string; targetDate: string; stage?: string; tasks?: any[] }>(
  timeline: T[],
  eventDateStr: string
): T[] {
  if (!Array.isArray(timeline) || timeline.length === 0) return timeline;

  // First pass: merge any pre-existing duplicates in the incoming timeline
  const deduplicated = mergeDuplicateMilestones(timeline);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = eventDateStr.split('-').map(Number);
  const eventDate = new Date(year, month - 1, day);
  eventDate.setHours(0, 0, 0, 0);

  const diffMs = eventDate.getTime() - today.getTime();
  const daysUntilEvent = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  const maxOriginalDays = Math.max(...deduplicated.map((m) => Number(m.daysBefore) || 0), 0);

  // If compression is not needed, return deduplicated timeline
  if (maxOriginalDays <= daysUntilEvent) {
    return deduplicated;
  }

  // Sort descending by daysBefore
  const sorted = [...deduplicated].sort(
    (a, b) => (Number(b.daysBefore) || 0) - (Number(a.daysBefore) || 0)
  );

  let prevDays = daysUntilEvent + 1;

  const compressed = sorted.map((m, idx) => {
    let newDays: number;
    if (idx === 0) {
      newDays = daysUntilEvent;
    } else if (Number(m.daysBefore) === 0 || idx === sorted.length - 1) {
      newDays = 0;
    } else {
      const ratio = maxOriginalDays > 0 ? (Number(m.daysBefore) || 0) / maxOriginalDays : 0;
      newDays = Math.round(daysUntilEvent * ratio);
      if (newDays >= prevDays) {
        newDays = Math.max(0, prevDays - 1);
      }
    }
    prevDays = newDays;

    // Calculate milestone date
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() - newDays);
    const targetDate = d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const isToday = newDays === daysUntilEvent && daysUntilEvent > 0;
    const label = newDays === 0
      ? 'Day of Event (T-0)'
      : isToday
      ? `${newDays} Days Before (Today / T-${newDays})`
      : `${newDays} Days Before (T-${newDays})`;

    return {
      ...m,
      daysBefore: newDays,
      label,
      targetDate,
    };
  });

  // Final pass: merge in case compression resulted in overlapping days/dates
  return mergeDuplicateMilestones(compressed);
}
