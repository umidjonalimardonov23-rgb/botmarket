import { ReactNode, useEffect } from "react";
import { BottomNav } from "./BottomNav";

export function AppLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
      const webapp = (window as any).Telegram.WebApp;
      webapp.ready();
      webapp.expand();
    }
  }, []);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col pb-20 max-w-md mx-auto overflow-x-hidden relative shadow-2xl">
      <main className="flex-1 w-full">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
