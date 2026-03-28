import { Bell, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { getLocalNotices } from "../utils/localStore";

export function NoticesBanner() {
  // Bug fix: use state so we can refresh notices when localStorage changes
  const [rawNotices, setRawNotices] = useState(() => getLocalNotices());
  const notices = rawNotices.map((n) => ({
    title: n.title,
    description: n.description,
    date: BigInt(n.date) * 1_000_000n, // ms to ns
  }));

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("dismissed_notices");
      return new Set(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set();
    }
  });

  // Listen for storage events so that:
  // 1. New notices published by admin in another tab appear immediately.
  // 2. Notices marked-read in the Navbar bell are also dismissed here.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "ge_notices") {
        setRawNotices(getLocalNotices());
      }
      if (e.key === "dismissed_notices") {
        try {
          const stored = localStorage.getItem("dismissed_notices");
          setDismissedIds(new Set(stored ? JSON.parse(stored) : []));
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const activeNotices = notices.filter(
    (n) => !dismissedIds.has(`${n.date}-${n.title}`),
  );

  const dismiss = (id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem("dismissed_notices", JSON.stringify([...next]));
      return next;
    });
    // Also mark as read in Navbar bell so the unread badge clears
    try {
      const raw = localStorage.getItem("read_notices");
      const reads: string[] = raw ? JSON.parse(raw) : [];
      if (!reads.includes(id)) {
        reads.push(id);
        localStorage.setItem("read_notices", JSON.stringify(reads));
      }
    } catch {}
  };

  if (activeNotices.length === 0) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 mb-4 space-y-2">
      <AnimatePresence>
        {activeNotices.map((notice) => {
          const id = `${notice.date}-${notice.title}`;
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-card rounded-xl px-4 py-3 flex items-start gap-3 border border-yellow-500/20 bg-yellow-500/5"
            >
              <div className="relative flex-shrink-0">
                <Bell className="w-4 h-4 text-yellow-400 mt-0.5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-yellow-300">
                  {notice.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {notice.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(id)}
                className="text-muted-foreground hover:text-white transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
