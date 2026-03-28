import {
  CheckCircle,
  Clock,
  Gamepad2,
  Package,
  ShoppingBag,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { AdBanner } from "../components/AdBanner";
import type { StoredOrder } from "../utils/localStore";
import { getMyOrders } from "../utils/localStore";

type OrderStatus = "pending" | "approved" | "rejected";

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const config = {
    pending: { label: "Pending", icon: Clock, className: "status-pending" },
    approved: {
      label: "Approved",
      icon: CheckCircle,
      className: "status-approved",
    },
    rejected: {
      label: "Rejected",
      icon: XCircle,
      className: "status-rejected",
    },
  };
  const { label, icon: Icon, className } = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${className}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

const statusBorderColor: Record<OrderStatus, string> = {
  pending: "border-l-yellow-400",
  approved: "border-l-green-400",
  rejected: "border-l-red-400",
};

function OrderCard({ order, index }: { order: StoredOrder; index: number }) {
  const isGooglePlay = order.rewardType === "googlePlay";
  const rupees = order.amount / 100;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: "spring", bounce: 0.3 }}
      className={`glass-card rounded-2xl p-5 border border-white/10 border-l-4 ${statusBorderColor[order.status]} flex items-center gap-4`}
      data-ocid={`orders.item.${index + 1}`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isGooglePlay
            ? "bg-green-500/15 text-green-400"
            : "bg-orange-500/15 text-orange-400"
        }`}
      >
        {isGooglePlay ? (
          <Gamepad2 className="w-6 h-6" />
        ) : (
          <ShoppingBag className="w-6 h-6" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold text-sm text-white">
              {isGooglePlay ? "Google Play" : "Amazon"} Voucher
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDate(order.date)}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-lg font-black gradient-text">₹{rupees}</span>
          <span className="text-xs text-muted-foreground">
            {order.amount.toLocaleString()} coins
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function OrdersPage() {
  const [orders, setOrders] = useState<StoredOrder[]>(() => getMyOrders());

  // Re-read orders when admin updates status from another tab/window
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "ge_my_orders" || e.key === "ge_all_orders") {
        setOrders(getMyOrders());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <main
      className="max-w-2xl mx-auto px-4 pb-8 space-y-6"
      data-ocid="orders.page"
    >
      <section className="text-center space-y-2 py-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-4xl sm:text-5xl font-black tracking-widest uppercase gradient-text glow-text"
        >
          MY ORDERS
        </motion.h1>
        <p className="text-muted-foreground">Track your redemption history</p>
      </section>

      <AdBanner slot="1111111111" className="mb-6" />

      {orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-3xl p-12 text-center space-y-4"
          data-ocid="orders.empty_state"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-bold text-lg">No orders yet</h3>
          <p className="text-sm text-muted-foreground">
            Start earning coins and redeem your first reward!
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, i) => (
            <OrderCard key={order.id} order={order} index={i} />
          ))}
        </div>
      )}
    </main>
  );
}
