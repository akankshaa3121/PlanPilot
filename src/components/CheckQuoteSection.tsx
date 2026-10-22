import React, { useState, useRef, useId } from 'react';
import { 
  UploadCloud, 
  FileSearch, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RotateCcw, 
  IndianRupee, 
  Sparkles, 
  Eye, 
  Info, 
  ShieldAlert, 
  ArrowRight, 
  HelpCircle,
  FileText,
  PlusCircle,
  Check
} from 'lucide-react';
import type { EventPlan, QuoteAnalysisResult, BudgetCategory, VendorChecklistItem } from '../types/plan';
import { formatINR } from '../utils/formatters';

interface CheckQuoteSectionProps {
  plan: EventPlan;
  onAddPayment?: (payment: { categoryId: string; categoryName: string; amount: number; note: string; date: string }) => void;
}

// Generate high quality canvas sample quotation image base64
function generateSampleQuoteDataUrl(type: 'catering' | 'sound' | 'decor'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1000;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 800, 1000);

  // Border
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, 760, 960);

  // Header banner
  ctx.fillStyle = '#0B1F4B';
  ctx.fillRect(20, 20, 760, 120);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 30px sans-serif';

  let title = 'ROYAL CATERING & SWEETS';
  let sub = 'Estimate / Quotation for Event Catering';
  let items: { name: string; qty: string; rate: string; total: string; numTotal: number }[] = [];
  let subTotal = 0;

  if (type === 'catering') {
    title = 'ANNAPURNA FEAST SERVICES';
    sub = 'Quotation No: ANP-2025-412';
    items = [
      { name: 'Standard Veg Buffet Menu (120 Pax)', qty: '120 plates', rate: '₹450', total: '₹54,000', numTotal: 54000 },
      { name: 'Live Chaat & Mocktail Welcome Counter', qty: '1 unit', rate: '₹8,500', total: '₹8,500', numTotal: 8500 },
      { name: 'Service Staff, Cutlery & Chafing Dishes', qty: '1 lot', rate: '₹5,000', total: '₹5,000', numTotal: 5000 },
      { name: 'Miscellaneous Administrative Handling Charge', qty: '1 fee', rate: '₹2,500', total: '₹2,500', numTotal: 2500 },
    ];
  } else if (type === 'sound') {
    title = 'BEATWAVE AUDIO & DJ SYSTEMS';
    sub = 'Sound & Lighting Rate Estimate #BW-88';
    items = [
      { name: '2000W JBL Sound System + 2 Cordless Mics', qty: '6 hours', rate: '₹14,000', total: '₹14,000', numTotal: 14000 },
      { name: 'Pro DJ Console & DJ Operator', qty: '5 hours', rate: '₹8,000', total: '₹8,000', numTotal: 8000 },
      { name: 'Ambient LED Par Lights (8 units) & Fog Machine', qty: '1 set', rate: '₹4,500', total: '₹4,500', numTotal: 4500 },
      { name: 'Vague Cable Transport Surcharge', qty: '1 trip', rate: '₹2,000', total: '₹2,000', numTotal: 2000 },
    ];
  } else {
    title = 'SHREEJI STAGE & BALLOON DECORATORS';
    sub = 'Decoration Cost Sheet #SJD-109';
    items = [
      { name: 'Entrance Floral Arch & Welcome Signboard Stand', qty: '1 setup', rate: '₹9,500', total: '₹9,500', numTotal: 9500 },
      { name: 'Stage Backdrop with Fabric Drape & Fairy Lights', qty: '1 stage', rate: '₹16,000', total: '₹16,000', numTotal: 16000 },
      { name: 'Guest Table Centerpieces (15 tables)', qty: '15 pcs', rate: '₹400', total: '₹6,000', numTotal: 6000 },
      { name: 'Unspecified Cleaning & Teardown Handling Fee', qty: '1 fee', rate: '₹3,500', total: '₹3,500', numTotal: 3500 },
    ];
  }

  subTotal = items.reduce((acc, curr) => acc + curr.numTotal, 0);

  ctx.fillText(title, 50, 75);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#94A3B8';
  ctx.fillText(sub, 50, 110);

  // Date and Bill details
  ctx.fillStyle = '#334155';
  ctx.font = '14px sans-serif';
  ctx.fillText(`Date: ${new Date().toLocaleDateString('en-IN')}`, 50, 175);
  ctx.fillText('Client: Event Organizer (PlanPilot Reference)', 50, 200);
  ctx.fillText('Payment Terms: 40% Advance, 60% on event completion', 50, 225);

  // Table header
  ctx.fillStyle = '#F1F5F9';
  ctx.fillRect(40, 260, 720, 45);
  ctx.fillStyle = '#0B1F4B';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('ITEM / SERVICE DESCRIPTION', 60, 290);
  ctx.fillText('QTY / DURATION', 420, 290);
  ctx.fillText('RATE', 560, 290);
  ctx.fillText('TOTAL (INR)', 660, 290);

  // Table rows
  let y = 335;
  items.forEach((item, index) => {
    ctx.fillStyle = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
    ctx.fillRect(40, y - 25, 720, 45);

    ctx.fillStyle = '#1E293B';
    ctx.font = '14px sans-serif';
    ctx.fillText(item.name, 60, y);
    ctx.fillStyle = '#64748B';
    ctx.fillText(item.qty, 420, y);
    ctx.fillText(item.rate, 560, y);
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(item.total, 660, y);

    y += 50;
  });

  // Total section
  y += 30;
  ctx.strokeStyle = '#0B1F4B';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(400, y);
  ctx.lineTo(760, y);
  ctx.stroke();

  y += 35;
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#0B1F4B';
  ctx.fillText('GRAND TOTAL:', 460, y);
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#2563EB';
  ctx.fillText(`₹${subTotal.toLocaleString('en-IN')}`, 640, y);

  // Stamp / Watermark
  y += 120;
  ctx.strokeStyle = '#94A3B8';
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(500, y, 220, 70);
  ctx.setLineDash([]);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('Authorized Signature / Stamp', 520, y + 40);

  // Note footer
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#94A3B8';
  ctx.fillText('Note: Rates are estimated and subject to confirmation upon contract signing.', 50, 930);

  return canvas.toDataURL('image/jpeg', 0.9);
}

export function CheckQuoteSection({ plan, onAddPayment }: CheckQuoteSectionProps) {
  const [selectedVendorIndex, setSelectedVendorIndex] = useState<number>(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<QuoteAnalysisResult | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isAddedToSpending, setIsAddedToSpending] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputId = useId();

  // Helper to map selected vendor to the best matching budget category
  const activeVendor: VendorChecklistItem | undefined = plan.vendorChecklist[selectedVendorIndex] || plan.vendorChecklist[0];

  const matchingCategory: BudgetCategory = React.useMemo(() => {
    if (!activeVendor) return plan.budgetCategories[0];
    const vendorLower = activeVendor.vendorType.toLowerCase();

    // Find best match in budget categories
    const match = plan.budgetCategories.find((cat) => {
      const catLower = cat.name.toLowerCase();
      if (vendorLower.includes('cater') || vendorLower.includes('food') || vendorLower.includes('halwai')) {
        return catLower.includes('food') || catLower.includes('refreshment') || catLower.includes('catering');
      }
      if (vendorLower.includes('venue') || vendorLower.includes('lawn') || vendorLower.includes('hall') || vendorLower.includes('banquet')) {
        return catLower.includes('venue') || catLower.includes('rental') || catLower.includes('permission');
      }
      if (vendorLower.includes('dj') || vendorLower.includes('sound') || vendorLower.includes('music') || vendorLower.includes('audio')) {
        return catLower.includes('sound') || catLower.includes('music') || catLower.includes('av');
      }
      if (vendorLower.includes('decor') || vendorLower.includes('stage') || vendorLower.includes('flower') || vendorLower.includes('balloon')) {
        return catLower.includes('decor') || catLower.includes('theme') || catLower.includes('stage');
      }
      if (vendorLower.includes('photo') || vendorLower.includes('media') || vendorLower.includes('video')) {
        return catLower.includes('photo') || catLower.includes('video') || catLower.includes('media');
      }
      if (vendorLower.includes('print') || vendorLower.includes('banner') || vendorLower.includes('gift') || vendorLower.includes('favor')) {
        return catLower.includes('favor') || catLower.includes('prize') || catLower.includes('invite') || catLower.includes('print');
      }
      return false;
    });

    return match || plan.budgetCategories[0];
  }, [activeVendor, plan.budgetCategories]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, or WebP).');
      return;
    }
    setError(null);
    setAnalysisResult(null);
    setIsAddedToSpending(false);
    setImageFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Load a sample quotation
  const handleLoadSample = (sampleType: 'catering' | 'sound' | 'decor') => {
    setError(null);
    setAnalysisResult(null);
    setIsAddedToSpending(false);

    // Auto-select corresponding vendor if present
    if (sampleType === 'catering') {
      const idx = plan.vendorChecklist.findIndex(v => v.vendorType.toLowerCase().includes('cater') || v.vendorType.toLowerCase().includes('food'));
      if (idx !== -1) setSelectedVendorIndex(idx);
    } else if (sampleType === 'sound') {
      const idx = plan.vendorChecklist.findIndex(v => v.vendorType.toLowerCase().includes('dj') || v.vendorType.toLowerCase().includes('sound'));
      if (idx !== -1) setSelectedVendorIndex(idx);
    } else if (sampleType === 'decor') {
      const idx = plan.vendorChecklist.findIndex(v => v.vendorType.toLowerCase().includes('decor') || v.vendorType.toLowerCase().includes('flower'));
      if (idx !== -1) setSelectedVendorIndex(idx);
    }

    const dataUrl = generateSampleQuoteDataUrl(sampleType);
    setImagePreview(dataUrl);
    setImageFile(null); // Indicates sample dataUrl
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setImageFile(null);
    setAnalysisResult(null);
    setError(null);
    setIsAddedToSpending(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Trigger Gemini API inspection
  const handleInspectQuote = async () => {
    if (!imagePreview) {
      setError('Please upload or select a quotation photo first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setIsAddedToSpending(false);

    try {
      const res = await fetch('/api/check-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
          mimeType: imageFile?.type || 'image/jpeg',
          vendorType: activeVendor?.vendorType || 'Vendor',
          categoryName: matchingCategory?.name || 'Category',
          plannedBudget: matchingCategory?.amount || 0,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }

      const data: QuoteAnalysisResult = await res.json();
      setAnalysisResult(data);

      if (!data.isQuotation && data.rejectionReason) {
        setError(data.rejectionReason);
      }
    } catch (err: any) {
      console.error('Quote analysis error:', err);
      setError(err?.message || 'Could not analyze quotation. Please ensure the photo is clear and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToSpending = () => {
    if (!analysisResult || !onAddPayment || isAddedToSpending) return;
    onAddPayment({
      categoryId: matchingCategory.id,
      categoryName: matchingCategory.name,
      amount: analysisResult.totalAmount,
      note: analysisResult.extractedVendorName 
        ? `${analysisResult.extractedVendorName} (${activeVendor?.vendorType || 'Vendor'})` 
        : `Quotation: ${activeVendor?.vendorType || 'Vendor'}`,
      date: new Date().toISOString().split('T')[0],
    });
    setIsAddedToSpending(true);
  };

  const handleCopyNegotiation = () => {
    if (!analysisResult) return;
    const text = `PlanPilot Negotiation Points for ${activeVendor?.vendorType || 'Vendor'}:\n` +
      analysisResult.negotiationPoints.map((pt, i) => `${i + 1}. ${pt}`).join('\n') +
      `\n\nTotal Quoted: ${formatINR(analysisResult.totalAmount)} vs Planned Budget: ${formatINR(matchingCategory.amount)}`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <section id="check-quote-section" className="scroll-mt-20">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0B1F4B] text-white shadow-xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-900/60 text-blue-200 border border-blue-400/20 text-xs font-semibold uppercase tracking-wider mb-3">
              <FileSearch className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Smart Vendor Quote Inspector</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Check a Vendor Quote
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mt-1 max-w-2xl leading-relaxed">
              Upload a photo of a vendor quotation or bill. PlanPilot reads the prices, compares it against your category budget, identifies unclear fees, and gives you 3 simple negotiation points.
            </p>
          </div>

          <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 text-xs text-slate-200 flex items-center gap-2 flex-shrink-0">
            <Info className="w-4 h-4 text-blue-300 flex-shrink-0" />
            <span>This is an estimate. Confirm prices with the vendor.</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Upload & Vendor Selector */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: Inputs */}
          <div className="bg-[#FFFFFF] p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#0B1F4B] text-white text-xs flex items-center justify-center font-bold">1</span>
              <span>Pick Vendor Type from Checklist</span>
            </h3>

            {/* Vendor Type Dropdown */}
            <div>
              <label htmlFor="vendor-type-select" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Vendor Checklist Role:
              </label>
              <select
                id="vendor-type-select"
                value={selectedVendorIndex}
                onChange={(e) => {
                  setSelectedVendorIndex(Number(e.target.value));
                  setAnalysisResult(null);
                  setError(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F5F7FA] text-[#111111] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563EB] cursor-pointer"
              >
                {plan.vendorChecklist.map((item, idx) => (
                  <option key={item.id || idx} value={idx}>
                    {item.vendorType} ({item.benchmarkCost})
                  </option>
                ))}
              </select>
            </div>

            {/* Matching Category & Planned Budget Pill */}
            <div className="p-3.5 rounded-2xl bg-[#F5F7FA] border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500 font-medium block">Planned Category Budget:</span>
                <span className="font-bold text-[#111111] text-sm">
                  {matchingCategory.name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 font-medium block">Category Limit:</span>
                <span className="font-extrabold text-[#0B1F4B] text-base">
                  {formatINR(matchingCategory.amount)}
                </span>
              </div>
            </div>

            {/* Image Upload Area */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#111111] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[#0B1F4B] text-white text-xs flex items-center justify-center font-bold">2</span>
                  <span>Upload Quotation Photo</span>
                </label>
                {imagePreview && (
                  <button
                    onClick={handleClearImage}
                    className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition cursor-pointer"
                  >
                    Clear photo
                  </button>
                )}
              </div>

              {imagePreview ? (
                <div className="relative rounded-2xl border-2 border-slate-200 overflow-hidden bg-slate-900 group">
                  <img
                    src={imagePreview}
                    alt="Quotation Preview"
                    className="w-full h-64 object-contain mx-auto"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-white text-[#111111] text-xs font-bold shadow-md hover:bg-slate-100 cursor-pointer"
                    >
                      Change Photo
                    </button>
                    <button
                      onClick={handleClearImage}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md hover:bg-rose-700 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label
                    htmlFor={uploadInputId}
                    className="border-2 border-dashed border-slate-300 hover:border-[#2563EB] rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-[#F5F7FA] hover:bg-blue-50/40 transition group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-[#2563EB] shadow-2xs group-hover:scale-105 transition mb-3">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold text-[#111111] block">
                      Click to upload quotation photo
                    </span>
                    <span className="text-xs text-slate-500 mt-1 block">
                      PNG, JPG, or WebP (bills, written estimates, rate sheets)
                    </span>
                  </label>
                  <input
                    id={uploadInputId}
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </div>
              )}
            </div>

            {/* Quick Sample Quotes to Test Instantly */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Don’t have a photo handy? Try a realistic Indian quote:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleLoadSample('catering')}
                  className="px-2.5 py-2 rounded-xl bg-[#F5F7FA] hover:bg-slate-200/80 border border-slate-200 text-[11px] font-semibold text-[#111111] transition text-center cursor-pointer leading-tight"
                >
                  🍲 Catering Quote
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('sound')}
                  className="px-2.5 py-2 rounded-xl bg-[#F5F7FA] hover:bg-slate-200/80 border border-slate-200 text-[11px] font-semibold text-[#111111] transition text-center cursor-pointer leading-tight"
                >
                  🎵 Sound/DJ Quote
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('decor')}
                  className="px-2.5 py-2 rounded-xl bg-[#F5F7FA] hover:bg-slate-200/80 border border-slate-200 text-[11px] font-semibold text-[#111111] transition text-center cursor-pointer leading-tight"
                >
                  🎈 Decor Quote
                </button>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleInspectQuote}
              disabled={isLoading || !imagePreview}
              className={`w-full py-3 px-4 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                isLoading || !imagePreview
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-[#0B1F4B] hover:bg-[#163066] text-white hover:shadow-lg'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Scanning Quotation with Gemini...</span>
                </>
              ) : (
                <>
                  <FileSearch className="w-4 h-4 text-[#2563EB]" />
                  <span>Inspect Quotation with AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Loading / Error / Results */}
        <div className="lg:col-span-7">
          {/* Loading State */}
          {isLoading && (
            <div className="bg-[#FFFFFF] p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4 animate-fade-in">
              <div className="relative w-20 h-20 mx-auto">
                <div className="w-20 h-20 rounded-full border-4 border-slate-100 border-t-[#2563EB] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileSearch className="w-8 h-8 text-[#0B1F4B]" />
                </div>
              </div>
              <h4 className="text-lg font-bold text-[#111111]">
                Reading Your Quotation Photo...
              </h4>
              <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                Gemini 3.8 Flash is detecting line items, extracting amounts in ₹, evaluating hidden charges, and comparing against your {matchingCategory.name} budget.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#0B1F4B] text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Checking budget fit & drafting negotiation tips</span>
              </div>
            </div>
          )}

          {/* Error / Blurry Photo State */}
          {!isLoading && error && (
            <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-3xl border border-rose-200 bg-rose-50/20 shadow-sm space-y-4 animate-fade-in">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-rose-900">
                    Could Not Read Quotation
                  </h4>
                  <p className="text-sm text-rose-800 mt-1 leading-relaxed">
                    {error}
                  </p>
                  <p className="text-xs text-rose-700/80 mt-2">
                    Tip: Ensure the bill is flat, well-lit, and text/numbers are clearly in focus.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={handleInspectQuote}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Inspection</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-[#111111] text-xs font-semibold transition cursor-pointer"
                >
                  Upload Clearer Photo
                </button>
              </div>
            </div>
          )}

          {/* Initial Blank State (Before any inspection) */}
          {!isLoading && !error && !analysisResult && (
            <div className="bg-[#FFFFFF] p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-[#F5F7FA] border border-slate-200 text-[#0B1F4B] flex items-center justify-center mx-auto shadow-2xs">
                <FileText className="w-8 h-8 text-[#2563EB]" />
              </div>
              <h4 className="text-lg font-bold text-[#111111]">
                No Quotation Scanned Yet
              </h4>
              <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                Take a photo or upload an image of any vendor quote or estimate to receive an itemized breakdown, budget fit status, and negotiation tips.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs px-3 py-1.5 rounded-xl bg-[#F5F7FA] border border-slate-200 font-medium text-slate-600">
                  ✓ Line item prices in ₹
                </span>
                <span className="text-xs px-3 py-1.5 rounded-xl bg-[#F5F7FA] border border-slate-200 font-medium text-slate-600">
                  ✓ Fits / slightly high / too high
                </span>
                <span className="text-xs px-3 py-1.5 rounded-xl bg-[#F5F7FA] border border-slate-200 font-medium text-slate-600">
                  ✓ Unnecessary charge alerts
                </span>
                <span className="text-xs px-3 py-1.5 rounded-xl bg-[#F5F7FA] border border-slate-200 font-medium text-slate-600">
                  ✓ 3 Negotiation tips
                </span>
              </div>
            </div>
          )}

          {/* Successful Analysis Results */}
          {!isLoading && analysisResult && analysisResult.isQuotation && (
            <div className="space-y-6 animate-fade-in">
              {/* Result Summary Card */}
              <div className="bg-[#FFFFFF] p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Vendor Quote Analysis
                    </span>
                    <h3 className="text-xl font-extrabold text-[#111111]">
                      {analysisResult.extractedVendorName || activeVendor?.vendorType || 'Vendor Quotation'}
                    </h3>
                  </div>

                  {/* Budget Fit Badge */}
                  <div className="flex-shrink-0">
                    {analysisResult.status === 'fits' ? (
                      <div className="px-3.5 py-1.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="uppercase tracking-wide">Fits Budget</span>
                      </div>
                    ) : analysisResult.status === 'slightly high' ? (
                      <div className="px-3.5 py-1.5 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="uppercase tracking-wide">Slightly High</span>
                      </div>
                    ) : (
                      <div className="px-3.5 py-1.5 rounded-2xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span className="uppercase tracking-wide">Too High</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Amounts Comparison Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-[#F5F7FA] border border-slate-200">
                    <span className="text-xs text-slate-500 font-semibold block mb-0.5">
                      Total Quote Amount:
                    </span>
                    <span className="text-lg font-extrabold text-[#0B1F4B]">
                      {formatINR(analysisResult.totalAmount)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F5F7FA] border border-slate-200">
                    <span className="text-xs text-slate-500 font-semibold block mb-0.5">
                      Planned Category Budget:
                    </span>
                    <span className="text-lg font-extrabold text-[#111111]">
                      {formatINR(analysisResult.plannedBudget)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F5F7FA] border border-slate-200">
                    <span className="text-xs text-slate-500 font-semibold block mb-0.5">
                      Difference:
                    </span>
                    <span className={`text-lg font-extrabold ${
                      analysisResult.status === 'fits' ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {analysisResult.status === 'fits' ? '-' : '+'}{formatINR(analysisResult.differenceAmount)}
                    </span>
                  </div>
                </div>

                {/* Simple English Difference Summary */}
                <div className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 ${
                  analysisResult.status === 'fits'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : analysisResult.status === 'slightly high'
                    ? 'bg-amber-50 text-amber-900 border border-amber-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}>
                  <Info className="w-4 h-4 flex-shrink-0" />
                  <span>{analysisResult.differenceDescription}</span>
                </div>

                {/* Optional: Add directly to Track Spending */}
                {onAddPayment && (
                  <div className="pt-1 flex items-center justify-between">
                    <button
                      onClick={handleAddToSpending}
                      disabled={isAddedToSpending}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        isAddedToSpending
                          ? 'bg-emerald-100 text-emerald-800 cursor-default'
                          : 'bg-[#F5F7FA] hover:bg-slate-200 border border-slate-200 text-[#111111]'
                      }`}
                    >
                      {isAddedToSpending ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Logged in Track Spending!</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-3.5 h-3.5 text-[#2563EB]" />
                          <span>Log this Quote in Track Spending</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleCopyNegotiation}
                      className="text-xs font-semibold text-slate-600 hover:text-[#0B1F4B] transition cursor-pointer"
                    >
                      {isCopied ? '✓ Copied tips!' : 'Copy negotiation points'}
                    </button>
                  </div>
                )}
              </div>

              {/* Itemized Breakdown Table */}
              <div className="bg-[#FFFFFF] p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#111111] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#2563EB]" />
                    <span>(1) Main Items & Prices ({analysisResult.items.length})</span>
                  </h4>
                  <span className="text-xs font-bold text-slate-500">
                    Total: {formatINR(analysisResult.totalAmount)}
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                  {analysisResult.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 flex items-center justify-between hover:bg-slate-50/60 transition text-xs"
                    >
                      <div className="pr-4">
                        <span className="font-bold text-[#111111] block">
                          {item.name}
                        </span>
                        {item.note && (
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            {item.note}
                          </span>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-extrabold text-[#0B1F4B] text-sm">
                          {formatINR(item.price)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Unnecessary or Unclear Items Callout */}
              <div className="bg-[#FFFFFF] p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <h4 className="text-sm font-bold text-[#111111] flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>(4) Unnecessary or Unclear Charges</span>
                </h4>

                {analysisResult.unnecessaryOrUnclearItems.length > 0 ? (
                  <div className="space-y-2">
                    {analysisResult.unnecessaryOrUnclearItems.map((charge, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span className="font-medium leading-relaxed">{charge}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-emerald-50 text-xs text-emerald-800 border border-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>No obvious hidden or unnecessary charges found. All items look standard.</span>
                  </div>
                )}
              </div>

              {/* 3 Simple Negotiation Points */}
              <div className="bg-[#FFFFFF] p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#111111] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#2563EB]" />
                    <span>(5) 3 Simple Points to Negotiate</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Polite & practical Indian market advice
                  </span>
                </div>

                <div className="space-y-3">
                  {analysisResult.negotiationPoints.map((point, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-[#F5F7FA] border border-slate-200 flex items-start gap-3"
                    >
                      <span className="w-5 h-5 rounded-lg bg-[#0B1F4B] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-xs sm:text-sm text-[#111111] font-medium leading-relaxed">
                        {point}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Estimate Disclaimer */}
              <div className="p-4 rounded-2xl bg-[#F5F7FA] border border-slate-200 text-xs text-slate-600 text-center">
                <span className="font-bold text-[#0B1F4B] block mb-0.5">
                  {analysisResult.disclaimer || 'This is an estimate. Confirm prices with the vendor.'}
                </span>
                <span className="text-slate-500 text-[11px]">
                  Budget estimates are approximate. Confirm prices with real quotes.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
