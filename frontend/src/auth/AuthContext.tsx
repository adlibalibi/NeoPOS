import { createContext, useContext } from "react";

export type UserRole = "admin" | "staff" | "customer";

export type AuthState = {
  loading: boolean;
  isAuthenticated: boolean;
  uid?: string;
  role?: UserRole;
};

export const AuthContext = createContext<AuthState>({
  loading: true,
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

