import { Layout } from "@/components/layout";
import { useListBots } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Check, Loader2, Sparkles } from "lucide-react";
import { useState, useMemo } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const CATEGORIES = ["Barchasi", "Savdo", "Restoran", "Taxi", "Media", "Quiz", "Crypto", "Kanal", "Custom"];

export default function Catalog() {
  const { data: bots, isLoading } = useListBots();
  const [activeCategory, setActiveCategory] = useState("Barchasi");
  const [, setLocation] = useLocation();

  const filteredBots = useMemo(() => {
    if (!bots) return [];
    if (activeCategory === "Barchasi") return bots;
    return bots.filter(bot => bot.category === activeCategory);
  }, [bots, activeCategory]);

  return (
    <Layout>
      <div className="space-y-4">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50 pt-4 pb-2 px-4 space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">Katalog</h1>
          
          <ScrollArea className="w-full whitespace-nowrap pb-2">
            <div className="flex w-max space-x-2">
              {CATEGORIES.map((cat) => (
                <Badge
                  key={cat}
                  variant={activeCategory === cat ? "default" : "outline"}
                  className="cursor-pointer px-4 py-1.5 text-sm rounded-full transition-all"
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        </div>

        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredBots.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Bu bo'limda botlar topilmadi
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredBots.map((bot, index) => (
                <motion.div
                  key={bot.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden bg-card/40 backdrop-blur border-border/50 hover:border-primary/50 transition-colors">
                    <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between gap-4 space-y-0">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{bot.emoji}</span>
                          <h3 className="font-semibold text-lg">{bot.name}</h3>
                        </div>
                        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                          {bot.category}
                        </Badge>
                      </div>
                      {bot.popular && (
                        <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-primary">
                          <Sparkles className="w-3 h-3 mr-1" /> Ommabop
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent className="p-4 py-2 space-y-4">
                      <p className="text-sm text-muted-foreground">{bot.description}</p>
                      
                      <div className="space-y-1">
                        {bot.features.slice(0, 3).map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-500 shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                        {bot.features.length > 3 && (
                          <div className="text-xs text-muted-foreground pl-6">
                            + yana {bot.features.length - 3} ta xususiyat
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-2 flex items-center justify-between bg-muted/20 border-t border-border/20 mt-2">
                      <div className="space-y-1">
                        <div className="font-bold text-lg">{formatPrice(bot.price)}</div>
                        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
                          1 hafta bepul!
                        </Badge>
                      </div>
                      <Link href={`/order/${bot.id}`}>
                        <Button className="font-semibold shadow-lg">
                          Buyurtma berish
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
