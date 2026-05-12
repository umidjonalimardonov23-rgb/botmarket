import { Bot } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Star, ShieldCheck, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function BotCard({ bot }: { bot: Bot }) {
  const isEmoji = /^\p{Emoji}/u.test(bot.icon) || bot.icon.length <= 4;
  
  return (
    <Link href={`/bots/${bot.id}`}>
      <div className="bg-card border border-card-border p-4 rounded-2xl flex gap-4 active:scale-[0.98] transition-transform shadow-sm">
        <div className="w-16 h-16 rounded-xl shrink-0 bg-primary/10 flex items-center justify-center overflow-hidden">
          {isEmoji ? (
            <span className="text-3xl">{bot.icon}</span>
          ) : (
            <img src={bot.icon} alt={bot.name} className="w-full h-full object-cover" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="font-bold text-base truncate">{bot.name}</h3>
            {bot.isVerified && <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />}
            {bot.isPremium && <Crown className="w-4 h-4 text-amber-500 shrink-0" />}
          </div>
          <p className="text-sm text-muted-foreground truncate mb-2">@{bot.username}</p>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-medium">{bot.rating.toFixed(1)}</span>
            </div>
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-medium rounded-sm">
              {bot.category}
            </Badge>
          </div>
        </div>
      </div>
    </Link>
  );
}
