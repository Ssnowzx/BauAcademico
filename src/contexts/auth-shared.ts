import { createContext } from "react";

export interface User {
  id: string;
  username: string;
  is_admin: boolean;
}

export interface UserRow {
  id: string;
  username: string;
  password: string;
  is_admin: boolean;
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  signUp: (username: string, password: string) => Promise<boolean>;
}

// Export only the context (non-component) from this module
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const DEV_ADMIN_ID = "00000000-0000-0000-0000-000000000001";
export const DEV_ADMIN_EMAIL = `${DEV_ADMIN_ID}@proofchest.local`;
