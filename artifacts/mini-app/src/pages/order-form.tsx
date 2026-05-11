import { Layout } from "@/components/layout";
import { useGetBotType, useCreateOrder } from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { getTelegramUser } from "@/lib/telegram";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { getGetOrderQueryKey } from "@workspace/api-client-react"; // Import query keys to invalidate

const orderSchema = z.object({
  clientName: z.string().min(2, "Ism kamida 2 ta harfdan iborat bo'lishi kerak"),
  clientPhone: z.string().min(9, "Telefon raqam noto'g'ri kiritildi"),
  notes: z.string().optional(),
});

export default function OrderForm() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const botId = parseInt(id || "0", 10);
  const { data: bot, isLoading: isLoadingBot } = useGetBotType(botId, {
    query: { enabled: !!botId }
  });
  
  const createOrder = useCreateOrder();
  
  const form = useForm<z.infer<typeof orderSchema>>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      clientName: "",
      clientPhone: "+998",
      notes: "",
    },
  });

  const onSubmit = (values: z.infer<typeof orderSchema>) => {
    if (!bot) return;
    
    const tgUser = getTelegramUser();
    
    // Extract referral code from initDataStartParam if available
    let referralCode = null;
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const startParam = window.Telegram.WebApp.initDataUnsafe?.start_param;
      if (startParam && startParam.startsWith("ref_")) {
        referralCode = startParam;
      }
    }
    
    createOrder.mutate({
      data: {
        botTypeId: bot.id,
        clientName: values.clientName,
        clientPhone: values.clientPhone,
        telegramId: tgUser.id,
        telegramUsername: tgUser.username,
        notes: values.notes,
        referralCode: referralCode,
      }
    }, {
      onSuccess: (order) => {
        toast({
          title: "Buyurtma qabul qilindi!",
          description: "Tez orada siz bilan bog'lanamiz.",
        });
        setLocation("/my-orders");
      },
      onError: () => {
        toast({
          title: "Xatolik yuz berdi",
          description: "Iltimos qaytadan urinib ko'ring.",
          variant: "destructive"
        });
      }
    });
  };

  if (isLoadingBot) {
    return (
      <Layout showNav={false}>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!bot) {
    return (
      <Layout showNav={false}>
        <div className="p-4 text-center mt-20">
          <p>Bot topilmadi</p>
          <Link href="/catalog">
            <Button className="mt-4">Orqaga qaytish</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showNav={false}>
      <div className="p-4 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/catalog">
            <Button variant="ghost" size="icon" className="rounded-full bg-muted/50">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Buyurtmani rasmiylashtirish</h1>
        </div>

        <Card className="bg-card/40 backdrop-blur border-border/50 overflow-hidden">
          <div className="bg-primary/10 p-4 border-b border-border/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{bot.emoji}</span>
              <h2 className="font-semibold text-lg">{bot.name}</h2>
            </div>
            <div className="text-2xl font-bold text-primary">{formatPrice(bot.price)}</div>
          </div>
          <CardContent className="p-4">
            <h3 className="font-medium mb-2 text-sm text-muted-foreground">Sizga taqdim etiladi:</h3>
            <ul className="space-y-2">
              {bot.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ism va Familiya</FormLabel>
                  <FormControl>
                    <Input placeholder="Ali Valiyev" className="bg-background/50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="clientPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefon raqam</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+998 90 123 45 67" className="bg-background/50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Qo'shimcha izoh (ixtiyoriy)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Biznesingiz haqida qisqacha yoki qo'shimcha talablar..." 
                      className="resize-none bg-background/50 h-24" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/25 mt-6"
              disabled={createOrder.isPending}
            >
              {createOrder.isPending ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Yuborilmoqda...</>
              ) : (
                "Buyurtmani tasdiqlash"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </Layout>
  );
}
