import { Gamepad2, Heart } from "lucide-react";
import { motion } from "motion/react";
import { AdBanner } from "../components/AdBanner";

export function CreditsPage() {
  return (
    <main
      className="max-w-2xl mx-auto px-4 pb-8 space-y-8"
      data-ocid="credits.page"
    >
      <section className="text-center space-y-2 py-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-4xl sm:text-5xl font-black tracking-widest uppercase gradient-text"
        >
          CREDITS
        </motion.h1>
        <p className="text-muted-foreground">The people behind Gamer Earn</p>
      </section>

      {/* Logo card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-3xl p-8 text-center space-y-4"
      >
        <div className="w-24 h-24 mx-auto rounded-3xl gradient-btn flex items-center justify-center neon-glow animate-float">
          <Gamepad2 className="w-12 h-12 text-white" />
        </div>
        <div>
          <h2 className="font-display text-3xl font-black uppercase tracking-widest gradient-text">
            GAMER EARN
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Watch. Earn. Redeem.
          </p>
        </div>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Gamer Earn is a premium watch-to-earn platform built for gamers. Watch
          ads, collect coins, and redeem them for real-world rewards like Google
          Play codes and Amazon vouchers.
        </p>
      </motion.div>

      {/* Owner card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-3xl p-6 space-y-4"
      >
        <h3 className="font-display text-lg font-bold uppercase tracking-wider text-muted-foreground">
          Project Owner
        </h3>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl gradient-btn flex items-center justify-center text-2xl font-black text-white">
            T
          </div>
          <div>
            <p className="font-bold text-xl text-white">Tanmoy Saha</p>
            <p className="text-sm text-muted-foreground">Creator & Developer</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Passionate developer dedicated to building free, accessible earning
          platforms for the gaming community.
        </p>
      </motion.div>

      {/* Tech stack */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-3xl p-6 space-y-4"
      >
        <h3 className="font-display text-lg font-bold uppercase tracking-wider text-muted-foreground">
          Built With
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            "React 19 + TypeScript",
            "Internet Computer (ICP)",
            "Tailwind CSS",
            "shadcn/ui",
            "Motoko (Backend)",
          ].map((tech) => (
            <div
              key={tech}
              className="bg-white/5 rounded-xl px-4 py-3 border border-white/10 text-sm font-medium text-white/80"
            >
              {tech}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Ad banner */}
      <AdBanner slot="2222222222" format="rectangle" className="mt-6" />

      {/* Heart */}
      <div className="text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
        <span>Made with</span>
        <Heart className="w-4 h-4 text-red-400 fill-red-400" />
        <span>for the gaming community</span>
      </div>
    </main>
  );
}
