const NOTICES_KEY = "ge_notices";
const ALL_ORDERS_KEY = "ge_all_orders";
const MY_ORDERS_KEY = "ge_my_orders";

export interface StoredNotice {
  id: number;
  title: string;
  description: string;
  date: number;
}

export interface StoredOrder {
  id: number;
  rewardType: "googlePlay" | "amazon";
  amount: number;
  status: "pending" | "approved" | "rejected";
  date: number;
  name: string;
  email: string;
}

function safeGet<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function safeSet<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

// NOTICES
export function getLocalNotices(): StoredNotice[] {
  return safeGet<StoredNotice>(NOTICES_KEY);
}

export function addLocalNotice(title: string, description: string): void {
  const notices = getLocalNotices();
  notices.unshift({ id: Date.now(), title, description, date: Date.now() });
  safeSet(NOTICES_KEY, notices);
}

export function updateLocalNotice(
  id: number,
  title: string,
  description: string,
): void {
  const notices = getLocalNotices();
  safeSet(
    NOTICES_KEY,
    notices.map((n) => (n.id === id ? { ...n, title, description } : n)),
  );
}

export function deleteLocalNotice(id: number): void {
  safeSet(
    NOTICES_KEY,
    getLocalNotices().filter((n) => n.id !== id),
  );
}

// ORDERS — both admin and user share the same record ID
export function getLocalOrders(): StoredOrder[] {
  return safeGet<StoredOrder>(ALL_ORDERS_KEY);
}

export function getMyOrders(): StoredOrder[] {
  return safeGet<StoredOrder>(MY_ORDERS_KEY);
}

/**
 * Add a redeem order to BOTH admin and user stores with the SAME id.
 * This ensures admin status updates can be reflected in user's order history.
 */
export function addRedeemOrder(
  order: Omit<StoredOrder, "id" | "date">,
): number {
  const id = Date.now();
  const date = id;
  const fullOrder: StoredOrder = { ...order, id, date };

  const allOrders = getLocalOrders();
  allOrders.unshift(fullOrder);
  safeSet(ALL_ORDERS_KEY, allOrders);

  const myOrders = getMyOrders();
  myOrders.unshift(fullOrder);
  safeSet(MY_ORDERS_KEY, myOrders);

  return id;
}

/**
 * Update order status in BOTH stores so the user sees the updated status.
 */
export function updateLocalOrderStatus(
  id: number,
  status: StoredOrder["status"],
): void {
  safeSet(
    ALL_ORDERS_KEY,
    getLocalOrders().map((o) => (o.id === id ? { ...o, status } : o)),
  );
  safeSet(
    MY_ORDERS_KEY,
    getMyOrders().map((o) => (o.id === id ? { ...o, status } : o)),
  );
}
