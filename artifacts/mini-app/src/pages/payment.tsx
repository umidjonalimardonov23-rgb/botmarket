import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Copy, CheckCircle2, ShieldCheck, Server } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/format";

export default function Payment() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const cardNumber = "9860606760806673";
  const formattedCardNumber = "9860 6067 6080 6673";
  const cardHolder = "Alimardonov Umidjon";
  const serverPrice = 50000;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cardNumber);
      setCopied(true);
      toast({
        title: "Nusxa olindi!",
        description: "Karta raqami nusxalandi.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({ variant: "destructive", title: "Xatolik" });
    }
  };

  return (
    <Layout>
      <div className="p-4 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight mb-2">To'lov ma'lumotlari</h1>
        
        {/* Credit Card UI */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 text-white shadow-xl shadow-purple-500/20">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 space-y-8">
            <div className="flex justify-between items-center">
              <CreditCard className="w-8 h-8 opacity-80" />
              <div className="font-bold italic text-lg opacity-80">HUMO</div>
            </div>
            
            <div className="space-y-1">
              <div className="font-mono text-2xl tracking-widest drop-shadow-md">
                {formattedCardNumber}
              </div>
            </div>
            
            <div className="flex justify-between items-end">
              <div>
                <div className="text-[10px] uppercase tracking-wider opacity-70 mb-1">Karta egasi</div>
                <div className="font-medium tracking-wide uppercase drop-shadow-md">{cardHolder}</div>
              </div>
            </div>
          </div>
        </div>

        <Button onClick={handleCopy} className="w-full" variant="outline">
          {copied ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
          Karta raqamini nusxalash
        </Button>

        <Card className="bg-card/40 backdrop-blur border-border/50">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-border/30">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Server to'lovi</h3>
                <p className="text-sm text-muted-foreground">Oylik xizmat ko'rsatish</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">To'lov summasi:</span>
              <span className="font-bold text-lg text-primary">{formatPrice(serverPrice)}</span>
            </div>
            
            <div className="bg-muted/30 p-3 rounded-lg text-sm flex gap-3 text-muted-foreground border border-border/30">
              <ShieldCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <p>
                To'lovni amalga oshirganingizdan so'ng, chekni skrinshot qilib qo'llab-quvvatlash xizmatiga yuboring.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
