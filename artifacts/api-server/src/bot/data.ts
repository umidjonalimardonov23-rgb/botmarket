export interface BotProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  emoji: string;
  features: string[];
  popular?: boolean;
}

export const BOT_CATALOG: BotProduct[] = [
  {
    id: "online_shop",
    name: "Online Do'kon Boti",
    emoji: "🛒",
    description: "Mahsulotlaringizni Telegram orqali soting. To'liq katalog, savat va buyurtma tizimi.",
    price: 50000,
    features: ["Mahsulot katalogi", "Savat tizimi", "Buyurtma qabul", "Admin panel", "To'lov tizimi"],
    popular: true,
  },
  {
    id: "order_bot",
    name: "Buyurtma Qabul Boti",
    emoji: "📋",
    description: "Mijozlardan buyurtma qabul qiling, admin ga xabar boring. Restoran, yetkazib berish uchun ideal.",
    price: 50000,
    features: ["Buyurtma qabul", "Admin xabarlari", "Holatni kuzatish", "Mijoz tarix"],
  },
  {
    id: "taxi_bot",
    name: "Taksi Boti",
    emoji: "🚕",
    description: "Taksi xizmati uchun professional bot. Haydovchilar va mijozlarni bog'laydi.",
    price: 80000,
    features: ["Marshrut tizimi", "Haydovchi panel", "Narx hisoblash", "GPS integratsiya", "To'lov tizimi"],
    popular: true,
  },
  {
    id: "food_delivery",
    name: "Ovqat Yetkazish Boti",
    emoji: "🍕",
    description: "Ovqat yetkazib berish xizmati uchun to'liq bot. Menyu, buyurtma va yetkazish tizimi.",
    price: 70000,
    features: ["Menyu katalogi", "Buyurtma tizimi", "Yetkazish kuzatuv", "To'lov tizimi", "Reyting tizimi"],
  },
  {
    id: "education_bot",
    name: "Ta'lim va Kurslar Boti",
    emoji: "📚",
    description: "Online kurslar, darslar va ta'lim materiallari uchun professional bot.",
    price: 60000,
    features: ["Kurs katalogi", "Dars materiallari", "Test tizimi", "Sertifikat", "To'lov tizimi"],
  },
  {
    id: "restaurant_bot",
    name: "Restoran Boti",
    emoji: "🍽️",
    description: "Restoran uchun to'liq bot. Stol bron qilish, menyu va buyurtma tizimi.",
    price: 65000,
    features: ["Menyu", "Stol bron", "Buyurtma qabul", "Admin panel", "Reklama tizimi"],
  },
  {
    id: "trading_bot",
    name: "Savdo va Biznes Boti",
    emoji: "💰",
    description: "Biznesingizni avtomatlashtiradigan universal savdo boti.",
    price: 55000,
    features: ["Mahsulot katalogi", "Narx taklif", "Mijoz CRM", "Hisobot", "Xabar yuborish"],
  },
  {
    id: "news_bot",
    name: "Yangiliklar Kanali Boti",
    emoji: "📰",
    description: "Yangiliklar va kontent kanali uchun avtomatik bot. Post rejalash va statistika.",
    price: 45000,
    features: ["Post rejalash", "Statistika", "Obuna tizimi", "Auto post", "Ko'p kanal"],
  },
  {
    id: "survey_bot",
    name: "Anketa va Ovoz Boti",
    emoji: "📊",
    description: "So'rovnoma, anketa va ovoz berish uchun professional bot.",
    price: 50000,
    features: ["Anketa yaratish", "Natijalar", "Eksport Excel", "Anonimlik", "Reyting"],
  },
  {
    id: "custom_bot",
    name: "Maxsus Bot",
    emoji: "⭐",
    description: "Sizning ehtiyojlaringizga moslashtirilgan maxsus bot. Narx va funksiyalar kelishiladi.",
    price: 0,
    features: ["Har qanday funksiya", "Maxsus dizayn", "API integratsiya", "24/7 qo'llab-quvvatlash", "Cheksiz imkoniyatlar"],
    popular: true,
  },
];

export function getBotById(id: string): BotProduct | undefined {
  return BOT_CATALOG.find((b) => b.id === id);
}

export function formatPrice(price: number): string {
  if (price === 0) return "Kelishiladi";
  return price.toLocaleString("uz-UZ") + " so'm/oy";
}
