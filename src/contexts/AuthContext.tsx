import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import * as bcrypt from "bcryptjs";
import { toast } from "sonner";

interface User {
  id: string;
  username: string;
  is_admin: boolean;
}

// Representação da linha/registro da tabela `users` no banco
interface UserRow {
  id: string;
  username: string;
  password: string;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  signUp: (username: string, password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Constants reused across the provider
const DEV_ADMIN_ID = "00000000-0000-0000-0000-000000000001"; // fixed dev admin id
const DEV_ADMIN_EMAIL = `${DEV_ADMIN_ID}@proofchest.local`;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Helpers para persistência local em DEV
  const persistDevUser = useCallback((u: User) => {
    try {
      localStorage.setItem("dev_user", JSON.stringify(u));
    } catch (e) {
      console.warn("Could not persist dev_user", e);
    }
  }, []);

  const removeDevUser = useCallback(() => {
    try {
      localStorage.removeItem("dev_user");
    } catch (e) {
      /* ignore */
    }
  }, []);

  // Helper: ensure a Supabase auth account exists for the given id and try to sign in
  const ensureAuthAccountAndSignIn = useCallback(async (id: string) => {
    try {
      // Try sign in first
      const signInResult = await supabase.auth.signInWithPassword({
        email: `${id}@proofchest.local`,
        password: id,
      });

      // If sign in failed because account does not exist, attempt signup (non-fatal)
      if (signInResult.error) {
        try {
          await supabase.auth.signUp({
            email: `${id}@proofchest.local`,
            password: id,
            options: { data: { user_id: id } },
          });
        } catch (e) {
          // Not fatal — log and continue
          console.warn("Auth signup warning:", e);
        }
      }
    } catch (e) {
      // Keep non-fatal: we don't want auth issues to block the app
      console.warn("ensureAuthAccountAndSignIn failed:", e);
    }
  }, []);

  // Fetch current session & restore dev fallback when necessary
  const checkUser = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (session?.user) {
        // Try to fetch the user row from our `users` table
        const { data: userData, error } = await supabase
          .from("users")
          .select("id, username, is_admin")
          .eq("id", session.user.id)
          .single();

        if (userData && !error) {
          setUser({
            id: userData.id,
            username: userData.username,
            is_admin: userData.is_admin,
          });
          return;
        }
      }

      // Development fallback: restore persisted dev user (keeps admin during dev reloads)
      if (import.meta.env.DEV) {
        const raw = localStorage.getItem("dev_user");
        if (raw) {
          try {
            const devUser = JSON.parse(raw) as User;
            setUser(devUser);

            // If the dev user is admin, ensure an auth account exists so auth.uid() works
            if (devUser.username === "admin") {
              await ensureAuthAccountAndSignIn(DEV_ADMIN_ID);
            }

            return;
          } catch (e) {
            console.warn("Failed to parse dev_user from localStorage", e);
          }
        }
      }
    } catch (error) {
      console.error("Error checking user:", error);
    } finally {
      setLoading(false);
    }
  }, [ensureAuthAccountAndSignIn]);

  useEffect(() => {
    void checkUser();
  }, [checkUser]);

  // Login function with dev fallback
  const login = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      setLoading(true);
      try {
        // DEV quick shortcut: accept admin/admin or admin/admin123 locally
        if (
          import.meta.env.DEV &&
          username === "admin" &&
          (password === "admin" || password === "admin123")
        ) {
          const devUser: User = {
            id: DEV_ADMIN_ID,
            username: "admin",
            is_admin: true,
          };
          setUser(devUser);

          try {
            persistDevUser(devUser);
            await ensureAuthAccountAndSignIn(DEV_ADMIN_ID);
          } catch (e) {
            console.warn("Could not persist dev_user or auth", e);
          }

          toast.success("Login de desenvolvimento realizado");
          return true;
        }

        // Normal flow: fetch user by username
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("username", username)
          .single();

        if (userError || !userData) {
          toast.error("Usuário não encontrado");
          return false;
        }

        let validPassword = false;
        try {
          validPassword = await bcrypt.compare(password, userData.password);
        } catch (e) {
          console.error("Password compare failed:", e);
          validPassword = false;
        }

        if (!validPassword) {
          toast.error("Senha incorreta");
          return false;
        }

        // Use a fixed admin id mapping to keep admin flows consistent
        const authUserId =
          userData.username === "admin" ? DEV_ADMIN_ID : userData.id;

        // Ensure auth account exists and sign in (non-fatal if auth fails)
        await ensureAuthAccountAndSignIn(authUserId);

        setUser({
          id: authUserId,
          username: userData.username,
          is_admin: userData.is_admin,
        });
        toast.success("Login realizado com sucesso!");
        return true;
      } catch (error) {
        console.error("Login error:", error);

        // DEV fallback in case users table isn't reachable (e.g. PostgREST 406)
        if (import.meta.env.DEV) {
          const devUser: User = {
            id: `dev-${username}-${Date.now()}`,
            username,
            is_admin: false,
          };
          setUser(devUser);
          try {
            persistDevUser(devUser);
          } catch (e) {
            console.warn("Could not persist dev_user", e);
          }
          toast("Login de desenvolvimento habilitado devido a erro no backend");
          return true;
        }

        toast.error("Erro ao fazer login");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [ensureAuthAccountAndSignIn, persistDevUser]
  );

  // Sign up new user
  const signUp = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      setLoading(true);
      try {
        if (!username || !password) {
          toast.error("Preencha usuário e senha");
          return false;
        }

        const hashed = await bcrypt.hash(password, 10);

        // Insert row into users; DB generates id
        const { data: inserted, error: insertError } = await supabase
          .from("users")
          .insert({ username, password: hashed, is_admin: false })
          .select("id, username, is_admin")
          .single();

        if (insertError || !inserted) {
          console.error("SignUp insert error:", insertError);

          // DEV fallback: create a local dev user so signup works offline
          if (import.meta.env.DEV) {
            const devUser: User = {
              id: `dev-${username}-${Date.now()}`,
              username,
              is_admin: false,
            };
            setUser(devUser);
            try {
              persistDevUser(devUser);
              const existing = JSON.parse(
                localStorage.getItem("dev_documents") || "[]"
              );
              localStorage.setItem(
                "dev_documents",
                JSON.stringify(existing || [])
              );
            } catch (e) {
              console.warn("Could not persist dev_user", e);
            }
            toast.success("Conta criada (modo desenvolvimento)");
            return true;
          }

          toast.error("Erro ao criar conta");
          return false;
        }

        // Try to create an Auth user so sign in flow stays consistent (non-fatal)
        try {
          await supabase.auth.signUp({
            email: `${inserted.id}@proofchest.local`,
            password: inserted.id,
            options: { data: { user_id: inserted.id } },
          });
        } catch (e) {
          console.warn("Auth signup warning:", e);
        }

        setUser({
          id: inserted.id,
          username: inserted.username,
          is_admin: inserted.is_admin,
        });
        toast.success("Conta criada com sucesso!");
        return true;
      } catch (error) {
        console.error("SignUp error:", error);
        toast.error("Erro ao criar conta");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [persistDevUser]
  );

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Supabase signOut failed:", e);
    }
    setUser(null);
    removeDevUser();
    toast.success("Logout realizado com sucesso!");
  }, [removeDevUser]);

  // Memoize context value to avoid unnecessary re-renders
  const value = useMemo(
    () => ({ user, login, logout, loading, signUp }),
    [user, login, logout, loading, signUp]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
