import { type Request, type Response, type NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  clearSession,
  getSessionId,
  getSession,
  type AppUser,
} from "../lib/auth";

declare global {
  namespace Express {
    interface Request {
      isAuthenticated(): this is AuthedRequest;
      user?: AppUser | undefined;
    }

    interface AuthedRequest {
      user: AppUser;
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  req.isAuthenticated = function (this: Request) {
    return this.user != null;
  } as Request["isAuthenticated"];

  const sid = getSessionId(req);
  if (!sid) {
    next();
    return;
  }

  const session = await getSession(sid);
  if (!session?.user?.id) {
    await clearSession(res, sid);
    next();
    return;
  }

  const [freshUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, session.user.id));

  if (!freshUser) {
    await clearSession(res, sid);
    next();
    return;
  }

  req.user = {
    id: freshUser.id,
    name: freshUser.name,
    email: freshUser.email,
    role: freshUser.role,
    teamId: freshUser.teamId,
    avatarUrl: freshUser.avatarUrl,
  };
  next();
}
