import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./auth";
import { Footer } from "./components/Footer";
import { Navbar } from "./components/Navbar";
import { NoticesBanner } from "./components/NoticesBanner";
import { useIsRegistered } from "./hooks/useQueries";
import { AdminPage } from "./pages/AdminPage";
import { AuthScreen } from "./pages/AuthScreen";
import { CreditsPage } from "./pages/CreditsPage";
import { EarnPage } from "./pages/EarnPage";
import { OrdersPage } from "./pages/OrdersPage";
import { RedeemPage } from "./pages/RedeemPage";
import { UsernameSetup } from "./pages/UsernameSetup";

type Page = "earn" | "redeem" | "orders" | "credits";

function AppContent() {
  const { isAuthenticated, isInitializing, isDemoMode, loginDemo } = useAuth();
  const [activePage, setActivePage] = useState<Page>("earn");
  const [isAdminRoute] = useState(
    () =>
      typeof window !== "undefined" && window.location.pathname === "/admin",
  );

  const { data: isRegistered, isLoading: checkingRegistered } =
    useIsRegistered();

  // Auto-login via /demo URL
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.location.pathname === "/demo" &&
      !isAuthenticated
    ) {
      loginDemo();
      window.history.replaceState(null, "", "/");
    }
  }, [isAuthenticated, loginDemo]);

  // Loading spinner while initializing
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  // Admin route
  if (isAdminRoute) {
    return <AdminPage />;
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // Demo mode skips registration check
  if (!isDemoMode) {
    if (checkingRegistered) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    if (isRegistered === false) {
      return (
        <UsernameSetup
          onComplete={() => {
            window.location.reload();
          }}
        />
      );
    }
  }

  const renderPage = () => {
    switch (activePage) {
      case "earn":
        return <EarnPage />;
      case "redeem":
        return <RedeemPage />;
      case "orders":
        return <OrdersPage />;
      case "credits":
        return <CreditsPage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/8 blur-[100px]" />
      </div>

      <Navbar activePage={activePage} onNavigate={setActivePage} />

      <div className="flex-1 pt-4">
        {activePage === "earn" && <NoticesBanner />}
        {renderPage()}
      </div>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: "oklch(0.14 0.018 265 / 90%)",
            border: "1px solid oklch(1 0 0 / 12%)",
            color: "white",
            backdropFilter: "blur(12px)",
          },
        }}
      />
    </AuthProvider>
  );
}
