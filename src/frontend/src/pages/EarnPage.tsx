import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../auth";
import { AdBanner } from "../components/AdBanner";
import { useRecordAdWatch, useUserProfile } from "../hooks/useQueries";

const DAILY_LIMIT = 15;
const COINS_PER_AD = 10;
const MAX_FAST_CLICKS = 5;
const FAST_CLICK_BAN_MS = 2 * 60 * 1000;
const AD_COUNTDOWN_SECONDS = 15;

function getStorageKey(key: string) {
  return `gamer_earn_${key}`;
}

function getCooldownMs() {
  return (Math.floor(Math.random() * 31) + 30) * 1000;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

export function EarnPage() {
  const { coinBalance, isDemoMode, addDemoCoins } = useAuth();
  const { data: profile } = useUserProfile();
  const recordAdWatch = useRecordAdWatch();

  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(0);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [banTimeLeft, setBanTimeLeft] = useState(0);
  const fastClickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);
  const adSessionCountRef = useRef(0);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  const [demoAdCount, setDemoAdCount] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [balancePulse, setBalancePulse] = useState(false);

  const dailyCount = isDemoMode
    ? demoAdCount
    : profile
      ? Number(profile.dailyAdCount)
      : 0;
  const progressPct = (dailyCount / DAILY_LIMIT) * 100;
  const isAtDailyLimit = dailyCount >= DAILY_LIMIT;

  // Track mount state to prevent state updates after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Clean up any running countdown timer on unmount
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const nextTime = Number.parseInt(
      localStorage.getItem(getStorageKey("next_ad_time")) || "0",
    );
    const banned = Number.parseInt(
      localStorage.getItem(getStorageKey("banned_until")) || "0",
    );
    const now = Date.now();
    if (nextTime > now) setCooldownLeft(Math.ceil((nextTime - now) / 1000));
    if (banned > now) setBanTimeLeft(Math.ceil((banned - now) / 1000));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextTime = Number.parseInt(
        localStorage.getItem(getStorageKey("next_ad_time")) || "0",
      );
      const banned = Number.parseInt(
        localStorage.getItem(getStorageKey("banned_until")) || "0",
      );
      const now = Date.now();
      setCooldownLeft(Math.max(0, Math.ceil((nextTime - now) / 1000)));
      setBanTimeLeft(Math.max(0, Math.ceil((banned - now) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const spawnParticles = useCallback(() => {
    const emojis = ["🪙", "✨", "★", "💫", "🌟", "💎", "🎮", "⚡"];
    const newParticles: Particle[] = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 160,
      y: -(Math.random() * 100 + 40),
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));
    setParticles(newParticles);
    setTimeout(() => {
      if (isMountedRef.current) setParticles([]);
    }, 900);
  }, []);

  // Bug fix: countdown now cleans up its interval via ref, safe on unmount
  const runCountdown = useCallback(
    (seconds: number): Promise<void> =>
      new Promise((resolve) => {
        // Clear any existing countdown before starting a new one
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        let count = seconds;
        if (isMountedRef.current) setAdCountdown(count);
        countdownTimerRef.current = setInterval(() => {
          count--;
          if (isMountedRef.current) setAdCountdown(count);
          if (count <= 0) {
            if (countdownTimerRef.current) {
              clearInterval(countdownTimerRef.current);
              countdownTimerRef.current = null;
            }
            resolve();
          }
        }, 1000);
      }),
    [],
  );

  const rewardUser = useCallback(
    async (isDemo: boolean) => {
      if (isDemo) {
        addDemoCoins(BigInt(COINS_PER_AD));
        toast.success(`+${COINS_PER_AD} coins earned! (Demo)`);
        if (isMountedRef.current) setDemoAdCount((prev) => prev + 1);
      } else {
        try {
          await recordAdWatch.mutateAsync();
          toast.success(`+${COINS_PER_AD} coins earned!`);
        } catch {
          toast.error("Failed to record ad watch. Please try again.");
          return;
        }
      }

      const cooldownMs = getCooldownMs();
      const newNextTime = Date.now() + cooldownMs;
      localStorage.setItem(
        getStorageKey("next_ad_time"),
        newNextTime.toString(),
      );
      if (!isMountedRef.current) return;
      setCooldownLeft(Math.ceil(cooldownMs / 1000));
      spawnParticles();
      setBalancePulse(true);
      setTimeout(() => {
        if (isMountedRef.current) setBalancePulse(false);
      }, 600);
    },
    [addDemoCoins, recordAdWatch, spawnParticles],
  );

  const handleWatchAd = useCallback(async () => {
    // Bug fix: prevent re-entry if already watching
    if (isWatchingAd) return;

    const now = Date.now();

    if (now - lastClickTimeRef.current < 2000) {
      fastClickCountRef.current += 1;
      if (fastClickCountRef.current >= MAX_FAST_CLICKS) {
        const banUntil = now + FAST_CLICK_BAN_MS;
        localStorage.setItem(
          getStorageKey("banned_until"),
          banUntil.toString(),
        );
        setBanTimeLeft(Math.ceil(FAST_CLICK_BAN_MS / 1000));
        toast.error("Too many rapid clicks! Button disabled for 2 minutes.");
        fastClickCountRef.current = 0;
        return;
      }
    } else {
      fastClickCountRef.current = 0;
    }
    lastClickTimeRef.current = now;

    const nextTime = Number.parseInt(
      localStorage.getItem(getStorageKey("next_ad_time")) || "0",
    );
    if (nextTime > now) {
      toast.error("Please wait before next ad");
      return;
    }

    if (isAtDailyLimit) {
      toast.error("Daily limit reached! Come back tomorrow.");
      return;
    }

    // Bug fix: check ban from localStorage directly (not stale state)
    const bannedUntil = Number.parseInt(
      localStorage.getItem(getStorageKey("banned_until")) || "0",
    );
    if (bannedUntil > now) {
      toast.error("Button temporarily disabled due to rapid clicking.");
      return;
    }

    setIsWatchingAd(true);

    // Bug fix: removed window.open("about:blank", "_blank") — Monetag's Wise Tag
    // (OnClick Popunder) fires automatically on user click events. Opening a blank
    // tab manually was incorrect and created a confusing empty browser tab.
    // The Monetag script handles the popunder on its own.

    await runCountdown(AD_COUNTDOWN_SECONDS);

    if (!isMountedRef.current) return;
    setIsWatchingAd(false);

    await rewardUser(isDemoMode);

    // Bug fix: use ref instead of stale state for session count
    adSessionCountRef.current += 1;
    if (adSessionCountRef.current % 3 === 0) {
      if (isMountedRef.current) setShowInterstitial(true);
    }
  }, [isWatchingAd, isAtDailyLimit, isDemoMode, runCountdown, rewardUser]);

  const isBanned = banTimeLeft > 0;
  const isInCooldown = cooldownLeft > 0 && !isBanned;
  const isButtonDisabled =
    isBanned || isInCooldown || isWatchingAd || isAtDailyLimit;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <main
      className="max-w-6xl mx-auto px-4 pb-8 space-y-8"
      data-ocid="earn.page"
    >
      <section className="text-center space-y-3 py-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-5xl sm:text-6xl font-black tracking-widest uppercase gradient-text glow-text"
        >
          WATCH & EARN
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground text-lg"
        >
          Watch ads, collect coins, and redeem amazing rewards
        </motion.p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Watch Ad CTA */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="premium-card p-8 space-y-6 flex flex-col items-center text-center"
          data-ocid="earn.watch_ad.card"
        >
          <div className="text-6xl">🎮</div>
          <div>
            <h2 className="font-display text-2xl font-black uppercase tracking-widest gradient-text">
              Watch Ad & Earn
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {COINS_PER_AD} coins per ad &bull; Max {DAILY_LIMIT} ads/day
            </p>
          </div>

          <div className="relative">
            <AnimatePresence>
              {particles.map((p) => (
                <motion.span
                  key={p.id}
                  initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                  animate={{ opacity: 0, x: p.x, y: p.y, scale: 0.5 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  className="absolute top-1/2 left-1/2 pointer-events-none text-xl z-20"
                  style={{ transform: "translate(-50%, -50%)" }}
                >
                  {p.emoji}
                </motion.span>
              ))}
            </AnimatePresence>

            <motion.button
              type="button"
              onClick={handleWatchAd}
              disabled={isButtonDisabled}
              data-ocid="earn.watch_ad.button"
              whileHover={!isButtonDisabled ? { scale: 1.05 } : {}}
              whileTap={!isButtonDisabled ? { scale: 0.97 } : {}}
              animate={isWatchingAd ? { scale: [1, 1.03, 1] } : {}}
              transition={{
                repeat: isWatchingAd ? Number.POSITIVE_INFINITY : 0,
                duration: 1,
              }}
              className="relative w-36 h-36 rounded-full gradient-btn neon-glow flex flex-col items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 text-white font-black text-lg shadow-2xl"
            >
              {isWatchingAd ? (
                <>
                  <span className="text-3xl font-black">{adCountdown}</span>
                  <span className="text-xs opacity-70">Watching...</span>
                </>
              ) : isBanned ? (
                <>
                  <span className="text-2xl">🚫</span>
                  <span className="text-xs">{formatTime(banTimeLeft)}</span>
                </>
              ) : isInCooldown ? (
                <>
                  <span className="text-2xl">⏳</span>
                  <span className="text-xs">{formatTime(cooldownLeft)}</span>
                </>
              ) : isAtDailyLimit ? (
                <>
                  <span className="text-2xl">✅</span>
                  <span className="text-xs">Done!</span>
                </>
              ) : (
                <>
                  <span className="text-3xl">▶️</span>
                  <span className="text-sm">WATCH</span>
                </>
              )}
            </motion.button>
          </div>

          {isBanned && (
            <p className="text-xs text-destructive">
              Rapid clicking detected. Wait {formatTime(banTimeLeft)}.
            </p>
          )}
          {isInCooldown && (
            <p className="text-xs text-muted-foreground">
              Next ad in {formatTime(cooldownLeft)}
            </p>
          )}
          {isWatchingAd && (
            <p className="text-xs text-muted-foreground animate-pulse">
              {isDemoMode
                ? "Demo ad in progress — wait for countdown"
                : "Ad loading — wait for countdown to complete"}
            </p>
          )}
        </motion.div>

        {/* Right: Stats */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {/* Coin balance */}
          <div
            className={`premium-card p-6 text-center transition-all duration-300 ${
              balancePulse ? "scale-105 border-yellow-400/40" : ""
            }`}
            data-ocid="earn.balance.card"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
              Coin Balance
            </p>
            <motion.div
              key={Number(coinBalance)}
              initial={{ scale: 0.9, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-5xl font-black font-display gradient-text"
            >
              {Number(coinBalance).toLocaleString()}
            </motion.div>
            <p className="text-xs text-muted-foreground mt-1">
              {Number(coinBalance) >= 5000
                ? `₹${Math.floor(Number(coinBalance) / 100)} redeemable`
                : `${5000 - Number(coinBalance)} more coins to redeem ₹50`}
            </p>
          </div>

          <AdBanner className="mb-6" />

          {/* Daily progress */}
          <div
            className="premium-card p-5 space-y-3"
            data-ocid="earn.daily_progress.card"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground uppercase tracking-widest">
                Daily Progress
              </span>
              <span className="text-sm font-bold text-white/80">
                {dailyCount} / {DAILY_LIMIT}
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full gradient-btn rounded-full"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {isAtDailyLimit
                ? "Daily limit reached! Come back tomorrow."
                : `${DAILY_LIMIT - dailyCount} ads remaining today`}
            </p>
          </div>

          {/* Rewards info */}
          <div
            className="premium-card p-5 space-y-2"
            data-ocid="earn.rewards_info.card"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
              Reward Tiers
            </p>
            {[
              { coins: 5000, amount: "₹50" },
              { coins: 10000, amount: "₹100" },
              { coins: 50000, amount: "₹500" },
              { coins: 100000, amount: "₹1000" },
            ].map((tier) => (
              <div
                key={tier.coins}
                className={`flex items-center justify-between py-1.5 px-3 rounded-lg text-sm ${
                  Number(coinBalance) >= tier.coins
                    ? "bg-primary/10 border border-primary/20 text-white"
                    : "text-muted-foreground"
                }`}
              >
                <span className="font-bold">{tier.amount}</span>
                <span className="text-xs">
                  {tier.coins.toLocaleString()} coins
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Upcoming Features */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        data-ocid="earn.upcoming_features.section"
      >
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">
          Upcoming Features
        </p>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[
            { icon: "📱", title: "Mobile App", desc: "Android & iOS" },
            {
              icon: "🎁",
              title: "More Rewards",
              desc: "Flipkart, Paytm & more",
            },
            { icon: "🏆", title: "Leaderboard", desc: "Top earners ranking" },
            {
              icon: "👥",
              title: "Referrals",
              desc: "Earn by inviting friends",
            },
            {
              icon: "🔔",
              title: "Push Alerts",
              desc: "Bonus coin notifications",
            },
          ].map((feat) => (
            <div
              key={feat.title}
              className="flex-shrink-0 premium-card p-4 text-center space-y-2 w-36"
            >
              <div className="text-3xl">{feat.icon}</div>
              <p className="text-sm font-bold text-white">{feat.title}</p>
              <p className="text-xs text-muted-foreground">{feat.desc}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Interstitial ad overlay */}
      <AnimatePresence>
        {showInterstitial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            data-ocid="earn.interstitial.modal"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="premium-card p-8 max-w-sm w-full mx-4 text-center space-y-4"
            >
              <div className="text-4xl">📊</div>
              <h3 className="font-display text-xl font-black gradient-text uppercase">
                Sponsor Message
              </h3>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-sm text-muted-foreground">
                Thank you for watching ads and supporting Gamer Earn!
              </div>
              <button
                type="button"
                onClick={() => setShowInterstitial(false)}
                data-ocid="earn.interstitial.close_button"
                className="w-full gradient-btn text-white font-bold py-3 rounded-xl"
              >
                Continue Earning
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AdBanner className="mt-6" />
    </main>
  );
}
