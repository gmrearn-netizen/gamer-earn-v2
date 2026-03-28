import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";

const DEMO_INITIAL_COINS = 9999999n;
const DEMO_RESET_DATE_KEY = "demo_coins_reset_date";
const DEMO_BALANCE_KEY = "demo_coin_balance";

function getTodayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isInitializing: boolean;
  username: string | null;
  coinBalance: bigint;
  login: () => void;
  logout: () => void;
  refreshBalance: () => Promise<void>;
  setUsername: (name: string) => void;
  isDemoMode: boolean;
  loginDemo: () => void;
  addDemoCoins: (amount: bigint) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { identity, login, clear, isInitializing, loginStatus } =
    useInternetIdentity();
  const { actor } = useActor();
  const [username, setUsernameState] = useState<string | null>(null);
  const [coinBalance, setCoinBalance] = useState<bigint>(0n);
  const [isDemoMode, setIsDemoMode] = useState(
    () => localStorage.getItem("demo_mode") === "true",
  );

  const isIdentityAuth = !!identity && !identity.getPrincipal().isAnonymous();
  const isAuthenticated = isIdentityAuth || isDemoMode;

  const loginDemo = useCallback(() => {
    const today = getTodayDateStr();
    localStorage.setItem("demo_mode", "true");
    localStorage.setItem(DEMO_RESET_DATE_KEY, today);
    setIsDemoMode(true);
    setUsernameState("Demo Player");
    setCoinBalance(DEMO_INITIAL_COINS);
    // Reset persisted balance on fresh login
    localStorage.setItem(DEMO_BALANCE_KEY, DEMO_INITIAL_COINS.toString());
  }, []);

  const logoutDemo = useCallback(() => {
    localStorage.removeItem("demo_mode");
    localStorage.removeItem(DEMO_BALANCE_KEY);
    setIsDemoMode(false);
    setUsernameState(null);
    setCoinBalance(0n);
  }, []);

  const addDemoCoins = useCallback((amount: bigint) => {
    setCoinBalance((prev) => {
      // Bug fix: guard against negative balance from subtraction
      const next = prev + amount;
      const safe = next < 0n ? 0n : next;
      // Bug fix: persist demo balance to localStorage so page refresh doesn't reset it
      localStorage.setItem(DEMO_BALANCE_KEY, safe.toString());
      return safe;
    });
  }, []);

  const refreshBalance = useCallback(async () => {
    if (isDemoMode) return;
    if (!actor || !isIdentityAuth) return;
    try {
      const [balance, profile] = await Promise.all([
        actor.getCoinBalance(),
        actor.getCallerUserProfile(),
      ]);
      setCoinBalance(balance);
      if (profile) setUsernameState(profile.username);
    } catch (e) {
      console.error("Failed to refresh balance", e);
    }
  }, [actor, isIdentityAuth, isDemoMode]);

  // On mount: if demo mode, check if date changed and reset coins
  useEffect(() => {
    if (isDemoMode) {
      setUsernameState("Demo Player");
      const today = getTodayDateStr();
      const stored = localStorage.getItem(DEMO_RESET_DATE_KEY);
      if (stored !== today) {
        // New day — reset coins
        localStorage.setItem(DEMO_RESET_DATE_KEY, today);
        localStorage.setItem(DEMO_BALANCE_KEY, DEMO_INITIAL_COINS.toString());
        setCoinBalance(DEMO_INITIAL_COINS);
      } else {
        // Bug fix: restore persisted balance so page refresh doesn't wipe redemptions
        const persistedBalance = localStorage.getItem(DEMO_BALANCE_KEY);
        if (persistedBalance) {
          try {
            setCoinBalance(BigInt(persistedBalance));
          } catch {
            setCoinBalance(DEMO_INITIAL_COINS);
          }
        } else {
          setCoinBalance(DEMO_INITIAL_COINS);
        }
      }
      return;
    }
    if (isIdentityAuth && actor) {
      refreshBalance();
    }
  }, [isIdentityAuth, actor, refreshBalance, isDemoMode]);

  // Interval: check for midnight date change every 60s
  useEffect(() => {
    if (!isDemoMode) return;
    const interval = setInterval(() => {
      const today = getTodayDateStr();
      const stored = localStorage.getItem(DEMO_RESET_DATE_KEY);
      if (stored !== today) {
        localStorage.setItem(DEMO_RESET_DATE_KEY, today);
        localStorage.setItem(DEMO_BALANCE_KEY, DEMO_INITIAL_COINS.toString());
        setCoinBalance(DEMO_INITIAL_COINS);
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [isDemoMode]);

  const setUsername = (name: string) => setUsernameState(name);

  const logout = useCallback(() => {
    // Bug fix: only call logoutDemo when actually in demo mode, otherwise
    // just call clear() for real Internet Identity users. Also clean up
    // the locked email key so it doesn't bleed into a different user's session.
    if (isDemoMode) {
      logoutDemo();
    } else {
      localStorage.removeItem("gamer_earn_locked_email");
      clear();
      setUsernameState(null);
      setCoinBalance(0n);
    }
  }, [clear, logoutDemo, isDemoMode]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isInitializing:
          !isDemoMode && (isInitializing || loginStatus === "initializing"),
        username,
        coinBalance,
        login,
        logout,
        refreshBalance,
        setUsername,
        isDemoMode,
        loginDemo,
        addDemoCoins,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
