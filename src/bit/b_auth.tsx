import { ElbeChildren } from "elbe-ui";
import { createContext, useContext, useState } from "react";
import { serverAuth } from "../app";
import { UserModel } from "../shared/m_schema.shared";

const AuthContext = createContext<{
  user: UserModel | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
} | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export function AuthProvider(p: { children: ElbeChildren }) {
  const [user, setUser] = useState<UserModel | null>(null);

  serverAuth.addStateListener((s) => {
    console.log("auth state changed", s);
    setUser(s);
  });

  async function signIn(username: string, password: string) {
    await serverAuth.login({ username, password });
  }

  async function signOut() {
    await serverAuth.logout();
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {p.children}
    </AuthContext.Provider>
  );
}
