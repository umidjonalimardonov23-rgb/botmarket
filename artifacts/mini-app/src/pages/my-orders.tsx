import { Layout } from "@/components/layout";
import { useListOrders } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import { getTelegramUser } from "@/lib/telegram";
import { motion } from "framer-motion";
import { Clock, CheckCircle2, PlayCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

const statusConfig = {
  pending: { label: "Kutilmoqda", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: Clock },
  confirmed: { label: "Tasdiqlandi", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: CheckCircle2 },
  in_progress: { label: "Jarayonda", color: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: PlayCircle },
  completed: { label: "Tugallandi", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle2 },
  cancelled: { label: "Bekor qilindi", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
};

export default function MyOrders() {
  const { data: orders, isLoading } = useListOrders();
  const tgUser = getTelegramUser();

  // In a real app we'd filter by tgUser.id on the backend, 
  // but here we filter on frontend for the mockup if needed.
  // Assuming listOrders returns all for admin, or just user's for regular user.
  const myOrders = orders?.filter(o => o.telegramId === tgUser.id) || orders || [];

  return (
    <Layout>
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold tracking-tight mb-6">Mening buyurtmalarim</h1>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : myOrders.length === 0 ? (
          <div className="text-center py-20 bg-card/20 rounded-xl border border-dashed border-border p-6">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-1">Buyurtmalar yo'q</h3>
            <p className="text-sm text-muted-foreground">Siz hali hech qanday bot buyurtma qilmadingiz.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myOrders.map((order, index) => {
              const config = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = config.icon;
              
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-card/40 backdrop-blur border-border/50 overflow-hidden">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0 bg-muted/10">
                      <div className="font-semibold">{order.botTypeName}</div>
                      <Badge variant="outline" className={`${config.color} flex items-center gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Buyurtma ID:</span>
                        <span className="font-mono">#{order.id.toString().padStart(4, '0')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Sana:</span>
                        <span>{format(new Date(order.createdAt), "dd.MM.yyyy HH:mm")}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Summa:</span>
                        <span className="font-bold text-primary">{formatPrice(order.totalPrice)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
