import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, MessageSquareHeart, Send } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../auth";

const FORMSPREE_URL = "https://formspree.io/f/xzzbnkow";

const CATEGORIES = [
  { value: "General", label: "General" },
  { value: "Bug Report", label: "Bug Report" },
  { value: "Suggestion", label: "Suggestion" },
  { value: "Payment Issue", label: "Payment Issue" },
];

interface FeedbackPageProps {
  inDialog?: boolean;
}

export function FeedbackPage({ inDialog }: FeedbackPageProps) {
  const { username } = useAuth();
  const [name, setName] = useState(username || "");
  const [email, setEmail] = useState(
    () => localStorage.getItem("gamer_earn_locked_email") || "",
  );
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    if (!category) {
      toast.error("Please select a category");
      return;
    }
    if (!message.trim() || message.trim().length < 10) {
      toast.error("Message must be at least 10 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(FORMSPREE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          category,
          message,
          _replyto: email,
          _subject: `Gamer Earn Feedback - ${category}`,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch {
      toast.error("Failed to send feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnother = () => {
    setMessage("");
    setCategory("");
    setSubmitted(false);
  };

  if (inDialog) {
    return (
      <div className="p-6" data-ocid="feedback.dialog">
        <div className="mb-5">
          <h2 className="font-display text-xl font-black gradient-text uppercase tracking-widest">
            FEEDBACK
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Help us improve your experience
          </p>
        </div>
        {submitted ? (
          <div
            className="text-center space-y-4 py-6"
            data-ocid="feedback.success_state"
          >
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-400" />
            <div className="space-y-1">
              <h3 className="font-display text-lg font-black gradient-text uppercase">
                Thanks!
              </h3>
              <p className="text-muted-foreground text-sm">
                Our team will review your message.
              </p>
            </div>
            <Button
              onClick={handleAnother}
              variant="outline"
              data-ocid="feedback.submit_another.button"
              className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
            >
              <MessageSquareHeart className="w-4 h-4 mr-2" />
              Submit Another
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            data-ocid="feedback.form"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label
                  htmlFor="fb-d-name"
                  className="text-xs text-muted-foreground uppercase tracking-wider"
                >
                  Name
                </label>
                <Input
                  id="fb-d-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  data-ocid="feedback.name.input"
                  className="bg-white/5 border-white/15 text-white rounded-xl focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="fb-d-email"
                  className="text-xs text-muted-foreground uppercase tracking-wider"
                >
                  Email
                </label>
                <Input
                  id="fb-d-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  data-ocid="feedback.email.input"
                  className="bg-white/5 border-white/15 text-white rounded-xl focus:border-primary"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label
                htmlFor="fb-d-cat"
                className="text-xs text-muted-foreground uppercase tracking-wider"
              >
                Category
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger
                  id="fb-d-cat"
                  data-ocid="feedback.category.select"
                  className="bg-white/5 border-white/15 text-white rounded-xl"
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-[oklch(0.14_0.018_265)] border-white/15 text-white">
                  {CATEGORIES.map((c) => (
                    <SelectItem
                      key={c.value}
                      value={c.value}
                      className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                    >
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label
                htmlFor="fb-d-msg"
                className="text-xs text-muted-foreground uppercase tracking-wider"
              >
                Message
              </label>
              <Textarea
                id="fb-d-msg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what's on your mind..."
                rows={4}
                data-ocid="feedback.message.textarea"
                className="bg-white/5 border-white/15 text-white rounded-xl focus:border-primary resize-none"
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              data-ocid="feedback.submit_button"
              className="w-full gradient-btn text-white border-0 font-bold"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {isSubmitting ? "Sending..." : "Send Feedback"}
            </Button>
          </form>
        )}
      </div>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 pb-12" data-ocid="feedback.page">
      <section className="text-center space-y-3 py-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-5xl font-black tracking-widest uppercase gradient-text glow-text"
        >
          FEEDBACK
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-muted-foreground"
        >
          Help us improve your experience
        </motion.p>
      </section>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="premium-card p-6 sm:p-8"
        data-ocid="feedback.panel"
      >
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-5 py-8"
            data-ocid="feedback.success_state"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: 2, duration: 0.5 }}
            >
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-400" />
            </motion.div>
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-black gradient-text uppercase">
                Thanks for your feedback!
              </h2>
              <p className="text-muted-foreground text-sm">
                We appreciate you taking the time to help us improve. Our team
                will review your message.
              </p>
            </div>
            <Button
              onClick={handleAnother}
              data-ocid="feedback.submit_another.button"
              variant="outline"
              className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
            >
              <MessageSquareHeart className="w-4 h-4 mr-2" />
              Submit Another
            </Button>
          </motion.div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
            data-ocid="feedback.form"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="fb-name"
                  className="text-xs text-muted-foreground uppercase tracking-wider"
                >
                  Your Name
                </label>
                <Input
                  id="fb-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  data-ocid="feedback.name.input"
                  className="bg-white/5 border-white/15 text-white rounded-xl focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="fb-email"
                  className="text-xs text-muted-foreground uppercase tracking-wider"
                >
                  Email Address
                </label>
                <Input
                  id="fb-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  data-ocid="feedback.email.input"
                  className="bg-white/5 border-white/15 text-white rounded-xl focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="fb-category"
                className="text-xs text-muted-foreground uppercase tracking-wider"
              >
                Category
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger
                  id="fb-category"
                  data-ocid="feedback.category.select"
                  className="bg-white/5 border-white/15 text-white rounded-xl focus:border-primary"
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-[oklch(0.14_0.018_265)] border-white/15 text-white">
                  {CATEGORIES.map((c) => (
                    <SelectItem
                      key={c.value}
                      value={c.value}
                      className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                    >
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="fb-message"
                className="text-xs text-muted-foreground uppercase tracking-wider"
              >
                Message
              </label>
              <Textarea
                id="fb-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what's on your mind..."
                rows={5}
                data-ocid="feedback.message.textarea"
                className="bg-white/5 border-white/15 text-white rounded-xl focus:border-primary resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {message.length} / 1000
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              data-ocid="feedback.submit_button"
              className="w-full gradient-btn text-white border-0 font-bold py-5"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {isSubmitting ? "Sending..." : "Send Feedback"}
            </Button>
          </form>
        )}
      </motion.div>

      {/* Decorative icon */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex justify-center mt-6"
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
          <MessageSquareHeart className="w-3.5 h-3.5" />
          <span>Your feedback goes directly to our team</span>
        </div>
      </motion.div>
    </main>
  );
}
