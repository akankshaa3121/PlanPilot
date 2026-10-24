import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import type { EventInput, EventPlan, BudgetCategory, TimelineMilestone, VendorChecklistItem, PersonalizedIdea } from './src/types/plan';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize GoogleGenAI SDK server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to compute target date string given eventDate and daysBefore
function calculateMilestoneDate(eventDateStr: string, daysBefore: number): string {
  try {
    const [year, month, day] = eventDateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() - daysBefore);
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return `${daysBefore} days prior`;
  }
}

// Helper to call Gemini with retry on 503, 429, or high demand
async function generateContentWithRetry(params: any, maxRetries = 0) {  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await ai.models.generateContent(params);
    } catch (error: any) {
      const msg = String(error?.message || error || '').toLowerCase();
      const status = error?.status || error?.statusCode;
      const isBusy =
        status === 503 ||
        status === 429 ||
        msg.includes('503') ||
        msg.includes('429') ||
        msg.includes('high demand') ||
        msg.includes('resource_exhausted') ||
        msg.includes('busy') ||
        msg.includes('overloaded') ||
        msg.includes('unavailable');

      if (isBusy && attempt < maxRetries) {
        attempt++;
        console.warn(`[Gemini Retry] Attempt ${attempt}/${maxRetries} after busy/high demand. Waiting ${1000 * attempt}ms...`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Gemini is busy, please try again.');
}

// Category color palettes for visual appeal (Strict navy, blue, teal, slate theme - zero orange)
const CATEGORY_COLORS = [
  '#0B1F4B', // dark navy
  '#2563EB', // accent blue
  '#0284c7', // light sky blue
  '#4f46e5', // indigo
  '#0d9488', // teal
  '#6366f1', // royal blue
  '#475569', // slate
  '#1e293b', // dark slate
];

app.post('/api/generate-plan', async (req, res) => {
  try {
    const input: EventInput = req.body;

    if (!input || !input.eventType || !input.eventDate || !input.guests || !input.budget || !input.city || !input.vibe) {
      return res.status(400).json({
        error: 'Missing required event parameters. Please provide event type, date, guests, budget, city, and vibe.',
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Gemini API key is not configured in server environment. Please check settings.',
      });
    }

    const budgetFormatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(input.budget);

    const prompt = `
You are PlanPilot, an expert event planning specialist for first-time organizers (college student clubs, family elders, startup team leads) organizing events in India.

PLAN DETAILS:
- Event Type: ${input.eventType}
- Event Date: ${input.eventDate}
- Number of Guests: ${input.guests}
- Total Budget: ${budgetFormatted} (INR ${input.budget})
- Host City: ${input.city}, India
- Vibe: ${input.vibe}
${input.notes ? `- Special Instructions / Notes: ${input.notes}` : ''}

Generate a comprehensive, tailored, realistic event master plan following these STRICT guidelines:

1. LANGUAGE & TONE:
- Use clean, simple, encouraging Indian-English that any first-timer can easily understand.
- Keep amounts strictly in Indian Rupees (₹).
- Reflect realistic Indian vendor market dynamics in ${input.city}.

2. BUDGET SPLIT (Section 1):
- Provide 5 to 7 logical categories (e.g., Food & Refreshments, Venue Rental/Permissions, Sound & Music/AV, Theme Decor & Stage, Photography/Videography, Favors/Prizes/Invites, Emergency Buffer Reserve).
- Amounts MUST be whole integer numbers that represent realistic proportions for this event type and city.
- Note: It is vital that the amounts add up realistically to the total budget of ₹${input.budget}.
- Provide practical cost-saving tips and 3-4 bullet sub-items for each category.

3. COUNTDOWN TIMELINE (Section 2):
- Count BACKWARD from event date.
- If the event date is closer than the plan’s normal timeline (for example 28 days away, 14 days away, or shorter), compress the timeline so that NO task has a date in the past. The first task must be dated today or later.
- Provide compressed milestones starting from today or later (e.g., if 28 days away, start at 28 days before down to Day of Event (0 days)).
- Each milestone must have realistic, high-priority tasks tailored to college clubs/families/small teams in India (e.g. tasting menu, getting principal/college permission or society approval, testing sound cables, setting up WhatsApp broadcast group, buying water bottles/ice, advance vendor token payments).

4. VENDOR CHECKLIST (Section 3):
- Include a vendor type for EVERY budget category that needs one (e.g., Catering/Food, Venue/Lawn, Sound & Music/DJ, Stage & Decor, Photography/Media, Favors/Printing/Gifts, Transport/Logistics). Only purely internal financial reserves (like Emergency Contingency Buffer) do not need a vendor.
- Strictly vendor TYPES only (e.g. "Catering Vendor / Halwai / Dabbawala", "Banquet Hall / Lawn Manager", "DJ & Sound System Operator", "Decorator & Balloon / Flower Vendor", "Event Photographer / Campus Media Club", "Printer for Banners & ID Badges").
- NEVER INVENT REAL VENDOR NAMES, REAL COMPANIES, OR PHONE NUMBERS!
- Include approximate benchmark cost in ₹.
- Provide EXACTLY THREE critical suggested questions to ask each vendor before booking to avoid last-minute Indian wedding/fest surprises (e.g., generator power backup, hidden cleaning charges, corkage, overtime fees, cancellation refund policy).
- Include 1 golden bargaining/negotiation organizer tip for that vendor.

5. 5 PERSONALIZED IDEAS (Section 4):
- Exactly FIVE distinct, creative ideas tailored to ${input.eventType} with ${input.vibe} vibe in ${input.city}.
- Cover: 1 Theme idea, 1 Decor idea, 1 Activity/Game idea, 1 Food/Drink twist, 1 Memorable signature moment.
- For each idea, provide:
  - Catchy title
  - Description in simple English
  - "budgetFriendlyHack": how to pull it off cheaply (DIY, street market sourcing, Spotify playlists, fairy lights, Polaroid camera rentals, fun quizzes)
  - "vibeFit": why this fits the ${input.vibe} vibe
`;

    const systemInstruction = `You are PlanPilot, a warm, experienced Indian event organizer mentor. Your advice is practical, grounded in Indian context (Indian cities, college fests, family pujas/parties, corporate offsites), and tailored for first-time organizers. You strictly never make up real business names or phone numbers. All figures must be in INR.`;

    const modelCandidates = ['gemini-3-flash-preview', 'gemini-3.8-flash', 'gemini-flash-latest'];
    let responseText = '';
    let lastError: any = null;

    for (const modelName of modelCandidates) {
      try {
        console.log(`Attempting plan generation with model: ${modelName}`);
        const response = await generateContentWithRetry({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: 'Catchy event project title' },
                tagline: { type: Type.STRING, description: 'Short inspiring tagline' },
                overview: { type: Type.STRING, description: 'A warm 2-3 sentence executive summary for the organizer' },
                topOrganizerTip: { type: Type.STRING, description: 'One critical golden rule for this specific event' },
                budgetCategories: {
                  type: Type.ARRAY,
                  description: 'Budget categories breakdown',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      amount: { type: Type.INTEGER, description: 'Amount in INR' },
                      tips: { type: Type.STRING },
                      items: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                    },
                    required: ['name', 'amount', 'tips', 'items'],
                  },
                },
                timeline: {
                  type: Type.ARRAY,
                  description: 'Timeline milestones counted backward from event date',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      daysBefore: { type: Type.INTEGER, description: 'Number of days before the event (e.g. 30, 14, 7, 3, 1, 0)' },
                      label: { type: Type.STRING, description: 'e.g. "30 Days Before (T-30)"' },
                      stage: { type: Type.STRING, description: 'Milestone stage name' },
                      tasks: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
                          },
                          required: ['title', 'description', 'priority'],
                        },
                      },
                    },
                    required: ['daysBefore', 'label', 'stage', 'tasks'],
                  },
                },
                vendorChecklist: {
                  type: Type.ARRAY,
                  description: 'Vendor types checklist with 3 questions each',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      vendorType: { type: Type.STRING, description: 'Vendor type category only, no fake names' },
                      benchmarkCost: { type: Type.STRING, description: 'Estimated cost range in INR' },
                      whyNeeded: { type: Type.STRING },
                      questions: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: 'Exactly 3 questions to ask',
                      },
                      organizerTip: { type: Type.STRING, description: 'Insider negotiation/clarity tip' },
                    },
                    required: ['vendorType', 'benchmarkCost', 'whyNeeded', 'questions', 'organizerTip'],
                  },
                },
                ideas: {
                  type: Type.ARRAY,
                  description: 'Exactly 5 creative ideas',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      category: {
                        type: Type.STRING,
                        enum: ['Theme', 'Decor', 'Activity', 'Food Experience', 'Memorable Moment'],
                      },
                      description: { type: Type.STRING },
                      budgetFriendlyHack: { type: Type.STRING },
                      vibeFit: { type: Type.STRING },
                    },
                    required: ['title', 'category', 'description', 'budgetFriendlyHack', 'vibeFit'],
                  },
                },
              },
              required: [
                'title',
                'tagline',
                'overview',
                'topOrganizerTip',
                'budgetCategories',
                'timeline',
                'vendorChecklist',
                'ideas',
              ],
            },
          },
        });

        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} encountered error:`, err?.message || err);
        lastError = err;
        // Wait before trying the next model
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    let rawData: any;

    if (!responseText) {
      console.warn('Gemini unavailable. Using built-in fallback plan.');
      rawData = {
        title: (input.eventType || 'Event') + ' Plan',
        tagline: 'A practical plan for your event',
        overview: 'AI generation is temporarily unavailable. Built-in planning defaults are being used.',
        topOrganizerTip: 'Confirm the venue and vendors early, and keep an emergency budget reserve.',
        budgetCategories: [],
        timeline: [
  { daysBefore: 14, label: 'Finalize event plan', stage: 'Planning', tasks: ['Finalize budget', 'Confirm venue', 'Prepare guest list'] },
  { daysBefore: 7, label: 'Confirm arrangements', stage: 'Preparation', tasks: ['Confirm vendors', 'Finalize food', 'Check decorations'] },
  { daysBefore: 3, label: 'Final confirmations', stage: 'Preparation', tasks: ['Remind guests', 'Verify bookings', 'Check supplies'] },
  { daysBefore: 1, label: 'Prepare for the event', stage: 'Final Checks', tasks: ['Pack supplies', 'Confirm schedules', 'Review checklist'] },
  { daysBefore: 0, label: 'Event day', stage: 'Event Day', tasks: ['Set up venue', 'Coordinate vendors', 'Welcome guests'] }
],
        vendorChecklist: [],
        ideas: [
  {
    title: 'Personalized Welcome Corner',
    category: 'Decor',
    description: 'Create a welcoming entrance with a sign and photo area.',
    budgetFriendlyHack: 'Use printed signs and decorations you already have.',
    vibeFit: `Customize the welcome area to match the ${input.vibe} vibe.`
  },
  {
    title: 'Interactive Guest Activity',
    category: 'Entertainment',
    description: 'Add a simple game that encourages guests to participate.',
    budgetFriendlyHack: 'Use free printable game sheets.',
    vibeFit: 'Helps guests connect and enjoy the event.'
  },
  {
    title: 'Personalized Playlist',
    category: 'Music',
    description: 'Prepare music for different moments of the event.',
    budgetFriendlyHack: 'Use a free music streaming option.',
    vibeFit: 'Matches the event atmosphere.'
  },
  {
    title: 'Memory Photo Spot',
    category: 'Photography',
    description: 'Create a small photo spot for memorable pictures.',
    budgetFriendlyHack: 'Use a plain backdrop and reusable props.',
    vibeFit: 'Gives guests a fun activity and lasting memories.'
  },
  {
    title: 'Thoughtful Thank-You',
    category: 'Guest Experience',
    description: 'End the event with a thank-you message for attendees.',
    budgetFriendlyHack: 'Send a digital thank-you message.',
    vibeFit: 'Creates a warm and personal ending.'
  }
]
      };
    } else {
      rawData = JSON.parse(responseText);
    }

    // EXACT BUDGET RECONCILIATION
    // We mathematically guarantee that the sum of budget categories matches totalBudget to the exact rupee!
    let rawCategories: any[] = rawData.budgetCategories || [];
    if (!Array.isArray(rawCategories) || rawCategories.length === 0) {
      rawCategories = [
        { name: 'Food & Refreshments', amount: Math.round(input.budget * 0.4), tips: 'Buffet and finger foods', items: ['Starters', 'Main buffet', 'Beverages'] },
        { name: 'Venue & Logistics', amount: Math.round(input.budget * 0.25), tips: 'Hall or lawn booking', items: ['Rent', 'Cleaning deposit'] },
        { name: 'Sound & Decor', amount: Math.round(input.budget * 0.2), tips: 'Fairy lights and sound system', items: ['Speakers', 'Banners', 'Lights'] },
        { name: 'Emergency Buffer', amount: Math.round(input.budget * 0.15), tips: 'For extra guests and unplanned items', items: ['Contingency fund'] },
      ];
    }

    // Compute raw sum
    const rawSum = rawCategories.reduce((acc, cat) => acc + (Number(cat.amount) || 0), 0);

    let processedCategories: BudgetCategory[] = [];

    if (rawSum > 0) {
      // Scale proportionally to meet user's input.budget exactly
      let runningTotal = 0;
      processedCategories = rawCategories.map((cat, idx) => {
        const proportion = (Number(cat.amount) || 0) / rawSum;
        let scaledAmount = Math.round(input.budget * proportion);
        
        // On last item, absorb any 1-2 rupee rounding difference
        if (idx === rawCategories.length - 1) {
          scaledAmount = input.budget - runningTotal;
        } else {
          runningTotal += scaledAmount;
        }

        const percentage = Math.round((scaledAmount / input.budget) * 100);

        return {
          id: `cat-${idx + 1}`,
          name: cat.name || `Category ${idx + 1}`,
          amount: Math.max(0, scaledAmount),
          percentage,
          color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
          tips: cat.tips || 'Book early to get best rates.',
          items: Array.isArray(cat.items) ? cat.items : ['Standard allocation'],
        };
      });
    } else {
      // Fallback
      processedCategories = [
        {
          id: 'cat-1',
          name: 'Food & Refreshments',
          amount: Math.round(input.budget * 0.45),
          percentage: 45,
          color: CATEGORY_COLORS[0],
          tips: 'Prioritize crowd-pleasing warm snacks and coolers.',
          items: ['Appetizers', 'Main courses', 'Dessert'],
        },
        {
          id: 'cat-2',
          name: 'Venue & Rentals',
          amount: Math.round(input.budget * 0.3),
          percentage: 30,
          color: CATEGORY_COLORS[1],
          tips: 'Confirm AC, chairs, and power backup.',
          items: ['Seating', 'Lighting', 'Space rental'],
        },
        {
          id: 'cat-3',
          name: 'Sound & Atmosphere',
          amount: Math.round(input.budget * 0.15),
          percentage: 15,
          color: CATEGORY_COLORS[2],
          tips: 'Rent 2 good PA speakers and wireless mic.',
          items: ['Sound system', 'Mic', 'Fairy lights'],
        },
        {
          id: 'cat-4',
          name: 'Contingency / Buffer',
          amount: input.budget - (Math.round(input.budget * 0.45) + Math.round(input.budget * 0.3) + Math.round(input.budget * 0.15)),
          percentage: 10,
          color: CATEGORY_COLORS[6],
          tips: 'Keep cash handy for extra ice, tips, and transport.',
          items: ['Miscellaneous cash reserve'],
        },
      ];
    }

    // Ensure total sum equals input.budget exactly
    const finalSum = processedCategories.reduce((acc, c) => acc + c.amount, 0);
    if (finalSum !== input.budget) {
      const diff = input.budget - finalSum;
      // Add diff to the largest category
      let maxCat = processedCategories[0];
      for (const cat of processedCategories) {
        if (cat.amount > maxCat.amount) maxCat = cat;
      }
      maxCat.amount += diff;
      maxCat.percentage = Math.round((maxCat.amount / input.budget) * 100);
    }

    // Calculate days from today to event date for timeline compression
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [eYear, eMonth, eDay] = input.eventDate.split('-').map(Number);
    const targetEventDate = new Date(eYear, eMonth - 1, eDay);
    targetEventDate.setHours(0, 0, 0, 0);
    const msDiff = targetEventDate.getTime() - today.getTime();
    const daysUntilEvent = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));

    // Format timeline milestones with realistic dates and compression
    const rawTimeline = Array.isArray(rawData.timeline) ? rawData.timeline : [];
    // Sort descending by daysBefore so it counts down
    rawTimeline.sort((a: any, b: any) => (Number(b.daysBefore) || 0) - (Number(a.daysBefore) || 0));

    const maxOriginalDays = Math.max(...rawTimeline.map((m: any) => Number(m.daysBefore) || 0), 0);
    const shouldCompress = maxOriginalDays > daysUntilEvent;

    let prevDays = daysUntilEvent + 1;

    const processedTimeline: TimelineMilestone[] = rawTimeline.map((m: any, idx: number) => {
      let days = typeof m.daysBefore === 'number' ? m.daysBefore : 0;
      let label = m.label || (days === 0 ? 'Day of Event (T-0)' : `${days} Days Before (T-${days})`);

      if (shouldCompress) {
        if (idx === 0) {
          days = daysUntilEvent;
        } else if (days === 0 || idx === rawTimeline.length - 1) {
          days = 0;
        } else {
          const ratio = maxOriginalDays > 0 ? (Number(m.daysBefore) || 0) / maxOriginalDays : 0;
          days = Math.round(daysUntilEvent * ratio);
          if (days >= prevDays) {
            days = Math.max(0, prevDays - 1);
          }
        }
        prevDays = days;

        const isToday = days === daysUntilEvent && daysUntilEvent > 0;
        label = days === 0
          ? 'Day of Event (T-0)'
          : isToday
          ? `${days} Days Before (Today / T-${days})`
          : `${days} Days Before (T-${days})`;
      }

      return {
        id: `milestone-${idx + 1}`,
        daysBefore: days,
        label,
        targetDate: calculateMilestoneDate(input.eventDate, days),
        stage: m.stage || 'Action Phase',
        tasks: Array.isArray(m.tasks)
          ? m.tasks.map((t: any, tIdx: number) => ({
              id: `task-${idx + 1}-${tIdx + 1}`,
              title: t.title || 'Organizer task',
              description: t.description || '',
              priority: (['high', 'medium', 'low'].includes(t.priority) ? t.priority : 'medium') as 'high' | 'medium' | 'low',
            }))
          : [],
      };
    });

    // Format vendor checklist
    const rawVendors = Array.isArray(rawData.vendorChecklist) ? rawData.vendorChecklist : [];
    const processedVendors: VendorChecklistItem[] = rawVendors.map((v: any, idx: number) => {
      let questions: [string, string, string] = [
        'What is included in the base quote versus extra charges?',
        'What is your cancellation and date-change policy?',
        'Do you provide your own setup staff and power backup?',
      ];
      if (Array.isArray(v.questions) && v.questions.length >= 3) {
        questions = [v.questions[0], v.questions[1], v.questions[2]];
      } else if (Array.isArray(v.questions) && v.questions.length > 0) {
        questions[0] = v.questions[0];
        if (v.questions[1]) questions[1] = v.questions[1];
      }

      return {
        id: `vendor-${idx + 1}`,
        vendorType: v.vendorType || 'Essential Vendor',
        benchmarkCost: v.benchmarkCost || 'Market rate',
        whyNeeded: v.whyNeeded || 'Key service for smooth event operations.',
        questions,
        organizerTip: v.organizerTip || 'Always get quote specifics confirmed in writing on WhatsApp.',
      };
    });

    // Ensure vendor checklist includes a vendor type for EVERY budget category that needs one
    const isBufferCategory = (name: string): boolean => {
      const lower = name.toLowerCase();
      return lower.includes('buffer') || lower.includes('contingency') || lower.includes('emergency') || lower.includes('reserve') || lower.includes('unplanned');
    };

    const categoriesNeedingVendors = processedCategories.filter((c) => !isBufferCategory(c.name));

    const vendorMatchesCategory = (vendorType: string, catName: string): boolean => {
      const v = (vendorType || '').toLowerCase();
      const c = (catName || '').toLowerCase();

      if ((c.includes('food') || c.includes('cater') || c.includes('beverage') || c.includes('meal') || c.includes('refresh') || c.includes('snack')) &&
          (v.includes('cater') || v.includes('food') || v.includes('halwai') || v.includes('chef') || v.includes('meal') || v.includes('beverage') || v.includes('snack'))) {
        return true;
      }
      if ((c.includes('venue') || c.includes('hall') || c.includes('lawn') || c.includes('space') || c.includes('rent') || c.includes('auditorium') || c.includes('room')) &&
          (v.includes('venue') || v.includes('hall') || v.includes('lawn') || v.includes('space') || v.includes('manager') || v.includes('auditorium'))) {
        return true;
      }
      if ((c.includes('sound') || c.includes('music') || c.includes('dj') || c.includes('audio') || c.includes('av') || c.includes('speaker')) &&
          (v.includes('sound') || v.includes('music') || v.includes('dj') || v.includes('audio') || v.includes('av') || v.includes('speaker'))) {
        return true;
      }
      if ((c.includes('decor') || c.includes('stage') || c.includes('flower') || c.includes('light') || c.includes('theme') || c.includes('balloon')) &&
          (v.includes('decor') || v.includes('flower') || v.includes('light') || v.includes('stage') || v.includes('balloon') || v.includes('theme'))) {
        return true;
      }
      if ((c.includes('photo') || c.includes('video') || c.includes('camera') || c.includes('media') || c.includes('film')) &&
          (v.includes('photo') || v.includes('video') || v.includes('camera') || v.includes('media') || v.includes('film'))) {
        return true;
      }
      if ((c.includes('gift') || c.includes('favor') || c.includes('prize') || c.includes('invite') || c.includes('print') || c.includes('badge') || c.includes('banner')) &&
          (v.includes('gift') || v.includes('favor') || v.includes('prize') || v.includes('print') || v.includes('invite') || v.includes('badge') || v.includes('banner'))) {
        return true;
      }
      if ((c.includes('transport') || c.includes('travel') || c.includes('logistics') || c.includes('cab') || c.includes('bus')) &&
          (v.includes('transport') || v.includes('travel') || v.includes('cab') || v.includes('logistics') || v.includes('bus'))) {
        return true;
      }
      const words = c.split(/[\s&/,-]+/).filter((w) => w.length > 3);
      return words.some((w) => v.includes(w));
    };

    const createVendorForCategory = (cat: BudgetCategory, index: number): VendorChecklistItem => {
      const c = cat.name.toLowerCase();
      const costStr = `≈ ₹${cat.amount.toLocaleString('en-IN')}`;

      if (c.includes('food') || c.includes('cater') || c.includes('beverage') || c.includes('meal') || c.includes('refresh') || c.includes('snack')) {
        return {
          id: `vendor-auto-${index}`,
          vendorType: 'Catering & Food Service Vendor / Halwai',
          benchmarkCost: costStr,
          whyNeeded: `Prepares meals, beverages, and service for ${input.guests} guests within your ${cat.name} budget.`,
          questions: [
            'Is a food tasting session included before booking, and what are the exact portion sizes?',
            'How many live counter attendants and service staff are included in this per-head quote?',
            'What is the policy for unexpected extra plates, and do you supply mineral water jars?',
          ],
          organizerTip: 'Confirm the final guest count 48 hours prior so you only pay for actual attendees.',
        };
      }

      if (c.includes('venue') || c.includes('hall') || c.includes('lawn') || c.includes('space') || c.includes('rent')) {
        return {
          id: `vendor-auto-${index}`,
          vendorType: 'Banquet Hall / Venue Coordinator',
          benchmarkCost: costStr,
          whyNeeded: `Secures the physical venue, air conditioning, seating layout, and legal permissions.`,
          questions: [
            'Are power backup diesel charges and basic housekeeping/cleaning fees included in the base rent?',
            'What is the strict decibel and curfew timing for music and lights in this hall/area?',
            'Do you allow external decor and catering vendors without demanding an extra royalty fee?',
          ],
          organizerTip: 'Check air-conditioning and restroom cleanliness in person during a busy ongoing event.',
        };
      }

      if (c.includes('sound') || c.includes('music') || c.includes('dj') || c.includes('audio') || c.includes('av')) {
        return {
          id: `vendor-auto-${index}`,
          vendorType: 'DJ & Sound System Operator',
          benchmarkCost: costStr,
          whyNeeded: `Ensures clear speech audibility and high-energy music tailored to your ${input.vibe} vibe.`,
          questions: [
            'Do you bring backup audio cables, aux converters, and at least two spare wireless microphones?',
            'Can we plug in our own custom Spotify/phone playlist directly into your console without lag?',
            'What is the exact generator/power load your sound amplifiers require from the venue?',
          ],
          organizerTip: 'Send your must-play track list and announcement schedule at least 3 days in advance.',
        };
      }

      if (c.includes('decor') || c.includes('stage') || c.includes('flower') || c.includes('light') || c.includes('theme') || c.includes('balloon')) {
        return {
          id: `vendor-auto-${index}`,
          vendorType: 'Stage Decorator & Lighting Specialist',
          benchmarkCost: costStr,
          whyNeeded: `Transforms the event environment with stage backdrops, entrance arches, and lighting.`,
          questions: [
            'Will the backdrop use real fresh flowers, faux blooms, or printed flex board materials?',
            'How many hours prior to guest arrival will the entire stage and lighting setup be 100% complete?',
            'Is post-event dismantling and debris cleanup included in this agreed quote?',
          ],
          organizerTip: 'Share exact photo reference mockups on WhatsApp and get signed confirmation on dimensions.',
        };
      }

      if (c.includes('photo') || c.includes('video') || c.includes('camera') || c.includes('media') || c.includes('film')) {
        return {
          id: `vendor-auto-${index}`,
          vendorType: 'Event Photographer & Candid Videographer',
          benchmarkCost: costStr,
          whyNeeded: `Captures high-resolution candid moments, group portraits, and short video highlights.`,
          questions: [
            'How many edited photos and teaser videos are guaranteed, and what is the delivery timeline?',
            'Will you provide all unedited raw files on a Google Drive or pen drive right after the event?',
            'Do you bring professional backup camera bodies and lighting equipment in case of malfunction?',
          ],
          organizerTip: 'Provide a short shot-list of VIP guests, club organizers, or key moments that must be captured.',
        };
      }

      if (c.includes('gift') || c.includes('favor') || c.includes('prize') || c.includes('invite') || c.includes('print') || c.includes('badge') || c.includes('banner')) {
        return {
          id: `vendor-auto-${index}`,
          vendorType: 'Custom Print Shop & Event Favor Supplier',
          benchmarkCost: costStr,
          whyNeeded: `Supplies printed standees, guest return gifts, certificates, and ID badges for ${cat.name}.`,
          questions: [
            'Can you provide a physical or high-res PDF sample proof before starting the full production batch?',
            'What is the minimum lead time required for re-prints if our guest count increases?',
            'Are packaging boxes, ribbons, or individual gift wrapping included in the unit price?',
          ],
          organizerTip: 'Order 5-10% extra printed badges and favors to account for unexpected last-minute walk-ins.',
        };
      }

      return {
        id: `vendor-auto-${index}`,
        vendorType: `${cat.name} Specialist / Vendor`,
        benchmarkCost: costStr,
        whyNeeded: `Dedicated procurement and execution partner for ${cat.name}.`,
        questions: [
          'What specific services and deliverables are included in this base quote?',
          'What is your cancellation, rescheduling, and token refund policy?',
          'What is the payment milestone split (advance vs. balance upon satisfactory delivery)?',
        ],
        organizerTip: 'Never pay more than a 30-50% advance token before seeing physical delivery on event day.',
      };
    };

    // Ensure every budget category needing a vendor is represented in the checklist
    const finalVendors: VendorChecklistItem[] = [...processedVendors];
    categoriesNeedingVendors.forEach((cat) => {
      const hasMatch = finalVendors.some((v) => vendorMatchesCategory(v.vendorType, cat.name));
      if (!hasMatch) {
        finalVendors.push(createVendorForCategory(cat, finalVendors.length + 1));
      }
    });

    // Format ideas (strictly 5 ideas)
    const rawIdeas = Array.isArray(rawData.ideas) ? rawData.ideas.slice(0, 5) : [];
    const processedIdeas: PersonalizedIdea[] = rawIdeas.map((idea: any, idx: number) => ({
      id: idx + 1,
      title: idea.title || `Creative Idea #${idx + 1}`,
      category: idea.category || 'Theme',
      description: idea.description || '',
      budgetFriendlyHack: idea.budgetFriendlyHack || 'Use local market decor and community volunteers.',
      vibeFit: idea.vibeFit || `Crafted specially for a ${input.vibe} atmosphere.`,
    }));

    // Never repeat a milestone date in the timeline; merge the two D-Day entries into one.
    const mergedTimelineMap = new Map<string, TimelineMilestone>();
    const timelineOrder: string[] = [];

    for (const m of processedTimeline) {
      const isDDay = Number(m.daysBefore) === 0 || /day of event|d-day|t-0/i.test(m.label || '');
      const key = isDDay ? 'dday_0' : `${Number(m.daysBefore)}_${m.targetDate.trim()}`;

      if (!mergedTimelineMap.has(key)) {
        mergedTimelineMap.set(key, {
          ...m,
          daysBefore: isDDay ? 0 : Number(m.daysBefore),
          label: isDDay ? 'Day of Event (T-0)' : m.label,
          stage: isDDay ? 'Event Day Execution & Celebration' : m.stage,
          tasks: [...m.tasks],
        });
        timelineOrder.push(key);
      } else {
        const existing = mergedTimelineMap.get(key)!;
        const existingTitles = new Set(existing.tasks.map((t) => t.title.toLowerCase().trim()));
        for (const t of m.tasks) {
          const tKey = t.title.toLowerCase().trim();
          if (!existingTitles.has(tKey)) {
            existing.tasks.push({
              ...t,
              id: `${existing.id}-t-${existing.tasks.length + 1}`,
            });
            existingTitles.add(tKey);
          }
        }
        if (isDDay) {
          existing.label = 'Day of Event (T-0)';
          existing.stage = 'Event Day Execution & Celebration';
        }
      }
    }

    const finalTimeline = timelineOrder
      .map((k) => mergedTimelineMap.get(k)!)
      .sort((a, b) => b.daysBefore - a.daysBefore);

    const finalPlan: EventPlan = {
      id: `plan-${Date.now()}`,
      title: rawData.title || `${input.eventType} Master Plan`,
      tagline: rawData.tagline || `Organized with confidence in ${input.city}`,
      overview: rawData.overview || `A complete, stress-free roadmap designed for ${input.guests} guests with a budget of ${budgetFormatted}.`,
      input,
      totalBudget: input.budget,
      perGuestCost: Math.round(input.budget / Math.max(1, input.guests)),
      topOrganizerTip: rawData.topOrganizerTip || 'Create a core volunteer WhatsApp group and designate one person purely for vendor phone calls on the event day.',
      budgetCategories: processedCategories,
      timeline: finalTimeline,
      vendorChecklist: finalVendors,
      ideas: processedIdeas,
      generatedAt: new Date().toISOString(),
    };

    return res.json(finalPlan);
  } catch (error: any) {
    console.error('Error generating event plan:', error);
    const msg = String(error?.message || error || '').toLowerCase();
    const isBusy =
      error?.status === 503 ||
      error?.status === 429 ||
      msg.includes('503') ||
      msg.includes('429') ||
      msg.includes('high demand') ||
      msg.includes('resource_exhausted') ||
      msg.includes('busy');
    return res.status(isBusy ? 503 : 500).json({
      error: isBusy
        ? 'Gemini is busy, trying again...'
        : error?.message || 'Could not generate event plan with Gemini. Please try again.',
    });
  }
});

// Endpoint for "What If?" Plan B scenario generation
app.post('/api/generate-plan-b', async (req, res) => {
  try {
    const { originalPlan, scenarioTitle, scenarioKey } = req.body;

    if (!originalPlan || !scenarioTitle) {
      return res.status(400).json({ error: 'Missing original plan or scenario details.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key is not configured.' });
    }

    // Determine target budget based on scenario
    let targetBudget = originalPlan.totalBudget;
    if (scenarioKey === 'budget_cut_20') {
      targetBudget = Math.round(originalPlan.totalBudget * 0.8);
    } else if (scenarioKey === 'half_guests') {
      // Fixed costs remain, but per-head catering & gifts drop
      targetBudget = Math.round(originalPlan.totalBudget * 0.65);
    }

    const budgetFormatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(targetBudget);

    const prompt = `
You are PlanPilot, an expert Indian event organizer mentor helping a first-time organizer navigate an urgent "What If?" contingency scenario.

ORIGINAL EVENT DETAILS:
- Event: ${originalPlan.title} (${originalPlan.input.eventType})
- City: ${originalPlan.input.city}, India
- Date: ${originalPlan.input.eventDate}
- Original Guests: ${originalPlan.input.guests}
- Original Budget: ₹${originalPlan.totalBudget}
- Original Categories: ${JSON.stringify(originalPlan.budgetCategories.map((c: any) => ({ name: c.name, amount: c.amount })))}

URGENT "WHAT IF?" SCENARIO:
"${scenarioTitle}"

NEW TOTAL TARGET BUDGET: ${budgetFormatted} (INR ${targetBudget})

Generate a concise, reassuring, practical "Plan B" in simple, plain English:
1. SUMMARY: 2 short sentences explaining the pivot and why the event will still be a success.
2. IMMEDIATE NEXT STEP: Exactly ONE clear, bold, highest-priority action the organizer must execute right now.
3. BUDGET RATIONALE: 1 sentence explaining the financial adjustment.
4. ADJUSTED BUDGET CATEGORIES:
   - Provide 4 to 6 revised categories that reflect this new reality (e.g. if it rains, shifting decor funds into waterproof canopy/indoor venue; if caterer cancels, emergency boxed meals or local halwai; if budget cut 20%, leaner menu).
   - Amounts must realistically total ₹${targetBudget}.
5. TIMELINE CHANGES:
   - 2 to 3 chronological urgent checkpoints (e.g. "Immediate (Next 2 Hours)", "24 Hours Before", "Event Day Arrival").
   - 2-3 specific action items per checkpoint.
6. VENDOR ACTION: Exactly which vendor to call right now and what instructions to give them.
7. SILVER LINING: A fun, positive spin to keep organizer spirits high.
`;

    const systemInstruction = `You are PlanPilot, an encouraging, calm, crisis-management mentor for first-time event organizers in India. Provide realistic advice in simple English with rupee figures. Never invent fake business names or phone numbers.`;

    const modelCandidates = ['gemini-flash-latest'];
    let responseText = '';
    let lastError: any = null;

    for (const modelName of modelCandidates) {
      try {
        console.log(`Generating Plan B with model: ${modelName}`);
        const response = await generateContentWithRetry({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                scenarioTitle: { type: Type.STRING },
                summary: { type: Type.STRING },
                immediateNextStep: { type: Type.STRING, description: 'One single clear next step' },
                budgetRationale: { type: Type.STRING },
                adjustedBudgetCategories: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      amount: { type: Type.INTEGER },
                      tips: { type: Type.STRING },
                      items: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                    },
                    required: ['name', 'amount', 'tips', 'items'],
                  },
                },
                timelineChanges: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      timeframe: { type: Type.STRING },
                      tasks: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      urgency: { type: Type.STRING, enum: ['critical', 'high', 'medium'] },
                    },
                    required: ['timeframe', 'tasks', 'urgency'],
                  },
                },
                vendorAction: { type: Type.STRING },
                silverLining: { type: Type.STRING },
              },
              required: [
                'scenarioTitle',
                'summary',
                'immediateNextStep',
                'budgetRationale',
                'adjustedBudgetCategories',
                'timelineChanges',
                'vendorAction',
                'silverLining',
              ],
            },
          },
        });

        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        console.warn(`Plan B model ${modelName} error:`, err?.message || err);
        lastError = err;
        await new Promise((r) => setTimeout(r, 1200));
      }
    }

    if (!responseText) {
      console.warn('Gemini models unavailable, generating smart rule-based Plan B fallback');
      // Resilient emergency fallback so user never gets blocked by upstream 503 spikes
      if (scenarioKey === 'rain') {
        responseText = JSON.stringify({
          scenarioTitle: "It rains on event day (Indoor Rain Pivot)",
          summary: "Don't let rain dampen the energy! We are shifting everything to a covered indoor hall with warm lighting and comfort snacks.",
          immediateNextStep: "Call the venue manager right now to unlock the indoor hall and check dry power points.",
          budgetRationale: "Reallocated decor funds into venue cleaning staff and waterproof floor mats.",
          adjustedBudgetCategories: originalPlan.budgetCategories.map((c: any) => {
            if (c.name.toLowerCase().includes('decor')) return { ...c, amount: Math.round(c.amount * 0.7), tips: "Use indoor fairy lights and borrow streamers." };
            if (c.name.toLowerCase().includes('venue') || c.name.toLowerCase().includes('buffer')) return { ...c, amount: Math.round(c.amount * 1.3), tips: "Extra floor mats and cleaning staff tips." };
            return c;
          }),
          timelineChanges: [
            { timeframe: "Immediate (Next 1-2 Hours)", tasks: ["Call venue manager to confirm indoor hall keys", "Instruct DJ to pack all electronics in waterproof plastic sheets", "Send WhatsApp broadcast notifying guests of the indoor entrance"], urgency: "critical" },
            { timeframe: "24 Hours Before", tasks: ["Buy heavy rubber door mats to prevent slippery floors", "Designate an umbrella drop bucket at the door", "Test indoor power sockets for DJ load"], urgency: "high" },
            { timeframe: "Event Day", tasks: ["Turn on warm fairy lights early for a cozy lounge atmosphere", "Serve hot chai and warm samosas right as guests arrive"], urgency: "medium" }
          ],
          vendorAction: "Contact the sound and DJ vendor immediately to confirm indoor setup and inspect dry power sockets.",
          silverLining: "Rainy day gatherings with hot snacks and great music feel cozy, intimate, and legendary!"
        });
      } else if (scenarioKey === 'caterer_cancels') {
        responseText = JSON.stringify({
          scenarioTitle: "Caterer Cancels (Quick-Serve Food Pivot)",
          summary: "Catering cancellation is solvable! We pivot directly to high-rated local restaurant meal boxes and street food counters.",
          immediateNextStep: "Call a top-rated local restaurant or Halwai immediately to order individual packaged snack/meal boxes.",
          budgetRationale: "Maintained food budget by ordering direct bulk meal boxes (Biryani/Pav Bhaji boxes) with zero setup fee.",
          adjustedBudgetCategories: originalPlan.budgetCategories.map((c: any) => {
            if (c.name.toLowerCase().includes('food') || c.name.toLowerCase().includes('refresh')) return { ...c, tips: "Direct restaurant packaged meal boxes with cold drinks." };
            return c;
          }),
          timelineChanges: [
            { timeframe: "Immediate (Next 1 Hour)", tasks: ["Call 2 popular local restaurants for bulk packaged meal boxes", "Order bottled water and cold drinks from wholesale dealer", "Assign 2 student leads to manage food distribution table"], urgency: "critical" },
            { timeframe: "4 Hours Before", tasks: ["Reconfirm dispatch timing with restaurant manager", "Set up 2 parallel distribution tables with paper napkins and bins"], urgency: "high" },
            { timeframe: "Event Showtime", tasks: ["Hand out fresh sealed food boxes cleanly with zero food wastage"], urgency: "medium" }
          ],
          vendorAction: "Call a reputable local restaurant or sweet mart for emergency bulk meal boxes.",
          silverLining: "Branded or famous local food boxes are often much cleaner, tastier, and popular than generic caterers!"
        });
      } else if (scenarioKey === 'budget_cut_20') {
        const cutFactor = 0.8;
        responseText = JSON.stringify({
          scenarioTitle: "20% Budget Cut Smart Pivot",
          summary: `Operating on ₹${targetBudget} is totally achievable without losing the party vibe. We preserve the DJ and delicious food while adopting smart DIY decor.`,
          immediateNextStep: "Call your food caterer immediately to switch from an elaborate spread to a hearty 2-item street snack combo.",
          budgetRationale: `Budget trimmed proportionally by 20% to ₹${targetBudget} while preserving core music and catering.`,
          adjustedBudgetCategories: originalPlan.budgetCategories.map((c: any) => ({
            ...c,
            amount: Math.round(c.amount * cutFactor),
            tips: "Streamlined allocation to meet 20% budget reduction."
          })),
          timelineChanges: [
            { timeframe: "Immediate (Next 2 Hours)", tasks: ["Lock revised snack combo menu with food vendor", "Ask organizing team to source fairy lights from home instead of renting", "Confirm core DJ playing hours"], urgency: "critical" },
            { timeframe: "24 Hours Before", tasks: ["Print photo booth props on cardstock at local xerox shop", "Review Spotify backup playlist to save on extra DJ hours"], urgency: "high" },
            { timeframe: "Event Day", tasks: ["Focus volunteer energy on crowd games and music energy rather than lavish props"], urgency: "medium" }
          ],
          vendorAction: "Call your food vendor to renegotiate a streamlined per-head snack price.",
          silverLining: "DIY events with street food and high energy are almost always more fun than formal over-budget affairs!"
        });
      } else if (scenarioKey === 'half_guests') {
        const cutFactor = 0.65;
        responseText = JSON.stringify({
          scenarioTitle: "Half the Guests Cancel (VIP Intimate Pivot)",
          summary: "A smaller crowd transforms your event into an exclusive, high-bonding celebration with personalized attention for everyone.",
          immediateNextStep: "Update your food vendor immediately with the reduced headcount to cut your per-plate billing.",
          budgetRationale: `Variable expenses reduced to ₹${targetBudget}; fixed venue/sound retained for quality.`,
          adjustedBudgetCategories: originalPlan.budgetCategories.map((c: any) => {
            if (c.name.toLowerCase().includes('food') || c.name.toLowerCase().includes('gift')) {
              return { ...c, amount: Math.round(c.amount * 0.5), tips: "Halved quantity for 50% attendance." };
            }
            return { ...c, amount: Math.round(c.amount * 0.8), tips: "Optimized for intimate VIP group." };
          }),
          timelineChanges: [
            { timeframe: "Immediate (Next 2 Hours)", tasks: ["Inform caterer of the reduced headcount to cut costs", "Reconfigure seating into a warm circular or lounge cluster", "Update game activities to interactive group discussions/quizzes"], urgency: "critical" },
            { timeframe: "24 Hours Before", tasks: ["Personalize welcome name tags for every confirmed guest", "Upgrade individual snack portions with the saved budget"], urgency: "high" },
            { timeframe: "Event Day", tasks: ["Engage every single guest directly on the mic and create memorable group moments"], urgency: "medium" }
          ],
          vendorAction: "Call caterer immediately to reduce head count before ingredients are prepped.",
          silverLining: "Smaller groups allow deep conversations, personalized souvenirs, and everyone actually having fun together!"
        });
      } else {
        responseText = JSON.stringify({
          scenarioTitle: scenarioTitle,
          summary: "We have restructured the plan to overcome this hurdle smoothly and keep your guests happy.",
          immediateNextStep: "Notify your core organizing team and designate leads for the crisis pivot.",
          budgetRationale: "Emergency budget reallocation applied to handle contingency.",
          adjustedBudgetCategories: originalPlan.budgetCategories,
          timelineChanges: [
            { timeframe: "Immediate", tasks: ["Brief volunteers on the contingency plan", "Contact primary vendor to renegotiate timeline"], urgency: "critical" },
            { timeframe: "Next 24 Hours", tasks: ["Execute alternative logistics", "Keep guests informed via WhatsApp"], urgency: "high" }
          ],
          vendorAction: "Contact primary vendor to adjust deliverables.",
          silverLining: "Overcoming unexpected challenges makes you a seasoned, confident event organizer!"
        });
      }
    }

    const rawData = JSON.parse(responseText);

    // EXACT RECONCILIATION FOR PLAN B BUDGET: Keep EXACT SAME category names as original plan!
    const origCategories: BudgetCategory[] = Array.isArray(originalPlan.budgetCategories)
      ? originalPlan.budgetCategories
      : [];
    const rawCategories: any[] = Array.isArray(rawData.adjustedBudgetCategories)
      ? rawData.adjustedBudgetCategories
      : [];

    // Map each original category to an adjusted amount while keeping the EXACT SAME category name & order
    const mappedCategories = origCategories.map((origCat, idx) => {
      // Find matching item in rawCategories by exact name or closest match
      const matched = rawCategories.find(
        (rc: any) =>
          rc?.name &&
          (rc.name.toLowerCase().trim() === origCat.name.toLowerCase().trim() ||
            rc.name.toLowerCase().includes(origCat.name.toLowerCase()) ||
            origCat.name.toLowerCase().includes(rc.name.toLowerCase()))
      ) || rawCategories[idx];

      const proposedAmount = matched ? Number(matched.amount) || origCat.amount : origCat.amount;
      const proposedTips = matched?.tips || origCat.tips || 'Contingency adjusted allocation.';
      const proposedItems = Array.isArray(matched?.items) && matched.items.length > 0 ? matched.items : origCat.items;

      return {
        origCat,
        proposedAmount: Math.max(0, proposedAmount),
        tips: proposedTips,
        items: proposedItems,
      };
    });

    const rawSum = mappedCategories.reduce((acc, c) => acc + c.proposedAmount, 0) || originalPlan.totalBudget || 1;
    let runningTotal = 0;

    const processedCategories: BudgetCategory[] = mappedCategories.map((entry, idx) => {
      const proportion = entry.proposedAmount / rawSum;
      let scaledAmount = Math.round(targetBudget * proportion);
      if (idx === mappedCategories.length - 1) {
        scaledAmount = targetBudget - runningTotal;
      } else {
        runningTotal += scaledAmount;
      }

      const percentage = Math.round((scaledAmount / targetBudget) * 100);
      return {
        id: entry.origCat.id,
        name: entry.origCat.name, // EXACT SAME CATEGORY NAME AS ORIGINAL PLAN
        amount: Math.max(0, scaledAmount),
        originalAmount: entry.origCat.amount, // "Was ₹X"
        percentage,
        color: entry.origCat.color || CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
        tips: entry.tips,
        items: entry.items,
      };
    });

    // Double check exact sum
    const finalSum = processedCategories.reduce((acc, c) => acc + c.amount, 0);
    if (finalSum !== targetBudget && processedCategories.length > 0) {
      const diff = targetBudget - finalSum;
      processedCategories[0].amount += diff;
      processedCategories[0].percentage = Math.round((processedCategories[0].amount / targetBudget) * 100);
    }

    const planBResult = {
      id: `plan-b-${Date.now()}`,
      scenarioKey: scenarioKey || 'custom',
      scenarioTitle: rawData.scenarioTitle || scenarioTitle,
      summary: rawData.summary || 'Here is your emergency Plan B to keep the celebration running smoothly.',
      immediateNextStep: rawData.immediateNextStep || 'Call your primary venue contact and announce the contingency protocol on WhatsApp.',
      newTotalBudget: targetBudget,
      originalTotalBudget: originalPlan.totalBudget,
      budgetDifference: targetBudget - originalPlan.totalBudget,
      budgetRationale: rawData.budgetRationale || `Budget revised to ${budgetFormatted} to handle this scenario smoothly.`,
      adjustedBudgetCategories: processedCategories,
      timelineChanges: Array.isArray(rawData.timelineChanges) ? rawData.timelineChanges : [],
      vendorAction: rawData.vendorAction || 'Contact vendor immediately to confirm adjusted schedule.',
      silverLining: rawData.silverLining || 'A change of plans often creates the most memorable, authentic stories!',
      generatedAt: new Date().toISOString(),
    };

    return res.json(planBResult);
  } catch (error: any) {
    console.error('Error generating Plan B:', error);
    const msg = String(error?.message || error || '').toLowerCase();
    const isBusy =
      error?.status === 503 ||
      error?.status === 429 ||
      msg.includes('503') ||
      msg.includes('429') ||
      msg.includes('high demand') ||
      msg.includes('resource_exhausted') ||
      msg.includes('busy');
    return res.status(isBusy ? 503 : 500).json({
      error: isBusy
        ? 'Gemini is busy, trying again...'
        : error?.message || 'Could not generate Plan B contingency. Please try again.',
    });
  }
});

// Quote Analysis endpoint using Gemini 3.8 Flash
app.post('/api/check-quote', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', vendorType, categoryName, plannedBudget } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        error: 'Please provide a photo of the vendor quotation to inspect.',
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Gemini API key is not configured in server environment. Please check settings.',
      });
    }

    // Strip data URL header if included
    const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');

    const budgetNum = Math.max(0, Math.round(Number(plannedBudget) || 0));
    const vType = vendorType || 'Vendor';
    const catName = categoryName || 'Category';

    const prompt = `
You are PlanPilot's Quote Inspector for first-time event organizers in India.
Analyze this uploaded vendor quotation / estimate / invoice image.

CONTEXT:
- Selected Vendor Type: ${vType}
- Target Budget Category: ${catName}
- Planned Category Budget: INR ${budgetNum}

YOUR STRICT INSTRUCTIONS:
1. IMAGE & QUOTATION CHECK:
   - Determine if the image is readable and actually contains a vendor quotation, cost estimate, proforma invoice, rate card, or bill for event services/goods.
   - If the image is blurry, illegible, corrupt, dark, or NOT an event quotation (e.g. random selfie, landscape, meme, pet, random receipt for groceries), set isQuotation to false. Provide a friendly, polite rejectionReason in simple English asking the organizer to upload a clearer, well-lit photo of the vendor quotation.
   - If it is a quotation or cost breakdown, set isQuotation to true and leave rejectionReason empty.

2. VENDOR NAME (CRITICAL):
   - Extract the business name of the vendor IF clearly printed or written on the document.
   - NEVER INVENT REAL OR FAKE VENDOR NAMES OR PHONE NUMBERS. If no vendor name is explicitly printed, leave extractedVendorName null.

3. LINE ITEMS & TOTAL:
   - Extract the main items and their respective prices in Indian Rupees as integer numbers.
   - Extract or calculate the total amount in Indian Rupees as an integer number.

4. BUDGET FIT COMPARISON:
   - Compare the total quote amount with the planned budget (INR ${budgetNum}):
     - If total <= plannedBudget: status is "fits"
     - If total > plannedBudget and total <= plannedBudget * 1.15: status is "slightly high"
     - If total > plannedBudget * 1.15: status is "too high"
   - Write a short, simple differenceDescription in plain English explaining whether it fits, is slightly high, or too high, including the rupee difference.

5. UNNECESSARY OR UNCLEAR CHARGES:
   - Identify any line items that appear unnecessary, hidden, inflated, or unclear (e.g., vague "sundry fees", excessive generator fuel without specified hours, duplicate service charges, ambiguous administrative fees).
   - If nothing suspicious is found, provide a single reassuring note like "No obvious unnecessary charges found; the line items look standard."

6. 3 SIMPLE POINTS TO NEGOTIATE:
   - Provide EXACTLY THREE simple, polite, practical points the user can use to negotiate with the vendor to reduce costs or get more value.
   - Use simple, easy English.

7. DISCLAIMER:
   - Strictly state: "This is an estimate. Confirm prices with the vendor."
   - Do NOT use the words "verified" or "certified".
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isQuotation: { type: Type.BOOLEAN },
            rejectionReason: { type: Type.STRING },
            extractedVendorName: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  note: { type: Type.STRING },
                },
                required: ['name', 'price'],
              },
            },
            totalAmount: { type: Type.NUMBER },
            status: { type: Type.STRING },
            differenceDescription: { type: Type.STRING },
            unnecessaryOrUnclearItems: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            negotiationPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            disclaimer: { type: Type.STRING },
          },
          required: ['isQuotation'],
        },
      },
    });

    const rawText = response.text || '{}';
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      return res.status(500).json({
        error: 'Failed to parse quote analysis response. Please try again with a clear photo.',
      });
    }

    if (!data.isQuotation) {
      return res.json({
        isQuotation: false,
        rejectionReason:
          data.rejectionReason ||
          'This photo looks blurry or is not a vendor quotation. Please take a clearer, well-lit photo of the bill or quote and try again.',
        items: [],
        totalAmount: 0,
        plannedBudget: budgetNum,
        categoryName: catName,
        vendorType: vType,
        status: 'fits',
        differenceAmount: 0,
        differenceDescription: '',
        unnecessaryOrUnclearItems: [],
        negotiationPoints: [],
        disclaimer: 'This is an estimate. Confirm prices with the vendor.',
        analyzedAt: new Date().toISOString(),
      });
    }

    const items = Array.isArray(data.items)
      ? data.items.map((it: any) => ({
          name: String(it.name || 'Item'),
          price: Math.max(0, Math.round(Number(it.price) || 0)),
          note: it.note ? String(it.note) : undefined,
        }))
      : [];

    const computedTotal = items.reduce((s: number, i: any) => s + i.price, 0);
    const totalAmount = Math.max(0, Math.round(Number(data.totalAmount) || computedTotal));

    // Determine status reliably based on planned budget
    let status: 'fits' | 'slightly high' | 'too high' = 'fits';
    const diff = Math.abs(totalAmount - budgetNum);
    if (budgetNum > 0) {
      if (totalAmount <= budgetNum) {
        status = 'fits';
      } else if (totalAmount <= Math.round(budgetNum * 1.15)) {
        status = 'slightly high';
      } else {
        status = 'too high';
      }
    }

    const diffDesc =
      totalAmount <= budgetNum
        ? `Fits within your planned budget with ₹${diff.toLocaleString('en-IN')} remaining.`
        : status === 'slightly high'
        ? `Slightly high by ₹${diff.toLocaleString('en-IN')} over your planned budget.`
        : `Too high by ₹${diff.toLocaleString('en-IN')} over your planned budget.`;

    // Ensure exactly 3 negotiation points
    let points: [string, string, string] = [
      'Ask for a 5-10% discount by offering a prompt UPI token advance today.',
      'Request complimentary setup, clean-up, or extra hours without an additional surcharge.',
      'Ask to remove or bundle vague transport or miscellaneous charges into the main price.',
    ];
    if (Array.isArray(data.negotiationPoints) && data.negotiationPoints.length >= 3) {
      points = [
        String(data.negotiationPoints[0]),
        String(data.negotiationPoints[1]),
        String(data.negotiationPoints[2]),
      ];
    } else if (Array.isArray(data.negotiationPoints) && data.negotiationPoints.length > 0) {
      if (data.negotiationPoints[0]) points[0] = String(data.negotiationPoints[0]);
      if (data.negotiationPoints[1]) points[1] = String(data.negotiationPoints[1]);
      if (data.negotiationPoints[2]) points[2] = String(data.negotiationPoints[2]);
    }

    return res.json({
      isQuotation: true,
      extractedVendorName: data.extractedVendorName || null,
      items,
      totalAmount,
      plannedBudget: budgetNum,
      categoryName: catName,
      vendorType: vType,
      status,
      differenceAmount: diff,
      differenceDescription: data.differenceDescription || diffDesc,
      unnecessaryOrUnclearItems: Array.isArray(data.unnecessaryOrUnclearItems)
        ? data.unnecessaryOrUnclearItems.map(String)
        : [],
      negotiationPoints: points,
      disclaimer: 'This is an estimate. Confirm prices with the vendor.',
      analyzedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error checking quotation with Gemini:', error);
    return res.status(500).json({
      error: error?.message || 'Could not analyze quotation. Please ensure the image is clear and try again.',
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Serve frontend with Vite in development or static dist in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PlanPilot server listening on port ${PORT}`);
  });
}

startServer();


