import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../auth";
import { RewardType } from "../backend.d";
import { AdBanner } from "../components/AdBanner";
import { useSubmitRedeem } from "../hooks/useQueries";
import { addRedeemOrder } from "../utils/localStore";

const COIN_RATE = 100;

function coinsForAmount(amount: number) {
  return amount * COIN_RATE;
}

const REWARD_OPTIONS = [
  {
    id: RewardType.googlePlay,
    label: "Google Play",
    icon: "🎮",
    desc: "Redeem for Google Play gift cards",
  },
  {
    id: RewardType.amazon,
    label: "Amazon",
    icon: "📦",
    desc: "Redeem for Amazon gift cards",
  },
];

const MIN_AMOUNT = 50;
const MAX_AMOUNT = 1000;

export function RedeemPage() {
  const { coinBalance, refreshBalance, isDemoMode, addDemoCoins } = useAuth();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [rewardType, setRewardType] = useState<RewardType | null>(null);
  const [amount, setAmount] = useState(50);
  const [name, setName] = useState(() => (isDemoMode ? "Demo User" : ""));
  const [email, setEmail] = useState(() =>
    isDemoMode
      ? "demo@gamerearn.com"
      : localStorage.getItem("gamer_earn_locked_email") || "",
  );
  // Bug fix: use regular state (not read-once) so that after the first successful
  // redeem locks the email in the same session, the field becomes read-only
  // immediately without requiring a page reload.
  const [isEmailLocked, setIsEmailLocked] = useState(
    () => !!localStorage.getItem("gamer_earn_locked_email"),
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const submitRedeem = useSubmitRedeem();

  const requiredCoins = coinsForAmount(amount);
  const hasEnough = Number(coinBalance) >= requiredCoins;

  const goNext = (nextStep: number) => {
    setDirection(1);
    setStep(nextStep);
  };
  const goBack = (prevStep: number) => {
    setDirection(-1);
    setStep(prevStep);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    // Bug fix: stronger email validation — must have chars before @, a domain, and a TLD
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Please enter a valid email");
      return;
    }
    if (!hasEnough) {
      toast.error("Insufficient coins");
      return;
    }
    if (!rewardType) return;

    const rewardTypeStr =
      rewardType === RewardType.googlePlay ? "googlePlay" : "amazon";
    const orderData = {
      rewardType: rewardTypeStr as "googlePlay" | "amazon",
      amount: requiredCoins,
      status: "pending" as const,
      name: isDemoMode ? "Demo User" : name.trim(),
      email: isDemoMode ? "demo@gamerearn.com" : email.trim(),
    };

    if (isDemoMode) {
      // Save with the SAME id in both admin and user stores
      addRedeemOrder(orderData);
      // Bug fix: guard against negative balance (hasEnough already checked above,
      // but being explicit here prevents any edge-case negative bigint)
      if (Number(coinBalance) >= requiredCoins) {
        addDemoCoins(-BigInt(requiredCoins));
      }
      setShowSuccess(true);
      return;
    }

    try {
      await submitRedeem.mutateAsync({
        rewardType,
        amount: BigInt(requiredCoins),
      });
      // Save with the SAME id in both admin and user stores
      addRedeemOrder(orderData);
      if (!isEmailLocked) {
        localStorage.setItem("gamer_earn_locked_email", email.trim());
        setIsEmailLocked(true); // Bug fix: lock immediately in this session
      }
      await refreshBalance();
      setShowSuccess(true);
    } catch {
      toast.error("Redeem request failed. Please try again.");
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setStep(1);
    setDirection(1);
    setRewardType(null);
    setAmount(50);
    if (!isDemoMode) {
      setName("");
      // Bug fix: re-read isEmailLocked from localStorage in case it was just set
      // (covers the same-session case where email was just locked after first redeem)
      if (!isEmailLocked) {
        const nowLocked = !!localStorage.getItem("gamer_earn_locked_email");
        if (!nowLocked) setEmail("");
        // if it just got locked, leave email as-is (it's now locked)
      }
    }
  };

  const variants = {
    enter: (d: number) => ({ x: d * 60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: -d * 60, opacity: 0 }),
  };

  return (
    <main className="max-w-2xl mx-auto px-4 pb-8" data-ocid="redeem.page">
      <section className="text-center space-y-3 py-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-5xl font-black tracking-widest uppercase gradient-text glow-text"
        >
          REDEEM
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-muted-foreground"
        >
          Exchange your coins for rewards
        </motion.p>
      </section>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="premium-card p-4 flex items-center justify-between mb-6"
        data-ocid="redeem.balance.card"
      >
        <span className="text-sm text-muted-foreground">Your Balance</span>
        <span className="text-xl font-black gradient-text">
          {Number(coinBalance).toLocaleString()} coins
        </span>
      </motion.div>

      <div className="flex items-center gap-2 mb-6 justify-center">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                step >= s
                  ? "gradient-btn text-white"
                  : "bg-white/10 text-muted-foreground"
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                className={`w-8 h-0.5 transition-all ${step > s ? "bg-primary" : "bg-white/10"}`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="premium-card p-6 space-y-4"
              data-ocid="redeem.step1.panel"
            >
              <h2 className="font-display font-black text-lg uppercase tracking-widest gradient-text">
                Choose Reward Type
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {REWARD_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setRewardType(opt.id)}
                    data-ocid={`redeem.reward_type.${opt.label.toLowerCase().replace(" ", "_")}.button`}
                    className={`p-4 rounded-xl border transition-all text-left space-y-1 ${
                      rewardType === opt.id
                        ? "border-primary/60 bg-primary/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="text-3xl">{opt.icon}</div>
                    <div className="font-bold text-sm text-white">
                      {opt.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>
              <Button
                onClick={() => rewardType && goNext(2)}
                disabled={!rewardType}
                data-ocid="redeem.step1.next_button"
                className="w-full gradient-btn text-white border-0 font-bold"
              >
                Continue
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="premium-card p-6 space-y-6"
              data-ocid="redeem.step2.panel"
            >
              <h2 className="font-display font-black text-lg uppercase tracking-widest gradient-text">
                Select Amount
              </h2>
              <div className="text-center">
                <div className="text-5xl font-black gradient-text font-display">
                  ₹{amount}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {requiredCoins.toLocaleString()} coins required
                </p>
                <p
                  className={`text-xs mt-1 ${hasEnough ? "text-green-400" : "text-destructive"}`}
                >
                  {hasEnough
                    ? "You have enough coins!"
                    : `Need ${(requiredCoins - Number(coinBalance)).toLocaleString()} more coins`}
                </p>
              </div>
              <Slider
                min={MIN_AMOUNT}
                max={MAX_AMOUNT}
                step={50}
                value={[amount]}
                onValueChange={([v]) => setAmount(v)}
                data-ocid="redeem.amount.select"
                className="my-4"
              />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => goBack(1)}
                  data-ocid="redeem.step2.back_button"
                  className="flex-1 border-white/15 bg-white/5"
                >
                  Back
                </Button>
                <Button
                  onClick={() => goNext(3)}
                  disabled={!hasEnough}
                  data-ocid="redeem.step2.next_button"
                  className="flex-1 gradient-btn text-white border-0 font-bold"
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="premium-card p-6 space-y-4"
              data-ocid="redeem.step3.panel"
            >
              <h2 className="font-display font-black text-lg uppercase tracking-widest gradient-text">
                Your Details
              </h2>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="redeem-name"
                    className="text-xs text-muted-foreground uppercase tracking-wider"
                  >
                    Full Name
                  </label>
                  <Input
                    id="redeem-name"
                    value={name}
                    onChange={(e) => !isDemoMode && setName(e.target.value)}
                    placeholder="Enter your full name"
                    readOnly={isDemoMode}
                    data-ocid="redeem.name.input"
                    className="bg-white/5 border-white/15 text-white rounded-xl focus:border-primary disabled:opacity-60"
                  />
                  {isDemoMode && (
                    <p className="text-xs text-yellow-400/80">
                      Fixed for demo account
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="redeem-email"
                    className="text-xs text-muted-foreground uppercase tracking-wider"
                  >
                    Email Address
                  </label>
                  <Input
                    id="redeem-email"
                    type="email"
                    value={email}
                    onChange={(e) =>
                      !isDemoMode && !isEmailLocked && setEmail(e.target.value)
                    }
                    placeholder="you@email.com"
                    readOnly={isDemoMode || isEmailLocked}
                    data-ocid="redeem.email.input"
                    className="bg-white/5 border-white/15 text-white rounded-xl focus:border-primary disabled:opacity-60"
                  />
                  {isDemoMode && (
                    <p className="text-xs text-yellow-400/80">
                      Fixed for demo account
                    </p>
                  )}
                  {!isDemoMode && isEmailLocked && (
                    <p className="text-xs text-muted-foreground">
                      Email locked for security
                    </p>
                  )}
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reward</span>
                  <span className="font-bold text-white">
                    {REWARD_OPTIONS.find((r) => r.id === rewardType)?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold gradient-text">₹{amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coins used</span>
                  <span className="font-bold text-white">
                    {requiredCoins.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => goBack(2)}
                  data-ocid="redeem.step3.back_button"
                  className="flex-1 border-white/15 bg-white/5"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitRedeem.isPending}
                  data-ocid="redeem.submit_button"
                  className="flex-1 gradient-btn text-white border-0 font-bold"
                >
                  {submitRedeem.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {submitRedeem.isPending ? "Submitting..." : "Confirm Redeem"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
            data-ocid="redeem.success.modal"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="premium-card p-8 max-w-sm w-full text-center space-y-4"
            >
              <div className="text-5xl">🎉</div>
              <h3 className="font-display text-2xl font-black gradient-text uppercase">
                Congratulations!
              </h3>
              <p className="text-sm text-muted-foreground">
                Your reward request has been submitted! Your reward will be sent
                to you in{" "}
                <span className="text-white font-bold">
                  3&ndash;7 working days
                </span>{" "}
                via email.
              </p>
              <Button
                onClick={handleSuccessClose}
                data-ocid="redeem.success.close_button"
                className="w-full gradient-btn text-white border-0 font-bold"
              >
                Done
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AdBanner slot="2222222222" format="rectangle" className="my-6" />
    </main>
  );
}
