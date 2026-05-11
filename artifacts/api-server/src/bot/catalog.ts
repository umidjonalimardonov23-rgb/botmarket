export interface BotType {
  id: string;
  name: string;
  price: number;
  desc: string;
  emoji: string;
  features: string[];
}

export const BOT_CATALOG: BotType[] = [
  {
    id: "admin",
    name: "Admin Bot",
    emoji: "👨‍💼",
    price: 50000,
    desc: "Guruh va kanal boshqaruvi",
    features: ["Spam filter", "Kicker/Banner", "Ogohlantirish tizimi", "Statistika"],
  },
  {
    id: "channel",
    name: "Kanal Bot",
    emoji: "📢",
    price: 80000,
    desc: "Post yuborish, obuna tekshirish",
    features: ["Auto post", "Obuna tekshirish", "Content rejalashtirish", "Statistika"],
  },
  {
    id: "form",
    name: "Ariza Bot",
    emoji: "📝",
    price: 100000,
    desc: "Ma'lumot yig'ish, anketalar",
    features: ["Forma yaratish", "Javoblarni saqlash", "Excel eksport", "Admin bildirishnoma"],
  },
  {
    id: "quiz",
    name: "Quiz Bot",
    emoji: "🎓",
    price: 120000,
    desc: "Testlar va sertifikatlar",
    features: ["Ko'p tanlovli savollar", "Ball tizimi", "Sertifikat", "Reyting"],
  },
  {
    id: "shop",
    name: "Do'kon Bot",
    emoji: "🛒",
    price: 150000,
    desc: "Online savdo, katalog, to'lov",
    features: ["Mahsulot katalogi", "Savatcha", "To'lov tizimi", "Buyurtma boshqaruvi"],
  },
  {
    id: "booking",
    name: "Booking Bot",
    emoji: "📅",
    price: 150000,
    desc: "Uchrashuv va xona bron qilish",
    features: ["Kalendar", "Bron tizimi", "Eslatmalar", "Bekor qilish"],
  },
  {
    id: "delivery",
    name: "Delivery Bot",
    emoji: "🚀",
    price: 180000,
    desc: "Yetkazib berish tizimi",
    features: ["Buyurtma qabul", "Status kuzatish", "Kuryer boshqaruvi", "Xarita"],
  },
  {
    id: "game",
    name: "O'yin Bot",
    emoji: "🎮",
    price: 200000,
    desc: "Mini o'yinlar va turnirlar",
    features: ["Mini o'yinlar", "Turnir", "Reyting", "Mukofotlar"],
  },
  {
    id: "crm",
    name: "CRM Bot",
    emoji: "💼",
    price: 250000,
    desc: "Mijozlar bazasi va hisobotlar",
    features: ["Mijozlar bazasi", "Hisobotlar", "Funnel", "Avtomatlashtirish"],
  },
  {
    id: "custom",
    name: "Custom Bot",
    emoji: "⚙️",
    price: 0,
    desc: "Maxsus bot — narx kelishiladi",
    features: ["To'liq individual", "Har qanday funksiya", "Texnik yordam", "Istalgan integratsiya"],
  },
];

export function formatPrice(price: number): string {
  if (price === 0) return "Narx kelishiladi";
  return price.toLocaleString("uz-UZ") + " so'm";
}

export function getBotById(id: string): BotType | undefined {
  return BOT_CATALOG.find((b) => b.id === id);
}
