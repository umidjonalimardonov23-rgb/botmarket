import { useTelegramUser } from "@/hooks/use-telegram-user";
import { useLanguage } from "@/hooks/use-language";
import { useTheme } from "@/hooks/use-theme";
import { themes } from "@/lib/translations";
import { Check, Palette, Globe, Info, Lock, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useGetBotStats } from "@workspace/api-client-react";
import { useTelegramBack } from "@/hooks/use-telegram-back";
import { Link } from "wouter";

const THEME_COLORS: Record<string, string> = {
  blue: "#2563eb", purple: "#9333ea", green: "#16a34a",
  orange: "#f97316", pink: "#e11d48", navy: "#1e3a8a",
  teal: "#0f766e", red: "#dc2626",
};

export default function Profile() {
  const user = useTelegramUser();
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { data: stats } = useGetBotStats();

  useTelegramBack("/");

  return (
    <div className="pb-28 flex flex-col gap-4">
      {/* Profile hero */}
      <div className="bg-gradient-to-br from-primary via-primary/80 to-primary/50 px-4 pt-8 pb-6 flex flex-col items-center text-center relative">
        <Link href="/" className="absolute top-4 left-4 w-9 h-9 bg-white/20 backdrop-blur rounded-full flex items-center justify-center z-10">
          <ChevronLeft className="w-5 h-5 text-white" />
        </Link>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="w-20 h-20 rounded-full border-4 border-white/30 overflow-hidden bg-white/20 flex items-center justify-center mb-3">
            {user.photoUrl ? (
              <img src={user.photoUrl} alt={user.fullName} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <span className="text-white font-bold text-2xl">{user.firstName?.[0] || "U"}</span>
            )}
          </div>
          <h1 className="text-white font-bold text-xl">{user.fullName}</h1>
          <p className="text-white/70 text-sm">@{user.username}</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 mt-5 w-full">
          <div className="bg-white/15 rounded-2xl p-3 text-white text-center">
            <div className="font-bold text-xl">{stats?.totalBots ?? 0}</div>
            <div className="text-xs opacity-70">{t("totalBots")}</div>
          </div>
          <div className="bg-white/15 rounded-2xl p-3 text-white text-center">
            <div className="font-bold text-xl">{stats?.totalReviews ?? 0}</div>
            <div className="text-xs opacity-70">{t("reviews")}</div>
          </div>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-4">
        {/* Theme */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-3.5 border-b border-border flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">{t("theme")}</h2>
          </div>
          <div className="p-3.5 grid grid-cols-4 gap-2.5">
            {themes.map((th) => (
              <button
                key={th.id}
                onClick={() => setTheme(th.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all",
                  theme === th.id ? "bg-primary/10 ring-2 ring-primary/40" : "hover:bg-muted"
                )}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md" style={{ backgroundColor: THEME_COLORS[th.id] }}>
                  {theme === th.id && <Check className="w-4 h-4" />}
                </div>
                <span className="text-[9px] font-medium text-center leading-tight">{th.name.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Language */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-3.5 border-b border-border flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">{t("language")}</h2>
          </div>
          {[
            { id: "uz" as const, flag: "🇺🇿", label: "O'zbek" },
            { id: "ru" as const, flag: "🇷🇺", label: "Русский" },
            { id: "en" as const, flag: "🇬🇧", label: "English" },
          ].map((lang, i, arr) => (
            <button
              key={lang.id}
              onClick={() => setLanguage(lang.id)}
              className={cn("w-full flex items-center justify-between p-3.5 hover:bg-muted/50 transition-colors", i < arr.length - 1 && "border-b border-border")}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{lang.flag}</span>
                <span className="font-medium text-sm">{lang.label}</span>
              </div>
              {language === lang.id ? <Check className="text-primary w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />}
            </button>
          ))}
        </motion.div>

        {/* Free week info */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-sm text-green-700 mb-0.5">1 hafta bepul!</p>
            <p className="text-xs text-green-600/80">Barcha botlar bepul. 1 haftadan so'ng admin bilan bog'laning.</p>
          </div>
        </motion.div>

        {/* About */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-card border border-border rounded-2xl p-4 flex gap-3">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-sm mb-0.5">BotMarket v1.0</p>
            <p className="text-xs text-muted-foreground">O'zbekistondagi eng yaxshi Telegram bot marketplace. Botlarni toping, baholang va ulashing!</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
