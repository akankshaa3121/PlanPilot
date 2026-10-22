import React from 'react';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

interface ErrorViewProps {
  message?: string;
  onRetry: () => void;
  onBack: () => void;
}

export const ErrorView: React.FC<ErrorViewProps> = ({ message, onRetry, onBack }) => {
  return (
    <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm max-w-xl mx-auto text-center space-y-6">
      <div className="w-16 h-16 rounded-3xl bg-[#F5F7FA] text-[#0B1F4B] border border-slate-200 flex items-center justify-center mx-auto shadow-xs">
        <AlertCircle className="w-9 h-9 text-[#2563EB]" />
      </div>

      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#0B1F4B] bg-[#F5F7FA] px-3 py-1 rounded-full border border-slate-200 inline-block mb-2">
          Planning Notice
        </span>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-[#111111] font-display">
          We Couldn't Complete the Plan Just Now
        </h3>
        <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
          {message || 'The Gemini event engine hit a momentary snag while calculating your schedule. Don’t worry, your inputs are saved.'}
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-[#F5F7FA] border border-slate-200 text-left text-xs text-[#111111] space-y-1">
        <span className="font-bold block text-[#0B1F4B]">Friendly Organizer Check:</span>
        <p>• Make sure the event date is set to an upcoming date.</p>
        <p>• Check that your budget is a realistic positive amount (₹2,000+).</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          onClick={onRetry}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#0B1F4B] hover:bg-[#142a63] text-white font-extrabold text-sm sm:text-base shadow-xs transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-white" />
          <span>Retry Generating Plan</span>
        </button>
        <button
          onClick={onBack}
          className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-[#F5F7FA] hover:bg-slate-200 border border-slate-200 text-[#111111] font-bold text-sm sm:text-base transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#111111]" />
          <span>Edit Details</span>
        </button>
      </div>
    </div>
  );
};
