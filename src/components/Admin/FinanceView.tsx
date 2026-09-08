"use client";

import { useState, useEffect, useCallback } from "react";
import { formatPrice } from "@/utils/formatePrice";
import {
  actionGetSettlements,
  actionGetCommissionRules,
  actionCreateCommissionRule,
  actionProcessPayout,
} from "@/actions/vanigamActions";
import {
  VanigamCommissionRule,
  VanigamSettlement,
} from "@/lib/b2b2c/mockVanigamData";
import { useWorkspace } from "@/context/WorkspaceContext";
import toast from "react-hot-toast";

export default function FinanceView() {
  const { currentWorkspace, isPlatformAdmin, hasPermission } = useWorkspace();
  const [rules, setRules] = useState<VanigamCommissionRule[]>([]);
  const [settlements, setSettlements] = useState<VanigamSettlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const canManageCommissions = hasPermission("commissions.manage");
  const canExecutePayouts = hasPermission("payouts.execute");

  const fetchFinanceData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedSettlements, fetchedRules] = await Promise.all([
        actionGetSettlements(isPlatformAdmin ? undefined : currentWorkspace.id),
        actionGetCommissionRules(),
      ]);
      setSettlements(fetchedSettlements || []);
      setRules(fetchedRules || []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load financial ledger");
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace.id, isPlatformAdmin]);

  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

  // Multi-Tenant Isolation Filter
  const workspaceSettlements = isPlatformAdmin
    ? settlements
    : settlements.filter((s) => s.organizationId === currentWorkspace.id);

  // Search & Status Filter
  const visibleSettlements = workspaceSettlements.filter((s) => {
    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.settlementNo.toLowerCase().includes(q) ||
      s.organizationName.toLowerCase().includes(q) ||
      (s.notes && s.notes.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  // Summary Metrics
  const totalSettledPayout = workspaceSettlements
    .filter((s) => s.status === "PAID")
    .reduce((acc, s) => acc + s.netPayout, 0);
  const totalPendingPayout = workspaceSettlements
    .filter((s) => s.status === "ELIGIBLE" || s.status === "PENDING")
    .reduce((acc, s) => acc + s.netPayout, 0);
  const totalCommissions = workspaceSettlements.reduce((acc, s) => acc + s.commissionFee, 0);

  // New Rule Form
  const [ruleName, setRuleName] = useState("");
  const [rate, setRate] = useState(8.5);
  const [fixedFee, setFixedFee] = useState(0);
  const [ruleType, setRuleType] = useState<"PERCENTAGE" | "FIXED" | "HYBRID">("PERCENTAGE");
  const [category, setCategory] = useState("Electronics");

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName) {
      toast.error("Please provide a name for this commission policy.");
      return;
    }

    setIsSubmitting(true);
    try {
      await actionCreateCommissionRule({
        name: ruleName,
        type: ruleType,
        percentageRate: rate,
        fixedFee,
        category,
        isActive: true,
      });

      toast.success("Commission rule applied to marketplace engine!");
      setShowRuleModal(false);
      setRuleName("");
      await fetchFinanceData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create commission rule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProcessPayout = async (settlementId: string) => {
    try {
      const updated = await actionProcessPayout(settlementId);
      if (updated) {
        setSettlements((prev) =>
          prev.map((s) => (s.id === settlementId ? { ...s, status: "PAID", paidAt: updated.paidAt } : s))
        );
        toast.success(`Payout ${updated.settlementNo} disbursed via automated electronic ACH!`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Payout failed");
    }
  };

  const handleExportCSV = () => {
    const headers = ["Settlement No", "Seller Org", "Gross Sales", "Commission Fee", "Adjustments / Refunds", "Net Payout", "Status", "Period End"];
    const rows = visibleSettlements.map((s) => [
      s.settlementNo,
      s.organizationName,
      s.grossSales,
      s.commissionFee,
      s.adjustments || 0,
      s.netPayout,
      s.status,
      s.period,
    ]);
    const content = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `financial-settlements-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Settlements ledger exported to CSV!");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
              Financial Escrow & Settlements
            </span>
            <span className="text-xs text-gray-400 font-medium">
              {workspaceSettlements.length} Settlements Processed
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-dark">Commissions & Seller Payouts</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isPlatformAdmin
              ? "Global take-rate calculation, multi-party ledger settlement, and escrow payouts."
              : `Settlement ledger and disbursement schedule for ${currentWorkspace.name}.`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchFinanceData}
            disabled={isLoading}
            className="py-2.5 px-4 bg-gray-1 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-2 transition border border-gray-3 flex items-center gap-1.5"
            title="Refresh finance data"
          >
            <span className={isLoading ? "animate-spin" : ""}>🔄</span> Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="py-2.5 px-4 bg-white text-dark rounded-xl text-xs font-bold hover:bg-gray-1 transition border border-gray-3 flex items-center gap-1.5"
          >
            ⬇ Export CSV
          </button>
          {canManageCommissions && (
            <button
              onClick={() => setShowRuleModal(true)}
              className="py-2.5 px-5 bg-blue text-white rounded-xl text-xs font-bold hover:bg-blue-dark transition shadow-sm self-start sm:self-auto"
            >
              + Add Commission Rule
            </button>
          )}
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-3 shadow-xs">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Disbursed Payouts</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{formatPrice(totalSettledPayout)}</div>
          <div className="text-xs text-gray-500 mt-1">Completed electronic disbursements</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-3 shadow-xs">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending / Escrow</div>
          <div className="text-2xl font-extrabold text-blue mt-1">{formatPrice(totalPendingPayout)}</div>
          <div className="text-xs text-gray-500 mt-1">Eligible or holding for return window</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-3 shadow-xs">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Marketplace Commissions</div>
          <div className="text-2xl font-extrabold text-dark mt-1">{formatPrice(totalCommissions)}</div>
          <div className="text-xs text-gray-500 mt-1">Platform take-rate deductions</div>
        </div>
      </div>

      {/* Section 1: Active Commission Policies (Visible only to Platform Governance) */}
      {isPlatformAdmin && (
        <div className="bg-white rounded-2xl border border-gray-3 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-2 bg-gray-2/50 font-bold text-dark text-sm flex justify-between items-center">
            <span>Platform Commission Policies ({rules.length})</span>
            <span className="text-xs text-gray-400 font-normal">Active fee schedules applied to business transactions</span>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2].map((n) => (
                <div key={n} className="h-10 bg-gray-2 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-2 text-xs uppercase tracking-wider font-semibold text-gray-500 bg-gray-1/30">
                    <th className="py-3 px-6">Rule Name</th>
                    <th className="py-3 px-4">Calculation Model</th>
                    <th className="py-3 px-4">Rate / Fee</th>
                    <th className="py-3 px-4">Category Scope</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-2">
                  {rules.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-1/50 transition">
                      <td className="py-4 px-6 font-bold text-dark">{r.name}</td>
                      <td className="py-4 px-4 font-mono text-xs text-gray-600">{r.type}</td>
                      <td className="py-4 px-4 font-bold text-blue">
                        {r.percentageRate}% {r.fixedFee > 0 ? `+ $${r.fixedFee}` : ""}
                      </td>
                      <td className="py-4 px-4 text-xs font-medium text-dark">{r.category}</td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                          ACTIVE
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Search & Status Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-3 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        <div className="flex-1 w-full relative">
          <input
            type="text"
            placeholder="Search settlements by Settlement #, Seller Org, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-3 rounded-lg text-sm focus:outline-none focus:border-blue"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-dark font-bold"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {["ALL", "ELIGIBLE", "PAID", "PENDING", "ON_HOLD"].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition ${
                statusFilter === filter
                  ? "bg-dark text-white"
                  : "bg-gray-1 border border-gray-3 text-gray-600 hover:bg-gray-2"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Section 2: Settlements & Payouts Ledger */}
      <div className="bg-white rounded-2xl border border-gray-3 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-gray-2 bg-gray-2/50 font-bold text-dark text-sm flex justify-between items-center">
          <span>Seller Settlements & Escrow Payouts ({visibleSettlements.length})</span>
          <span className="text-xs text-gray-400 font-normal">
            Automated release after delivery & return eligibility window
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-12 bg-gray-2 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {/* Mobile & Tablet Card Layout (< 1024px) */}
            <div className="block lg:hidden divide-y divide-gray-2">
              {visibleSettlements.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  No settlements match your search criteria.
                </div>
              ) : (
                visibleSettlements.map((s) => (
                  <div key={s.id} className="p-4 sm:p-5 space-y-3 bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-mono font-bold text-dark text-sm">{s.settlementNo}</div>
                        <div className="text-xs text-gray-500 font-semibold mt-0.5">{s.organizationName}</div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                          s.status === "PAID"
                            ? "bg-emerald-100 text-emerald-700"
                            : s.status === "ELIGIBLE"
                            ? "bg-blue/10 text-blue font-bold animate-pulse"
                            : s.status === "PENDING"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-2 text-gray-600"
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs border border-gray-2 p-2.5 rounded-xl text-center">
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Gross</span>
                        <span className="font-bold text-dark">{formatPrice(s.grossSales)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Fee</span>
                        <span className="font-mono text-emerald-600 font-semibold">-{formatPrice(s.commissionFee)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Net Payout</span>
                        <span className="font-bold text-blue font-mono">{formatPrice(s.netPayout)}</span>
                      </div>
                    </div>

                    <div className="pt-1">
                      {s.status === "ELIGIBLE" && canExecutePayouts ? (
                        <button
                          onClick={() => handleProcessPayout(s.id)}
                          className="w-full py-2.5 px-3 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-xs min-h-[38px]"
                        >
                          Execute Payout
                        </button>
                      ) : s.status === "PAID" ? (
                        <div className="text-xs font-mono text-gray-400 text-center bg-gray-1 py-2 rounded-lg">
                          ✓ Disbursed {s.paidAt?.slice(0, 10) || "Recorded"}
                        </div>
                      ) : (
                        <div className="text-xs font-mono text-gray-400 text-center bg-gray-1 py-2 rounded-lg">
                          Holding Period: Awaiting 14-day clearance
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table (>= 1024px) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-2 text-xs uppercase tracking-wider font-semibold text-gray-500 bg-gray-1/30">
                    <th className="py-3 px-6">Settlement #</th>
                    <th className="py-3 px-4">Seller Org</th>
                    <th className="py-3 px-4">Gross Sales</th>
                    <th className="py-3 px-4">Take-Rate Fee</th>
                    <th className="py-3 px-4">Deductions</th>
                    <th className="py-3 px-4">Net Payout</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-6 text-right">Disbursement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-2">
                  {visibleSettlements.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-gray-400">
                        No settlements match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    visibleSettlements.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-1/50 transition">
                        <td className="py-4 px-6 font-mono font-bold text-dark">{s.settlementNo}</td>
                        <td className="py-4 px-4 font-semibold text-dark">{s.organizationName}</td>
                        <td className="py-4 px-4 font-bold text-dark">{formatPrice(s.grossSales)}</td>
                        <td className="py-4 px-4 text-xs font-mono text-emerald-600 font-semibold">
                          -{formatPrice(s.commissionFee)}
                        </td>
                        <td className="py-4 px-4 text-xs font-mono text-red-500 font-semibold">
                          {s.adjustments && s.adjustments > 0 ? `-${formatPrice(s.adjustments)}` : "$0.00"}
                        </td>
                        <td className="py-4 px-4 font-bold text-blue text-base font-mono">
                          {formatPrice(s.netPayout)}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              s.status === "PAID"
                                ? "bg-emerald-100 text-emerald-700"
                                : s.status === "ELIGIBLE"
                                ? "bg-blue/10 text-blue font-bold animate-pulse"
                                : s.status === "PENDING"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-gray-2 text-gray-600"
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          {s.status === "ELIGIBLE" && canExecutePayouts ? (
                            <button
                              onClick={() => handleProcessPayout(s.id)}
                              className="py-1.5 px-3 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition shadow-xs"
                            >
                              Execute Payout
                            </button>
                          ) : s.status === "PAID" ? (
                            <span className="text-xs font-mono text-gray-400">
                              Disbursed {s.paidAt?.slice(0, 10) || "Recorded"}
                            </span>
                          ) : (
                            <span className="text-xs font-mono text-gray-400">Holding Period</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal for creating a commission rule */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-gray-3 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-2">
              <h2 className="text-lg font-bold text-dark">Define Commission Policy</h2>
              <button
                onClick={() => setShowRuleModal(false)}
                className="text-gray-400 hover:text-dark text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-dark mb-1">Policy Identifier</label>
                <input
                  type="text"
                  placeholder="e.g. Standard Electronics Take-Rate"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-3 rounded-lg text-xs text-dark focus:outline-none focus:border-blue"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-dark mb-1">Fee Model</label>
                <select
                  value={ruleType}
                  onChange={(e) => setRuleType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-3 rounded-lg text-xs text-dark focus:outline-none focus:border-blue bg-white"
                >
                  <option value="PERCENTAGE">Percentage Only</option>
                  <option value="FIXED">Fixed Fee per Item</option>
                  <option value="HYBRID">Hybrid (% + Fixed Transaction Fee)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-dark mb-1">Take-Rate Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    max={100}
                    value={rate}
                    onChange={(e) => setRate(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-3 rounded-lg text-xs text-dark focus:outline-none focus:border-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-dark mb-1">Fixed Fee ($)</label>
                  <input
                    type="number"
                    step="0.05"
                    min={0}
                    value={fixedFee}
                    onChange={(e) => setFixedFee(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-3 rounded-lg text-xs text-dark focus:outline-none focus:border-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-dark mb-1">Applicable Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-3 rounded-lg text-xs text-dark focus:outline-none focus:border-blue bg-white"
                >
                  <option value="Electronics">Electronics & Hardware</option>
                  <option value="Apparel">Apparel & Textiles</option>
                  <option value="Industrial">Industrial Supplies</option>
                  <option value="ALL">All Marketplace Categories</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-2">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="py-2 px-4 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2 px-5 bg-blue text-white rounded-xl text-xs font-bold hover:bg-blue-dark transition disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Apply Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
