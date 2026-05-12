import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useListBots, useListCategories } from "@workspace/api-client-react";
import { useSearch } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Search, Star, Shield, Crown, TrendingUp, ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useTelegramBack } from "@/hooks/use-telegram-back";

function isEmojiIcon(icon: string) {
  return /^\p{Emoji}/u.test(icon);
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return String(n);
}

export default function BotsList() {
  const { t } = useLanguage();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(params.get("category") || "");

  useTelegramBack("/");

  const { data: categories } = useListCategories();
  const { data: bots, isLoading } = useListBots({
    search: search || undefined,
    category: selectedCategory || undefined,
  });

  return (
    <div className="flex flex-col h-[100dvh]">
      {/* Sticky header */}
      <div className="bg-background/95 backdrop-blur-md z-10 px-4 pt-4 pb-3 border-b border-border sticky top-0">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/">
            <button className="w-9 h-9 flex items-center justify-center bg-muted rounded-full shrink-0">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-xl font-bold">{t("catalog")}</h1>
        </div>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("search")}
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          <button
            onClick={() => setSelectedCategory("")}
            className={cn("px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0", selectedCategory === "" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}
          >
            {t("all")}
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn("px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1 transition-colors shrink-0", selectedCategory === cat.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-28 flex flex-col gap-2.5">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
        ) : !bots || bots.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <span className="text-4xl block mb-3">🔍</span>
            <p>Bot topilmadi</p>
          </div>
        ) : (
          bots.map((bot, i) => (
            <motion.div
              key={bot.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link href={`/bots/${bot.id}`}>
                <div className="bg-card border border-border p-3.5 rounded-2xl flex gap-3 active:scale-[0.98] transition-transform shadow-sm">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                    {isEmojiIcon(bot.icon) ? (
                      <span className="text-3xl">{bot.icon}</span>
                    ) : (
                      <img src={bot.icon} alt={bot.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="font-bold text-sm truncate">{bot.name}</span>
                      {bot.isVerified && <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                      {bot.isPremium && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mb-1.5">@{bot.username}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-0.5 text-xs font-medium">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {bot.rating.toFixed(1)}
                      </span>
                      {bot.subscribers && bot.subscribers > 0 ? (
                        <span className="flex items-center gap-0.5 text-xs text-green-600 font-medium">
                          <TrendingUp className="w-3 h-3" />
                          {formatNum(bot.subscribers)}
                        </span>
                      ) : null}
                      <span className="bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded text-[10px] font-medium">{bot.category}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
