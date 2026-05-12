import { useParams } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { useTelegramBack } from "@/hooks/use-telegram-back";
import {
  useGetBot,
  useListBotReviews,
  useCreateBotReview,
  getGetBotQueryKey,
  getListBotReviewsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/rating";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Star, Users, ExternalLink, Shield, Crown, TrendingUp, MessageCircle } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useTelegramUser } from "@/hooks/use-telegram-user";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

function safeDate(val: string): string {
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("uz-UZ", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function isEmojiIcon(icon: string) {
  return /^\p{Emoji}/u.test(icon);
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return String(n);
}

const LANG_FLAGS: Record<string, string> = { uz: "🇺🇿", en: "🇬🇧", ru: "🇷🇺" };

export default function BotDetail() {
  const { id } = useParams<{ id: string }>();
  const botId = parseInt(id || "0", 10);
  const { t } = useLanguage();
  const user = useTelegramUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useTelegramBack("/bots");

  const { data: bot, isLoading } = useGetBot(botId, { query: { queryKey: getGetBotQueryKey(botId) } });
  const { data: reviews, isLoading: loadingReviews } = useListBotReviews(botId, { query: { queryKey: getListBotReviewsQueryKey(botId) } });
  const createReview = useCreateBotReview();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    createReview.mutate(
      { id: botId, data: { botId, rating, comment, authorName: user.fullName, authorAvatar: user.photoUrl ?? null } },
      {
        onSuccess: () => {
          toast({ title: t("reviews") + " ✓" });
          setComment("");
          setRating(5);
          queryClient.invalidateQueries({ queryKey: getGetBotQueryKey(botId) });
          queryClient.invalidateQueries({ queryKey: getListBotReviewsQueryKey(botId) });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-44 rounded-3xl w-full" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (!bot) return (
    <div className="flex flex-col items-center justify-center h-60 text-muted-foreground">
      <span className="text-4xl mb-3">🤖</span>
      <p>Bot topilmadi</p>
      <Link href="/bots"><Button className="mt-4" variant="outline">Orqaga</Button></Link>
    </div>
  );

  return (
    <div className="pb-28">
      {/* Hero banner */}
      <div className="h-44 bg-gradient-to-br from-primary/40 via-primary/20 to-transparent relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-primary/20" />
        <div className="absolute -bottom-4 right-12 w-20 h-20 rounded-full bg-primary/10" />
        <Link href="/bots" className="absolute top-4 left-4 w-9 h-9 bg-background/60 backdrop-blur-md rounded-full flex items-center justify-center z-10">
          <ChevronLeft className="w-5 h-5" />
        </Link>
      </div>

      <div className="px-4 -mt-14 relative z-10">
        {/* Icon & launch */}
        <div className="flex justify-between items-end mb-4">
          <div className="w-20 h-20 rounded-2xl bg-card border-4 border-background shadow-xl flex items-center justify-center overflow-hidden">
            {isEmojiIcon(bot.icon) ? (
              <span className="text-4xl">{bot.icon}</span>
            ) : (
              <img src={bot.icon} alt={bot.name} className="w-full h-full object-cover" />
            )}
          </div>
          <a href={`https://t.me/${bot.username}`} target="_blank" rel="noreferrer">
            <Button className="rounded-full gap-2 px-5 shadow-lg shadow-primary/30">
              {t("bots")} <ExternalLink className="w-4 h-4" />
            </Button>
          </a>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Name */}
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-xl font-bold">{bot.name}</h1>
            {bot.isVerified && <Shield className="w-4 h-4 text-blue-500 shrink-0" />}
            {bot.isPremium && <Crown className="w-4 h-4 text-amber-500 shrink-0" />}
          </div>
          <p className="text-muted-foreground text-sm mb-3">@{bot.username}</p>

          {/* Stats chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 px-3 py-1.5 rounded-full text-sm font-medium">
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              {bot.rating.toFixed(1)}
            </div>
            <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-600 px-3 py-1.5 rounded-full text-sm font-medium">
              <MessageCircle className="w-3.5 h-3.5" />
              {bot.reviewCount} {t("reviews")}
            </div>
            {bot.subscribers && bot.subscribers > 0 ? (
              <div className="flex items-center gap-1.5 bg-green-500/10 text-green-600 px-3 py-1.5 rounded-full text-sm font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                {formatNum(bot.subscribers)} {t("totalUsers")}
              </div>
            ) : null}
          </div>

          {/* Description */}
          <div className="bg-card border border-border p-4 rounded-2xl mb-4 text-sm leading-relaxed">
            {bot.description}
          </div>

          {/* Languages */}
          <div className="flex gap-2 mb-6">
            {bot.languages.map((lang) => (
              <span key={lang} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                {LANG_FLAGS[lang] || "🌐"} {lang.toUpperCase()}
              </span>
            ))}
            <Badge variant="outline" className="rounded-full text-xs">{bot.category}</Badge>
          </div>

          {/* Reviews */}
          <h2 className="text-base font-bold mb-3">{t("reviews")} ({bot.reviewCount})</h2>

          {/* Leave review */}
          <form onSubmit={handleSubmit} className="bg-card border border-border p-4 rounded-2xl mb-4 flex flex-col gap-3">
            <p className="text-sm font-medium">{t("leaveReview")}</p>
            <Rating value={rating} onChange={setRating} size="lg" />
            <Textarea
              placeholder={t("leaveReview")}
              className="resize-none bg-background text-sm"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
            <Button type="submit" size="sm" disabled={createReview.isPending || !comment.trim()} className="self-end">
              {t("submit")}
            </Button>
          </form>

          {/* Reviews list */}
          <div className="flex flex-col gap-3">
            {loadingReviews ? (
              Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
            ) : !reviews || reviews.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">Hali izoh yo'q. Birinchi bo'ling!</p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="bg-card border border-border p-3 rounded-2xl">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                        {r.authorName?.[0] || "U"}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{r.authorName}</p>
                        <p className="text-xs text-muted-foreground">{safeDate(r.createdAt)}</p>
                      </div>
                    </div>
                    <Rating value={r.rating} readOnly size="sm" />
                  </div>
                  <p className="text-sm text-foreground/90 pl-10">{r.comment}</p>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
