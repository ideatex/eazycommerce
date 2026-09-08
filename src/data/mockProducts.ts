import { Product, IProductByDetails } from "@/types/product";

export interface MockProductItem extends Product {
  category: {
    title: string;
    slug: string;
  };
  description: string;
  rating: number;
  previews: string[];
  thumbnails: string[];
  tags: string[];
  sku: string;
  additionalInfo: { name: string; description: string }[];
}

export const mockProducts: MockProductItem[] = [
  {
    id: "prod-1",
    title: "Havit HV-G69 USB Gamepad",
    slug: "havit-hv-g69-usb-gamepad",
    price: 59.0,
    discountedPrice: 29.0,
    reviews: 15,
    rating: 4.8,
    quantity: 24,
    updatedAt: new Date("2026-01-15"),
    shortDescription: "Ergonomic dual-vibration USB gamepad controller for PC and console gaming with precision triggers and non-slip grip.",
    description: "Designed for competitive and casual gamers alike, the Havit HV-G69 features high-precision analog sticks, responsive D-pad, and immersive dual vibration motors. Plug and play compatibility with Windows, Mac, and popular gaming consoles without additional driver setup.",
    category: {
      title: "Electronics",
      slug: "electronics",
    },
    sku: "HV-G69-BLK",
    tags: ["gaming", "accessories", "gamepad", "usb"],
    thumbnails: [
      "/images/products/product-1-sm-1.png",
      "/images/products/product-1-sm-2.png",
    ],
    previews: [
      "/images/products/product-1-bg-1.png",
      "/images/products/product-1-bg-2.png",
    ],
    productVariants: [
      {
        color: "Black",
        size: "Standard",
        image: "/images/products/product-1-bg-1.png",
        isDefault: true,
      },
      {
        color: "Red",
        size: "Standard",
        image: "/images/products/product-1-bg-2.png",
        isDefault: false,
      },
    ],
    additionalInfo: [
      { name: "Connectivity", description: "USB 2.0 / 3.0 Wired (1.8m Cable)" },
      { name: "Compatibility", description: "Windows 11/10/8, macOS, PS3" },
      { name: "Vibration", description: "Dual Feedback Rumble Motors" },
    ],
  },
  {
    id: "prod-2",
    title: "iPhone 14 Plus, 6/128GB",
    slug: "iphone-14-plus-6-128gb",
    price: 899.0,
    discountedPrice: 799.0,
    reviews: 24,
    rating: 4.9,
    quantity: 12,
    updatedAt: new Date("2026-01-20"),
    shortDescription: "Experience expansive viewing with the 6.7-inch Super Retina XDR display and all-day battery life with A15 Bionic chip.",
    description: "The iPhone 14 Plus brings big-screen excitement with an advanced dual-camera system, Photonic Engine for low-light photography, Crash Detection, and Emergency SOS via satellite. Packed into a durable aerospace-grade aluminum enclosure with Ceramic Shield front glass.",
    category: {
      title: "Mobile",
      slug: "mobile",
    },
    sku: "IPH14P-128-BLU",
    tags: ["apple", "iphone", "smartphone", "5g"],
    thumbnails: [
      "/images/products/product-2-sm-1.png",
      "/images/products/product-2-sm-2.png",
    ],
    previews: [
      "/images/products/product-2-bg-1.png",
      "/images/products/product-2-bg-2.png",
    ],
    productVariants: [
      {
        color: "Midnight Blue",
        size: "128GB",
        image: "/images/products/product-2-bg-1.png",
        isDefault: true,
      },
      {
        color: "Starlight",
        size: "256GB",
        image: "/images/products/product-2-bg-2.png",
        isDefault: false,
      },
    ],
    additionalInfo: [
      { name: "Display", description: "6.7-inch Super Retina XDR OLED (2778 x 1284)" },
      { name: "Processor", description: "Apple A15 Bionic chip with 5-core GPU" },
      { name: "Camera", description: "12MP Main + 12MP Ultra Wide with Action Mode" },
    ],
  },
  {
    id: "prod-3",
    title: "Apple iMac M1 24-inch 2021",
    slug: "apple-imac-m1-24-inch",
    price: 1299.0,
    discountedPrice: 1199.0,
    reviews: 18,
    rating: 4.7,
    quantity: 8,
    updatedAt: new Date("2026-01-22"),
    shortDescription: "Strikingly thin design powered by the transformative Apple M1 chip with 4.5K Retina display and studio-quality mics.",
    description: "Transform any workspace with the vibrant 24-inch 4.5K Retina display with 500 nits of brightness. Featuring a 1080p FaceTime HD camera, studio-quality three-mic array, and six-speaker sound system with Spatial Audio for an unrivaled desktop experience.",
    category: {
      title: "Computer",
      slug: "computer",
    },
    sku: "IMAC-M1-24-SLV",
    tags: ["apple", "desktop", "mac", "retina"],
    thumbnails: [
      "/images/products/product-3-sm-1.png",
      "/images/products/product-3-sm-2.png",
    ],
    previews: [
      "/images/products/product-3-bg-1.png",
      "/images/products/product-3-bg-2.png",
    ],
    productVariants: [
      {
        color: "Silver",
        size: "256GB SSD",
        image: "/images/products/product-3-bg-1.png",
        isDefault: true,
      },
      {
        color: "Blue",
        size: "512GB SSD",
        image: "/images/products/product-3-bg-2.png",
        isDefault: false,
      },
    ],
    additionalInfo: [
      { name: "Display", description: "24-inch 4.5K Retina display (4480 x 2520)" },
      { name: "Memory", description: "8GB / 16GB Unified Memory" },
      { name: "Ports", description: "2x Thunderbolt / USB 4, 3.5mm Headphone Jack" },
    ],
  },
  {
    id: "prod-4",
    title: "MacBook Air M1 chip, 8/256GB",
    slug: "macbook-air-m1-chip",
    price: 999.0,
    discountedPrice: 849.0,
    reviews: 32,
    rating: 5.0,
    quantity: 15,
    updatedAt: new Date("2026-01-25"),
    shortDescription: "The thinnest, lightest Apple notebook supercharged by M1 with silent fanless design and up to 18 hours of battery life.",
    description: "MacBook Air with M1 is incredibly fast and responsive. Effortlessly edit 4K video, compile code, and breeze through heavy multi-tasking without ever hearing a fan whisper. Features a breathtaking 13.3-inch Retina display with P3 wide color.",
    category: {
      title: "Computer",
      slug: "computer",
    },
    sku: "MBA-M1-256-GRY",
    tags: ["apple", "laptop", "macbook", "portable"],
    thumbnails: [
      "/images/products/product-4-sm-1.png",
      "/images/products/product-4-sm-2.png",
    ],
    previews: [
      "/images/products/product-4-bg-1.png",
      "/images/products/product-4-bg-2.png",
    ],
    productVariants: [
      {
        color: "Space Gray",
        size: "8GB/256GB",
        image: "/images/products/product-4-bg-1.png",
        isDefault: true,
      },
      {
        color: "Gold",
        size: "8GB/512GB",
        image: "/images/products/product-4-bg-2.png",
        isDefault: false,
      },
    ],
    additionalInfo: [
      { name: "Battery Life", description: "Up to 18 hours wireless web" },
      { name: "Weight", description: "1.29 kg (2.8 pounds)" },
      { name: "Security", description: "Touch ID sensor built into power key" },
    ],
  },
  {
    id: "prod-5",
    title: "Apple Watch Ultra Titanium",
    slug: "apple-watch-ultra-titanium",
    price: 799.0,
    discountedPrice: 729.0,
    reviews: 14,
    rating: 4.9,
    quantity: 10,
    updatedAt: new Date("2026-02-01"),
    shortDescription: "The most rugged and capable Apple Watch ever, engineered for endurance, outdoor adventure, and oceanic exploration.",
    description: "With a robust 49mm aerospace-grade titanium case, dual-frequency precision GPS, up to 36 hours of battery life, and specialized bands tailored for athletes and adventurers. Water resistant to 100 meters with certified EN13319 dive gauge capabilities.",
    category: {
      title: "Watch",
      slug: "watch",
    },
    sku: "AW-ULTRA-49-ORG",
    tags: ["apple", "smartwatch", "fitness", "gps"],
    thumbnails: [
      "/images/products/product-5-sm-1.png",
      "/images/products/product-5-sm-2.png",
    ],
    previews: [
      "/images/products/product-5-bg-1.png",
      "/images/products/product-5-bg-2.png",
    ],
    productVariants: [
      {
        color: "Orange Alpine Loop",
        size: "49mm",
        image: "/images/products/product-5-bg-1.png",
        isDefault: true,
      },
      {
        color: "Midnight Ocean Band",
        size: "49mm",
        image: "/images/products/product-5-bg-2.png",
        isDefault: false,
      },
    ],
    additionalInfo: [
      { name: "Case", description: "49mm Aerospace-Grade Titanium" },
      { name: "Display", description: "Always-On Retina display up to 2000 nits" },
      { name: "Resistance", description: "IP6X dust resistance, WR100 water resistance" },
    ],
  },
  {
    id: "prod-6",
    title: "Logitech MX Master 3S Wireless Mouse",
    slug: "logitech-mx-master-3s",
    price: 99.0,
    discountedPrice: 79.0,
    reviews: 28,
    rating: 4.8,
    quantity: 30,
    updatedAt: new Date("2026-02-05"),
    shortDescription: "Remastered ergonomic performance mouse featuring 8K DPI any-surface tracking and 90% quieter Quiet Clicks.",
    description: "Feel every moment of your workflow with even more precision and tactile tactile satisfaction. MagSpeed electromagnetic scrolling delivers 1,000 lines per second scrolling speed with pinpoint accuracy. Connect up to 3 devices across Windows and macOS via Bluetooth or Logi Bolt.",
    category: {
      title: "Accessories",
      slug: "accessories",
    },
    sku: "LOGI-MXM3S-GRY",
    tags: ["logitech", "mouse", "ergonomic", "wireless"],
    thumbnails: [
      "/images/products/product-6-sm-1.png",
      "/images/products/product-6-sm-2.png",
    ],
    previews: [
      "/images/products/product-6-bg-1.png",
      "/images/products/product-6-bg-2.png",
    ],
    productVariants: [
      {
        color: "Graphite",
        size: "Standard",
        image: "/images/products/product-6-bg-1.png",
        isDefault: true,
      },
      {
        color: "Pale Gray",
        size: "Standard",
        image: "/images/products/product-6-bg-2.png",
        isDefault: false,
      },
    ],
    additionalInfo: [
      { name: "Sensor", description: "Darkfield high precision 8000 DPI" },
      { name: "Battery", description: "Up to 70 days on a full charge via USB-C" },
      { name: "Buttons", description: "7 customizable gesture and navigation buttons" },
    ],
  },
  {
    id: "prod-7",
    title: "Apple iPad Air 5th Gen - 64GB",
    slug: "apple-ipad-air-5th-gen",
    price: 599.0,
    discountedPrice: 549.0,
    reviews: 20,
    rating: 4.7,
    quantity: 14,
    updatedAt: new Date("2026-02-08"),
    shortDescription: "Light. Bright. Full of might. Supercharged by the Apple M1 chip with 10.9-inch Liquid Retina display and Center Stage.",
    description: "Immerse yourself in whatever you are reading, watching, or creating. The 10.9-inch Liquid Retina display features advanced technologies like True Tone, P3 wide color, and an antireflective coating. Compatible with Apple Pencil (2nd gen) and Magic Keyboard.",
    category: {
      title: "Tablet",
      slug: "tablet",
    },
    sku: "IPADAIR-5-64-BLU",
    tags: ["apple", "tablet", "ipad", "m1"],
    thumbnails: [
      "/images/products/product-7-sm-1.png",
      "/images/products/product-7-sm-2.png",
    ],
    previews: [
      "/images/products/product-7-bg-1.png",
      "/images/products/product-7-bg-2.png",
    ],
    productVariants: [
      {
        color: "Blue",
        size: "64GB Wi-Fi",
        image: "/images/products/product-7-bg-1.png",
        isDefault: true,
      },
      {
        color: "Starlight",
        size: "256GB Wi-Fi",
        image: "/images/products/product-7-bg-2.png",
        isDefault: false,
      },
    ],
    additionalInfo: [
      { name: "Screen", description: "10.9-inch Liquid Retina with True Tone" },
      { name: "Chip", description: "Apple M1 with 8-core CPU and 8-core GPU" },
      { name: "Audio", description: "Landscape stereo speakers" },
    ],
  },
  {
    id: "prod-8",
    title: "Asus RT Dual Band Wi-Fi 6 Router",
    slug: "asus-rt-dual-band-router",
    price: 149.0,
    discountedPrice: 119.0,
    reviews: 11,
    rating: 4.6,
    quantity: 19,
    updatedAt: new Date("2026-02-12"),
    shortDescription: "Ultra-fast Wi-Fi 6 wireless router delivering up to 3000 Mbps speeds with AiProtection commercial-grade network security.",
    description: "The growing number of connected personal and IoT devices has led to an overall increase in network density. The Asus RT dual band router provides future-proof technologies, higher network efficiency, faster Wi-Fi speeds, greater coverage, and improved battery life for connected devices.",
    category: {
      title: "Networking",
      slug: "networking",
    },
    sku: "ASUS-RT-AX3000",
    tags: ["asus", "wifi", "router", "networking"],
    thumbnails: [
      "/images/products/product-8-sm-1.png",
      "/images/products/product-8-sm-2.png",
    ],
    previews: [
      "/images/products/product-8-bg-1.png",
      "/images/products/product-8-bg-2.png",
    ],
    productVariants: [
      {
        color: "Black",
        size: "AX3000",
        image: "/images/products/product-8-bg-1.png",
        isDefault: true,
      },
      {
        color: "White",
        size: "AX5400",
        image: "/images/products/product-8-bg-2.png",
        isDefault: false,
      },
    ],
    additionalInfo: [
      { name: "Standard", description: "Wi-Fi 6 (802.11ax) Dual Band" },
      { name: "Speed", description: "574 Mbps (2.4GHz) + 2402 Mbps (5GHz)" },
      { name: "Security", description: "AiProtection Pro powered by Trend Micro" },
    ],
  },
];

export const mockCategories = [
  { title: "All Categories", slug: "all", count: mockProducts.length },
  { title: "Electronics", slug: "electronics", count: 1 },
  { title: "Mobile", slug: "mobile", count: 1 },
  { title: "Computer", slug: "computer", count: 2 },
  { title: "Watch", slug: "watch", count: 1 },
  { title: "Accessories", slug: "accessories", count: 1 },
  { title: "Tablet", slug: "tablet", count: 1 },
  { title: "Networking", slug: "networking", count: 1 },
];
