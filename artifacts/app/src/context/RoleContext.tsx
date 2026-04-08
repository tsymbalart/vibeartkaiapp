import { useAuth, type Role, type AuthUser } from "./AuthContext";

export { type Role };

export function useRole() {
  const { user } = useAuth();
  return {
    role: (user?.role ?? "member") as Role,
    userId: user?.id ?? 0,
    userName: user?.name ?? "",
    setRole: () => {},
  };
}
