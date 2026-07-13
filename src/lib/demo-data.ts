export const townLocations = [
  "Dunkwa-on-Offin",
  "Jukwa",
  "Ayanfuri",
  "Diaso",
  "Obuasi",
  "Cape Coast",
  "Kumasi",
];

export const townCoordinates: Record<string, { latitude: number; longitude: number }> = {
  "Dunkwa-on-Offin": { latitude: 5.9678765, longitude: -1.7873448 },
  Jukwa: { latitude: 5.2577781, longitude: -1.3388004 },
  Ayanfuri: { latitude: 5.9602024, longitude: -1.8951464 },
  Diaso: { latitude: 6.153129, longitude: -2.153013 },
  Obuasi: { latitude: 6.211542, longitude: -1.6894045 },
  "Cape Coast": { latitude: 5.1080932, longitude: -1.2417103 },
  Kumasi: { latitude: 6.6985605, longitude: -1.6233086 },
};

export const demoCategories = [
  {
    id: "cat-phones",
    name: "Phones & Tablets",
    slug: "phones-tablets",
    description: "Smartphones, tablets, chargers, cases, and accessories.",
    icon: "Smartphone",
  },
  {
    id: "cat-electronics",
    name: "Electronics",
    slug: "electronics",
    description: "TVs, laptops, audio gear, appliances, and gadgets.",
    icon: "Laptop",
  },
  {
    id: "cat-fashion",
    name: "Fashion",
    slug: "fashion",
    description: "Clothing, shoes, bags, watches, and local style finds.",
    icon: "Shirt",
  },
  {
    id: "cat-vehicles",
    name: "Vehicles",
    slug: "vehicles",
    description: "Cars, motorbikes, tricycles, parts, and repairs.",
    icon: "Car",
  },
  {
    id: "cat-real-estate",
    name: "Real Estate",
    slug: "real-estate",
    description: "Rooms, houses, shops, land, and short stays.",
    icon: "Home",
  },
  {
    id: "cat-home",
    name: "Home & Furniture",
    slug: "home-furniture",
    description: "Beds, sofas, kitchen items, decor, and household goods.",
    icon: "Armchair",
  },
  {
    id: "cat-health",
    name: "Health & Beauty",
    slug: "health-beauty",
    description: "Beauty products, hair care, wellness, and personal care.",
    icon: "Sparkles",
  },
  {
    id: "cat-jobs",
    name: "Jobs & Services",
    slug: "jobs-services",
    description: "Local services, skilled workers, openings, and gigs.",
    icon: "BriefcaseBusiness",
  },
  {
    id: "cat-food",
    name: "Food & Groceries",
    slug: "food-groceries",
    description: "Groceries, prepared food, drinks, and market supplies.",
    icon: "ShoppingBasket",
  },
  {
    id: "cat-building",
    name: "Building Materials",
    slug: "building-materials",
    description: "Cement, roofing, tools, plumbing, and building supplies.",
    icon: "Hammer",
  },
  {
    id: "cat-farm",
    name: "Farm Products",
    slug: "farm-products",
    description: "Fresh produce, livestock, seeds, tools, and inputs.",
    icon: "Wheat",
  },
  {
    id: "cat-other",
    name: "Other",
    slug: "other",
    description: "Everything useful that does not fit anywhere else.",
    icon: "Package",
  },
  {
    id: "cat-events",
    name: "Events",
    slug: "events",
    description: "Weddings, funerals, church programs, concerts, and community events.",
    icon: "CalendarDays",
  },
  {
    id: "cat-property",
    name: "Property",
    slug: "property",
    description: "Houses, land, shops, apartments, and commercial spaces.",
    icon: "Building2",
  },
  {
    id: "cat-professional-services",
    name: "Professional Services",
    slug: "professional-services",
    description: "Plumbers, electricians, barbers, hairdressers, mechanics, carpenters, painters, and tutors.",
    icon: "Wrench",
  },
  {
    id: "cat-emergency-delivery",
    name: "Emergency Delivery",
    slug: "emergency-delivery",
    description: "Documents, parcels, medicines, groceries, and urgent local delivery requests.",
    icon: "Truck",
  },
];

export const demoStores = [
  {
    id: "store-1",
    name: "Offin Digital Hub",
    slug: "offin-digital-hub",
    description:
      "Phones, laptop accessories, and reliable device support around Dunkwa market.",
    phone: "+233 24 410 1198",
    location: "Dunkwa-on-Offin",
    logoUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=300&q=80",
    coverUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    isVerified: true,
    owner: {
      id: "seller-1",
      name: "Kojo Mensah",
      email: "seller@shoplinkk.com",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    },
  },
  {
    id: "store-2",
    name: "Nana Ama Home Finds",
    slug: "nana-ama-home-finds",
    description:
      "Furniture, small appliances, and tidy home pieces available for pickup or delivery discussion.",
    phone: "+233 55 320 8841",
    location: "Dunkwa-on-Offin",
    logoUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
    coverUrl:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80",
    isVerified: false,
    owner: {
      id: "seller-2",
      name: "Nana Ama Boateng",
      email: "seller2@shoplinkk.com",
      image:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
    },
  },
];

export const demoProducts = [
  {
    id: "product-1",
    title: "iPhone 13 Pro, 256GB, clean condition",
    slug: "iphone-13-pro-256gb-clean-condition",
    description:
      "Neatly used iPhone 13 Pro with strong battery, Face ID working, original display, and a free case. Buyer can inspect around Dunkwa town before paying.",
    price: 6200,
    condition: "USED",
    location: "Dunkwa-on-Offin",
    stockStatus: "AVAILABLE",
    listingStatus: "APPROVED",
    isFeatured: true,
    createdAt: "2026-07-08T11:30:00.000Z",
    category: demoCategories[0],
    store: demoStores[0],
    seller: demoStores[0].owner,
    images: [
      {
        url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
        alt: "Smartphone on a bright surface",
      },
      {
        url: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1200&q=80",
        alt: "iPhone product detail",
      },
    ],
  },
  {
    id: "product-2",
    title: "Samsung 43-inch Smart TV with wall bracket",
    slug: "samsung-43-inch-smart-tv-wall-bracket",
    description:
      "Clear display, good sound, HDMI ports working, and comes with a wall bracket. Good for a shop, room, or family hall.",
    price: 2800,
    condition: "USED",
    location: "Dunkwa-on-Offin",
    stockStatus: "AVAILABLE",
    listingStatus: "APPROVED",
    isFeatured: true,
    createdAt: "2026-07-07T16:00:00.000Z",
    category: demoCategories[1],
    store: demoStores[0],
    seller: demoStores[0].owner,
    images: [
      {
        url: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1200&q=80",
        alt: "Smart TV in a living room",
      },
    ],
  },
  {
    id: "product-3",
    title: "Modern 3-seater sofa, ash fabric",
    slug: "modern-3-seater-sofa-ash-fabric",
    description:
      "Comfortable 3-seater sofa with firm cushions. Clean, no tears, ideal for a small living room or office reception.",
    price: 1900,
    condition: "USED",
    location: "Dunkwa-on-Offin",
    stockStatus: "AVAILABLE",
    listingStatus: "APPROVED",
    isFeatured: true,
    createdAt: "2026-07-06T09:10:00.000Z",
    category: demoCategories[5],
    store: demoStores[1],
    seller: demoStores[1].owner,
    images: [
      {
        url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80",
        alt: "Modern sofa in a living room",
      },
    ],
  },
  {
    id: "product-4",
    title: "Fresh plantain bunches from farm gate",
    slug: "fresh-plantain-bunches-farm-gate",
    description:
      "Fresh plantain available in bunches. Seller can supply small food vendors and households around Dunkwa-on-Offin.",
    price: 85,
    condition: "NEW",
    location: "Ayanfuri",
    stockStatus: "AVAILABLE",
    listingStatus: "APPROVED",
    isFeatured: false,
    createdAt: "2026-07-08T08:20:00.000Z",
    category: demoCategories[10],
    store: demoStores[1],
    seller: demoStores[1].owner,
    images: [
      {
        url: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?auto=format&fit=crop&w=1200&q=80",
        alt: "Fresh plantains",
      },
    ],
  },
  {
    id: "product-5",
    title: "Registered Toyota Corolla, neat interior",
    slug: "registered-toyota-corolla-neat-interior",
    description:
      "Reliable Corolla with neat seats, cool AC, and smooth drive. Inspection preferred before any purchase discussion.",
    price: 87500,
    condition: "USED",
    location: "Obuasi",
    stockStatus: "AVAILABLE",
    listingStatus: "APPROVED",
    isFeatured: false,
    createdAt: "2026-07-05T12:40:00.000Z",
    category: demoCategories[3],
    store: demoStores[0],
    seller: demoStores[0].owner,
    images: [
      {
        url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
        alt: "Car on the road",
      },
    ],
  },
  {
    id: "product-6",
    title: "Ladies sneakers, new arrivals",
    slug: "ladies-sneakers-new-arrivals",
    description:
      "New sneakers available in sizes 37 to 41. Buyers can chat to confirm color and size before meeting the seller.",
    price: 240,
    condition: "NEW",
    location: "Dunkwa-on-Offin",
    stockStatus: "AVAILABLE",
    listingStatus: "APPROVED",
    isFeatured: false,
    createdAt: "2026-07-04T14:15:00.000Z",
    category: demoCategories[2],
    store: demoStores[1],
    seller: demoStores[1].owner,
    images: [
      {
        url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
        alt: "Colorful sneakers",
      },
    ],
  },
];
