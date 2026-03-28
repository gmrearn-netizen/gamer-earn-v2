import { Button } from "@/components/ui/button";
import { Gamepad2, User } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../auth";
import { AdBanner } from "../components/AdBanner";

export function AuthScreen() {
  const { login, isInitializing } = useAuth();

  return (
    <div className="min-h-screen hex-bg relative flex flex-col items-center justify-center px-4 py-8">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="glass-card rounded-3xl p-8 space-y-8">
          {/* Logo */}
          <div className="text-center space-y-4">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 3,
                ease: "easeInOut",
              }}
              className="w-20 h-20 mx-auto rounded-2xl gradient-btn flex items-center justify-center neon-glow"
            >
              <Gamepad2 className="w-10 h-10 text-white" />
            </motion.div>
            <div>
              <h1 className="font-display text-4xl font-black tracking-widest gradient-text uppercase">
                GAMER EARN
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Watch Ads. Earn Coins. Redeem Rewards.
              </p>
            </div>
          </div>

          {/* Stats preview */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Coins/Ad", value: "10" },
              { label: "Daily Limit", value: "15" },
              { label: "Min Redeem", value: "₹50" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/5 rounded-xl p-3 text-center border border-white/10"
              >
                <div className="text-lg font-black gradient-text">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Login */}
          <div className="space-y-3">
            <p className="text-center text-sm text-muted-foreground">
              Connect with Internet Identity to get started
            </p>
            <Button
              onClick={login}
              disabled={isInitializing}
              data-ocid="auth.login.button"
              className="w-full gradient-btn neon-glow text-white font-bold text-base py-6 rounded-xl border-0 transition-all"
            >
              <User className="w-5 h-5 mr-2" />
              {isInitializing ? "Initializing..." : "Login / Sign Up"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Secure login powered by Internet Identity
          </p>
        </div>

        {/* Ad below login card */}
        <AdBanner slot="1111111111" className="mt-6" />
      </motion.div>
    </div>
  );
}
