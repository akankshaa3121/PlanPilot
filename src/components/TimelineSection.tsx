import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Share2, 
  Check, 
  Flag
} from 'lucide-react';
import type { TimelineMilestone } from '../types/plan';

interface TimelineSectionProps {
  timeline: TimelineMilestone[];
  eventDate: string;
  eventType: string;
  completedTasks?: { [id: string]: boolean };
  onToggleTask?: (taskId: string) => void;
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({
  timeline,
  eventDate,
  eventType,
  completedTasks: externalCompletedTasks,
  onToggleTask: externalToggleTask,
}) => {
  const storageKey = `planpilot_tasks_${eventType}_${eventDate}`;
  const [internalCompletedTasks, setInternalCompletedTasks] = useState<{ [id: string]: boolean }>({});
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');

  useEffect(() => {
    if (!externalCompletedTasks) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          setInternalCompletedTasks(JSON.parse(saved));
        }
      } catch {
        // ignore storage error
      }
    }
  }, [storageKey, externalCompletedTasks]);

  const completedTasks = externalCompletedTasks ?? internalCompletedTasks;

  const toggleTask = (taskId: string) => {
    if (externalToggleTask) {
      externalToggleTask(taskId);
    } else {
      setInternalCompletedTasks((prev) => {
        const next = { ...prev, [taskId]: !prev[taskId] };
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    }
  };

  const allTasks = timeline.flatMap((m) => m.tasks);
  const totalCount = allTasks.length;
  const completedCount = allTasks.filter((t) => completedTasks[t.id]).length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleCopyTimeline = () => {
    let text = `📅 *PlanPilot Countdown Timeline for ${eventType}*\n`;
    text += `Target Event Date: ${eventDate}\n\n`;

    timeline.forEach((m) => {
      text += `📍 *${m.label} (${m.targetDate})* - ${m.stage}\n`;
      m.tasks.forEach((t) => {
        const check = completedTasks[t.id] ? '✅' : '⏳';
        text += `${check} ${t.title}: ${t.description}\n`;
      });
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#0B1F4B] text-white flex items-center justify-center font-bold text-sm">
              2
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-[#111111] font-display">
              Backward Countdown Timeline
            </h3>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Counted backward from your event date so nothing slips through the cracks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyTimeline}
            className="px-4 py-2.5 rounded-2xl bg-[#0B1F4B] hover:bg-[#142a63] text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-white">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-white" />
                <span>Share to WhatsApp / Team</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar & Filter */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <div className="flex items-center justify-between text-xs font-bold text-[#111111] mb-1.5">
            <span>Overall Readiness Progress</span>
            <span className="text-[#2563EB]">{progressPct}% Ready ({completedCount}/{totalCount} tasks)</span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200">
            <div
              className="h-full rounded-full bg-[#2563EB] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Task filter */}
        <div className="flex items-center gap-1.5 bg-[#F5F7FA] p-1 rounded-2xl self-start sm:self-auto border border-slate-200">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filter === 'all' ? 'bg-[#0B1F4B] text-white shadow-xs' : 'text-slate-600 hover:text-[#111111]'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filter === 'pending' ? 'bg-[#0B1F4B] text-white shadow-xs' : 'text-slate-600 hover:text-[#111111]'
            }`}
          >
            Pending ({totalCount - completedCount})
          </button>
          <button
            onClick={() => setFilter('done')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filter === 'done' ? 'bg-[#0B1F4B] text-white shadow-xs' : 'text-slate-600 hover:text-[#111111]'
            }`}
          >
            Done ({completedCount})
          </button>
        </div>
      </div>

      {/* Backward Timeline Stepper */}
      <div className="space-y-6 relative before:absolute before:inset-0 before:left-7 sm:before:left-9 before:w-0.5 before:bg-slate-200">
        {timeline.map((milestone) => {
          const visibleTasks = milestone.tasks.filter((t) => {
            if (filter === 'pending') return !completedTasks[t.id];
            if (filter === 'done') return !!completedTasks[t.id];
            return true;
          });

          if (visibleTasks.length === 0 && filter !== 'all') {
            return null;
          }

          const isEventDay = milestone.daysBefore === 0;

          return (
            <div key={milestone.id} className="relative flex items-start gap-4 sm:gap-6 group">
              {/* Milestone Badge Icon */}
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex-shrink-0 flex flex-col items-center justify-center font-bold shadow-sm z-10 transition-transform group-hover:scale-105 border ${
                  isEventDay
                    ? 'bg-[#0B1F4B] text-white border-[#0B1F4B]'
                    : milestone.daysBefore <= 3
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-[#F5F7FA] text-[#111111] border-slate-300'
                }`}
              >
                {isEventDay ? (
                  <>
                    <Flag className="w-5 h-5 text-white" />
                    <span className="text-[10px] uppercase tracking-wider font-extrabold mt-0.5">D-Day</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm sm:text-base font-extrabold leading-tight">
                      T-{milestone.daysBefore}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500">
                      days
                    </span>
                  </>
                )}
              </div>

              {/* Milestone Content Card */}
              <div className="flex-1 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-3 mb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#F5F7FA] text-[#0B1F4B] border border-slate-200">
                        {milestone.stage}
                      </span>
                      <h4 className="font-bold text-[#111111] text-base sm:text-lg">
                        {milestone.label}
                      </h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Target Date: {milestone.targetDate}</span>
                  </div>
                </div>

                {/* Tasks List */}
                <div className="space-y-2.5">
                  {visibleTasks.map((task) => {
                    const isDone = !!completedTasks[task.id];

                    return (
                      <div
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                          isDone
                            ? 'bg-[#F5F7FA] border-slate-200 opacity-60'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-[#F5F7FA]/40'
                        }`}
                      >
                        <button
                          type="button"
                          className="mt-0.5 text-slate-400 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTask(task.id);
                          }}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-[#2563EB]" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300 hover:text-[#2563EB]" />
                          )}
                        </button>

                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span
                              className={`text-sm font-bold ${
                                isDone ? 'line-through text-slate-400' : 'text-[#111111]'
                              }`}
                            >
                              {task.title}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                task.priority === 'high'
                                  ? 'bg-[#F5F7FA] text-[#0B1F4B] border border-slate-300'
                                  : 'bg-[#F5F7FA] text-slate-600 border border-slate-200'
                              }`}
                            >
                              {task.priority} priority
                            </span>
                          </div>
                          {task.description && (
                            <p
                              className={`text-xs mt-1 leading-relaxed ${
                                isDone ? 'text-slate-400 line-through' : 'text-slate-600'
                              }`}
                            >
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
