import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Coins, Gamepad2, LogOut } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { getLocalNotices } from "../utils/localStore";

type Page = "earn" | "redeem" | "orders" | "credits";

interface NavbarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

const navItems: { id: Page; label: string }[] = [
  { id: "earn", label: "EARN" },
  { id: "redeem", label: "REDEEM" },
  { id: "orders", label: "ORDERS" },
  { id: "credits", label: "CREDITS" },
];

const READ_NOTICES_KEY = "read_notices";

function getReadNotices(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_NOTICES_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveReadNotices(set: Set<string>) {
  localStorage.setItem(READ_NOTICES_KEY, JSON.stringify([...set]));
}

function noticeId(notice: { date: bigint; title: string }): string {
  return `${notice.date.toString()}-${notice.title}`;
}

function formatNoticeDate(time: bigint): string {
  const ms = Number(time / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function Navbar({ activePage, onNavigate }: NavbarProps) {
  const { username, coinBalance, logout, isDemoMode } = useAuth();
  // Bug fix: use state + effect so notices refresh when bell opens or storage changes
  const [rawNotices, setRawNotices] = useState(() => getLocalNotices());
  const notices = rawNotices.map((n) => ({
    title: n.title,
    description: n.description,
    date: BigInt(n.date) * 1_000_000n, // ms to ns
  }));
  const [readSet, setReadSet] = useState<Set<string>>(getReadNotices);
  const [bellOpen, setBellOpen] = useState(false);

  // Re-read notices from localStorage whenever the bell opens, and also listen
  // for storage changes from other tabs / admin panel actions.
  useEffect(() => {
    if (bellOpen) {
      setRawNotices(getLocalNotices());
    }
  }, [bellOpen]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "ge_notices") {
        setRawNotices(getLocalNotices());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const sortedNotices = [...notices].sort((a, b) => Number(b.date - a.date));
  const unreadCount = sortedNotices.filter(
    (n) => !readSet.has(noticeId(n)),
  ).length;

  const markRead = (n: { date: bigint; title: string }) => {
    const id = noticeId(n);
    const next = new Set(readSet);
    next.add(id);
    setReadSet(next);
    saveReadNotices(next);
    // Also sync with NoticesBanner dismissed_notices so the banner
    // doesn't re-appear for a notice that was read in the bell.
    try {
      const raw = localStorage.getItem("dismissed_notices");
      const dismissed: string[] = raw ? JSON.parse(raw) : [];
      if (!dismissed.includes(id)) {
        dismissed.push(id);
        localStorage.setItem("dismissed_notices", JSON.stringify(dismissed));
      }
    } catch {}
  };

  const markAllRead = () => {
    const next = new Set(readSet);
    const dismissed: string[] = [];
    try {
      const raw = localStorage.getItem("dismissed_notices");
      dismissed.push(...(raw ? JSON.parse(raw) : []));
    } catch {}
    for (const n of sortedNotices) {
      const id = noticeId(n);
      next.add(id);
      if (!dismissed.includes(id)) dismissed.push(id);
    }
    setReadSet(next);
    saveReadNotices(next);
    try {
      localStorage.setItem("dismissed_notices", JSON.stringify(dismissed));
    } catch {}
  };

  return (
    <header className="sticky top-0 z-50 px-4 py-3">
      <nav className="max-w-6xl mx-auto glass-card rounded-2xl px-4 py-2 flex flex-col gap-1">
        {/* Row 1: Logo + Right controls */}
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <button
            type="button"
            onClick={() => onNavigate("earn")}
            className="flex items-center gap-2 flex-shrink-0"
            data-ocid="nav.earn.link"
          >
            <div className="w-9 h-9 rounded-xl gradient-btn flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="font-display text-xs font-bold text-white/60 tracking-widest">
                GAMER
              </span>
              <span className="font-display text-sm font-black tracking-widest gradient-text">
                EARN
              </span>
            </div>
          </button>

          {/* Right: coins + bell + avatar + logout */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-2 bg-white/5 rounded-full px-3 py-1.5 border border-white/10">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-bold text-yellow-400">
                {Number(coinBalance).toLocaleString()}
              </span>
            </div>

            {/* Bell Notification */}
            <Popover open={bellOpen} onOpenChange={setBellOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  data-ocid="nav.notifications.button"
                  className="relative p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <Bell
                    className={`w-4 h-4 transition-colors ${
                      unreadCount > 0 ? "text-primary" : "text-muted-foreground"
                    } ${unreadCount > 0 ? "animate-glow-pulse" : ""}`}
                  />
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center"
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </motion.span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-80 p-0 glass border-white/15 rounded-2xl overflow-hidden"
                data-ocid="nav.notifications.popover"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <span className="font-display text-sm font-black uppercase tracking-wider gradient-text">
                    NOTIFICATIONS
                  </span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      data-ocid="nav.notifications.mark_all_read.button"
                      className="text-xs text-primary hover:text-primary/80 font-bold transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {sortedNotices.length === 0 ? (
                    <div
                      className="text-center py-8 text-muted-foreground space-y-2"
                      data-ocid="nav.notifications.empty_state"
                    >
                      <Bell className="w-8 h-8 mx-auto opacity-30" />
                      <p className="text-sm">No notices yet</p>
                    </div>
                  ) : (
                    sortedNotices.map((notice, i) => {
                      const id = noticeId(notice);
                      const isUnread = !readSet.has(id);
                      return (
                        <button
                          type="button"
                          key={id}
                          onClick={() => markRead(notice)}
                          data-ocid={`nav.notification.item.${i + 1}`}
                          className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors last:border-0 ${
                            isUnread ? "bg-primary/5" : ""
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                            )}
                            <div
                              className={`flex-1 min-w-0 ${!isUnread ? "pl-4" : ""}`}
                            >
                              <p
                                className={`text-sm font-bold truncate ${isUnread ? "text-white" : "text-white/70"}`}
                              >
                                {notice.title}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                {notice.description}
                              </p>
                              <p className="text-xs text-muted-foreground/60 mt-1">
                                {formatNoticeDate(notice.date)}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <div className="flex items-center gap-2 bg-white/5 rounded-full px-2 py-1 border border-white/10">
              <Avatar className="w-7 h-7">
                <AvatarFallback className="text-xs gradient-btn text-white font-bold">
                  {username ? username.charAt(0).toUpperCase() : "G"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-medium text-white/80 max-w-[80px] truncate">
                {username || "Player"}
              </span>
              {isDemoMode && (
                <span className="text-[9px] font-black bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full px-1.5 py-0.5 uppercase tracking-wider">
                  DEMO
                </span>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              data-ocid="nav.logout.button"
              className="text-muted-foreground hover:text-destructive p-2 rounded-full"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Row 2: Nav pills */}
        <div className="flex items-center gap-1 bg-white/5 rounded-full p-1 justify-center">
          {navItems.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => onNavigate(item.id)}
              data-ocid={`nav.${item.id}.link`}
              className={`relative flex-1 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider transition-all duration-300 ${
                activePage === item.id
                  ? "text-white"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              {activePage === item.id && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 gradient-btn rounded-full neon-glow"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}
