import { type ReactNode } from "react";
import { BiSolidShield } from "react-icons/bi";
import { useAuth, type Role } from "@/context/AuthContext";
import { AppLayout } from "./AppLayout";

interface RequireRoleProps {
  roles: Role[];
  children: ReactNode;
}

/**
 * Role-aware route guard. If the current user's role is not in the allowed
 * list, shows an access-denied screen instead of rendering the wrapped page.
 * This is defence-in-depth on top of the server-side `requireRole` middleware
 * — without it, members who type a lead-only URL would still get the page
 * shell and trigger API requests that return 403.
 */
export function RequireRole({ roles, children }: RequireRoleProps) {
  const { user } = useAuth();
  const role: Role = user?.role ?? "member";

  if (!roles.includes(role)) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center max-w-sm">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <BiSolidShield className="w-6 h-6 text-primary" />
            </div>
            <p className="text-lg font-medium text-foreground">Restricted page</p>
            <p className="text-sm text-muted-foreground mt-1">
              This area is only available to team leads
              {roles.includes("director") && !roles.includes("lead") ? " or directors" : ""}
              . If you think this is a mistake, ask a director to update your access.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return <>{children}</>;
}
