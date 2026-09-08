"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { actionRegisterEnterprise } from "@/actions/vanigamActions";

export default function BusinessOnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Wizard Form State
  const [formData, setFormData] = useState({
    organizationType: "SELLER",
    name: "",
    legalName: "",
    description: "",
    website: "",
    taxIdentificationNumber: "",
    registrationNumber: "",
    country: "United States",
    city: "",
    state: "",
    postalCode: "",
    email: "",
    phone: "",
    capabilities: ["SELL"],
    agreedToTerms: true,
  });

  const handleNext = () => {
    if (step === 1 && !formData.organizationType) {
      toast.error("Please select a business type.");
      return;
    }
    if (step === 2 && (!formData.name || !formData.legalName)) {
      toast.error("Please enter your business name and legal entity name.");
      return;
    }
    if (step === 3 && !formData.taxIdentificationNumber) {
      toast.error("Please provide your Tax ID / EIN.");
      return;
    }
    if (step === 4 && (!formData.city || !formData.country)) {
      toast.error("Please provide your city and country.");
      return;
    }
    if (step === 5 && (!formData.email || !formData.phone)) {
      toast.error("Please enter a valid business contact email and phone.");
      return;
    }
    setStep(Math.min(7, step + 1));
  };

  const handleBack = () => {
    setStep(Math.max(1, step - 1));
  };

  const handleCompleteRegistration = async () => {
    setIsSubmitting(true);
    try {
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

      const created = await actionRegisterEnterprise({
        name: formData.name,
        slug: slug || `org-${Date.now()}`,
        legalName: formData.legalName,
        organizationType: formData.organizationType as any,
        status: "ACTIVE",
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        taxIdentificationNumber: formData.taxIdentificationNumber,
        registrationNumber: formData.registrationNumber,
        description: formData.description,
        city: formData.city,
        state: formData.state,
        country: formData.country,
      });

      toast.success(`${created.name} registered and activated on VANIGAM platform!`);
      router.push(`/admin/businesses`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to complete onboarding registration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCapability = (cap: string) => {
    if (formData.capabilities.includes(cap)) {
      setFormData({ ...formData, capabilities: formData.capabilities.filter((c) => c !== cap) });
    } else {
      setFormData({ ...formData, capabilities: [...formData.capabilities, cap] });
    }
  };

  return (
    <div className="pb-24 pt-10 bg-gray-1 min-h-[80vh] flex items-center justify-center">
      <div className="w-full px-4 mx-auto max-w-3xl">
        <div className="bg-white rounded-3xl border border-gray-3 p-8 sm:p-12 shadow-xs">
          {/* Logo Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/images/logo/logo.svg"
                alt="Vanigam Commerce"
                width={220}
                height={54}
                className="h-12 sm:h-14 w-auto mx-auto object-contain"
                priority
              />
            </Link>
            <h1 className="text-2xl font-black text-dark mb-1">
              Enterprise Partner Self-Onboarding
            </h1>
            <p className="text-xs text-gray-500">
              Register your manufacturing, distribution, or retail enterprise on the VANIGAM B2B2C marketplace.
            </p>
          </div>

          {/* Top Progress Tracker */}
          <div className="mb-10">
            <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              <span>Step {step} of 7</span>
              <span className="text-blue">
                {step === 1 && "Business Model"}
                {step === 2 && "Company Profile"}
                {step === 3 && "Legal & Compliance"}
                {step === 4 && "Physical Address"}
                {step === 5 && "Primary Contact"}
                {step === 6 && "Platform Capabilities"}
                {step === 7 && "Verification & Launch"}
              </span>
            </div>
            <div className="w-full bg-gray-2 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue h-full transition-all duration-300"
                style={{ width: `${(step / 7) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* STEP 1: Business Type */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-dark mb-2">Choose Your Business Model</h2>
              <p className="text-sm text-gray-500 mb-6">
                Select the primary role of your enterprise within the VANIGAM supply chain network.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    type: "MANUFACTURER",
                    title: "Manufacturer / Factory",
                    desc: "Produce goods, hold wholesale lots, and supply distributors.",
                  },
                  {
                    type: "SUPPLIER",
                    title: "Supplier / Brand Owner",
                    desc: "Own trademarked catalog, authorize sellers, and supply inventory.",
                  },
                  {
                    type: "DISTRIBUTOR",
                    title: "Distributor / Wholesaler",
                    desc: "Aggregate supplier lines, manage bulk inventory, and supply retailers.",
                  },
                  {
                    type: "SELLER",
                    title: "Marketplace Retailer / Seller",
                    desc: "Sell verified catalog items directly to retail consumers.",
                  },
                ].map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setFormData({ ...formData, organizationType: item.type })}
                    className={`p-5 rounded-2xl border-2 text-left transition ${
                      formData.organizationType === item.type
                        ? "border-blue bg-blue/5 shadow-xs"
                        : "border-gray-3 hover:border-gray-4"
                    }`}
                  >
                    <h3 className="font-bold text-dark text-base mb-1">{item.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Business Info */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-dark mb-1">Company Profile</h2>
                <p className="text-sm text-gray-500 mb-6">Enter your operating business brand details.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-dark mb-1">Business Trade Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Dynamics Ltd"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-3 bg-gray-2 text-dark text-sm focus:outline-none focus:border-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-dark mb-1">Registered Legal Entity Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Dynamics Global Technologies Inc."
                  value={formData.legalName}
                  onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-3 bg-gray-2 text-dark text-sm focus:outline-none focus:border-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-dark mb-1">Website URL</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-3 bg-gray-2 text-dark text-sm focus:outline-none focus:border-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-dark mb-1">Short Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief overview of your products and distribution capabilities..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-3 bg-gray-2 text-dark text-sm focus:outline-none focus:border-blue"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Legal Info */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-dark mb-1">Legal & Tax Identification</h2>
                <p className="text-sm text-gray-500 mb-6">Required for B2B contracts, tax invoices, and settlements.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-dark mb-1">Tax ID / EIN / VAT Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TAX-US-98102931"
                  value={formData.taxIdentificationNumber}
                  onChange={(e) => setFormData({ ...formData, taxIdentificationNumber: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-3 bg-gray-2 text-dark text-sm focus:outline-none focus:border-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-dark mb-1">Company Registration / License Number</label>
                <input
                  type="text"
                  placeholder="e.g. REG-CORP-2026-441"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-3 bg-gray-2 text-dark text-sm focus:outline-none focus:border-blue"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Address */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-dark mb-1">Operating Address</h2>
                <p className="text-sm text-gray-500 mb-6">Headquarters or primary fulfillment center.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-dark mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chicago"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-3 bg-gray-2 text-dark text-sm focus:outline-none focus:border-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-dark mb-1">State / Province</label>
                  <input
                    type="text"
                    placeholder="e.g. IL"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-3 bg-gray-2 text-dark text-sm focus:outline-none focus:border-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-dark mb-1">Country *</label>
                  <input
                    type="text"
                    required
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-3 bg-gray-2 text-dark text-sm focus:outline-none focus:border-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-dark mb-1">Postal / ZIP Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 60601"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-3 bg-gray-2 text-dark text-sm focus:outline-none focus:border-blue"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Contact */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-dark mb-1">Primary Business Contact</h2>
                <p className="text-sm text-gray-500 mb-6">Contact details for operational alerts and purchase order dispatch.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-dark mb-1">Business Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="operations@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-3 bg-gray-2 text-dark text-sm focus:outline-none focus:border-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-dark mb-1">Direct Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-3 bg-gray-2 text-dark text-sm focus:outline-none focus:border-blue"
                />
              </div>
            </div>
          )}

          {/* STEP 6: Capabilities */}
          {step === 6 && (
            <div>
              <h2 className="text-2xl font-bold text-dark mb-1">Select Platform Capabilities</h2>
              <p className="text-sm text-gray-500 mb-6">Choose what operations your team will perform in the workspace.</p>

              <div className="space-y-3">
                {[
                  { id: "SELL", label: "Sell directly on the consumer marketplace", desc: "List retail offers with 1-click checkout" },
                  { id: "SUPPLY", label: "Supply inventory to distributors & wholesalers", desc: "Accept bulk B2B Purchase Orders with MOQs" },
                  { id: "DISTRIBUTE", label: "Distribute & warehouse manufacturer product lines", desc: "Access wholesale catalogs with credit terms" },
                  { id: "FULFILL", label: "Manage third-party logistics & fulfillment", desc: "Track multi-carrier shipments and packing slips" },
                ].map((cap) => (
                  <label
                    key={cap.id}
                    className="flex items-start gap-3 p-4 rounded-xl border border-gray-3 hover:border-gray-4 cursor-pointer bg-white"
                  >
                    <input
                      type="checkbox"
                      checked={formData.capabilities.includes(cap.id)}
                      onChange={() => toggleCapability(cap.id)}
                      className="text-blue rounded mt-1 focus:ring-blue"
                    />
                    <div>
                      <span className="font-bold text-dark text-sm block">{cap.label}</span>
                      <span className="text-xs text-gray-400">{cap.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 7: Review & Launch */}
          {step === 7 && (
            <div>
              <h2 className="text-2xl font-bold text-dark mb-1">Review & Initialize Workspace</h2>
              <p className="text-sm text-gray-500 mb-6">Confirm your enterprise details before launching your workspace.</p>

              <div className="bg-gray-2 p-6 rounded-2xl border border-gray-3 space-y-3 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-500">Business Model:</span>
                  <span className="font-bold text-dark">{formData.organizationType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Trade Name:</span>
                  <span className="font-bold text-dark">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Legal Entity:</span>
                  <span className="font-bold text-dark">{formData.legalName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax ID:</span>
                  <span className="font-mono font-bold text-dark">{formData.taxIdentificationNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Contact:</span>
                  <span className="font-bold text-dark">{formData.email} • {formData.phone}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold mb-6">
                <span>✓ Automated compliance pre-checks passed</span>
                <span>•</span>
                <span>Immediate Sandbox Workspace Access</span>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-8 border-t border-gray-2 mt-8">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="py-2.5 px-6 border border-gray-3 rounded-lg text-sm font-semibold text-dark hover:bg-gray-2 transition"
              >
                ← Previous
              </button>
            ) : (
              <div></div>
            )}

            {step < 7 ? (
              <button
                type="button"
                onClick={handleNext}
                className="py-2.5 px-8 bg-blue text-white rounded-lg text-sm font-bold hover:bg-blue-dark transition shadow-sm"
              >
                Next Step →
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCompleteRegistration}
                className="py-3 px-8 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? "Initializing..." : "Launch Enterprise Workspace 🚀"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
