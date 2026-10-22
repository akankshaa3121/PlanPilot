import React, { useState } from 'react';
import { 
  Sparkles, 
  Lightbulb, 
  Star
} from 'lucide-react';
import type { PersonalizedIdea, EventVibe } from '../types/plan';

interface IdeasSectionProps {
  ideas: PersonalizedIdea[];
  vibe: EventVibe;
  eventType: string;
}

export const IdeasSection: React.FC<IdeasSectionProps> = ({ ideas, vibe }) => {
  const [favorites, setFavorites] = useState<{ [id: number]: boolean }>({});

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#0B1F4B] text-white flex items-center justify-center font-bold text-sm">
              4
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-[#111111] font-display">
              5 Personalized Creative Ideas
            </h3>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Handpicked themes, decor hacks, games and moments crafted to match your {vibe} vibe.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-2xl bg-[#F5F7FA] border border-slate-200 text-xs font-bold text-[#0B1F4B] capitalize flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>Vibe: {vibe}</span>
        </div>
      </div>

      {/* 5 Ideas Cards */}
      <div className="space-y-4">
        {ideas.map((idea, index) => {
          const isFavorite = !!favorites[idea.id];

          return (
            <div
              key={idea.id || index}
              className={`bg-white rounded-3xl p-6 sm:p-7 border transition-all ${
                isFavorite
                  ? 'border-[#0B1F4B] ring-2 ring-blue-900/10 shadow-sm bg-[#F5F7FA]/30'
                  : 'border-slate-200 shadow-xs hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#0B1F4B] text-white font-black text-lg flex items-center justify-center shadow-xs flex-shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-slate-200 bg-[#F5F7FA] text-[#0B1F4B]">
                        {idea.category}
                      </span>
                      <span className="text-xs font-semibold text-slate-600 bg-[#F5F7FA] px-2 py-0.5 rounded-full border border-slate-200/80">
                        {idea.vibeFit}
                      </span>
                    </div>
                    <h4 className="text-lg sm:text-xl font-extrabold text-[#111111] leading-snug">
                      {idea.title}
                    </h4>
                  </div>
                </div>

                {/* Team Favorite Toggle */}
                <button
                  type="button"
                  onClick={() => toggleFavorite(idea.id)}
                  className={`p-2.5 rounded-2xl border transition flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                    isFavorite
                      ? 'bg-[#0B1F4B] border-[#0B1F4B] text-white'
                      : 'bg-[#F5F7FA] border-slate-200 text-slate-600 hover:text-[#111111] hover:bg-slate-200/70'
                  }`}
                  title="Mark as team favorite"
                >
                  <Star
                    className={`w-4 h-4 ${
                      isFavorite ? 'fill-white text-white' : 'text-slate-400'
                    }`}
                  />
                  <span className="hidden sm:inline">
                    {isFavorite ? 'Our Pick' : 'Vote Idea'}
                  </span>
                </button>
              </div>

              {/* Description in simple English */}
              <p className="text-sm sm:text-base text-[#111111] leading-relaxed font-normal mb-4 pl-0 sm:pl-13">
                {idea.description}
              </p>

              {/* Budget-Friendly Hack Callout */}
              <div className="sm:ml-13 p-4 rounded-2xl bg-[#F5F7FA] border border-slate-200 text-xs sm:text-sm text-[#111111] flex items-start gap-3">
                <span className="text-base flex-shrink-0">💡</span>
                <div>
                  <span className="font-bold text-[#0B1F4B] uppercase tracking-wide text-xs block mb-0.5">
                    Budget-Friendly DIY Hack:
                  </span>
                  <p className="font-medium text-[#111111] leading-relaxed">
                    {idea.budgetFriendlyHack}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
