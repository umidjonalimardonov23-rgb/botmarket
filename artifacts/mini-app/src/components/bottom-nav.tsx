import { Link, useLocation } from "wouter";
import { Home, Grid, ListOrdered, Share2, CreditCard } from "lucide-react";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: "Asosiy" },
    { href: "/catalog", icon: Grid, label: "Katalog" },
    { href: "/my-orders", icon: ListOrdered, label: "Buyurtmalar" },
    { href: "/referral", icon: Share2, label: "Referral" },
    { href: "/payment", icon: CreditCard, label: "To'lov" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border pb-safe">
      <div className="flex items-center justify-around h-16 px-4">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex-1 flex flex-col items-center justify-center h-full gap-1 text-muted-foreground hover:text-primary transition-colors">
              <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
              <span className={`text-[10px] ${isActive ? "text-primary font-medium" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
