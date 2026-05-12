import { Link, useLocation } from "wouter";
import { Home, Search, User, Plus } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();
  const { t } = useLanguage();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border pb-safe">
      <div className="flex items-center justify-around h-16 px-4 max-w-md mx-auto relative">
        <Link href="/" className={cn("flex flex-col items-center justify-center w-16 h-full transition-colors", location === "/" ? "text-primary" : "text-muted-foreground")}>
          <Home className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">{t("home")}</span>
        </Link>

        <Link href="/bots" className={cn("flex flex-col items-center justify-center w-16 h-full transition-colors", location === "/bots" ? "text-primary" : "text-muted-foreground")}>
          <Search className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">{t("catalog")}</span>
        </Link>

        <div className="w-16 flex justify-center -mt-6">
          <Link href="/bots/new" className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 transform transition-transform hover:scale-105 active:scale-95">
            <Plus className="w-6 h-6" />
          </Link>
        </div>

        <Link href="/profile" className={cn("flex flex-col items-center justify-center w-16 h-full transition-colors", location === "/profile" ? "text-primary" : "text-muted-foreground")}>
          <User className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">{t("profile")}</span>
        </Link>
      </div>
    </div>
  );
}
