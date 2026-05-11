import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetDashboardStats } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Bot, Users, TrendingUp, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: stats, isLoading } = useGetDashboardStats();

  return (
    <Layout>
      <div className="p-4 space-y-6">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/20 p-6 text-center"
        >
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-primary rounded-full blur-3xl opacity-20" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-purple-500 rounded-full blur-3xl opacity-20" />
          
          <div className="relative z-10 space-y-4">
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Biznesingizni <span className="text-primary">bot</span> orqali rivojlantiring
            </h1>
            <p className="text-muted-foreground text-sm">
              Professional Telegram botlar, 24/7 qo'llab-quvvatlash va yuqori sifat.
            </p>
            <Link href="/catalog" className="inline-block mt-4">
              <Button size="lg" className="w-full sm:w-auto font-semibold shadow-[0_0_20px_rgba(var(--primary)_/_0.4)]">
                Katalogga o'tish
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : stats?.totalOrders || "0+"}
                  </div>
                  <div className="text-xs text-muted-foreground">Buyurtmalar</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : stats?.totalUsers || "0+"}
                  </div>
                  <div className="text-xs text-muted-foreground">Foydalanuvchilar</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Popular Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Ommabop yo'nalishlar
            </h2>
            <Link href="/catalog" className="text-xs text-primary hover:underline">
              Barchasi
            </Link>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "savdo", name: "Savdo", emoji: "🛒", img: "/images/category-savdo.png" },
              { id: "restoran", name: "Restoran", emoji: "🍔", img: "/images/category-restoran.png" },
              { id: "taxi", name: "Taxi", emoji: "🚕", img: "/images/category-taxi.png" },
              { id: "media", name: "Media", emoji: "🎬", img: "/images/category-media.png" },
            ].map((cat, i) => (
              <Link key={cat.id} href={`/catalog?category=${cat.name}`}>
                <Card className="overflow-hidden hover:border-primary/50 transition-colors bg-card/40 backdrop-blur group cursor-pointer">
                  <div className="h-24 bg-muted relative flex items-center justify-center">
                    <img src={cat.img} alt={cat.name} className="h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <CardContent className="p-3 text-center">
                    <span className="font-medium text-sm">{cat.emoji} {cat.name}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
