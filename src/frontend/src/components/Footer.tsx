import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Gamepad2 } from "lucide-react";
import { useState } from "react";
import { FeedbackPage } from "../pages/FeedbackPage";
import { AdBanner } from "./AdBanner";

const FOOTER_CONTENT = {
  terms: {
    title: "Terms & Conditions",
    content:
      "Welcome to Gamer Earn. By using this platform, you agree to these terms.\n\n1. Users must be 18+ to redeem rewards.\n2. Rewards are processed within 3\u20137 working days.\n3. Coin balance cannot be transferred between accounts.\n4. Fraudulent activity will result in account suspension.\n5. Daily ad limits are strictly enforced for platform safety.\n6. We reserve the right to modify reward rates at any time.",
  },
  faq: {
    title: "Frequently Asked Questions",
    content:
      'Q: How do I earn coins?\nA: Click "Watch Ad & Earn" to watch a short ad and earn 10 coins.\n\nQ: What is the daily limit?\nA: You can watch up to 15 ads per day.\n\nQ: How long is the cooldown between ads?\nA: Cooldown is randomly between 30\u201360 seconds.\n\nQ: What can I redeem?\nA: Google Play codes and Amazon vouchers. Minimum \u20b950 (5000 coins).\n\nQ: How long does redemption take?\nA: 3\u20137 working days via email.',
  },
  privacy: {
    title: "Privacy Policy",
    content:
      "Gamer Earn values your privacy.\n\nData collected: Username, email (for redemption), usage statistics.\n\nWe do not sell personal data to third parties.\n\nCookies are used for session management and anti-fraud detection.\n\nYou may request data deletion by contacting us.",
  },
};

export function Footer() {
  const [modal, setModal] = useState<keyof typeof FOOTER_CONTENT | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-white/10 py-8 px-4">
      <AdBanner slot="1111111111" className="mb-8" />
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-btn flex items-center justify-center">
              <Gamepad2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-black tracking-wider gradient-text">
              GAMER EARN
            </span>
          </div>
          <div className="flex items-center gap-6 flex-wrap justify-center">
            {(
              Object.keys(FOOTER_CONTENT) as Array<keyof typeof FOOTER_CONTENT>
            ).map((key) => (
              <button
                type="button"
                key={key}
                onClick={() => setModal(key)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors capitalize"
              >
                {key === "faq" ? "FAQ" : FOOTER_CONTENT[key].title}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setFeedbackOpen(true)}
              data-ocid="footer.feedback.button"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Feedback
            </button>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            &copy;{currentYear} Gamer Earn &mdash; Created and Maintained by
            Tanmoy Saha
          </p>
        </div>
      </div>

      {/* Terms / FAQ / Privacy dialog */}
      <Dialog open={!!modal} onOpenChange={() => setModal(null)}>
        <DialogContent className="glass-card border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="gradient-text font-display text-xl">
              {modal ? FOOTER_CONTENT[modal].title : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
            {modal ? FOOTER_CONTENT[modal].content : ""}
          </div>
        </DialogContent>
      </Dialog>

      {/* Feedback dialog */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="glass-card border-white/10 max-w-2xl p-0 overflow-hidden">
          <FeedbackPage inDialog />
        </DialogContent>
      </Dialog>
    </footer>
  );
}
