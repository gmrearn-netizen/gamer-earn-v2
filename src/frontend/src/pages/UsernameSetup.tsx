import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gamepad2, Loader2, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../auth";
import { useUpdateUsername } from "../hooks/useQueries";

export function UsernameSetup({ onComplete }: { onComplete: () => void }) {
  const [username, setUsername] = useState("");
  const { setUsername: setAuthUsername } = useAuth();
  const mutation = useUpdateUsername();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }
    try {
      await mutation.mutateAsync(username.trim());
      setAuthUsername(username.trim());
      toast.success("Welcome to Gamer Earn! 🎮");
      onComplete();
    } catch {
      toast.error("Failed to set username. Try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="glass-card rounded-3xl p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl gradient-btn flex items-center justify-center neon-glow">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-display text-3xl font-black gradient-text uppercase tracking-wider">
              Choose Your Name
            </h2>
            <p className="text-sm text-muted-foreground">
              Pick a unique username to start your earning journey
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="username"
                className="text-sm font-medium text-white/80"
              >
                Username
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your gamer tag..."
                maxLength={20}
                data-ocid="username.input"
                className="bg-white/5 border-white/15 text-white placeholder:text-muted-foreground rounded-xl py-3 focus:border-primary"
              />
              <p className="text-xs text-muted-foreground">
                3–20 characters. This will be your public gamer identity.
              </p>
            </div>

            <Button
              type="submit"
              disabled={mutation.isPending || username.length < 3}
              data-ocid="username.submit_button"
              className="w-full gradient-btn neon-glow text-white font-bold py-6 rounded-xl border-0"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Setting
                  up...
                </>
              ) : (
                <>
                  <Gamepad2 className="w-4 h-4 mr-2" /> Enter the Arena
                </>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
