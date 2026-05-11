export const getTelegramUser = () => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    return {
      id: tg.initDataUnsafe?.user?.id?.toString() || "web_user",
      username: tg.initDataUnsafe?.user?.username || null,
      firstName: tg.initDataUnsafe?.user?.first_name || null,
      lastName: tg.initDataUnsafe?.user?.last_name || null,
    };
  }
  return {
    id: "web_user",
    username: null,
    firstName: null,
    lastName: null,
  };
};

export const initTelegramApp = () => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
  }
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        initDataUnsafe?: {
          user?: {
            id: number;
            username?: string;
            first_name?: string;
            last_name?: string;
          };
        };
      };
    };
  }
}
