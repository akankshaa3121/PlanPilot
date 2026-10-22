import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  ShieldCheck, 
  Lightbulb, 
  Search,
  MessageSquare
} from 'lucide-react';
import type { VendorChecklistItem } from '../types/plan';

interface VendorSectionProps {
  vendors: VendorChecklistItem[];
  city: string;
  completedVendors?: { [id: string]: boolean };
  onToggleVendor?: (vendorId: string) => void;
}

export const VendorSection: React.FC<VendorSectionProps> = ({ 
  vendors, 
  city,
  completedVendors = {},
  onToggleVendor,
}) => {
  const [checkedQuestions, setCheckedQuestions] = useState<{ [key: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState('');

  const toggleQuestion = (vendorId: string, qIdx: number) => {
    const key = `${vendorId}-q-${qIdx}`;
    setCheckedQuestions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const filteredVendors = vendors.filter((v) =>
    v.vendorType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.whyNeeded.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#0B1F4B] text-white flex items-center justify-center font-bold text-sm">
              3
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-[#111111] font-display">
              Vendor Checklist & 3 Crucial Questions
            </h3>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Standard vendor types calibrated for {city}. Tick off each vendor once booked to boost your Readiness Score!
          </p>
        </div>

        {/* Safety & Realism Badge */}
        <div className="px-4 py-2.5 rounded-2xl bg-[#F5F7FA] border border-slate-200 text-xs text-[#111111] flex items-center gap-2 max-w-sm">
          <ShieldCheck className="w-5 h-5 text-[#2563EB] flex-shrink-0" />
          <span className="font-medium leading-snug">
            <strong>Standard vendor types only.</strong> Never hire blind — use these suggested questions to evaluate local providers in {city}.
          </span>
        </div>
      </div>

      {/* Search / Filter */}
      {vendors.length > 3 && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vendor category (e.g. food, sound, decor, photo)..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-300 bg-white text-[#111111] text-sm font-medium focus:border-[#2563EB] focus:outline-none shadow-xs"
          />
        </div>
      )}

      {/* Vendor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredVendors.map((vendor, vIdx) => {
          const isBooked = Boolean(completedVendors[vendor.id]);

          return (
            <div
              key={vendor.id}
              className={`bg-white rounded-3xl p-6 border transition-all flex flex-col justify-between ${
                isBooked
                  ? 'border-[#0B1F4B] ring-2 ring-blue-900/10 shadow-sm'
                  : 'border-slate-200 shadow-sm hover:border-slate-300'
              }`}
            >
              <div>
                {/* Vendor Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#F5F7FA] text-[#0B1F4B] border border-slate-200 text-xs font-bold flex items-center justify-center">
                        {vIdx + 1}
                      </span>
                      <h4 className="font-extrabold text-[#111111] text-lg">
                        {vendor.vendorType}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {vendor.whyNeeded}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Benchmark Cost
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-[#0B1F4B] bg-[#F5F7FA] px-2.5 py-1 rounded-xl border border-slate-200 block mt-0.5">
                      {vendor.benchmarkCost}
                    </span>
                  </div>
                </div>

                {/* Primary Booking Checkbox Bar */}
                {onToggleVendor && (
                  <div
                    onClick={() => onToggleVendor(vendor.id)}
                    className={`mt-2 mb-3.5 p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                      isBooked
                        ? 'bg-[#F5F7FA] border-[#0B1F4B]'
                        : 'bg-[#F5F7FA] border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-[#2563EB]">
                        {isBooked ? (
                          <CheckSquare className="w-5 h-5 text-[#2563EB]" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                      </span>
                      <span className={`text-xs font-bold ${isBooked ? 'text-[#0B1F4B]' : 'text-[#111111]'}`}>
                        {isBooked ? 'Vendor Confirmed & Booked' : 'Mark as Booked & Advance Paid'}
                      </span>
                    </div>

                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isBooked
                        ? 'bg-[#0B1F4B] text-white'
                        : 'bg-white text-slate-500 border border-slate-200'
                    }`}>
                      {isBooked ? 'Locked In' : 'Pending'}
                    </span>
                  </div>
                )}

                {/* 3 Questions to Ask */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                      3 Crucial Questions to Ask Before Booking:
                    </span>
                  </div>

                  <div className="space-y-2">
                    {vendor.questions.map((q, qIdx) => {
                      const key = `${vendor.id}-q-${qIdx}`;
                      const isAsked = !!checkedQuestions[key];

                      return (
                        <div
                          key={qIdx}
                          onClick={() => toggleQuestion(vendor.id, qIdx)}
                          className={`p-2.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-start gap-2.5 select-none ${
                            isAsked
                              ? 'bg-[#F5F7FA] border-slate-300 text-[#111111]'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-[#F5F7FA]'
                          }`}
                        >
                          <span className="mt-0.5 text-[#2563EB] flex-shrink-0">
                            {isAsked ? (
                              <CheckSquare className="w-4 h-4 fill-blue-50" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </span>
                          <span className="flex-1 leading-snug">
                            <strong className="text-[#111111]">Q{qIdx + 1}: </strong>
                            {q}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Organizer Negotiation Tip */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="p-3 rounded-2xl bg-[#F5F7FA] border border-slate-200 text-xs text-[#111111] flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-[#2563EB] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#0B1F4B] block mb-0.5">
                      Organizer Negotiation Pro-Tip:
                    </span>
                    <p className="leading-relaxed font-medium">{vendor.organizerTip}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
