import { ReactNode, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { AuthContext, AuthState, UserRole } from "./AuthContext";

const coerceRole = (value: unknown): UserRole | undefined => {
  if (value === "admin" || value === "staff" || value === "customer") return value;
  return undefined;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    loading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ loading: false, isAuthenticated: false });
        return;
      }

      setState((s) => ({ ...s, loading: true, isAuthenticated: true, uid: user.uid }));
      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        const data = snap.exists() ? snap.data() : {};
        const role = coerceRole((data as any)?.role) ?? "customer";

        if (snap.exists() && !coerceRole((data as any)?.role)) {
          await setDoc(userRef, { role }, { merge: true });
        }

        setState({ loading: false, isAuthenticated: true, uid: user.uid, role });
      } catch {
        setState({ loading: false, isAuthenticated: true, uid: user.uid, role: "customer" });
      }
    });

    return () => unsub();
  }, []);

  const value = useMemo(() => state, [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

