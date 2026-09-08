export interface VanigamOrganization {
  id: string;
  name: string;
  slug: string;
  legalName: string;
  organizationType:
    | "PLATFORM"
    | "MANUFACTURER"
    | "SUPPLIER"
    | "BRAND"
    | "DISTRIBUTOR"
    | "WHOLESALER"
    | "DEALER"
    | "RETAILER"
    | "SELLER"
    | "FULFILLMENT_PARTNER";
  status: "ACTIVE" | "PENDING_VERIFICATION" | "SUSPENDED" | "INACTIVE";
  email: string;
  phone: string;
  website: string;
  taxIdentificationNumber: string;
  registrationNumber: string;
  logo: string;
  description: string;
  currency: string;
  country: string;
  city: string;
  state: string;
  createdAt: string;
}

export interface VanigamRelationship {
  id: string;
  sourceOrgId: string;
  sourceOrgName: string;
  targetOrgId: string;
  targetOrgName: string;
  relationshipType: "SUPPLIES" | "DISTRIBUTES" | "RESELLS" | "AUTHORIZED_SELLER" | "FULFILLS" | "PARTNERS_WITH";
  status: "ACTIVE" | "PENDING" | "REJECTED" | "TERMINATED";
  creditLimit: number;
  paymentTerms: string;
  startedAt: string;
}

export interface VanigamProductOffer {
  id: string;
  organizationId: string;
  organizationName: string;
  productId: string;
  productTitle: string;
  productImage?: string;
  sku: string;
  sellingPrice: number;
  costPrice: number;
  wholesalePrice: number;
  minimumOrderQuantity: number;
  stockQuantity: number;
  leadTimeDays: number;
  isMarketplaceLive: boolean;
  status: "ACTIVE" | "PAUSED" | "DRAFT";
}

export interface VanigamB2BOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  buyerId: string;
  buyerName: string;
  items: {
    productId: string;
    productTitle: string;
    sku: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentTerms: string;
  status:
    | "DRAFT"
    | "SUBMITTED"
    | "PENDING_APPROVAL"
    | "APPROVED"
    | "REJECTED"
    | "PROCESSING"
    | "PARTIALLY_FULFILLED"
    | "FULFILLED"
    | "SHIPPED"
    | "DELIVERED"
    | "RECEIVED"
    | "CANCELLED";
  createdAt: string;
}

export interface VanigamBusinessOrder {
  id: string;
  businessOrderNo: string;
  masterOrderId: string;
  sellerOrgId: string;
  sellerOrgName: string;
  customerName: string;
  customerEmail: string;
  items: {
    productId?: string;
    productTitle: string;
    sku: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
  }[];
  subtotal: number;
  shippingCost: number;
  commissionRate: number;
  commissionAmount: number;
  payoutAmount: number;
  totalAmount: number;
  status: "CREATED" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURNED";
  carrier?: string;
  trackingNumber?: string;
  returnRequested?: boolean;
  returnReason?: string;
  returnStatus?: string;
  createdAt: string;
}

export interface VanigamCommissionRule {
  id: string;
  name: string;
  organizationId: string | null;
  organizationName: string;
  type: "PERCENTAGE" | "FIXED" | "HYBRID";
  percentageRate: number;
  fixedFee: number;
  category: string;
  isActive: boolean;
}

export interface VanigamSettlement {
  id: string;
  settlementNo: string;
  organizationId: string;
  organizationName: string;
  grossSales: number;
  commissionFee: number;
  netPayout: number;
  status: "PENDING" | "ELIGIBLE" | "PROCESSING" | "PAID";
  period: string;
  payoutDate: string | null;
  paidAt?: string;
  adjustments?: number;
  notes?: string;
}

export const initialOrganizations: VanigamOrganization[] = [
  {
    id: "org-platform",
    name: "VANIGAM Global Platform",
    slug: "platform",
    legalName: "Vanigam Commerce Technologies Inc.",
    organizationType: "PLATFORM",
    status: "ACTIVE",
    email: "admin@vanigam.com",
    phone: "+1 (800) 555-0100",
    website: "https://vanigam.com",
    taxIdentificationNumber: "TAX-US-98102931",
    registrationNumber: "CORP-DEL-2026-89",
    logo: "/images/logo/logo.svg",
    description: "Platform headquarters managing B2B2C governance, commissions, KYC, and dispute resolution.",
    currency: "USD",
    country: "US",
    city: "San Francisco",
    state: "CA",
    createdAt: "2026-01-01",
  },
  {
    id: "org-mfg-techflow",
    name: "TechFlow Electronics",
    slug: "techflow-mfg",
    legalName: "TechFlow Manufacturing Corporation",
    organizationType: "MANUFACTURER",
    status: "ACTIVE",
    email: "supplier@techflow.com",
    phone: "+1 (555) 438-9201",
    website: "https://techflow-mfg.example.com",
    taxIdentificationNumber: "TAX-US-44910283",
    registrationNumber: "MFG-NV-2024-112",
    logo: "/images/sellers/sellers-01.png",
    description: "Direct tier-1 manufacturer of high-precision input controllers, PC networking hardware, and audio gear.",
    currency: "USD",
    country: "US",
    city: "Reno",
    state: "NV",
    createdAt: "2026-01-10",
  },
  {
    id: "org-mfg-apex",
    name: "Apex SmartWear Co.",
    slug: "apex-smartwear",
    legalName: "Apex Wearable Dynamics LLC",
    organizationType: "SUPPLIER",
    status: "ACTIVE",
    email: "partner@apexsmartwear.com",
    phone: "+1 (555) 892-1133",
    website: "https://apexsmartwear.example.com",
    taxIdentificationNumber: "TAX-US-77819234",
    registrationNumber: "LLC-OR-2025-442",
    logo: "/images/sellers/sellers-02.png",
    description: "Specialist designer and supplier of rugged titanium wearables, biometric bands, and fitness sensors.",
    currency: "USD",
    country: "US",
    city: "Portland",
    state: "OR",
    createdAt: "2026-01-15",
  },
  {
    id: "org-dist-globallink",
    name: "Global Link Distribution",
    slug: "global-link-dist",
    legalName: "Global Link Logistics & Distribution Inc.",
    organizationType: "DISTRIBUTOR",
    status: "ACTIVE",
    email: "distributor@apex.com",
    phone: "+1 (555) 773-8822",
    website: "https://globallinkdist.example.com",
    taxIdentificationNumber: "TAX-US-66192844",
    registrationNumber: "DIST-IL-2023-99",
    logo: "/images/sellers/sellers-03.png",
    description: "Authorized regional tech distributor managing wholesale stocking, credit lines, and rapid B2B deliveries.",
    currency: "USD",
    country: "US",
    city: "Chicago",
    state: "IL",
    createdAt: "2026-01-20",
  },
  {
    id: "org-seller-velocity",
    name: "Velocity Tech Store",
    slug: "velocity-tech",
    legalName: "Velocity Retail Enterprises",
    organizationType: "SELLER",
    status: "ACTIVE",
    email: "contact@velocitytech.example.com",
    phone: "+1 (555) 321-9988",
    website: "https://velocitytech.example.com",
    taxIdentificationNumber: "TAX-US-33829102",
    registrationNumber: "RET-TX-2025-502",
    logo: "/images/sellers/sellers-04.png",
    description: "Premier consumer electronics retailer offering verified warrantied gear with 24-hour dispatch.",
    currency: "USD",
    country: "US",
    city: "Austin",
    state: "TX",
    createdAt: "2026-02-01",
  },
];

export const initialRelationships: VanigamRelationship[] = [
  {
    id: "rel-1",
    sourceOrgId: "org-mfg-techflow",
    sourceOrgName: "TechFlow Electronics",
    targetOrgId: "org-dist-globallink",
    targetOrgName: "Global Link Distribution",
    relationshipType: "SUPPLIES",
    status: "ACTIVE",
    creditLimit: 250000,
    paymentTerms: "Net 45 Days",
    startedAt: "2026-01-22",
  },
  {
    id: "rel-2",
    sourceOrgId: "org-mfg-apex",
    sourceOrgName: "Apex SmartWear Co.",
    targetOrgId: "org-dist-globallink",
    targetOrgName: "Global Link Distribution",
    relationshipType: "SUPPLIES",
    status: "ACTIVE",
    creditLimit: 150000,
    paymentTerms: "Net 30 Days",
    startedAt: "2026-01-25",
  },
  {
    id: "rel-3",
    sourceOrgId: "org-dist-globallink",
    sourceOrgName: "Global Link Distribution",
    targetOrgId: "org-seller-velocity",
    targetOrgName: "Velocity Tech Store",
    relationshipType: "DISTRIBUTES",
    status: "ACTIVE",
    creditLimit: 50000,
    paymentTerms: "Net 15 Days",
    startedAt: "2026-02-05",
  },
];

export const initialProductOffers: VanigamProductOffer[] = [
  {
    id: "offer-1",
    organizationId: "org-seller-velocity",
    organizationName: "Velocity Tech Store",
    productId: "prod-1",
    productTitle: "Havit HV-G69 USB Gamepad",
    productImage: "/images/products/product-1-bg-1.png",
    sku: "HV-G69-BLK",
    sellingPrice: 29.0,
    costPrice: 18.0,
    wholesalePrice: 22.0,
    minimumOrderQuantity: 1,
    stockQuantity: 140,
    leadTimeDays: 1,
    isMarketplaceLive: true,
    status: "ACTIVE",
  },
  {
    id: "offer-2",
    organizationId: "org-dist-globallink",
    organizationName: "Global Link Distribution",
    productId: "prod-1",
    productTitle: "Havit HV-G69 USB Gamepad (B2B Lot)",
    productImage: "/images/products/product-1-bg-1.png",
    sku: "HV-G69-LOT20",
    sellingPrice: 22.0,
    costPrice: 15.0,
    wholesalePrice: 19.5,
    minimumOrderQuantity: 20,
    stockQuantity: 1200,
    leadTimeDays: 3,
    isMarketplaceLive: false,
    status: "ACTIVE",
  },
  {
    id: "offer-3",
    organizationId: "org-seller-velocity",
    organizationName: "Velocity Tech Store",
    productId: "prod-5",
    productTitle: "Apple Watch Ultra Titanium",
    productImage: "/images/products/product-5-bg-1.png",
    sku: "AW-ULTRA-49-ORG",
    sellingPrice: 729.0,
    costPrice: 610.0,
    wholesalePrice: 650.0,
    minimumOrderQuantity: 1,
    stockQuantity: 35,
    leadTimeDays: 1,
    isMarketplaceLive: true,
    status: "ACTIVE",
  },
  {
    id: "offer-4",
    organizationId: "org-seller-velocity",
    organizationName: "Velocity Tech Store",
    productId: "prod-6",
    productTitle: "Logitech MX Master 3S Wireless Mouse",
    productImage: "/images/products/product-6-bg-1.png",
    sku: "LOGI-MXM3S-GRY",
    sellingPrice: 79.0,
    costPrice: 52.0,
    wholesalePrice: 60.0,
    minimumOrderQuantity: 1,
    stockQuantity: 88,
    leadTimeDays: 1,
    isMarketplaceLive: true,
    status: "ACTIVE",
  },
];

export const initialB2BOrders: VanigamB2BOrder[] = [
  {
    id: "po-1001",
    poNumber: "PO-2026-0089",
    supplierId: "org-mfg-techflow",
    supplierName: "TechFlow Electronics",
    buyerId: "org-dist-globallink",
    buyerName: "Global Link Distribution",
    items: [
      {
        productId: "prod-1",
        productTitle: "Havit HV-G69 USB Gamepad",
        sku: "HV-G69-BLK",
        unitPrice: 15.0,
        quantity: 500,
        lineTotal: 7500.0,
      },
      {
        productId: "prod-8",
        productTitle: "Asus RT Dual Band Wi-Fi 6 Router",
        sku: "ASUS-RT-AX3000",
        unitPrice: 75.0,
        quantity: 100,
        lineTotal: 7500.0,
      },
    ],
    subtotal: 15000.0,
    taxAmount: 750.0,
    totalAmount: 15750.0,
    paymentTerms: "Net 45 Days",
    status: "APPROVED",
    createdAt: "2026-02-18",
  },
  {
    id: "po-1002",
    poNumber: "PO-2026-0104",
    supplierId: "org-dist-globallink",
    supplierName: "Global Link Distribution",
    buyerId: "org-seller-velocity",
    buyerName: "Velocity Tech Store",
    items: [
      {
        productId: "prod-1",
        productTitle: "Havit HV-G69 USB Gamepad",
        sku: "HV-G69-BLK",
        unitPrice: 19.5,
        quantity: 50,
        lineTotal: 975.0,
      },
    ],
    subtotal: 975.0,
    taxAmount: 48.75,
    totalAmount: 1023.75,
    paymentTerms: "Net 15 Days",
    status: "PROCESSING",
    createdAt: "2026-02-24",
  },
];

export const initialBusinessOrders: VanigamBusinessOrder[] = [
  {
    id: "bo-89101",
    businessOrderNo: "ORD-2026-901-A",
    masterOrderId: "mo-1001",
    sellerOrgId: "org-seller-velocity",
    sellerOrgName: "Velocity Tech Store",
    customerName: "John Anderson",
    customerEmail: "john.anderson@example.com",
    items: [
      {
        productTitle: "Havit HV-G69 USB Gamepad",
        sku: "HV-G69-BLK",
        unitPrice: 29.0,
        quantity: 2,
        totalPrice: 58.0,
      },
      {
        productTitle: "Logitech MX Master 3S Wireless Mouse",
        sku: "LOGI-MXM3S-GRY",
        unitPrice: 79.0,
        quantity: 1,
        totalPrice: 79.0,
      },
    ],
    subtotal: 137.0,
    shippingCost: 9.99,
    commissionRate: 8.0,
    commissionAmount: 10.96,
    payoutAmount: 136.03,
    totalAmount: 146.99,
    status: "PROCESSING",
    createdAt: "2026-02-28",
  },
  {
    id: "bo-89102",
    businessOrderNo: "ORD-2026-901-B",
    masterOrderId: "mo-1001",
    sellerOrgId: "org-mfg-apex",
    sellerOrgName: "Apex SmartWear Co.",
    customerName: "John Anderson",
    customerEmail: "john.anderson@example.com",
    items: [
      {
        productTitle: "Apex Titan Pulse Titanium Smartwatch",
        sku: "APX-TITAN-01",
        unitPrice: 299.0,
        quantity: 1,
        totalPrice: 299.0,
      },
    ],
    subtotal: 299.0,
    shippingCost: 0.0,
    commissionRate: 8.0,
    commissionAmount: 23.92,
    payoutAmount: 275.08,
    totalAmount: 299.0,
    status: "DELIVERED",
    createdAt: "2026-02-28",
  },
];

export const initialCommissionRules: VanigamCommissionRule[] = [
  {
    id: "comm-1",
    name: "Standard Marketplace Rate",
    organizationId: null,
    organizationName: "Global Default",
    type: "PERCENTAGE",
    percentageRate: 8.0,
    fixedFee: 0,
    category: "All",
    isActive: true,
  },
  {
    id: "comm-2",
    name: "Consumer Electronics Special",
    organizationId: null,
    organizationName: "Global Default",
    type: "HYBRID",
    percentageRate: 6.0,
    fixedFee: 1.5,
    category: "Electronics",
    isActive: true,
  },
];

export const initialSettlements: VanigamSettlement[] = [
  {
    id: "set-101",
    settlementNo: "SET-2026-02-A",
    organizationId: "org-seller-velocity",
    organizationName: "Velocity Tech Store",
    grossSales: 8420.0,
    commissionFee: 673.6,
    netPayout: 7746.4,
    status: "ELIGIBLE",
    period: "Feb 1 - Feb 15, 2026",
    payoutDate: null,
  },
  {
    id: "set-102",
    settlementNo: "SET-2026-01-B",
    organizationId: "org-seller-velocity",
    organizationName: "Velocity Tech Store",
    grossSales: 12150.0,
    commissionFee: 972.0,
    netPayout: 11178.0,
    status: "PAID",
    period: "Jan 16 - Jan 31, 2026",
    payoutDate: "2026-02-03",
  },
];
