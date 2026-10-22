import React, { useState } from 'react';
import { 
  IndianRupee, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Receipt, 
  Calendar, 
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import type { BudgetCategory, PaymentEntry } from '../types/plan';
import { formatINR } from '../utils/formatters';

interface TrackSpendingSectionProps {
  categories: BudgetCategory[];
  totalBudget: number;
  payments: PaymentEntry[];
  onAddPayment: (payment: Omit<PaymentEntry, 'id' | 'createdAt'>) => void;
  onDeletePayment: (paymentId: string) => void;
  onClearPayments: () => void;
}

export const TrackSpendingSection: React.FC<TrackSpendingSectionProps> = ({
  categories,
  totalBudget,
  payments,
  onAddPayment,
  onDeletePayment,
  onClearPayments,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || '');
  const [amountStr, setAmountStr] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Compute spending per category
  const categorySpendingMap: { [catId: string]: number } = {};
  categories.forEach((cat) => {
    categorySpendingMap[cat.id] = 0;
  });

  payments.forEach((p) => {
    if (categorySpendingMap[p.categoryId] !== undefined) {
      categorySpendingMap[p.categoryId] += p.amount;
    } else {
      categorySpendingMap[p.categoryId] = (categorySpendingMap[p.categoryId] || 0) + p.amount;
    }
  });

  // Total spent and remaining
  const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallPercentageUsed = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // Identify categories above 80% used
  const warningCategories = categories
    .map((cat) => {
      const spent = categorySpendingMap[cat.id] || 0;
      const pct = cat.amount > 0 ? Math.round((spent / cat.amount) * 100) : 0;
      const remaining = cat.amount - spent;
      return {
        ...cat,
        spent,
        pct,
        remaining,
      };
    })
    .filter((c) => c.pct >= 80);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseInt(amountStr.replace(/[^0-9]/g, ''), 10);
    if (!parsedAmount || parsedAmount <= 0) return;

    const matchedCat = categories.find((c) => c.id === selectedCategoryId) || categories[0];
    if (!matchedCat) return;

    onAddPayment({
      categoryId: matchedCat.id,
      categoryName: matchedCat.name,
      amount: parsedAmount,
      note: note.trim() || `Payment for ${matchedCat.name}`,
      date: paymentDate || new Date().toISOString().split('T')[0],
    });

    // Reset form fields
    setAmountStr('');
    setNote('');
  };

  const filteredPayments = filterCategory === 'all'
    ? payments
    : payments.filter((p) => p.categoryId === filterCategory);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#0B1F4B] text-white flex items-center justify-center font-bold text-sm">
              ₹
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-[#111111] font-display">
              Track Spending
            </h3>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Log vendor payments in rupees, compare with planned category budgets, and avoid surprises.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {payments.length > 0 && (
            <span className="px-3 py-1.5 rounded-xl bg-[#F5F7FA] border border-slate-200 text-xs font-bold text-[#0B1F4B]">
              {payments.length} {payments.length === 1 ? 'payment' : 'payments'} saved
            </span>
          )}
        </div>
      </div>

      {/* Main Budget Health Overview Banner */}
      <div className="bg-[#F5F7FA] p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
              <span>Total Planned Budget</span>
              <Receipt className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#111111] font-display">
              {formatINR(totalBudget)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Exact budget allocated across {categories.length} categories
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
              <span>Total Spent So Far</span>
              <TrendingUp className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4B] font-display">
              {formatINR(totalSpent)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {overallPercentageUsed}% of your event budget used
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
              <span>Remaining Total Budget</span>
              <IndianRupee className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div
              className={`text-2xl sm:text-3xl font-extrabold font-display ${
                totalRemaining >= 0 ? 'text-[#2563EB]' : 'text-rose-600'
              }`}
            >
              {formatINR(totalRemaining)}
            </div>
            <p className="text-xs font-medium mt-1">
              {totalRemaining >= 0 ? (
                <span className="text-[#2563EB]">₹{formatINR(totalRemaining)} cash left to spend</span>
              ) : (
                <span className="text-rose-600">Over budget by {formatINR(Math.abs(totalRemaining))}</span>
              )}
            </p>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#111111]">
            <span>Overall Budget Used</span>
            <span>{overallPercentageUsed}% Used ({formatINR(totalSpent)} of {formatINR(totalBudget)})</span>
          </div>
          <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full rounded-full transition-all duration-500 bg-[#2563EB]"
              style={{ width: `${Math.min(100, Math.max(0, overallPercentageUsed))}%` }}
            />
          </div>
          <p className="text-xs text-slate-600">
            {totalRemaining >= 0
              ? `You have spent ${formatINR(totalSpent)} out of your ${formatINR(totalBudget)} total budget. You still have ${formatINR(totalRemaining)} left to spend safely.`
              : `Warning: You have exceeded your total budget by ${formatINR(Math.abs(totalRemaining))}. Recheck upcoming vendor contracts.`}
          </p>
        </div>
      </div>

      {/* 80%+ Simple English Warnings Banner (if any) */}
      {warningCategories.length > 0 && (
        <div className="bg-white p-5 rounded-3xl border-2 border-[#2563EB]/40 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#0B1F4B] text-white flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-[#2563EB]" />
            </div>
            <h4 className="text-base font-bold text-[#111111]">
              Budget Alerts: {warningCategories.length} {warningCategories.length === 1 ? 'Category' : 'Categories'} High or Exhausted
            </h4>
          </div>

          <div className="space-y-2">
            {warningCategories.map((c) => {
              const isOver = c.remaining < 0;
              return (
                <div
                  key={c.id}
                  className="p-3.5 rounded-2xl bg-[#F5F7FA] border border-slate-200 text-xs text-[#111111] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-[#0B1F4B] text-sm block">
                      {c.name} ({c.pct}% Used)
                    </span>
                    <p className="font-medium text-slate-700">
                      {isOver ? (
                        <>You have spent <strong className="text-rose-600">{formatINR(c.spent)}</strong> against a planned budget of {formatINR(c.amount)}. You are over budget by {formatINR(Math.abs(c.remaining))}.</>
                      ) : (
                        <>You have used <strong>{c.pct}%</strong> of your {c.name} budget ({formatINR(c.spent)} of {formatINR(c.amount)}). Only <strong>{formatINR(c.remaining)}</strong> remains for any extra requests.</>
                      )}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-block px-3 py-1 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-[#0B1F4B]">
                      {isOver ? 'Exceeded Budget' : 'Above 80% Alert'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Payment Form */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#0B1F4B] text-white flex items-center justify-center font-bold text-xs">
            +
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-bold text-[#111111]">
              Add a Payment
            </h4>
            <p className="text-xs text-slate-500">
              Record an advance, booking deposit, or final bill payment
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Category Select */}
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1.5">
                Category
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm font-semibold text-[#111111] focus:outline-none focus:border-[#2563EB]"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} (Budget: {formatINR(cat.amount)})
                  </option>
                ))}
              </select>
            </div>

            {/* Amount in Rupees */}
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1.5">
                Amount (in ₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  placeholder="e.g. 15000"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm font-semibold text-[#111111] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            {/* Description / Note */}
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1.5">
                Note / Vendor Paid
              </label>
              <input
                type="text"
                placeholder="e.g. 50% Hall booking advance"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm font-semibold text-[#111111] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1.5">
                Payment Date
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm font-semibold text-[#111111] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          {/* Quick Amount Shortcuts & Submit Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500 mr-1">Quick Add:</span>
              {[2000, 5000, 10000, 25000].map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setAmountStr(amt.toString())}
                  className="px-2.5 py-1 rounded-lg bg-[#F5F7FA] border border-slate-200 text-xs font-semibold text-[#111111] hover:bg-slate-200 transition cursor-pointer"
                >
                  +{formatINR(amt)}
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#0B1F4B] text-white hover:bg-[#142a63] text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Save Payment</span>
            </button>
          </div>
        </form>
      </div>

      {/* Category Budget Comparison Cards with Progress Bars */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-base sm:text-lg font-bold text-[#111111]">
            Planned Budget vs. Actual Spending by Category
          </h4>
          <span className="text-xs text-slate-500 font-medium">
            Blue bar shows percentage used
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => {
            const spent = categorySpendingMap[cat.id] || 0;
            const pct = cat.amount > 0 ? Math.round((spent / cat.amount) * 100) : 0;
            const remaining = cat.amount - spent;
            const isAbove80 = pct >= 80;
            const isOver100 = pct > 100;
            const catPaymentsCount = payments.filter((p) => p.categoryId === cat.id).length;

            return (
              <div
                key={cat.id}
                className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all ${
                  isOver100
                    ? 'border-rose-300 ring-1 ring-rose-100'
                    : isAbove80
                    ? 'border-blue-300 ring-1 ring-blue-100'
                    : 'border-slate-200'
                } shadow-xs space-y-4`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h5 className="font-bold text-[#111111] text-base leading-tight">
                      {cat.name}
                    </h5>
                    <span className="text-xs text-slate-500 font-medium">
                      {catPaymentsCount} {catPaymentsCount === 1 ? 'payment logged' : 'payments logged'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-xl text-xs font-bold ${
                        isOver100
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : isAbove80
                          ? 'bg-blue-50 text-[#0B1F4B] border border-blue-200'
                          : 'bg-[#F5F7FA] text-[#111111] border border-slate-200'
                      }`}
                    >
                      {pct}% Used
                    </span>
                  </div>
                </div>

                {/* Progress Bar (highlighted with #2563EB) */}
                <div className="space-y-1.5">
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver100 ? 'bg-rose-600' : 'bg-[#2563EB]'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span>Spent: <strong className="text-[#111111]">{formatINR(spent)}</strong></span>
                    <span>Planned: <strong className="text-[#111111]">{formatINR(cat.amount)}</strong></span>
                  </div>
                </div>

                {/* Category Status & Remaining */}
                <div className="p-3 rounded-2xl bg-[#F5F7FA] border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-600">Category Balance:</span>
                    <span className={remaining >= 0 ? 'text-[#2563EB]' : 'text-rose-600'}>
                      {remaining >= 0 ? `${formatINR(remaining)} left` : `Over by ${formatINR(Math.abs(remaining))}`}
                    </span>
                  </div>

                  {/* Warning in simple English when above 80% */}
                  {isOver100 ? (
                    <p className="text-rose-600 font-semibold pt-1">
                      ⚠️ Over budget: You have exceeded your {cat.name} budget by {formatINR(Math.abs(remaining))}. Try cutting other non-essential costs.
                    </p>
                  ) : isAbove80 ? (
                    <p className="text-[#0B1F4B] font-semibold pt-1">
                      ⚠️ Caution: You have used {pct}% of your {cat.name} budget. Only {formatINR(remaining)} is left for extras.
                    </p>
                  ) : (
                    <p className="text-slate-600 font-medium pt-1">
                      Safe: You have {formatINR(remaining)} remaining in this category. Spending is on track.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment History & Ledger */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h4 className="text-base sm:text-lg font-bold text-[#111111] flex items-center gap-2">
              <span>Payment History</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F5F7FA] text-[#0B1F4B] border border-slate-200 font-bold">
                {payments.length} Records
              </span>
            </h4>
            <p className="text-xs text-slate-500">
              All payment entries are saved securely in your browser
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter by Category */}
            {categories.length > 0 && payments.length > 0 && (
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#F5F7FA] border border-slate-200 text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#2563EB]"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            {payments.length > 0 && (
              <>
                {showClearConfirm ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onClearPayments();
                        setShowClearConfirm(false);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition cursor-pointer"
                    >
                      Confirm Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      className="px-3 py-1.5 rounded-xl bg-[#F5F7FA] border border-slate-200 text-xs font-semibold text-[#111111] hover:bg-slate-200 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="px-3 py-1.5 rounded-xl bg-[#F5F7FA] border border-slate-200 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:border-rose-200 transition cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-2xl bg-[#F5F7FA] border border-slate-200 text-slate-500 space-y-2">
            <Receipt className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-[#111111]">
              {payments.length === 0 ? 'No payments recorded yet' : 'No payments found for this category'}
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              When you pay an advance for the venue, caterer, DJ, or photographer, add it using the form above. It will update your remaining budget immediately.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase font-bold">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Note / Vendor</th>
                  <th className="py-3 px-3 text-right">Amount (₹)</th>
                  <th className="py-3 px-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F5F7FA] transition">
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap font-medium">
                      {p.date}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-[#F5F7FA] border border-slate-200 text-xs font-bold text-[#0B1F4B]">
                        {p.categoryName}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#111111]">
                      {p.note}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-[#111111] whitespace-nowrap">
                      {formatINR(p.amount)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => onDeletePayment(p.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete payment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
