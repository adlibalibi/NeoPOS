import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import Inventory from "./pages/Inventory";
import UserProfile from "./pages/UserProfile"
import Signup from "./pages/Signup";
import Transactions from "./pages/Transactions";
import { useAuth } from "@/auth/AuthContext";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { loading, isAuthenticated } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const RoleRoute = ({
  children,
  allow,
}: {
  children: React.ReactNode;
  allow: Array<"admin" | "staff" | "customer">;
}) => {
  const { loading, role } = useAuth();
  if (loading) return null;
  if (!role || !allow.includes(role as any)) return <Navigate to="/dashboard" />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <RoleRoute allow={["admin", "staff"]}>
                  <Dashboard />
                </RoleRoute>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/payment-portal"
            element={
              <ProtectedRoute>
                <RoleRoute allow={["admin", "staff"]}>
                  <Checkout />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route path="/success" element={<PaymentSuccess />} />
          <Route path="/failed" element={<PaymentFailed />} />
          <Route 
            path="/inventory"
            element={
              <ProtectedRoute>
                <RoleRoute allow={["admin", "staff"]}>
                  <Inventory />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/checkout"
            element={
              <ProtectedRoute>
                <RoleRoute allow={["admin", "staff"]}>
                  <Checkout />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/transactions" 
            element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            } 
          />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;