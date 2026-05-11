import { Layout } from "@/components/layout";
import { useGetReferralInfo } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTelegramUser } from "@/lib/telegram";
import { Copy, Gift, Users, Share2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Referral() {
  const tgUser = getTelegramUser();
  const refCode = `ref_${tgUser.id}`;
  const referralLink = `https://t.me/botmarket_uz_bot?start=${refCode}`;
  
  const { data: refInfo } = useGetReferralInfo(refCode, {
    query: { enabled: !!tgUser.id }
  });

  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: "Nusxa olindi!",
        description: "Havolani do'stlaringizga yuboring.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Xatolik",
        description: "Nusxa olishda xatolik yuz berdi.",
        variant: "destructive"
      });
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      const text = encodeURIComponent(`Zo'r Telegram botlar kerakmi? BotMarket'dan buyurtma bering!`);
      tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`);
    } else {
      handleCopy();
    }
  };

  return (
    <Layout>
      <div className="p-4 space-y-6">
        <div className="text-center space-y-2 mt-4">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
            <Gift className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Referal Dasturi</h1>
          <p className="text-muted-foreground text-sm max-w-[250px] mx-auto">
            Do'stlaringizni taklif qiling va har bir muvaffaqiyatli buyurtma uchun bonuslarga ega bo'ling.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-card/40 backdrop-blur border-border/50 text-center py-4">
            <div className="text-3xl font-bold text-primary mb-1">
              {refInfo?.totalReferrals || 0}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Users className="w-3 h-3" /> Taklif qilinganlar
            </div>
          </Card>
          <Card className="bg-card/40 backdrop-blur border-border/50 text-center py-4">
            <div className="text-3xl font-bold text-green-500 mb-1">
              0
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Muvaffaqiyatli
            </div>
          </Card>
        </div>

        <Card className="bg-card/40 backdrop-blur border-border/50 overflow-hidden relative">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold">Sizning referal havolangiz</h3>
            <div className="flex items-center gap-2 bg-background p-3 rounded-lg border border-border font-mono text-xs overflow-hidden relative">
              <div className="truncate flex-1">{referralLink}</div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCopy} variant="secondary" className="flex-1">
                {copied ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? "Olingan" : "Nusxa olish"}
              </Button>
              <Button onClick={handleShare} className="flex-1">
                <Share2 className="w-4 h-4 mr-2" />
                Ulashish
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3 p-4 bg-muted/20 rounded-xl border border-border/50">
          <h3 className="font-semibold text-sm">Qanday ishlaydi?</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex gap-2"><span className="text-primary font-bold">1.</span> Havolani do'stlaringiz bilan ulashing.</li>
            <li className="flex gap-2"><span className="text-primary font-bold">2.</span> Do'stingiz havola orqali kirib bot buyurtma qiladi.</li>
            <li className="flex gap-2"><span className="text-primary font-bold">3.</span> Buyurtma yakunlangach, sizga bonus hisoblanadi.</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
