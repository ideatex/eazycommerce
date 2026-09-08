"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  actionGetOrganizations,
  actionGetRelationships,
  actionUpdateOrgStatus,
  actionCreateRelationship,
  actionGetAuditLogs,
} from "@/actions/vanigamActions";
import {
  VanigamOrganization,
  VanigamRelationship,
} from "@/lib/b2b2c/mockVanigamData";
import { AuditLogEntry } from "@/services/auditAndNotificationService";
import { useWorkspace } from "@/context/WorkspaceContext";
import toast from "react-hot-toast";

export default function BusinessManagementView() {
  const { currentWorkspace, isPlatformAdmin } = useWorkspace();
  const [organizations, setOrganizations] = useState<VanigamOrganization[]>([]);
  const [relationships, setRelationships] = useState<VanigamRelationship[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"organizations" | "relationships" | "audit_logs">("organizations");

  // New Relationship Form
  const [sourceOrg, setSourceOrg] = useState("");
  const [targetOrg, setTargetOrg] = useState("");
  const [relType, setRelType] = useState<VanigamRelationship["relationshipType"]>("SUPPLIES");
  const [creditLimit, setCreditLimit] = useState(100000);
  const [paymentTerms, setPaymentTerms] = useState("Net 30 Days");

  const fetchBusinessData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedOrgs, fetchedRels, fetchedLogs] = await Promise.all([
        actionGetOrganizations(),
        actionGetRelationships(),
        actionGetAuditLogs(),
      ]);
      setOrganizations(fetchedOrgs || []);
      setRelationships(fetchedRels || []);
      setAuditLogs(fetchedLogs || []);
      if (fetchedOrgs && fetchedOrgs.length >= 2) {
        if (!sourceOrg) setSourceOrg(fetchedOrgs[1]?.id || fetchedOrgs[0]?.id || "");
        if (!targetOrg) setTargetOrg(fetchedOrgs[2]?.id || fetchedOrgs[1]?.id || "");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load organizations & relationships");
    } finally {
      setIsLoading(false);
    }
  }, [sourceOrg, targetOrg]);

  useEffect(() => {
    fetchBusinessData();
  }, [fetchBusinessData]);

  const filteredOrgs = organizations.filter((o) => {
    const matchesType = filterType === "ALL" || o.organizationType === filterType;
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      o.name.toLowerCase().includes(q) ||
      o.legalName.toLowerCase().includes(q) ||
      o.taxIdentificationNumber.toLowerCase().includes(q) ||
      (o.city && o.city.toLowerCase().includes(q)) ||
      (o.email && o.email.toLowerCase().includes(q));
    return matchesType && matchesStatus && matchesSearch;
  });

  const handleStatusChange = async (id: string, newStatus: VanigamOrganization["status"]) => {
    try {
      const updated = await actionUpdateOrgStatus(id, newStatus);
      if (updated) {
        setOrganizations((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
        toast.success(`Organization status updated to ${newStatus}`);
        const refreshedLogs = await actionGetAuditLogs();
        setAuditLogs(refreshedLogs || []);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status: Requires Platform Super Admin.");
    }
  };

  const handleCreateRelationship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceOrg || !targetOrg || sourceOrg === targetOrg) {
      toast.error("Source and Target organizations must be selected and different.");
      return;
    }

    setIsSubmitting(true);
    try {
      await actionCreateRelationship(sourceOrg, targetOrg, relType, creditLimit, paymentTerms);
      toast.success("B2B Supply Relationship created successfully!");
      await fetchBusinessData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create relationship.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportOrgsCSV = () => {
    const headers = ["ID", "Name", "Legal Name", "Tier", "Tax ID", "Location", "Status", "Currency"];
    const rows = filteredOrgs.map((o) => [
      o.id,
      o.name,
      o.legalName,
      o.organizationType,
      o.taxIdentificationNumber,
      `${o.city || ""}, ${o.country}`,
      o.status,
      o.currency,
    ]);
    const content = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `enterprises-directory-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Enterprises directory exported to CSV!");
  };

  if (!isPlatformAdmin) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto my-12 bg-white p-8 rounded-2xl border border-amber-200 shadow-xs text-center">
        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xl mx-auto">
          ⚠️
        </div>
        <h2 className="text-xl font-bold text-dark">Platform Super Admin Privilege Required</h2>
        <p className="text-sm text-gray-600">
          Global Business Governance and KYC network topologies are strictly governed by Platform Super Administrators.
          You are currently viewing workspace <strong>{currentWorkspace.name}</strong> ({currentWorkspace.organizationType}).
        </p>
        <p className="text-xs text-gray-400">
          Switch to <strong>VANIGAM Platform Operations</strong> in the active workspace switcher to access this module.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue border border-blue-100">
              Platform Governance
            </span>
            <span className="text-xs text-gray-400 font-medium">{organizations.length} Verified Enterprises</span>
          </div>
          <h1 className="text-2xl font-extrabold text-dark">Business Governance & KYC</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage verified manufacturers, distributors, authorized sellers, supply chain topologies, and audit trails.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBusinessData}
            disabled={isLoading}
            className="py-2.5 px-4 bg-gray-1 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-2 transition border border-gray-3 flex items-center gap-1.5"
            title="Refresh business data"
          >
            <span className={isLoading ? "animate-spin" : ""}>🔄</span> Refresh
          </button>
          <button
            onClick={handleExportOrgsCSV}
            className="py-2.5 px-4 bg-white text-dark rounded-xl text-xs font-bold hover:bg-gray-1 transition border border-gray-3 flex items-center gap-1.5"
          >
            ⬇ Export CSV
          </button>
          <Link
            href="/onboarding"
            className="py-2.5 px-5 bg-blue text-white rounded-xl text-xs font-bold hover:bg-blue-dark transition shadow-sm self-start sm:self-auto"
          >
            + Register Enterprise
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-3 gap-6 bg-white px-6 pt-3 rounded-t-2xl shadow-xs">
        <button
          onClick={() => setActiveTab("organizations")}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === "organizations" ? "border-blue text-blue" : "border-transparent text-gray-500 hover:text-dark"
          }`}
        >
          Organizations
          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{filteredOrgs.length}</span>
        </button>
        <button
          onClick={() => setActiveTab("relationships")}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === "relationships" ? "border-blue text-blue" : "border-transparent text-gray-500 hover:text-dark"
          }`}
        >
          Supply Chain Relationships
          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{relationships.length}</span>
        </button>
        <button
          onClick={() => setActiveTab("audit_logs")}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === "audit_logs" ? "border-blue text-blue" : "border-transparent text-gray-500 hover:text-dark"
          }`}
        >
          Audit Trail & Compliance
          <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue font-bold">{auditLogs.length}</span>
        </button>
      </div>

      {/* TAB 1: ORGANIZATIONS DIRECTORY */}
      {activeTab === "organizations" && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-3 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full relative">
              <input
                type="text"
                placeholder="Search organizations by name, legal entity, tax ID, or city..."
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

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 px-3 border border-gray-3 rounded-lg text-xs font-semibold text-dark bg-white focus:outline-none focus:border-blue"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>

              <div className="flex flex-wrap gap-1">
                {["ALL", "MANUFACTURER", "SUPPLIER", "DISTRIBUTOR", "SELLER"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition ${
                      filterType === type
                        ? "bg-dark text-white"
                        : "bg-gray-1 border border-gray-3 text-gray-600 hover:bg-gray-2"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-3 overflow-hidden shadow-xs">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-12 bg-gray-2 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filteredOrgs.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                No organizations match &quot;{searchQuery}&quot; with current filters.
              </div>
            ) : (
              <>
                {/* Mobile Card Layout (< 768px) */}
                <div className="block md:hidden divide-y divide-gray-2">
                  {filteredOrgs.map((org) => (
                    <div key={org.id} className="p-4 space-y-3 bg-white">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-dark text-sm">{org.name}</div>
                          <div className="text-xs text-gray-400">{org.legalName}</div>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                            org.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-700"
                              : org.status === "PENDING_VERIFICATION"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {org.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-gray-1 p-2.5 rounded-xl">
                        <div>
                          <span className="text-gray-400 block text-[10px] uppercase font-bold">Tier / Model</span>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-white text-dark inline-block mt-0.5 border border-gray-2">
                            {org.organizationType}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px] uppercase font-bold">Location</span>
                          <span className="text-gray-700 font-medium block truncate mt-0.5">
                            {org.city ? `${org.city}, ` : ""}{org.country}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs font-mono text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-2 flex justify-between items-center">
                        <span className="text-gray-400 text-[10px]">TAX ID:</span>
                        <span className="font-bold">{org.taxIdentificationNumber}</span>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-1">
                        {org.status === "PENDING_VERIFICATION" && (
                          <button
                            onClick={() => handleStatusChange(org.id, "ACTIVE")}
                            className="w-full py-2.5 px-3 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition min-h-[40px]"
                          >
                            Approve KYC
                          </button>
                        )}
                        {org.status === "ACTIVE" && org.organizationType !== "PLATFORM" && (
                          <button
                            onClick={() => handleStatusChange(org.id, "SUSPENDED")}
                            className="w-full py-2.5 px-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition min-h-[40px]"
                          >
                            Suspend Organization
                          </button>
                        )}
                        {org.status === "SUSPENDED" && (
                          <button
                            onClick={() => handleStatusChange(org.id, "ACTIVE")}
                            className="w-full py-2.5 px-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition min-h-[40px]"
                          >
                            Reactivate Organization
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table (>= 768px) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-gray-2 bg-gray-2/50 text-xs uppercase tracking-wider font-semibold text-gray-500">
                        <th className="py-4 px-6">Business Name</th>
                        <th className="py-4 px-4">Tier / Model</th>
                        <th className="py-4 px-4">Tax ID / Reg</th>
                        <th className="py-4 px-4">Location</th>
                        <th className="py-4 px-4">Status</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-2">
                      {filteredOrgs.map((org) => (
                        <tr key={org.id} className="hover:bg-gray-1/50 transition">
                          <td className="py-4 px-6">
                            <div>
                              <div className="font-bold text-dark">{org.name}</div>
                              <div className="text-xs text-gray-400">{org.legalName}</div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-gray-2 text-dark">
                              {org.organizationType}
                            </span>
                          </td>

                          <td className="py-4 px-4 font-mono text-xs text-gray-600">
                            <div>{org.taxIdentificationNumber}</div>
                            <div className="text-[10px] text-gray-400">{org.registrationNumber}</div>
                          </td>

                          <td className="py-4 px-4 text-xs text-gray-600">
                            {org.city ? `${org.city}, ` : ""}
                            {org.country}
                          </td>

                          <td className="py-4 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                org.status === "ACTIVE"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : org.status === "PENDING_VERIFICATION"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {org.status}
                            </span>
                          </td>

                          <td className="py-4 px-6 text-right space-x-2">
                            {org.status === "PENDING_VERIFICATION" && (
                              <button
                                onClick={() => handleStatusChange(org.id, "ACTIVE")}
                                className="py-1 px-3 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition"
                              >
                                Approve KYC
                              </button>
                            )}
                            {org.status === "ACTIVE" && org.organizationType !== "PLATFORM" && (
                              <button
                                onClick={() => handleStatusChange(org.id, "SUSPENDED")}
                                className="py-1 px-3 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition"
                              >
                                Suspend
                              </button>
                            )}
                            {org.status === "SUSPENDED" && (
                              <button
                                onClick={() => handleStatusChange(org.id, "ACTIVE")}
                                className="py-1 px-3 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition"
                              >
                                Reactivate
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SUPPLY CHAIN RELATIONSHIPS */}
      {activeTab === "relationships" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Relationship Form */}
          <div className="bg-white p-6 rounded-2xl border border-gray-3 shadow-xs h-fit">
            <h2 className="text-base font-bold text-dark mb-1">Establish Supply Chain Link</h2>
            <p className="text-xs text-gray-500 mb-4">
              Authorize B2B procurement agreements, wholesale terms, and credit limits between enterprises.
            </p>

            <form onSubmit={handleCreateRelationship} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-dark mb-1">Upstream Supplier / Manufacturer</label>
                <select
                  value={sourceOrg}
                  onChange={(e) => setSourceOrg(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-3 rounded-lg text-xs text-dark focus:outline-none focus:border-blue bg-white"
                >
                  {organizations
                    .filter((o) => o.organizationType === "MANUFACTURER" || o.organizationType === "SUPPLIER" || o.organizationType === "DISTRIBUTOR")
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.organizationType})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-dark mb-1">Downstream Buyer / Distributor</label>
                <select
                  value={targetOrg}
                  onChange={(e) => setTargetOrg(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-3 rounded-lg text-xs text-dark focus:outline-none focus:border-blue bg-white"
                >
                  {organizations
                    .filter((o) => o.organizationType === "DISTRIBUTOR" || o.organizationType === "SELLER" || o.organizationType === "RETAILER")
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.organizationType})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-dark mb-1">Agreement Model</label>
                <select
                  value={relType}
                  onChange={(e) => setRelType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-3 rounded-lg text-xs text-dark focus:outline-none focus:border-blue bg-white"
                >
                  <option value="SUPPLIES">SUPPLIES (Direct Manufacturing Wholesale)</option>
                  <option value="DISTRIBUTES">DISTRIBUTES (Authorized Regional Hub)</option>
                  <option value="WHOLESALES">WHOLESALES (Merchant Inventory Reselling)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-dark mb-1">Revolving Credit Limit ($)</label>
                <input
                  type="number"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-3 rounded-lg text-xs text-dark focus:outline-none focus:border-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-dark mb-1">Commercial Payment Terms</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-3 rounded-lg text-xs text-dark focus:outline-none focus:border-blue bg-white"
                >
                  <option value="Net 15 Days">Net 15 Days</option>
                  <option value="Net 30 Days">Net 30 Days</option>
                  <option value="Net 45 Days">Net 45 Days</option>
                  <option value="Net 60 Days">Net 60 Days</option>
                  <option value="Advance Payment / COD">Advance Payment / COD</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-blue text-white font-bold text-xs rounded-xl hover:bg-blue-dark transition disabled:opacity-50"
              >
                {isSubmitting ? "Linking Supply Chain..." : "Authorize Partnership"}
              </button>
            </form>
          </div>

          {/* Relationships List */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-3 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-gray-2 bg-gray-2/50 font-bold text-dark text-sm">
              Active Enterprise Partnerships ({relationships.length})
            </div>

            <div className="divide-y divide-gray-2">
              {relationships.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  No supply chain relationships established yet.
                </div>
              ) : (
                relationships.map((r) => (
                  <div key={r.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-1/30 transition">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-dark text-sm">{r.sourceOrgName}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-blue/10 text-blue font-bold">
                          {r.relationshipType}
                        </span>
                        <span className="font-bold text-dark text-sm">{r.targetOrgName}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Payment Terms: <strong className="text-dark">{r.paymentTerms}</strong> • Credit Limit: <strong className="text-dark">${r.creditLimit.toLocaleString()}</strong>
                      </div>
                    </div>

                    <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ACTIVE PARTNERSHIP
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL & COMPLIANCE */}
      {activeTab === "audit_logs" && (
        <div className="bg-white rounded-2xl border border-gray-3 overflow-hidden shadow-xs space-y-4 p-6">
          <div>
            <h2 className="text-lg font-bold text-dark">Immutable System Audit Trail</h2>
            <p className="text-xs text-gray-500">
              Complete chronological audit logging capturing critical administrative actions, KYC updates, order splits, payouts, and CMS publishing events.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-2 bg-gray-50 text-xs uppercase tracking-wider font-semibold text-gray-500">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Entity Type</th>
                  <th className="py-3.5 px-4">Resource ID</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-2">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-gray-400">
                      No audit logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 text-xs font-mono text-gray-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-gray-100 text-dark">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-blue">{log.entityType}</td>
                      <td className="py-3 px-4 text-xs font-mono text-gray-600">{log.entityId}</td>
                      <td className="py-3 px-4 text-xs text-gray-700">{log.actorId || "System"}</td>
                      <td className="py-3 px-4 text-xs text-gray-500 max-w-xs truncate">
                        {log.details ? JSON.stringify(log.details) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
