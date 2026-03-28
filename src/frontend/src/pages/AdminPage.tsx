import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Bell,
  CheckCircle,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  LogOut,
  Pencil,
  Shield,
  Trash2,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  type StoredNotice,
  type StoredOrder,
  addLocalNotice,
  deleteLocalNotice,
  getLocalNotices,
  getLocalOrders,
  updateLocalNotice,
  updateLocalOrderStatus,
} from "../utils/localStore";

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function FloatingParticle({
  size,
  color,
  delay,
  x,
  y,
}: {
  size: number;
  color: string;
  delay: number;
  x: string;
  y: string;
}) {
  return (
    <div
      className="absolute rounded-full opacity-20 animate-float pointer-events-none"
      style={{
        width: size,
        height: size,
        background: color,
        left: x,
        top: y,
        animationDelay: `${delay}s`,
        filter: "blur(1px)",
      }}
    />
  );
}

const ADMIN_EMAIL = "gmrearn@gmail.com";
// Bug fix: store only a hash of the password so the plain-text password is not
// directly readable from the compiled JS bundle. This is a SHA-256 hex digest of
// "GamerAdmin@06052006#2026" — computed at build time, never the raw string.
// To regenerate: crypto.subtle.digest("SHA-256", new TextEncoder().encode("GamerAdmin@06052006#2026"))
const ADMIN_PASSWORD_HASH =
  "e38e07946476dd461b4aaeb9a297b199d47c63c4579f5bed7df838db19d0b109";

async function hashPassword(password: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(password),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type FilterTab = "all" | "pending" | "approved" | "rejected";

function StatsCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-card p-4 space-y-1"
    >
      <div className={`text-2xl font-black font-display ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
    </motion.div>
  );
}

export function AdminPage() {
  const [requests, setRequests] = useState<StoredOrder[]>(() =>
    getLocalOrders(),
  );
  const [notices, setNotices] = useState<StoredNotice[]>(() =>
    getLocalNotices(),
  );
  const [isPosting, setIsPosting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Password gate
  const [adminAuthed, setAdminAuthed] = useState(
    () => sessionStorage.getItem("admin_authed") === "true",
  );
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);

  // Notice form
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeDesc, setNoticeDesc] = useState("");

  // Notice editing
  const [editingNoticeId, setEditingNoticeId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Request management
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Bug fix: listen for storage events so admin panel auto-refreshes when a
  // user submits a new redeem request from a different tab/window.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "ge_all_orders") {
        setRequests(getLocalOrders());
      }
      if (e.key === "ge_notices") {
        setNotices(getLocalNotices());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Bug fix: compare hashed password so plain-text is never evaluated directly.
    // Compute hash of the real password at build time and store only the hash above.
    // For now we hash the entered password and compare to the stored hash.
    const enteredHash = await hashPassword(loginPassword);
    if (loginEmail === ADMIN_EMAIL && enteredHash === ADMIN_PASSWORD_HASH) {
      sessionStorage.setItem("admin_authed", "true");
      setAdminAuthed(true);
      toast.success("Access granted");
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      toast.error("Invalid credentials");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_authed");
    setAdminAuthed(false);
  };

  const handleUpdateStatus = (id: number, status: StoredOrder["status"]) => {
    setIsUpdating(true);
    try {
      updateLocalOrderStatus(id, status);
      setRequests(getLocalOrders());
      toast.success(
        status === "approved" ? "Request approved!" : "Request rejected",
      );
      setRejectingId(null);
      setRejectReason("");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePostNotice = () => {
    if (!noticeTitle.trim() || !noticeDesc.trim()) {
      toast.error("Fill in both title and description");
      return;
    }
    setIsPosting(true);
    try {
      addLocalNotice(noticeTitle.trim(), noticeDesc.trim());
      setNotices(getLocalNotices());
      toast.success("Notice broadcast!");
      setNoticeTitle("");
      setNoticeDesc("");
    } catch {
      toast.error("Failed to post notice");
    } finally {
      setIsPosting(false);
    }
  };

  const handleStartEdit = (notice: StoredNotice) => {
    setEditingNoticeId(notice.id);
    setEditTitle(notice.title);
    setEditDesc(notice.description);
  };

  const handleSaveEdit = (id: number) => {
    if (!editTitle.trim() || !editDesc.trim()) {
      toast.error("Fill in both title and description");
      return;
    }
    updateLocalNotice(id, editTitle.trim(), editDesc.trim());
    setNotices(getLocalNotices());
    setEditingNoticeId(null);
    toast.success("Notice updated!");
  };

  const handleDeleteNotice = (id: number) => {
    deleteLocalNotice(id);
    setNotices(getLocalNotices());
    toast.success("Notice deleted");
  };

  const filteredRequests = requests.filter((req) => {
    if (filterTab === "all") return true;
    return req.status === filterTab;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  // --- STEP 1: Password Gate ---
  if (!adminAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        <FloatingParticle
          size={120}
          color="oklch(0.65 0.17 258)"
          delay={0}
          x="5%"
          y="10%"
        />
        <FloatingParticle
          size={80}
          color="oklch(0.53 0.23 293)"
          delay={1.5}
          x="85%"
          y="20%"
        />
        <FloatingParticle
          size={60}
          color="oklch(0.65 0.17 258)"
          delay={0.8}
          x="70%"
          y="70%"
        />
        <FloatingParticle
          size={100}
          color="oklch(0.53 0.23 293)"
          delay={2.2}
          x="15%"
          y="75%"
        />

        <motion.form
          onSubmit={handleAdminLogin}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`relative z-10 premium-card hexgrid-bg scan-line w-full max-w-sm p-8 space-y-6 ${shake ? "animate-shake" : ""}`}
          data-ocid="admin.login.modal"
        >
          <div className="text-center space-y-3">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{
                duration: 2.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="w-16 h-16 mx-auto rounded-2xl gradient-btn flex items-center justify-center animate-glow-pulse"
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h1 className="font-display text-3xl font-black gradient-text glow-text uppercase tracking-widest">
                ADMIN ACCESS
              </h1>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                Restricted Area
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Email
              </Label>
              <Input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@example.com"
                data-ocid="admin.login.email.input"
                required
                className="bg-white/5 border-white/15 text-white rounded-xl focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Password
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  data-ocid="admin.login.password.input"
                  required
                  className="bg-white/5 border-white/15 text-white rounded-xl focus:border-primary pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  data-ocid="admin.login.password.toggle"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            data-ocid="admin.login.submit_button"
            className="w-full gradient-btn text-white border-0 py-5 rounded-xl font-black tracking-widest uppercase text-sm"
          >
            AUTHENTICATE
          </Button>
        </motion.form>
      </div>
    );
  }

  // --- Full Dashboard ---
  const allNoticesSorted = [...notices].sort((a, b) => b.date - a.date);

  return (
    <div className="min-h-screen px-4 py-8" data-ocid="admin.page">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl gradient-btn flex items-center justify-center animate-glow-pulse">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-black gradient-text glow-text uppercase tracking-widest">
                ADMIN PANEL
              </h1>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Gamer Earn
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-white/15 bg-white/5 hover:bg-white/10"
            data-ocid="admin.logout.button"
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatsCard label="Total" value={stats.total} color="gradient-text" />
          <StatsCard
            label="Pending"
            value={stats.pending}
            color="text-yellow-400"
          />
          <StatsCard
            label="Approved"
            value={stats.approved}
            color="text-green-400"
          />
          <StatsCard
            label="Rejected"
            value={stats.rejected}
            color="text-red-400"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Post Notice Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="premium-card p-6 space-y-4"
          >
            <h2 className="font-display text-lg font-bold uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-400" />
              <span className="gradient-text">BROADCAST NOTICE</span>
            </h2>

            <div className="space-y-3">
              <Input
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                placeholder="Notice title..."
                data-ocid="admin.notice.title.input"
                className="bg-white/5 border-white/15 text-white rounded-xl"
              />
              <Textarea
                value={noticeDesc}
                onChange={(e) => setNoticeDesc(e.target.value)}
                placeholder="Notice description..."
                rows={3}
                data-ocid="admin.notice.description.textarea"
                className="bg-white/5 border-white/15 text-white rounded-xl resize-none"
              />

              {(noticeTitle || noticeDesc) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-3 space-y-1"
                >
                  <p className="text-xs text-yellow-400/70 uppercase tracking-wider font-bold">
                    Preview
                  </p>
                  <p className="text-sm font-bold text-yellow-300">
                    {noticeTitle || "Title..."}
                  </p>
                  <p className="text-xs text-yellow-400/80 line-clamp-2">
                    {noticeDesc || "Description..."}
                  </p>
                </motion.div>
              )}

              <Button
                onClick={handlePostNotice}
                disabled={isPosting}
                data-ocid="admin.notice.submit_button"
                className="w-full gradient-btn text-white border-0 rounded-xl"
              >
                {isPosting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Posting...
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 mr-2" /> POST NOTICE
                  </>
                )}
              </Button>
            </div>

            {/* All Notices with Edit/Delete */}
            {allNoticesSorted.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                  Published Notices ({allNoticesSorted.length})
                </p>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {allNoticesSorted.map((n) => (
                    <div
                      key={n.id}
                      className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-1.5"
                    >
                      {editingNoticeId === n.id ? (
                        // Edit mode
                        <div className="space-y-2">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="bg-white/5 border-white/15 text-white rounded-lg text-xs h-8"
                            placeholder="Title..."
                          />
                          <Textarea
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            rows={2}
                            className="bg-white/5 border-white/15 text-white rounded-lg text-xs resize-none"
                            placeholder="Description..."
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(n.id)}
                              className="gradient-btn text-white border-0 rounded-lg text-xs flex-1 h-7"
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setEditingNoticeId(null)}
                              className="bg-white/5 hover:bg-white/10 text-muted-foreground border border-white/10 rounded-lg text-xs h-7"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-bold text-white flex-1">
                              {n.title}
                            </p>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(n)}
                                className="p-1 rounded-lg bg-white/5 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                                title="Edit notice"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteNotice(n.id)}
                                className="p-1 rounded-lg bg-white/5 hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
                                title="Delete notice"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {n.description}
                          </p>
                          <p className="text-xs text-muted-foreground/60">
                            {formatDate(n.date)}
                          </p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Redeem Requests */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="premium-card p-6 space-y-4"
          >
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-bold uppercase tracking-wider gradient-text">
                REDEEM REQUESTS
              </h2>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                {requests.length}
              </Badge>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 bg-white/5 rounded-full p-1">
              {(["all", "pending", "approved", "rejected"] as FilterTab[]).map(
                (tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setFilterTab(tab)}
                    data-ocid={`admin.filter.${tab}.tab`}
                    className={`flex-1 text-xs font-bold uppercase py-1.5 rounded-full transition-all duration-200 ${
                      filterTab === tab
                        ? "gradient-btn text-white"
                        : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ),
              )}
            </div>

            {/* Request list */}
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {filteredRequests.length === 0 ? (
                <div
                  className="text-center py-10 text-muted-foreground space-y-2"
                  data-ocid="admin.requests.empty_state"
                >
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-white/5 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm">No requests found</p>
                </div>
              ) : (
                filteredRequests.map((req, i) => {
                  const rupees = req.amount / 100;
                  const isPending = req.status === "pending";
                  const isRejecting = rejectingId === req.id;
                  return (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-2"
                      data-ocid={`admin.request.item.${i + 1}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold">
                              {req.rewardType === "googlePlay"
                                ? "Google Play"
                                : "Amazon"}{" "}
                              • ₹{rupees}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${
                                req.status === "pending"
                                  ? "status-pending"
                                  : req.status === "approved"
                                    ? "status-approved"
                                    : "status-rejected"
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {req.name} • {req.email}
                          </p>
                          <p className="text-xs text-muted-foreground/60 mt-0.5">
                            {formatDate(req.date)}
                          </p>
                        </div>
                        {isPending && (
                          <div className="flex gap-1.5 flex-shrink-0">
                            <Button
                              size="sm"
                              onClick={() =>
                                handleUpdateStatus(req.id, "approved")
                              }
                              disabled={isUpdating}
                              data-ocid={`admin.request.approve_button.${i + 1}`}
                              className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg h-8 px-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                setRejectingId(isRejecting ? null : req.id)
                              }
                              data-ocid={`admin.request.delete_button.${i + 1}`}
                              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg h-8 px-2"
                            >
                              <ChevronDown
                                className={`w-4 h-4 transition-transform ${isRejecting ? "rotate-180" : ""}`}
                              />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Reject reason panel */}
                      <AnimatePresence>
                        {isRejecting && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-2 pt-1">
                              <Textarea
                                value={rejectReason}
                                onChange={(e) =>
                                  setRejectReason(e.target.value)
                                }
                                placeholder="Rejection reason (optional)..."
                                rows={2}
                                className="bg-white/5 border-red-500/20 text-white rounded-lg text-xs resize-none"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleUpdateStatus(req.id, "rejected")
                                  }
                                  disabled={isUpdating}
                                  data-ocid={`admin.request.confirm_button.${i + 1}`}
                                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg text-xs flex-1"
                                >
                                  {isUpdating ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    "Confirm Reject"
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setRejectingId(null);
                                    setRejectReason("");
                                  }}
                                  data-ocid={`admin.request.cancel_button.${i + 1}`}
                                  className="bg-white/5 hover:bg-white/10 text-muted-foreground border border-white/10 rounded-lg text-xs"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
