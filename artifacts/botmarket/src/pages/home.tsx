import { useTelegramUser } from "@/hooks/use-telegram-user";
import { useLanguage } from "@/hooks/use-language";
import {
  useGetBotStats,
  useGetFeaturedBots,
  useListCategories,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Users, Bot as BotIcon, Star, Shield, ChevronRight, TrendingUp } from "lucide-react";

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return String(n);
}

function isEmojiIcon(icon: string) {
  return /^\p{Emoji}/u.test(icon);
}

export default function Home() {
  const user = useTelegramUser();
  const { t } = useLanguage();
  const { data: stats, isLoading: loadingStats } = useGetBotStats();
  const { data: featured, isLoading: loadingFeatured } = useGetFeaturedBots();
  const { data: categories, isLoading: loadingCats } = useListCategories();

  return (
    <div className="flex flex-col gap-5 pb-28">
      {/* Hero header */}
      <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/70 px-4 pt-8 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-5"
        >
          <div className="w-12 h-12 rounded-full border-2 border-white/30 overflow-hidden bg-white/20 flex items-center justify-center shrink-0">
            {user.photoUrl ? (
              <img src={user.photoUrl} alt={user.fullName} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <span className="text-white font-bold text-lg">{user.firstName?.[0] || "U"}</span>
            )}
          </div>
          <div>
            <p className="text-white/70 text-sm">{t("greeting")}</p>
            <h2 className="text-white font-bold text-lg leading-tight">{user.fullName}</h2>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-2"
        >
          {loadingStats ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl bg-white/20" />)
          ) : (
            <>
              <div className="bg-white/15 backdrop-blur rounded-2xl p-3 text-white text-center">
                <BotIcon className="w-4 h-4 mx-auto mb-1 opacity-80" />
                <div className="font-bold text-lg leading-none">{stats?.totalBots ?? 0}</div>
                <div className="text-[10px] opacity-70 mt-0.5">{t("totalBots")}</div>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-2xl p-3 text-white text-center">
                <Users className="w-4 h-4 mx-auto mb-1 opacity-80" />
                <div className="font-bold text-lg leading-none">{formatNum(stats?.totalUsers ?? 0)}</div>
                <div className="text-[10px] opacity-70 mt-0.5">{t("totalUsers")}</div>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-2xl p-3 text-white text-center">
                <Star className="w-4 h-4 mx-auto mb-1 opacity-80" />
                <div className="font-bold text-lg leading-none">{stats?.totalReviews ?? 0}</div>
                <div className="text-[10px] opacity-70 mt-0.5">{t("reviews")}</div>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Featured bots carousel */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15 }}
        className="px-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base">{t("featured")}</h2>
          <Link href="/bots" className="text-primary text-sm font-medium flex items-center gap-0.5">
            {t("all")} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 hide-scrollbar snap-x snap-mandatory">
          {loadingFeatured
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="w-36 h-44 shrink-0 rounded-2xl" />
              ))
            : featured?.map((bot) => (
                <Link key={bot.id} href={`/bots/${bot.id}`}>
                  <motion.div
                    whileTap={{ scale: 0.96 }}
                    className="w-36 shrink-0 snap-start bg-card border border-border rounded-2xl p-3 flex flex-col items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                      {isEmojiIcon(bot.icon) ? (
                        <span className="text-3xl">{bot.icon}</span>
                      ) : (
                        <img src={bot.icon} alt={bot.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="text-center w-full">
                      <div className="font-semibold text-xs truncate flex items-center justify-center gap-1">
                        {bot.name}
                        {bot.isVerified && <Shield className="w-2.5 h-2.5 text-blue-500 shrink-0" />}
                      </div>
                      <div className="text-muted-foreground text-[10px] truncate">@{bot.username}</div>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-medium">{bot.rating.toFixed(1)}</span>
                      </div>
                      {bot.subscribers && bot.subscribers > 0 ? (
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <TrendingUp className="w-2.5 h-2.5 text-green-500" />
                          <span className="text-[10px] text-green-600 font-medium">{formatNum(bot.subscribers)}</span>
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                </Link>
              ))}
        </div>
      </motion.div>

      {/* Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base">{t("categories")}</h2>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {loadingCats
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)
            : categories?.map((cat) => (
                <Link key={cat.id} href={`/bots?category=${cat.id}`}>
                  <motion.div
                    whileTap={{ scale: 0.96 }}
                    className="bg-card border border-border p-3 rounded-2xl flex items-center gap-3 shadow-sm cursor-pointer active:scale-95 transition-transform"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xl">{cat.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{cat.name}</div>
                      <div className="text-xs text-muted-foreground">{cat.count} {t("bots").toLowerCase()}</div>
                    </div>
                  </motion.div>
                </Link>
              ))}
        </div>
      </motion.div>
    </div>
  );
}
