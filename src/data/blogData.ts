export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  category: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  publishedAt: string;
  readTime: string;
  tags: string[];
  content: string[];
}

export const blogPosts: BlogPost[] = [
  {
    id: "blog-1",
    title: "10 Essential Gadgets That Will Revolutionize Your Work From Home Setup",
    slug: "10-essential-gadgets-work-from-home",
    excerpt: "Discover the cutting-edge workspace peripherals and tech essentials designed to boost productivity and comfort.",
    coverImage: "/images/blog/blog-1.png",
    category: "Technology",
    author: {
      name: "Alex Morgan",
      avatar: "/images/users/user-01.png",
      role: "Tech Editor",
    },
    publishedAt: "February 24, 2026",
    readTime: "5 min read",
    tags: ["Productivity", "DeskSetup", "Hardware", "SmartWork"],
    content: [
      "In the modern remote work era, having an ergonomic and tech-forward workspace is not just a luxury—it's essential for sustained health and focus.",
      "From dual-motor standing desks and ultrawide color-calibrated monitors to electromagnetic mice and studio-grade noise-canceling headsets, small hardware improvements compound into massive productivity gains.",
      "Investing in high quality lighting like monitor lightbars reduces eye fatigue during late night coding and creative design sessions.",
    ],
  },
  {
    id: "blog-2",
    title: "How to Choose the Perfect Smartwatch for Fitness and Daily Productivity",
    slug: "choose-perfect-smartwatch-fitness-productivity",
    excerpt: "A comprehensive buyer guide exploring battery life, sensor accuracy, health tracking, and smartphone compatibility.",
    coverImage: "/images/blog/blog-2.png",
    category: "Wearables",
    author: {
      name: "Sophia Chen",
      avatar: "/images/users/user-02.png",
      role: "Health & Fitness Reviewer",
    },
    publishedAt: "February 20, 2026",
    readTime: "7 min read",
    tags: ["Smartwatch", "Fitness", "Apple", "Wearables"],
    content: [
      "Smartwatches have matured from notification screens into vital health companions equipped with ECG sensors, blood oxygen tracking, and precision dual-frequency GPS.",
      "When selecting a wearable, determine your primary use case: if you are training for endurance marathons, titanium durability and multi-day battery are paramount.",
      "Ensure seamless ecosystem integration with your primary phone operating system to make full use of contactless payments and smart home controls.",
    ],
  },
  {
    id: "blog-3",
    title: "The Ultimate Comparison: Mechanical Keyboards vs Ergonomic Keyboards",
    slug: "mechanical-vs-ergonomic-keyboards",
    excerpt: "Delve into switch types, tactile feedback, split layouts, and wrist ergonomics to find your dream typing experience.",
    coverImage: "/images/blog/blog-3.png",
    category: "Accessories",
    author: {
      name: "David Kim",
      avatar: "/images/users/user-03.png",
      role: "Hardware Specialist",
    },
    publishedAt: "February 15, 2026",
    readTime: "6 min read",
    tags: ["Keyboards", "Ergonomics", "Setup", "Tech"],
    content: [
      "Typing comfort is directly linked to hand alignment and repetitive strain prevention. Hot-swappable mechanical switches let you tune acoustic pitch and actuation force.",
      "Split ergonomic keyboards keep your shoulders opened and wrists in a neutral handshake posture, dramatically diminishing forearm tension.",
      "Explore customized keycaps and wireless multi-pairing to elevate your workstation aesthetic and daily workflow.",
    ],
  },
  {
    id: "blog-4",
    title: "Why Wi-Fi 6 and Mesh Networking Are Essential for Smart Homes in 2026",
    slug: "wifi-6-mesh-networking-smart-homes",
    excerpt: "Say goodbye to dead zones and streaming buffers with modern high-bandwidth mesh routing protocols.",
    coverImage: "/images/blog/blog-4.png",
    category: "Networking",
    author: {
      name: "Marcus Vance",
      avatar: "/images/users/user-01.png",
      role: "Network Architect",
    },
    publishedAt: "February 10, 2026",
    readTime: "4 min read",
    tags: ["Networking", "WiFi6", "SmartHome", "Streaming"],
    content: [
      "As the number of household connected gadgets exceeds dozens—from 4K cameras and smart speakers to laptops and gaming consoles—traditional routers struggle with channel congestion.",
      "Wi-Fi 6 OFDMA and beamforming allocate distinct frequency channels to dozens of devices concurrently, eliminating packet drops.",
    ],
  },
  {
    id: "blog-5",
    title: "Top 5 Mobile Photography Tips to Shoot Studio Quality Photos with Your Phone",
    slug: "top-mobile-photography-tips-phone",
    excerpt: "Master composition, lighting, RAW processing, and portrait mode to capture breathtaking photography on the go.",
    coverImage: "/images/blog/blog-5.png",
    category: "Mobile",
    author: {
      name: "Elena Rostova",
      avatar: "/images/users/user-02.png",
      role: "Visual Creator",
    },
    publishedAt: "January 28, 2026",
    readTime: "8 min read",
    tags: ["Photography", "Mobile", "Creative", "iPhone"],
    content: [
      "Today's computational photography engines rival entry-level mirrorless cameras. Understanding natural lighting and leading lines creates instant cinematic depth.",
      "Always clean your camera lens, lock exposure on the subject, and leverage golden hour backlighting for naturally warm tones.",
    ],
  },
  {
    id: "blog-6",
    title: "Sustainable Electronics: How Eco-Friendly Tech is Shaping the Future",
    slug: "sustainable-electronics-eco-friendly-tech",
    excerpt: "How tech manufacturers are adopting recycled aluminum, modular repairability, and renewable packaging.",
    coverImage: "/images/blog/blog-6.png",
    category: "Eco Tech",
    author: {
      name: "Alex Morgan",
      avatar: "/images/users/user-01.png",
      role: "Sustainability Editor",
    },
    publishedAt: "January 19, 2026",
    readTime: "5 min read",
    tags: ["Sustainability", "GreenTech", "Hardware", "Future"],
    content: [
      "Eco-conscious consumers are driving demand for repairable, circular electronics made from recycled rare earth elements and ocean-bound plastics.",
      "Prolonging gadget lifespans through modular battery swaps and lifetime software support reduces global e-waste exponentially.",
    ],
  },
];

export const blogCategories = [
  { name: "All Topics", count: 6 },
  { name: "Technology", count: 2 },
  { name: "Wearables", count: 1 },
  { name: "Accessories", count: 1 },
  { name: "Networking", count: 1 },
  { name: "Mobile", count: 1 },
];
