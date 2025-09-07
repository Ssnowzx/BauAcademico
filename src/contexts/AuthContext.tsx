import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import * as bcrypt from "bcryptjs";
import { toast } from "sonner";

import { AuthContext, User } from "./auth-shared";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Helpers para persistência local para TODOS os usuários
  const persistUser = useCallback((u: User) => {
    try {
      localStorage.setItem("app_user", JSON.stringify(u));
    } catch (e) {
      console.warn("Could not persist app_user", e);
    }
  }, []);

  const removeUser = useCallback(() => {
    try {
      localStorage.removeItem("app_user");
    } catch (e) {
      /* ignore */
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
        } else {
          // Se a sessão existe mas não há registro na tabela users,
          // criar um registro básico para manter a sessão
          try {
            const { error: insertError } = await supabase
              .from("users")
              .insert({
                id: session.user.id,
                username: session.user.email?.split("@")[0] || "user",
                password: "", // password vazio para auth via Supabase
                is_admin: false,
              })
              .single();

            if (!insertError) {
              setUser({
                id: session.user.id,
                username: session.user.email?.split("@")[0] || "user",
                is_admin: false,
              });
              return;
            }
          } catch (insertErr) {
            console.warn("Failed to create user record:", insertErr);
          }
        }
      }

      // Fallback: restaurar usuário persistido localmente (TODOS os usuários)
      const raw = localStorage.getItem("app_user");
      if (raw) {
        try {
          const persistedUser = JSON.parse(raw) as User;
          setUser(persistedUser);

          // Se for admin, não há mais necessidade de auth account especial
          return;
        } catch (e) {
          console.warn("Failed to parse app_user from localStorage", e);
        }
      }

      // Development fallback: restore persisted dev user (keeps admin during dev reloads)
      if (import.meta.env.DEV) {
        const devRaw = localStorage.getItem("dev_user");
        if (devRaw) {
          try {
            const devUser = JSON.parse(devRaw) as User;
            setUser(devUser);

            // Se o dev user é admin, não há mais necessidade de auth account especial
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
  }, []);

  useEffect(() => {
    void checkUser();
  }, [checkUser]);

  // Login function with dev fallback
  const login = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      setLoading(true);
      try {
        // Fallback de desenvolvimento removido por segurança
        // Agora apenas login via banco de dados é permitido

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

        // Para manter consistência, usar o ID real do usuário para auth
        const authUserId = userData.id;

        // Para admin, não há mais necessidade de conta Auth especial

        setUser({
          id: authUserId,
          username: userData.username,
          is_admin: userData.is_admin,
        });

        // Persistir TODOS os usuários para manter sessão
        persistUser({
          id: authUserId,
          username: userData.username,
          is_admin: userData.is_admin,
        });

        toast.success("Login realizado com sucesso!");
        return true;
      } catch (error) {
        console.error("Login error:", error);

        // Fallback de desenvolvimento removido por segurança
        // Agora apenas login via banco de dados é permitido
        toast.error("Erro ao fazer login - verifique suas credenciais");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [persistUser]
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
              persistUser(devUser);
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

        // Não criar conta no Supabase Auth para usuários normais
        // Apenas usar nossa tabela customizada 'users'

        setUser({
          id: inserted.id,
          username: inserted.username,
          is_admin: inserted.is_admin,
        });

        // Persistir usuário para manter sessão
        persistUser({
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
    [persistUser]
  );

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Supabase signOut failed:", e);
    }
    setUser(null);
    removeUser();
    toast.success("Logout realizado com sucesso!");
  }, [removeUser]);

  // Memoize context value to avoid unnecessary re-renders
  const value = useMemo(
    () => ({ user, login, logout, loading, signUp }),
    [user, login, logout, loading, signUp]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Note: the `useAuth` hook is provided from `./useAuth` module. Do not re-export
// it from this file to keep this module exporting only components (Fast Refresh
// compatibility). Import `useAuth` from `@/contexts/useAuth` where needed.
