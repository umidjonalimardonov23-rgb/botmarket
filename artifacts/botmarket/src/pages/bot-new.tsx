import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useCreateBot, useListCategories, getListBotsQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useTelegramBack } from "@/hooks/use-telegram-back";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Bot, Send } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

const LANG_OPTIONS = [
  { id: "uz", flag: "🇺🇿", label: "O'zbek" },
  { id: "ru", flag: "🇷🇺", label: "Русский" },
  { id: "en", flag: "🇬🇧", label: "English" },
];

export default function BotNew() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categories } = useListCategories();
  const createBot = useCreateBot();

  useTelegramBack("/bots");

  const [form, setForm] = useState({ name: "", username: "", description: "", category: "", icon: "🤖", languages: ["uz", "ru"] });

  const toggleLang = (id: string) => {
    setForm((f) => ({
      ...f,
      languages: f.languages.includes(id) ? f.languages.filter((l) => l !== id) : [...f.languages, id],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category) { toast({ title: "Kategoriya tanlang", variant: "destructive" }); return; }
    if (form.languages.length === 0) { toast({ title: "Kamida 1 til tanlang", variant: "destructive" }); return; }
    createBot.mutate(
      { data: { ...form, isPremium: false, isVerified: false, subscribers: 0 } },
      {
        onSuccess: () => {
          toast({ title: "Bot muvaffaqiyatli qo'shildi! ✅" });
          queryClient.invalidateQueries({ queryKey: getListBotsQueryKey() });
          setLocation("/bots");
        },
        onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="pb-28">
      <div className="px-4 pt-4 pb-3 flex items-center gap-3 bg-background/95 backdrop-blur-md sticky top-0 z-10 border-b border-border">
        <Link href="/bots">
          <button className="w-9 h-9 flex items-center justify-center bg-muted rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </Link>
        <h1 className="text-lg font-bold">{t("addBot")}</h1>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="p-4 flex flex-col gap-4"
      >
        {/* Icon preview */}
        <div className="flex justify-center py-2">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
            <span className="text-4xl">{form.icon || "🤖"}</span>
          </div>
        </div>

        {/* Icon */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-medium">Icon (emoji)</Label>
          <input
            type="text"
            maxLength={4}
            placeholder="🤖"
            className="w-full px-3 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
          />
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-medium">{t("name")}</Label>
          <input
            required
            type="text"
            placeholder="Masalan: ChatGPT Bot"
            className="w-full px-3 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        {/* Username */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-medium">{t("username")}</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
            <input
              required
              type="text"
              placeholder="botusername"
              className="w-full pl-8 pr-3 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-medium">{t("description")}</Label>
          <textarea
            required
            rows={3}
            placeholder="Bot nima qila oladi?"
            className="w-full px-3 py-2.5 bg-card border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-medium">Kategoriya</Label>
          <div className="grid grid-cols-2 gap-2">
            {categories?.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setForm({ ...form, category: cat.id })}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${form.category === cat.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"}`}
              >
                <span>{cat.icon}</span> {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Languages */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-medium">Tillar</Label>
          <div className="flex gap-2">
            {LANG_OPTIONS.map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => toggleLang(lang.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${form.languages.includes(lang.id) ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}
              >
                <span>{lang.flag}</span> {lang.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
          <Bot className="w-4 h-4 inline mr-1" />
          Botingiz adminga ko'rib chiqish uchun yuboriladi. Tekshirilgandan so'ng katalogda ko'rinadi.
        </div>

        <Button type="submit" size="lg" className="w-full rounded-xl gap-2 mt-2" disabled={createBot.isPending}>
          <Send className="w-4 h-4" />
          {t("submit")}
        </Button>
      </motion.form>
    </div>
  );
}
