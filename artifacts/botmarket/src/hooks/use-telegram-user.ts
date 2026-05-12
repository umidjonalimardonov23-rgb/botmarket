export function useTelegramUser() {
  const tg = typeof window !== "undefined" ? (window as any).Telegram?.WebApp : null;
  const user = tg?.initDataUnsafe?.user;

  if (user) {
    return {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
      photoUrl: user.photo_url,
      fullName: [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username
    };
  }

  return {
    id: 1,
    firstName: "Demo",
    lastName: "User",
    username: "demouser",
    photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    fullName: "Demo User"
  };
}
