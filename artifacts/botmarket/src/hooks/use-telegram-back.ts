import { useEffect } from "react";
import { useLocation } from "wouter";

export function useTelegramBack(to?: string) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const tg = typeof window !== "undefined" ? (window as any).Telegram?.WebApp : null;
    if (!tg?.BackButton) return;

    const handleBack = () => {
      if (to) {
        setLocation(to);
      } else {
        history.back();
      }
    };

    tg.BackButton.show();
    tg.BackButton.onClick(handleBack);

    return () => {
      tg.BackButton.offClick(handleBack);
      tg.BackButton.hide();
    };
  }, [to, setLocation]);
}
