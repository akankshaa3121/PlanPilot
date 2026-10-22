import type { EventPlan, TimelineTask, VendorChecklistItem } from '../types/plan';

export interface HurtingItem {
  id: string;
  type: 'vendor' | 'task';
  title: string;
  subtitle: string;
  actionText: string;
  weight: number;
  points: number;
  category: 'venue' | 'food' | 'sound' | 'permission' | 'general';
}

export interface ReadinessCalculation {
  score: number;
  totalWeight: number;
  completedWeight: number;
  message: string;
  statusBadge: string;
  hurtingItems: HurtingItem[];
  completedTaskCount: number;
  totalTaskCount: number;
  completedVendorCount: number;
  totalVendorCount: number;
}

/**
 * Calculates item weight based on event planning importance.
 * High weight is given to Venue and Food, as well as critical permissions and sound.
 */
export function getTaskWeight(task: TimelineTask): { weight: number; category: HurtingItem['category'] } {
  const text = `${task.title} ${task.description}`.toLowerCase();

  // Venue & Permissions (Highest impact anchor)
  if (/venue|hall|auditorium|ground|lawn|room booking|space rental|hostel|campus permission|police permission|society approval/i.test(text)) {
    return { weight: 6, category: 'venue' };
  }

  // Food & Catering (High impact anchor)
  if (/cater|food|menu|meal|snack|tasting|halwai|dabbawala|beverage|lunch|dinner|chai|breakfast/i.test(text)) {
    return { weight: 6, category: 'food' };
  }

  // Sound, DJ & AV
  if (/sound|dj|music|audio|speaker|mic|av setup|console/i.test(text)) {
    return { weight: 4, category: 'sound' };
  }

  // Permissions / approvals
  if (/permission|approval|signoff|license|permit/i.test(text)) {
    return { weight: 5, category: 'permission' };
  }

  // General priority
  if (task.priority === 'high') {
    return { weight: 3, category: 'general' };
  }
  if (task.priority === 'medium') {
    return { weight: 2, category: 'general' };
  }
  return { weight: 1, category: 'general' };
}

export function getVendorWeight(vendor: VendorChecklistItem): { weight: number; category: HurtingItem['category'] } {
  const text = `${vendor.vendorType} ${vendor.whyNeeded}`.toLowerCase();

  // Venue vendor: Top weight
  if (/venue|hall|lawn|auditorium|ground|banquet|hotel|resort|space/i.test(text)) {
    return { weight: 10, category: 'venue' };
  }

  // Food / Caterer vendor: Top weight
  if (/cater|food|halwai|dabba|meal|snack|buffet|cook/i.test(text)) {
    return { weight: 10, category: 'food' };
  }

  // Sound & Music / DJ
  if (/sound|dj|music|audio|av|speaker/i.test(text)) {
    return { weight: 6, category: 'sound' };
  }

  // Decor / Stage / Lighting
  if (/decor|balloon|flower|light|stage|tent/i.test(text)) {
    return { weight: 4, category: 'general' };
  }

  // Photography / Media
  if (/photo|camera|media|video|film/i.test(text)) {
    return { weight: 3, category: 'general' };
  }

  // Default vendor weight
  return { weight: 3, category: 'general' };
}

/**
 * Calculates the holistic Readiness Score out of 100 and identifies the top 3 hurting items.
 */
export function calculateReadinessScore(
  plan: EventPlan,
  completedTasks: { [id: string]: boolean },
  completedVendors: { [id: string]: boolean }
): ReadinessCalculation {
  const allTasks: TimelineTask[] = plan.timeline.flatMap((m) => m.tasks);
  const allVendors: VendorChecklistItem[] = plan.vendorChecklist;

  let totalWeight = 0;
  let completedWeight = 0;
  const pendingItems: HurtingItem[] = [];

  // Calculate weights for all vendors
  allVendors.forEach((vendor) => {
    const { weight, category } = getVendorWeight(vendor);
    totalWeight += weight;
    const isDone = Boolean(completedVendors[vendor.id]);

    if (isDone) {
      completedWeight += weight;
    } else {
      let friendlyTitle = `Book ${vendor.vendorType}`;
      let friendlySub = `Benchmark: ${vendor.benchmarkCost}. Needs 3 suggested questions asked before advance payment.`;

      if (category === 'venue') {
        friendlyTitle = `Lock in Venue / Hall (${vendor.vendorType})`;
        friendlySub = 'Venue is your event anchor. Without confirmed venue, date & crowd cannot be guaranteed.';
      } else if (category === 'food') {
        friendlyTitle = `Confirm Catering & Food (${vendor.vendorType})`;
        friendlySub = 'Food takes the biggest share of guest happiness and budget. Lock in menu & per-plate rate.';
      } else if (category === 'sound') {
        friendlyTitle = `Confirm Sound & Audio Operator`;
        friendlySub = 'Sound clarity and wireless mics are vital for announcements, games and music.';
      }

      pendingItems.push({
        id: vendor.id,
        type: 'vendor',
        title: friendlyTitle,
        subtitle: friendlySub,
        actionText: 'Vendor Checklist',
        weight,
        points: 0, // Will be computed after totalWeight is finalized
        category,
      });
    }
  });

  // Calculate weights for all timeline tasks
  allTasks.forEach((task) => {
    const { weight, category } = getTaskWeight(task);
    totalWeight += weight;
    const isDone = Boolean(completedTasks[task.id]);

    if (isDone) {
      completedWeight += weight;
    } else {
      pendingItems.push({
        id: task.id,
        type: 'task',
        title: task.title,
        subtitle: task.description || 'Important milestone countdown task.',
        actionText: 'Timeline Task',
        weight,
        points: 0,
        category,
      });
    }
  });

  // Calculate score out of 100
  const score = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
  const clampedScore = Math.min(100, Math.max(0, score));

  // Compute points contribution for pending items
  pendingItems.forEach((item) => {
    item.points = totalWeight > 0 ? Math.max(1, Math.round((item.weight / totalWeight) * 100)) : 1;
  });

  // Sort pending items descending by weight/points to find what's hurting the score the most
  pendingItems.sort((a, b) => b.weight - a.weight || b.points - a.points);
  const topHurtingItems = pendingItems.slice(0, 3);

  // Short message based on score bracket
  let message = "Fresh start! Tick off tasks and vendors as you book them.";
  let statusBadge = "Planning Phase";

  if (clampedScore === 0) {
    message = "0% — Just getting started! Focus on locking in your venue and food first.";
    statusBadge = "Not Started";
  } else if (clampedScore <= 25) {
    message = "Starting line — secure your venue, permissions, and caterer first!";
    statusBadge = "Early Stage";
  } else if (clampedScore <= 50) {
    message = "Good start! Core foundation is coming together nicely.";
    statusBadge = "In Progress";
  } else if (clampedScore <= 75) {
    message = "Solid progress! Most critical event anchors are locked in.";
    statusBadge = "Well Prepared";
  } else if (clampedScore <= 95) {
    message = "Almost event-ready! Just final touches and logistics remain.";
    statusBadge = "Nearly Ready";
  } else {
    message = "100% Event-Ready! All critical anchors and tasks are complete.";
    statusBadge = "Event Ready!";
  }

  const completedTaskCount = allTasks.filter((t) => completedTasks[t.id]).length;
  const completedVendorCount = allVendors.filter((v) => completedVendors[v.id]).length;

  return {
    score: clampedScore,
    totalWeight,
    completedWeight,
    message,
    statusBadge,
    hurtingItems: topHurtingItems,
    completedTaskCount,
    totalTaskCount: allTasks.length,
    completedVendorCount,
    totalVendorCount: allVendors.length,
  };
}
