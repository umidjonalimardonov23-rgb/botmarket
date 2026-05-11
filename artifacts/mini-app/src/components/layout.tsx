import { ReactNode } from "react";
import { BottomNav } from "./bottom-nav";

interface LayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export function Layout({ children, showNav = true }: LayoutProps) {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col pb-16">
      <main className="flex-1 w-full max-w-md mx-auto relative overflow-x-hidden">
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
